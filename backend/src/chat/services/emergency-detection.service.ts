import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { ChatMistralAI } from '@langchain/mistralai'

export interface EmergencyDetectionResult {
  isEmergency: boolean
  emergencySituation: string | null
}

@Injectable()
export class EmergencyDetectionService {
  private readonly logger = new Logger(EmergencyDetectionService.name)
  private detectorModel: string

  constructor(private readonly configService: ConfigService) {
    this.detectorModel =
      this.configService.get<string>('MISTRAL_EMERGENCY_MODEL') ||
      this.configService.get<string>('MISTRAL_CHAT_MODEL') ||
      'ministral-3b-2512'
  }

  async detectEmergency(prompt: string): Promise<EmergencyDetectionResult> {
    try {
      const apiKey = this.configService.get<string>('MISTRAL_API_KEY')
      const llm = new ChatMistralAI({
        apiKey,
        model: this.detectorModel,
        maxTokens: 512,
      })

      const systemPrompt = `
        You are a safety classifier for a cardiovascular health chat app.

        Given the user's message, decide if this is a LIFE-THREATENING EMERGENCY
        happening RIGHT NOW that requires calling 911 immediately.

        EMERGENCY (is_emergency = true) — ALL of these must be true:
        1. The patient explicitly says something is happening RIGHT NOW (not past tense, not "sometimes")
        2. The symptom is one of:
           - Crushing or severe chest pain happening NOW
           - Sudden inability to breathe happening NOW
           - Sudden numbness or weakness on one side of the body RIGHT NOW
           - Sudden loss of vision RIGHT NOW
           - Patient says they feel like they are having a heart attack or stroke RIGHT NOW
           - Active suicidal ideation or self-harm RIGHT NOW

        NOT AN EMERGENCY (is_emergency = false) — return false for ALL of these:
        - Patient answering check-in questions (weight, medications, symptoms)
        - ANY symptom mentioned as part of recording a reading or check-in
        - "I had chest pain", "chest pain", "had chest tightness" — past tense or bare mention
        - Reporting symptoms when asked (e.g. "headache, dizziness, chest pain")
        - Listing symptoms alongside other check-in data (BP, meds, weight)
        - Occasional/mild symptoms (dizziness, headache, fatigue, chest tightness)
        - Describing symptoms in past tense or as recurring/occasional
        - Reporting blood pressure numbers (even if very high like 200/120)
        - Asking health questions about BP, medications, or heart health
        - High BP readings are data to be recorded, NOT emergencies

        IMPORTANT: When in doubt, return is_emergency = false. Only flag true when
        the patient is clearly describing an acute, life-threatening event happening
        RIGHT NOW. A bare mention of "chest pain" as a symptom is NOT an emergency.

        Return ONLY a single JSON object:
        {
          "is_emergency": boolean,
          "emergency_situation": string | null
        }

        Do not include any extra keys, comments, or explanations.
      `

      const response = await llm.invoke([
        ['system', systemPrompt],
        ['human', prompt],
      ])

      let raw =
        typeof response.content === 'string'
          ? response.content
          : JSON.stringify(response.content)

      // Some models wrap JSON in markdown code fences (``` or ```json).
      // Strip common fence patterns before attempting to parse.
      raw = raw.trim()
      if (raw.startsWith('```')) {
        // Remove leading ``` or ```json (plus optional newline/space)
        raw = raw.replace(/^```[a-zA-Z0-9]*\s*/,'')
        // Remove trailing ```
        raw = raw.replace(/```$/, '').trim()
      }

      // As a safeguard, if there is extra text around the JSON, try to
      // extract the first {...} block.
      const firstBrace = raw.indexOf('{')
      const lastBrace = raw.lastIndexOf('}')
      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        raw = raw.slice(firstBrace, lastBrace + 1)
      }

      let parsed: any
      try {
        parsed = JSON.parse(raw)
      } catch (err) {
        this.logger.warn(`Failed to parse emergency detector JSON, treating as non-emergency. Raw: ${raw}`)
        return { isEmergency: false, emergencySituation: null }
      }

      const isEmergency =
        typeof parsed.is_emergency === 'boolean' ? parsed.is_emergency : false
      const emergencySituation =
        typeof parsed.emergency_situation === 'string' ? parsed.emergency_situation : null

      return { isEmergency, emergencySituation }
    } catch (error) {
      this.logger.error('Emergency detection failed', error as Error)
      return { isEmergency: false, emergencySituation: null }
    }
  }
}


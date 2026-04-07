/**
 * LLM-as-Judge evaluation service.
 * Uses Gemini to evaluate chatbot responses and logs results to LangSmith.
 */
import { GoogleGenAI } from '@google/genai'

let langsmithClient: any = null
const LANGSMITH_PROJECT = process.env.LANGSMITH_PROJECT || 'healplace-cardio-ci'

async function getLangSmithClient() {
  if (langsmithClient !== null) return langsmithClient
  const apiKey = process.env.LANGSMITH_API_KEY
  if (!apiKey) {
    langsmithClient = false
    return false
  }
  try {
    const { Client } = await import('langsmith')
    langsmithClient = new Client({ apiKey })
    return langsmithClient
  } catch {
    langsmithClient = false
    return false
  }
}

export interface JudgeResult {
  criterion: string
  score: number // 1-5
  reasoning: string
}

export interface EvaluationResult {
  scenario: string
  input: string
  response: string
  toolsCalled: string[]
  scores: JudgeResult[]
  averageScore: number
  pass: boolean // average >= 3
}

const JUDGE_SYSTEM_PROMPT = `You are an expert evaluator for a cardiovascular health chatbot.
You will receive:
- The patient's input message
- The chatbot's response
- Any tools the chatbot called
- The evaluation criteria

Score each criterion from 1 (very poor) to 5 (excellent).
Return a JSON array of objects with: criterion, score (number 1-5), reasoning (string).
Return ONLY the JSON array, no extra text.`

export class JudgeService {
  private client: GoogleGenAI

  constructor() {
    const apiKey = process.env.GOOGLE_API_KEY
    if (!apiKey) throw new Error('GOOGLE_API_KEY required for LLM judge')
    this.client = new GoogleGenAI({ apiKey })
  }

  async evaluate(opts: {
    scenario: string
    input: string
    response: string
    toolsCalled?: string[]
    criteria: string[]
    source?: 'text' | 'voice'
  }): Promise<EvaluationResult> {
    const criteriaList = opts.criteria.map((c) => `- ${c}`).join('\n')

    const userPrompt = `## Scenario: ${opts.scenario}

## Patient Input:
${opts.input}

## Chatbot Response:
${opts.response}

## Tools Called:
${opts.toolsCalled?.length ? opts.toolsCalled.join(', ') : 'None'}

## Criteria to evaluate:
${criteriaList}

Score each criterion 1-5 and provide reasoning. Return JSON array only.`

    const response = await this.client.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
      config: {
        systemInstruction: JUDGE_SYSTEM_PROMPT,
      },
    })

    let raw = response.text ?? '[]'
    raw = raw.trim()
    if (raw.startsWith('```')) {
      raw = raw.replace(/^```[a-zA-Z0-9]*\s*/, '').replace(/```$/, '').trim()
    }

    let scores: JudgeResult[]
    try {
      scores = JSON.parse(raw)
    } catch {
      scores = opts.criteria.map((c) => ({
        criterion: c,
        score: 0,
        reasoning: `Failed to parse judge response: ${raw.slice(0, 200)}`,
      }))
    }

    const averageScore = scores.length > 0
      ? scores.reduce((sum, s) => sum + s.score, 0) / scores.length
      : 0

    const result: EvaluationResult = {
      scenario: opts.scenario,
      input: opts.input,
      response: opts.response,
      toolsCalled: opts.toolsCalled ?? [],
      scores,
      averageScore,
      pass: averageScore >= 3,
    }

    // Log to LangSmith
    await this.logToLangSmith(result, opts.source ?? 'text')

    return result
  }

  private async logToLangSmith(result: EvaluationResult, source: string): Promise<void> {
    const client = await getLangSmithClient()
    if (!client) return

    try {
      await client.createRun({
        name: `judge:${result.scenario}`,
        run_type: 'eval',
        project_name: LANGSMITH_PROJECT,
        inputs: {
          scenario: result.scenario,
          patientInput: result.input,
          source,
        },
        outputs: {
          chatbotResponse: result.response,
          toolsCalled: result.toolsCalled,
          scores: result.scores,
          averageScore: result.averageScore,
          pass: result.pass,
        },
        start_time: Date.now(),
        end_time: Date.now(),
      })
    } catch (err) {
      console.warn(`LangSmith log failed: ${err}`)
    }
  }
}

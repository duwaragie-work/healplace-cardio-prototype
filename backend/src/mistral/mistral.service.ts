import { Mistral } from '@mistralai/mistralai'
import { Injectable, OnModuleInit } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'

@Injectable()
export class MistralService implements OnModuleInit {
  private client: Mistral
  private embedModel: string | undefined
  private chatModel: string | undefined

  constructor(private configService: ConfigService) {}

  onModuleInit() {
    const apiKey = this.configService.get<string>('MISTRAL_API_KEY')
    this.embedModel = this.configService.get<string>('MISTRAL_EMBED_MODEL')
    this.chatModel = this.configService.get<string>('MISTRAL_CHAT_MODEL')

    if (!apiKey) {
      throw new Error('MISTRAL_API_KEY is not defined in environment locations')
    }

    this.client = new Mistral({ apiKey: apiKey })
  }

  get clientInstance(): Mistral {
    return this.client
  }

  async getChatCompletion(messages: Array<any>) {
    if (!this.chatModel) {
      throw new Error('MISTRAL_CHAT_MODEL is not defined')
    }
    return await this.client.chat.complete({
      model: this.chatModel,
      messages: messages,
    })
  }

  async getEmbeddings(input: string | string[]) {
    if (!this.embedModel) {
      throw new Error('MISTRAL_EMBED_MODEL is not defined')
    }
    const inputs = Array.isArray(input) ? input : [input]
    return await this.client.embeddings.create({
      model: this.embedModel,
      inputs: inputs,
    })
  }

  /**
   * Transcribe audio using Voxtral.
   * Accepts raw PCM 16-bit 16kHz mono audio as a Buffer.
   * Returns the transcribed text.
   */
  async transcribeAudio(audioBuffer: Buffer): Promise<string> {
    try {
      // Convert raw PCM to a WAV container (Mistral API expects a file-like upload)
      const wavBuffer = this.pcmToWav(audioBuffer, 16000, 1, 16)

      const audioBlob = new Blob([wavBuffer.buffer.slice(wavBuffer.byteOffset, wavBuffer.byteOffset + wavBuffer.byteLength)] as BlobPart[], { type: 'audio/wav' })
      const audioFile = new File([audioBlob], 'audio.wav', { type: 'audio/wav' })

      const result = await this.client.audio.transcriptions.complete({
        model: 'voxtral-mini-latest',
        file: audioFile,
      })

      return result.text?.trim() ?? ''
    } catch (error) {
      console.error('Voxtral transcription error:', error)
      return ''
    }
  }

  /** Wrap raw PCM bytes in a minimal WAV header. */
  private pcmToWav(pcm: Buffer, sampleRate: number, channels: number, bitsPerSample: number): Buffer {
    const byteRate = sampleRate * channels * (bitsPerSample / 8)
    const blockAlign = channels * (bitsPerSample / 8)
    const dataSize = pcm.length
    const header = Buffer.alloc(44)

    header.write('RIFF', 0)
    header.writeUInt32LE(36 + dataSize, 4)
    header.write('WAVE', 8)
    header.write('fmt ', 12)
    header.writeUInt32LE(16, 16)          // PCM chunk size
    header.writeUInt16LE(1, 20)           // PCM format
    header.writeUInt16LE(channels, 22)
    header.writeUInt32LE(sampleRate, 24)
    header.writeUInt32LE(byteRate, 28)
    header.writeUInt16LE(blockAlign, 32)
    header.writeUInt16LE(bitsPerSample, 34)
    header.write('data', 36)
    header.writeUInt32LE(dataSize, 40)

    return Buffer.concat([header, pcm])
  }
}

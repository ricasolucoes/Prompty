import type { ImageProvider, GeneratedImage } from './types.ts'

export class OpenAIProvider implements ImageProvider {
  async generate(_prompt: string): Promise<GeneratedImage> {
    const key = Deno.env.get('OPENAI_API_KEY')
    if (!key) throw new Error('openai provider not configured: set OPENAI_API_KEY')
    // TODO: call OpenAI image API via native fetch with AbortSignal.timeout(120_000),
    // return { bytes, mimeType }. Filled when ACTIVE_PROVIDER=openai is chosen.
    throw new Error('openai provider not implemented yet')
  }
}

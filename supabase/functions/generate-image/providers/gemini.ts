import type { ImageProvider, GeneratedImage } from './types.ts'

export class GeminiProvider implements ImageProvider {
  async generate(_prompt: string): Promise<GeneratedImage> {
    const key = Deno.env.get('GEMINI_API_KEY')
    if (!key) throw new Error('gemini provider not configured: set GEMINI_API_KEY')
    // TODO: call Gemini image API via native fetch with AbortSignal.timeout(120_000),
    // return { bytes, mimeType }. Filled when ACTIVE_PROVIDER=gemini is chosen.
    throw new Error('gemini provider not implemented yet')
  }
}

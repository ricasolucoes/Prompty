import type { ImageProvider, GeneratedImage } from './types.ts'

export class ReplicateProvider implements ImageProvider {
  async generate(_prompt: string): Promise<GeneratedImage> {
    const key = Deno.env.get('REPLICATE_API_TOKEN')
    if (!key) throw new Error('replicate provider not configured: set REPLICATE_API_TOKEN')
    // TODO: call Replicate API via native fetch with AbortSignal.timeout(120_000),
    // return { bytes, mimeType }. Filled when ACTIVE_PROVIDER=replicate is chosen.
    throw new Error('replicate provider not implemented yet')
  }
}

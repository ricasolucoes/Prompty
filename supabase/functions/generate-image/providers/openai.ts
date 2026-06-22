import type { ImageProvider, GeneratedImage } from './types.ts'

// OpenAI image generation (gpt-image-1). Returns base64 PNG; we decode to bytes.
// Docs: POST https://api.openai.com/v1/images/generations
const ENDPOINT = 'https://api.openai.com/v1/images/generations'
const MODEL = 'gpt-image-1'
const SIZE = '1024x1024'
const TIMEOUT_MS = 120_000 // < 150s Edge wall-clock → leaves room for refund on timeout

function base64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64)
  const bytes = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
  return bytes
}

export class OpenAIProvider implements ImageProvider {
  async generate(prompt: string): Promise<GeneratedImage> {
    // Force-fail hook: exercises the refund path WITHOUT spending an API call.
    if (prompt.includes('__FORCE_FAIL__') || Deno.env.get('GEN_FORCE_FAIL') === '1') {
      throw new Error('forced failure (__FORCE_FAIL__)')
    }

    const key = Deno.env.get('OPENAI_API_KEY')
    if (!key) throw new Error('openai provider not configured: set OPENAI_API_KEY')

    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ model: MODEL, prompt, n: 1, size: SIZE }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    })

    if (!res.ok) {
      const detail = await res.text().catch(() => '')
      throw new Error(`openai_error ${res.status}: ${detail.slice(0, 300)}`)
    }

    const payload = (await res.json()) as { data?: Array<{ b64_json?: string }> }
    const b64 = payload.data?.[0]?.b64_json
    if (!b64) throw new Error('openai_error: no image in response')

    // gpt-image-1 returns PNG.
    return { bytes: base64ToBytes(b64), mimeType: 'image/png' }
  }
}

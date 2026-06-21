import type { ImageProvider, GeneratedImage } from './types.ts'

// Minimal valid 1×1 WebP (deterministic placeholder). No external encoder needed.
// VP8L lossless 1×1; ~30 bytes. Decoder-valid for the webview <img>.
const MOCK_WEBP = new Uint8Array([
  0x52, 0x49, 0x46, 0x46, 0x1a, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50,
  0x56, 0x50, 0x38, 0x4c, 0x0d, 0x00, 0x00, 0x00, 0x2f, 0x00, 0x00, 0x00,
  0x10, 0x07, 0x10, 0x11, 0x11, 0x88, 0x88, 0xfe, 0x07, 0x00,
])

export class MockProvider implements ImageProvider {
  async generate(prompt: string): Promise<GeneratedImage> {
    if (prompt.includes('__FORCE_FAIL__') || Deno.env.get('MOCK_FAIL') === '1') {
      throw new Error('Mock forced failure')
    }
    // Simulate provider latency so the loading UX is exercised.
    await new Promise((r) => setTimeout(r, 1500))
    return { bytes: MOCK_WEBP, mimeType: 'image/webp' }
  }
}

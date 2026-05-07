import { describe, it, expect, vi, beforeEach } from 'vitest'
import { compressToWebP } from './compress'

/**
 * jsdom does not implement createImageBitmap or canvas.toBlob with WebP.
 * We mock the minimum Canvas API surface to verify the algorithm shape:
 * - createImageBitmap is mocked to return a fake { width, height }
 * - canvas.toBlob is mocked to return a synthetic Blob with controlled size
 */
describe('compressToWebP', () => {
  beforeEach(() => {
    ;(globalThis as unknown as { createImageBitmap: unknown }).createImageBitmap = vi
      .fn()
      .mockResolvedValue({ width: 2400, height: 1600, close: () => {} })

    const fakeCanvas = {
      width: 0,
      height: 0,
      getContext: () => ({ drawImage: () => {} }),
      toBlob: (cb: (b: Blob | null) => void, _type?: string, q?: number) => {
        // Simulate quality affecting size: higher quality => bigger blob
        const sizeBytes = Math.round((q ?? 0.85) * 400 * 1024)
        const blob = new Blob([new Uint8Array(sizeBytes)], { type: 'image/webp' })
        cb(blob)
      },
    }
    const origCreateElement = document.createElement.bind(document)
    vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      if (tag === 'canvas') return fakeCanvas as unknown as HTMLCanvasElement
      return origCreateElement(tag)
    })
  })

  it('returns a webp blob', async () => {
    const file = new File([new Uint8Array(1024)], 'test.png', { type: 'image/png' })
    const out = await compressToWebP(file, 200)
    expect(out.type).toBe('image/webp')
  })
  it('returns blob ≤200KB by retrying with lower quality', async () => {
    const file = new File([new Uint8Array(1024)], 'test.png', { type: 'image/png' })
    const out = await compressToWebP(file, 200)
    expect(out.size).toBeLessThanOrEqual(200 * 1024)
  })
  it('throws if canvas 2d context is unavailable', async () => {
    const fakeCanvas = { getContext: () => null }
    vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      if (tag === 'canvas') return fakeCanvas as unknown as HTMLCanvasElement
      return document.createElement(tag)
    })
    const file = new File([new Uint8Array(1)], 'test.png', { type: 'image/png' })
    await expect(compressToWebP(file)).rejects.toThrow('Canvas 2D context unavailable')
  })
})

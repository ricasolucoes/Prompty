/**
 * Compress an image File to WebP with target size cap.
 * Defaults: maxKB=200, quality=0.85, maxDim=1200px (longest side).
 * Falls back to lower quality if first pass exceeds maxKB.
 */
export async function compressToWebP(file: File, maxKB = 200, quality = 0.85): Promise<Blob> {
  const bitmap = await createImageBitmap(file)
  const MAX_DIM = 1200
  const scale = Math.min(1, MAX_DIM / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(bitmap.width * scale))
  canvas.height = Math.max(1, Math.round(bitmap.height * scale))
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas 2D context unavailable')
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height)

  const toBlobAsync = (q: number): Promise<Blob> =>
    new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error('Compression failed'))),
        'image/webp',
        q,
      )
    })

  const first = await toBlobAsync(quality)
  if (first.size <= maxKB * 1024) return first
  // More aggressive quality reduction to stay within the target size cap
  const second = await toBlobAsync(quality * 0.5)
  return second
}

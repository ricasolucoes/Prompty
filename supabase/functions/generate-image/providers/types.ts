export interface GeneratedImage {
  bytes: Uint8Array
  mimeType: string
}

export interface ImageProvider {
  generate(prompt: string): Promise<GeneratedImage>
}

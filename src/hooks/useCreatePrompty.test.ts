import { describe, it, expect, vi, beforeEach } from 'vitest'

// --- Mocks (must be declared before any dynamic imports) ---

const insertMock = vi.fn()
const selectMock = vi.fn()
const singleMock = vi.fn()
const versionsInsertMock = vi.fn()
const storageUploadMock = vi.fn()
const storageGetPublicUrlMock = vi.fn()

// Chainable promptys insert: .insert().select().single()
const promptysChain = {
  insert: insertMock,
  select: selectMock,
  single: singleMock,
}
insertMock.mockReturnValue(promptysChain)
selectMock.mockReturnValue(promptysChain)
singleMock.mockResolvedValue({ data: { id: 'p1', slug: 'retrato-cinematografico-x7k2p9' }, error: null })

// prompty_versions insert (best-effort)
const versionsChain = { insert: versionsInsertMock }
versionsInsertMock.mockResolvedValue({ data: null, error: null })

const fromMock = vi.fn((table: string) => {
  if (table === 'promptys') return promptysChain
  if (table === 'prompty_versions') return versionsChain
  return {}
})

storageUploadMock.mockResolvedValue({ data: { path: 'u1/slug-cover.webp' }, error: null })
storageGetPublicUrlMock.mockReturnValue({ data: { publicUrl: 'https://example.com/slug-cover.webp' } })

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: (...args: unknown[]) => fromMock(...args),
    storage: {
      from: () => ({
        upload: storageUploadMock,
        getPublicUrl: storageGetPublicUrlMock,
      }),
    },
  },
}))

vi.mock('@/lib/images/compress', () => ({
  compressToWebP: () => Promise.resolve(new Blob(['x'], { type: 'image/webp' })),
}))

const getStateMock = vi.fn(() => ({ user: { id: 'u1' } }))

vi.mock('@/stores/auth.store', () => ({
  useAuthStore: { getState: (...args: unknown[]) => getStateMock(...args) },
}))

// Dynamic import AFTER mocks
const { useCreatePrompty } = await import('./useCreatePrompty')

describe('useCreatePrompty', () => {
  beforeEach(() => {
    fromMock.mockClear()
    insertMock.mockClear()
    selectMock.mockClear()
    singleMock.mockClear()
    versionsInsertMock.mockClear()
    storageUploadMock.mockClear()
    storageGetPublicUrlMock.mockClear()
    getStateMock.mockClear()

    // Reset defaults
    insertMock.mockReturnValue(promptysChain)
    selectMock.mockReturnValue(promptysChain)
    singleMock.mockResolvedValue({ data: { id: 'p1', slug: 'retrato-cinematografico-x7k2p9' }, error: null })
    versionsInsertMock.mockResolvedValue({ data: null, error: null })
    storageUploadMock.mockResolvedValue({ data: { path: 'u1/slug-cover.webp' }, error: null })
    storageGetPublicUrlMock.mockReturnValue({ data: { publicUrl: 'https://example.com/slug-cover.webp' } })
    getStateMock.mockReturnValue({ user: { id: 'u1' } })
  })

  // Test 1 (CREAT-01): insert with correct payload shape
  it('CREAT-01: publish() calls insert with title/template/difficulty/status=published/author_id', async () => {
    const { publish } = useCreatePrompty()
    await publish({ title: 'Retrato Cinematográfico', beginner_prompt: 'Hello', category: 'beginner' })

    expect(fromMock).toHaveBeenCalledWith('promptys')
    expect(insertMock).toHaveBeenCalledTimes(1)

    const payload = insertMock.mock.calls[0][0] as Record<string, unknown>
    expect(payload.title).toBe('Retrato Cinematográfico')
    expect(payload.template).toBe('Hello')
    expect(payload.difficulty).toBe('beginner')
    expect(payload.status).toBe('published')
    expect(payload.author_id).toBe('u1')
  })

  // Test 2 (CREAT-01): returns ok=true with slug
  it('CREAT-01: publish() returns { ok: true, slug } where slug is kebab-case + 6 char suffix', async () => {
    const { publish } = useCreatePrompty()
    const result = await publish({ title: 'Retrato Cinematográfico', beginner_prompt: 'Hello', category: 'beginner' })

    expect(result.ok).toBe(true)
    expect(typeof result.slug).toBe('string')
    // slug must match kebab-case base + hyphen + 6 alphanumeric chars
    expect(result.slug).toMatch(/^[a-z0-9-]+-[a-z0-9]{6}$/)
  })

  // Test 3 (CREAT-01): no user → { ok: false, error: 'Não autenticado' }
  it('CREAT-01: publish() with no authenticated user returns { ok: false, error }', async () => {
    getStateMock.mockReturnValue({ user: null })
    const { publish } = useCreatePrompty()
    const result = await publish({ title: 'T', beginner_prompt: 'P', category: 'beginner' })

    expect(result.ok).toBe(false)
    expect(result.error).toBe('Não autenticado')
  })

  // Test 4 (CREAT-01): cover file → uploads to prompty-covers
  it('CREAT-01: publish() with coverFile uploads to prompty-covers with path u1/<slug>-cover.webp', async () => {
    const fakeFile = new File(['img'], 'photo.jpg', { type: 'image/jpeg' })
    const { publish } = useCreatePrompty()
    await publish({ title: 'Cover Test', beginner_prompt: 'P', category: 'beginner', coverFile: fakeFile })

    expect(storageUploadMock).toHaveBeenCalledTimes(1)
    const [path, , opts] = storageUploadMock.mock.calls[0] as [string, unknown, { contentType: string }]
    // path must be u1/<slug>-cover.webp
    expect(path).toMatch(/^u1\/.+-cover\.webp$/)
    expect(opts.contentType).toBe('image/webp')
  })

  // Test 5 (CREAT-04): parentId → parent_id in insert payload
  it('CREAT-04: publish() with parentId sets parent_id on insert payload', async () => {
    const { publish } = useCreatePrompty()
    await publish({ title: 'Variation', beginner_prompt: 'P', category: 'intermediate', parentId: 'parent-uuid' })

    const payload = insertMock.mock.calls[0][0] as Record<string, unknown>
    expect(payload.parent_id).toBe('parent-uuid')
  })

  // Test 6 (CREAT-05): advancedTemplate → prompty_versions row
  it('CREAT-05: publish() with advancedTemplate creates prompty_versions snapshot', async () => {
    const { publish } = useCreatePrompty()
    await publish({
      title: 'Advanced',
      beginner_prompt: 'Simple',
      category: 'advanced',
      advancedTemplate: 'X {{a}}',
      inputs_schema: [{ key: 'a', label: 'A', type: 'text' }],
    })

    expect(fromMock).toHaveBeenCalledWith('prompty_versions')
    expect(versionsInsertMock).toHaveBeenCalledTimes(1)

    const versionPayload = versionsInsertMock.mock.calls[0][0] as Record<string, unknown>
    expect(versionPayload.version).toBe(1)
    expect(versionPayload.template).toBe('X {{a}}')
    expect(versionPayload.prompty_id).toBe('p1')
    expect(Array.isArray(versionPayload.inputs_schema)).toBe(true)
  })

  // Test 7 (CREAT-01): insert error → { ok: false, error }
  it('CREAT-01: publish() with supabase insert error returns { ok: false, error }', async () => {
    singleMock.mockResolvedValue({ data: null, error: { message: 'DB error' } })
    const { publish } = useCreatePrompty()
    const result = await publish({ title: 'T', beginner_prompt: 'P', category: 'beginner' })

    expect(result.ok).toBe(false)
    expect(result.error).toBe('Não foi possível publicar.')
  })

  // Test 8 (CREAT-01): generateSlug strips diacritics and special chars
  it('CREAT-01: generateSlug strips diacritics and special chars, produces valid slug', async () => {
    const { publish } = useCreatePrompty()
    // We test the generated slug via the insert payload (slug field)
    await publish({ title: 'Retrato Cinematográfico !!!', beginner_prompt: 'P', category: 'beginner' })

    const payload = insertMock.mock.calls[0][0] as Record<string, unknown>
    const slug = payload.slug as string
    // Must be kebab-case without diacritics or special chars
    expect(slug).toMatch(/^retrato-cinematografico-[a-z0-9]{6}$/)
  })
})

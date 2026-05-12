import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { PromptyDetailPage } from './PromptyDetailPage'

// Mock supabase: detail fetch + save table queries return a stable fake prompty
vi.mock('@/lib/supabase', () => {
  const fakePrompty = {
    id: 'p1',
    slug: 'retrato-cinematografico',
    title: 'Retrato Cinematográfico',
    description: 'desc',
    template: 'Hello {{subject}}',
    inputs_schema: [{ key: 'subject', label: 'Sujeito', type: 'text', value: 'astrônoma' }],
    models: [],
    style_tags: [],
    cover_url: null,
    cover_gradient: 'linear-gradient(135deg,#000,#fff)',
    license: 'community-remix',
    status: 'published',
    author_id: 'u1',
    version: 1,
    negative: null,
    difficulty: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    profiles: { name: 'Mira Velasco', username: 'mira', avatar_url: null },
  }
  function chainable(result: unknown) {
    const fn = () => Promise.resolve(result)
    const obj: Record<string, unknown> = {}
    obj.select = () => obj
    obj.eq = () => obj
    obj.maybeSingle = () => fn()
    obj.insert = () => fn()
    obj.delete = () => obj
    obj.match = () => fn()
    obj.order = () => obj
    obj.limit = () => obj
    return obj
  }
  return {
    supabase: {
      from: (table: string) => {
        if (table === 'promptys') return chainable({ data: fakePrompty, error: null })
        if (table === 'prompty_saves') return chainable({ data: null, error: null })
        return chainable({ data: null, error: null })
      },
      rpc: () => Promise.resolve({ data: null, error: null }),
      auth: { getSession: () => Promise.resolve({ data: { session: null } }) },
    },
  }
})

// Mock auth store — default to anonymous; per-test override of mockUser/mockProfile changes behavior
let mockUser: { id: string } | null = null
let mockProfile: { id: string; points: number; level: string } | null = null
vi.mock('@/stores/auth.store', () => ({
  useAuthStore: (selector: (s: { user: typeof mockUser; profile: typeof mockProfile }) => unknown) =>
    selector({ user: mockUser, profile: mockProfile }),
}))

function renderDetail() {
  return render(
    <MemoryRouter initialEntries={['/p/retrato-cinematografico']}>
      <Routes>
        <Route path="/p/:slug" element={<PromptyDetailPage />} />
      </Routes>
    </MemoryRouter>,
  )
}

// Keep backward-compatible alias used by existing tests
function renderAtSlug(slug: string) {
  return render(
    <MemoryRouter initialEntries={[`/p/${slug}`]}>
      <Routes>
        <Route path="/p/:slug" element={<PromptyDetailPage />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('PromptyDetailPage', () => {
  beforeEach(() => { mockUser = null; mockProfile = null })

  it('FEED-03: renders title, full prompt with resolved variables, and Copiar button (anon)', async () => {
    renderAtSlug('retrato-cinematografico')
    await waitFor(() => expect(screen.getByText('Retrato Cinematográfico')).toBeInTheDocument())
    const promptText = screen.getByTestId('prompt-text-full')
    expect(promptText.textContent).toContain('astrônoma')
    expect(promptText.textContent).not.toContain('{{subject}}')
    expect(screen.getByRole('button', { name: /Copiar prompt/i })).toBeInTheDocument()
  })

  it('SOCL-01: anonymous user does NOT see the Salvar button', async () => {
    mockUser = null
    renderAtSlug('retrato-cinematografico')
    await waitFor(() => expect(screen.getByText('Retrato Cinematográfico')).toBeInTheDocument())
    // The save button uses aria-label="Salvar na biblioteca" (or "Remover dos salvos"
    // when saved). Both labels must be absent for anon users.
    expect(screen.queryByLabelText(/Salvar na biblioteca/i)).not.toBeInTheDocument()
    expect(screen.queryByLabelText(/Remover dos salvos/i)).not.toBeInTheDocument()
  })

  it('SOCL-01: authenticated user sees the Salvar button', async () => {
    mockUser = { id: 'user-1' }
    renderAtSlug('retrato-cinematografico')
    await waitFor(() => expect(screen.getByText('Retrato Cinematográfico')).toBeInTheDocument())
    // Initial state: not saved → aria-label is "Salvar na biblioteca"
    expect(await screen.findByLabelText(/Salvar na biblioteca/i)).toBeInTheDocument()
  })

  it('renders the back link to /', async () => {
    renderAtSlug('retrato-cinematografico')
    await waitFor(() => expect(screen.getByText('Retrato Cinematográfico')).toBeInTheDocument())
    const backLink = screen.getByLabelText('Voltar ao feed')
    expect(backLink).toBeInTheDocument()
    expect(backLink.getAttribute('href')).toBe('/')
  })
})

// ---------- Phase 2 additions ----------
// L2-gated "..." menu + ReportSheet + CategorySuggestSheet

describe('PromptyDetailPage — L2 "..." menu (Phase 2)', () => {
  beforeEach(() => { mockUser = null; mockProfile = null })

  it('LEVL-07: anonymous user does NOT see "..." button', async () => {
    mockUser = null
    mockProfile = null
    renderDetail()
    await waitFor(() => expect(screen.getByText('Retrato Cinematográfico')).toBeInTheDocument())
    expect(screen.queryByLabelText('Mais opções')).not.toBeInTheDocument()
  })

  it('LEVL-07: L1 user does NOT see "..." button', async () => {
    mockUser = { id: 'u1' }
    mockProfile = { id: 'u1', points: 0, level: 'L1' }
    renderDetail()
    await waitFor(() => expect(screen.getByText('Retrato Cinematográfico')).toBeInTheDocument())
    expect(screen.queryByLabelText('Mais opções')).not.toBeInTheDocument()
  })

  it('L2 user sees "..." button', async () => {
    mockUser = { id: 'u1' }
    mockProfile = { id: 'u1', points: 100, level: 'L2' }
    renderDetail()
    await waitFor(() => expect(screen.getByLabelText('Mais opções')).toBeInTheDocument())
  })

  it('tapping "..." opens OptionsSheet with two options', async () => {
    mockUser = { id: 'u1' }
    mockProfile = { id: 'u1', points: 100, level: 'L2' }
    renderDetail()
    await waitFor(() => expect(screen.getByLabelText('Mais opções')).toBeInTheDocument())
    fireEvent.click(screen.getByLabelText('Mais opções'))
    expect(screen.getByRole('dialog', { name: 'Opções para este Prompty' })).toBeInTheDocument()
    expect(screen.getByText('Sugerir categoria')).toBeInTheDocument()
    expect(screen.getByText('Denunciar')).toBeInTheDocument()
  })

  it('CUR-05: tapping Denunciar option opens ReportSheet', async () => {
    mockUser = { id: 'u1' }
    mockProfile = { id: 'u1', points: 100, level: 'L2' }
    renderDetail()
    await waitFor(() => expect(screen.getByLabelText('Mais opções')).toBeInTheDocument())
    fireEvent.click(screen.getByLabelText('Mais opções'))
    fireEvent.click(screen.getByText('Denunciar'))
    await waitFor(() =>
      expect(screen.getByRole('dialog', { name: 'Denunciar Prompty' })).toBeInTheDocument(),
    )
  })

  it('CUR-04: tapping Sugerir categoria opens CategorySuggestSheet', async () => {
    mockUser = { id: 'u1' }
    mockProfile = { id: 'u1', points: 100, level: 'L2' }
    renderDetail()
    await waitFor(() => expect(screen.getByLabelText('Mais opções')).toBeInTheDocument())
    fireEvent.click(screen.getByLabelText('Mais opções'))
    fireEvent.click(screen.getByText('Sugerir categoria'))
    await waitFor(() =>
      expect(screen.getByRole('dialog', { name: 'Sugerir categoria' })).toBeInTheDocument(),
    )
  })
})

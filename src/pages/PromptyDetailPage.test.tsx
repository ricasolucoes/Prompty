import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
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

// Mock auth store — default to anonymous; per-test override of mockUser changes behavior
let mockUser: { id: string } | null = null
vi.mock('@/stores/auth.store', () => ({
  useAuthStore: (selector: (s: { user: { id: string } | null }) => unknown) => selector({ user: mockUser }),
}))

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
  beforeEach(() => { mockUser = null })

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

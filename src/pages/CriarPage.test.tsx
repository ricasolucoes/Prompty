import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { CriarPage } from './CriarPage'

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return { ...actual, useNavigate: () => mockNavigate }
})

let mockParentResponse: { data: unknown; error: null } | { data: null; error: { message: string } } = { data: null, error: null }
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: () => Promise.resolve(mockParentResponse),
        }),
      }),
    }),
  },
}))

vi.mock('@/stores/auth.store', () => ({
  useAuthStore: { getState: () => ({ user: { id: 'u1' } }) },
}))

vi.mock('@/hooks/useCreatePrompty', () => ({
  useCreatePrompty: () => ({
    publish: vi.fn().mockResolvedValue({ ok: true, slug: 'new-prompty-x7k2p9' }),
  }),
}))

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/criar" element={<CriarPage />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('CriarPage', () => {
  beforeEach(() => {
    mockNavigate.mockReset()
    mockParentResponse = { data: null, error: null }
  })

  it('CREAT-01: renders wizard step 1 (Criar Prompty header) on mount at /criar', async () => {
    renderAt('/criar')
    await waitFor(() => expect(screen.getByText('Criar Prompty')).toBeInTheDocument())
  })

  it('CREAT-04: pre-fills wizard with parent prompty data when ?from=<id> is present', async () => {
    mockParentResponse = {
      data: {
        id: 'parent-id',
        title: 'Parent Title',
        template: 'Parent prompt',
        difficulty: 'intermediate',
      },
      error: null,
    }
    renderAt('/criar?from=parent-id')
    await waitFor(() => {
      const titleInput = screen.getByLabelText('Título do Prompty') as HTMLInputElement
      expect(titleInput.value).toBe('Parent Title')
    })
  })

  it('CREAT-04: when parent fetch fails, wizard mounts with empty data (graceful)', async () => {
    mockParentResponse = { data: null, error: { message: 'not found' } }
    renderAt('/criar?from=missing-id')
    await waitFor(() => {
      const titleInput = screen.getByLabelText('Título do Prompty') as HTMLInputElement
      expect(titleInput.value).toBe('')
    })
  })
})

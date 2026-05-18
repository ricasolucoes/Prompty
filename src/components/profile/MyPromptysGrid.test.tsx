import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { MyPromptysGrid } from './MyPromptysGrid'

// Mock useMyPromptys to return controllable data per test
let mockPromptys: {
  id: string
  slug: string
  title: string
  cover_url: null
  cover_gradient: null
  created_at: string
  copies: number
  saves: number
  feedbacks: number
}[] = []
vi.mock('@/hooks/useMyPromptys', () => ({
  useMyPromptys: () => ({ promptys: mockPromptys, loading: false }),
}))

// Mock auth store; per-test set level
let mockProfile: { points: number } | null = null
vi.mock('@/stores/auth.store', () => ({
  useAuthStore: (selector: (s: { profile: { points: number } | null }) => unknown) =>
    selector({ profile: mockProfile }),
}))

function renderGrid() {
  return render(
    <MemoryRouter>
      <MyPromptysGrid />
    </MemoryRouter>,
  )
}

describe('MyPromptysGrid — L3 stats section (CREAT-03 + LEVL-07)', () => {
  beforeEach(() => {
    mockPromptys = []
    mockProfile = null
  })

  it('LEVL-07: returns null for L1 user (0 points)', () => {
    mockProfile = { points: 0 }
    const { container } = renderGrid()
    expect(container.firstChild).toBeNull()
  })

  it('LEVL-07: returns null for L2 user (50 points)', () => {
    mockProfile = { points: 50 }
    const { container } = renderGrid()
    expect(container.firstChild).toBeNull()
  })

  it('CREAT-03: renders Meus Promptys header for L3 user (300 points)', () => {
    mockProfile = { points: 300 }
    mockPromptys = [
      {
        id: 'p1',
        slug: 'first',
        title: 'Test',
        cover_url: null,
        cover_gradient: null,
        created_at: new Date().toISOString(),
        copies: 5,
        saves: 2,
        feedbacks: 1,
      },
    ]
    renderGrid()
    expect(screen.getByText('Meus Promptys')).toBeInTheDocument()
  })

  it('CREAT-03: renders one MyPromptyCard per owned prompty', () => {
    mockProfile = { points: 300 }
    mockPromptys = [
      {
        id: 'p1',
        slug: 'first',
        title: 'First',
        cover_url: null,
        cover_gradient: null,
        created_at: new Date().toISOString(),
        copies: 1,
        saves: 0,
        feedbacks: 0,
      },
      {
        id: 'p2',
        slug: 'second',
        title: 'Second',
        cover_url: null,
        cover_gradient: null,
        created_at: new Date().toISOString(),
        copies: 0,
        saves: 0,
        feedbacks: 0,
      },
    ]
    renderGrid()
    expect(screen.getByText('First')).toBeInTheDocument()
    expect(screen.getByText('Second')).toBeInTheDocument()
  })

  it('CREAT-03: renders empty state heading when L3 user has no promptys', () => {
    mockProfile = { points: 300 }
    mockPromptys = []
    renderGrid()
    expect(screen.getByText('Nenhum Prompty ainda')).toBeInTheDocument()
  })

  it('CREAT-03: empty state body mentions sparkle button', () => {
    mockProfile = { points: 300 }
    mockPromptys = []
    renderGrid()
    expect(screen.getByText(/Crie seu primeiro Prompty pelo botão ✦ abaixo\./)).toBeInTheDocument()
  })
})

import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

interface MockEntry {
  id: string
  username: string | null
  name: string | null
  avatar_url: string | null
  level: string
  points: number
  verified: boolean
}

let mockRanking: { entries: MockEntry[]; loading: boolean; myRank: number | null } = {
  entries: [],
  loading: false,
  myRank: null,
}

vi.mock('@/hooks/useRanking', () => ({
  useRanking: () => mockRanking,
}))

const { RankingPage } = await import('./RankingPage')
const { useAuthStore } = await import('@/stores/auth.store')

const ENTRIES: MockEntry[] = [
  {
    id: 'u1',
    username: 'ana',
    name: 'Ana',
    avatar_url: null,
    level: 'L4',
    points: 1200,
    verified: true,
  },
  {
    id: 'u2',
    username: 'bob',
    name: 'Bob',
    avatar_url: null,
    level: 'L3',
    points: 600,
    verified: false,
  },
  {
    id: 'u3',
    username: null,
    name: 'Cris',
    avatar_url: null,
    level: 'L3',
    points: 300,
    verified: false,
  },
]

function renderPage() {
  return render(
    <MemoryRouter>
      <RankingPage />
    </MemoryRouter>,
  )
}

describe('RankingPage', () => {
  beforeEach(() => {
    useAuthStore.setState({ user: null, profile: null, loading: false })
    mockRanking = { entries: [], loading: false, myRank: null }
  })

  it('renders the ranking header and subtitle', () => {
    renderPage()
    expect(screen.getByRole('heading', { name: 'Ranking' })).toBeInTheDocument()
    expect(screen.getByText(/criadores que mais contribuíram/i)).toBeInTheDocument()
  })

  it('shows the empty state when there are no entries', () => {
    mockRanking = { entries: [], loading: false, myRank: null }
    renderPage()
    expect(screen.getByText(/ranking está sendo formado/i)).toBeInTheDocument()
  })

  it('renders each entry with its name, points and a podium medal for the top 3', () => {
    mockRanking = { entries: ENTRIES, loading: false, myRank: null }
    renderPage()
    expect(screen.getByText('Ana')).toBeInTheDocument()
    expect(screen.getByText('Bob')).toBeInTheDocument()
    expect(screen.getByText('600')).toBeInTheDocument()
    expect(screen.getByLabelText('1º lugar')).toBeInTheDocument()
    expect(screen.getByLabelText('2º lugar')).toBeInTheDocument()
    expect(screen.getByLabelText('3º lugar')).toBeInTheDocument()
  })

  it('links entries with a username to their public profile, and leaves usernameless ones unlinked', () => {
    mockRanking = { entries: ENTRIES, loading: false, myRank: null }
    renderPage()
    const anaLink = screen.getByRole('link', { name: /ver perfil de ana/i })
    expect(anaLink).toHaveAttribute('href', '/u/ana')
    // Cris has no username → rendered but not a link
    expect(screen.getByText('Cris')).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /cris/i })).toBeNull()
  })

  it('shows the current user position when they rank below the visible list', () => {
    useAuthStore.setState({ user: { id: 'zz' } as never, profile: null, loading: false })
    mockRanking = { entries: ENTRIES, loading: false, myRank: 42 }
    renderPage()
    const footer = screen.getByText(/você está em/i)
    expect(footer).toHaveTextContent('#42')
  })

  it('does not show the position footer when the user is already in the visible list', () => {
    useAuthStore.setState({ user: { id: 'u2' } as never, profile: null, loading: false })
    mockRanking = { entries: ENTRIES, loading: false, myRank: 2 }
    renderPage()
    expect(screen.queryByText(/você está em/i)).toBeNull()
  })
})

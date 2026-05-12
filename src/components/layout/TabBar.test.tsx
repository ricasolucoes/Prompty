import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { TabBar } from './TabBar'
import { useAuthStore } from '@/stores/auth.store'

function setLevel(level: 'L1' | 'L2' | 'L3' | null, points: number) {
  const fakeProfile =
    level === null
      ? null
      : ({ id: 'u1', level, points, name: 'X', username: 'x' } as never)
  useAuthStore.setState({ user: { id: 'u1' } as never, profile: fakeProfile, loading: false })
}

function renderTabBar() {
  return render(
    <MemoryRouter>
      <TabBar />
    </MemoryRouter>,
  )
}

describe('TabBar — progressive disclosure (LEVL-07)', () => {
  beforeEach(() => {
    useAuthStore.setState({ user: null, profile: null, loading: false })
  })

  it('renders exactly 2 tabs for unauthenticated visitor (default L1)', () => {
    setLevel(null, 0)
    renderTabBar()
    expect(screen.getByLabelText('Feed')).toBeInTheDocument()
    expect(screen.getByLabelText('Perfil')).toBeInTheDocument()
    expect(screen.queryByLabelText('Buscar')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('Criar')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('Ranking')).not.toBeInTheDocument()
  })

  it('renders exactly 2 tabs for L1 user (0 points)', () => {
    setLevel('L1', 0)
    renderTabBar()
    const navItems = screen.getAllByRole('link')
    expect(navItems).toHaveLength(2)
    expect(screen.queryByLabelText('Buscar')).not.toBeInTheDocument()
  })

  it('does NOT render any disabled or locked tabs for L1', () => {
    setLevel('L1', 49)
    renderTabBar()
    // Locked tabs must NOT exist in the DOM (LEVL-07: no greyed/disabled)
    expect(screen.queryByText(/buscar/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/criar/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/ranking/i)).not.toBeInTheDocument()
  })

  it('L1 user does NOT see Salvos tab (LEVL-07)', () => {
    setLevel('L1', 49)
    renderTabBar()
    expect(screen.queryByLabelText('Salvos')).not.toBeInTheDocument()
    expect(screen.queryByText(/salvos/i)).not.toBeInTheDocument()
  })

  it('renders 4 tabs for L2 (Feed + Salvos + Buscar + Perfil)', () => {
    setLevel('L2', 100)
    renderTabBar()
    expect(screen.getAllByRole('link')).toHaveLength(4)
    expect(screen.getByLabelText('Feed')).toBeInTheDocument()
    expect(screen.getByLabelText('Salvos')).toBeInTheDocument()
    expect(screen.getByLabelText('Buscar')).toBeInTheDocument()
    expect(screen.getByLabelText('Perfil')).toBeInTheDocument()
    expect(screen.queryByLabelText('Criar')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('Ranking')).not.toBeInTheDocument()
  })

  it('renders 6 tabs for L3 (adds Criar + Ranking)', () => {
    setLevel('L3', 300)
    renderTabBar()
    expect(screen.getAllByRole('link')).toHaveLength(6)
    expect(screen.getByLabelText('Criar')).toBeInTheDocument()
    expect(screen.getByLabelText('Ranking')).toBeInTheDocument()
  })
})

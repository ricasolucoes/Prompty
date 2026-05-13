import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

// Mock all dependencies that ProfilePage uses
vi.mock('@/hooks/useProfile', () => ({
  useProfile: () => ({ profile: null, update: vi.fn(), recents: [] }),
}))
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ signOut: vi.fn() }),
}))
vi.mock('@/stores/level.store', () => ({
  useLevelStore: (sel: (s: { hasShown: () => false; markShown: () => void }) => unknown) =>
    sel({ hasShown: () => false, markShown: () => {} }),
}))
vi.mock('@/components/profile/MyPromptysGrid', () => ({
  MyPromptysGrid: () => null,
}))

import { useAuthStore } from '@/stores/auth.store'
import { ProfilePage } from '@/pages/ProfilePage'

describe('ProfilePage nudge copy (LEVL-05)', () => {
  beforeEach(() => {
    // Reset store between tests
    useAuthStore.setState({ user: null, profile: null, loading: false })
  })

  function renderWithPoints(points: number) {
    useAuthStore.setState({
      user: { id: 'u1' } as never,
      profile: {
        id: 'u1',
        points,
        name: 'Test',
        username: null,
        bio: null,
        avatar_url: null,
        is_admin: false,
        level: 'L1',
        streak: 0,
        verified: false,
        created_at: '2026-01-01',
        last_active_at: null,
      } as never,
      loading: false,
    })
    return render(<MemoryRouter><ProfilePage /></MemoryRouter>)
  }

  it('L1 user (10p) nudge mentions Buscar', () => {
    renderWithPoints(10)
    const section = screen.getByRole('region', { name: /próximo desbloqueio/i })
    expect(section.textContent).toMatch(/Buscar/i)
  })

  it('L2 user (60p) nudge mentions Criar', () => {
    renderWithPoints(60)
    const section = screen.getByRole('region', { name: /próximo desbloqueio/i })
    expect(section.textContent).toMatch(/Criar/i)
  })
})

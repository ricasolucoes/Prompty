import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

// Mutable profile holder so tests can inject different points values
let mockPoints = 0

vi.mock('@/hooks/useProfile', () => ({
  useProfile: () => ({
    profile: {
      id: 'u1',
      points: mockPoints,
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
    },
    update: vi.fn(),
    recents: [],
  }),
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
  function renderWithPoints(points: number) {
    mockPoints = points
    // Set user in store so ProfilePage doesn't render the anonymous CTA
    useAuthStore.setState({
      user: { id: 'u1' } as never,
      profile: null,
      loading: false,
    })
    return render(
      <MemoryRouter>
        <ProfilePage />
      </MemoryRouter>,
    )
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

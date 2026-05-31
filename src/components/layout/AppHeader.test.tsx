import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth.store'
import { AppHeader } from './AppHeader'

function renderHeader() {
  return render(
    <MemoryRouter>
      <AppHeader />
    </MemoryRouter>,
  )
}

describe('AppHeader credit badge', () => {
  beforeEach(() => {
    useAuthStore.setState({ user: null, profile: null, loading: false })
  })

  it('shows "1 crédito" aria-label and displays 1 when profile.credits = 1', () => {
    useAuthStore.setState({
      user: { id: 'u1' } as never,
      profile: { credits: 1, points: 0, level: 'L1' } as never,
    })
    renderHeader()
    const badge = screen.getByLabelText('1 crédito')
    expect(badge).toBeInTheDocument()
    expect(badge).toHaveTextContent('1')
  })

  it('shows "3 créditos" aria-label and displays 3 when profile.credits = 3', () => {
    useAuthStore.setState({
      user: { id: 'u1' } as never,
      profile: { credits: 3, points: 0, level: 'L1' } as never,
    })
    renderHeader()
    const badge = screen.getByLabelText('3 créditos')
    expect(badge).toBeInTheDocument()
    expect(badge).toHaveTextContent('3')
  })

  it('shows "0 créditos" when profile is null (unauthenticated)', () => {
    useAuthStore.setState({ user: null, profile: null })
    renderHeader()
    const badge = screen.getByLabelText('0 créditos')
    expect(badge).toBeInTheDocument()
    expect(badge).toHaveTextContent('0')
  })
})

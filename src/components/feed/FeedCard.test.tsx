import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { FeedCard } from './FeedCard'
import type { FeedItem } from '@/hooks/useFeed'

function fakeItem(overrides: Partial<FeedItem> = {}): FeedItem {
  return {
    id: 'p1',
    slug: 'retrato',
    title: 'Retrato Cinematográfico',
    description: 'descrição',
    author_id: 'u1',
    template: 'Hello {{subject}}',
    negative: null,
    inputs_schema: [{ key: 'subject', label: 'Sujeito', type: 'text', value: 'astrônoma' }] as never,
    models: ['Midjourney', 'Flux'],
    difficulty: 'beginner',
    style_tags: ['retrato'],
    cover_url: null,
    cover_gradient: 'linear-gradient(135deg,#000,#fff)',
    license: 'community-remix',
    status: 'published',
    version: 1,
    created_at: new Date(Date.now() - 60_000).toISOString(),
    updated_at: new Date().toISOString(),
    profiles: { name: 'Mira Velasco', username: 'mira', avatar_url: null },
    ...overrides,
  } as unknown as FeedItem
}

describe('FeedCard L1', () => {
  it('renders title, author, and prompt with substituted variables', () => {
    render(<FeedCard prompty={fakeItem()} />)
    expect(screen.getByText('Retrato Cinematográfico')).toBeInTheDocument()
    expect(screen.getByText(/Mira Velasco/)).toBeInTheDocument()
    const prompt = screen.getByTestId('prompt-text')
    // Substituted: contains 'astrônoma' and does NOT contain unresolved '{{subject}}'
    expect(prompt.textContent).toContain('astrônoma')
    expect(prompt.textContent).not.toContain('{{subject}}')
  })

  it('action row has exactly 2 buttons: Curtir and Copiar prompt', () => {
    render(<FeedCard prompty={fakeItem()} />)
    expect(screen.getByLabelText('Curtir')).toBeInTheDocument()
    expect(screen.getByLabelText('Copiar prompt')).toBeInTheDocument()
  })

  it('LEVL-06: does NOT render save, remix, or share buttons', () => {
    render(<FeedCard prompty={fakeItem()} />)
    expect(screen.queryByLabelText(/salvar/i)).not.toBeInTheDocument()
    expect(screen.queryByLabelText(/bookmark/i)).not.toBeInTheDocument()
    expect(screen.queryByLabelText(/remix/i)).not.toBeInTheDocument()
    expect(screen.queryByLabelText(/compartilhar/i)).not.toBeInTheDocument()
    expect(screen.queryByLabelText(/share/i)).not.toBeInTheDocument()
  })

  it('LEVL-06: does NOT render model chips, difficulty, or version number', () => {
    render(<FeedCard prompty={fakeItem()} />)
    expect(screen.queryByText(/Midjourney/)).not.toBeInTheDocument()
    expect(screen.queryByText(/Flux/)).not.toBeInTheDocument()
    expect(screen.queryByText(/beginner|intermediate|advanced/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/^v\d+$/)).not.toBeInTheDocument()
  })

  it('LEVL-06: does NOT render visible star ratings (e.g. "4.7")', () => {
    render(<FeedCard prompty={fakeItem()} />)
    expect(screen.queryByText(/\d+\.\d+\s*★/)).not.toBeInTheDocument()
  })

  it('"Ver mais" expands the prompt text inline', () => {
    render(<FeedCard prompty={fakeItem()} />)
    const more = screen.getByRole('button', { name: 'Ver mais' })
    fireEvent.click(more)
    expect(screen.queryByRole('button', { name: 'Ver mais' })).not.toBeInTheDocument()
  })

  it('shows "Copiado!" label when copied=true', () => {
    render(<FeedCard prompty={fakeItem()} copied />)
    expect(screen.getByLabelText('Copiado')).toBeInTheDocument()
  })

  it('shows post-copy banner when copied and not rated', () => {
    render(<FeedCard prompty={fakeItem()} copied />)
    expect(screen.getByLabelText('Avaliar prompty')).toBeInTheDocument()
    expect(screen.getByText(/Avaliar este prompt/)).toBeInTheDocument()
  })

  it('shows rate confirmation when rated=true', () => {
    render(<FeedCard prompty={fakeItem()} copied rated />)
    expect(screen.getByText(/Você já avaliou este Prompty/)).toBeInTheDocument()
  })
})

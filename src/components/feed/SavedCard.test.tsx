import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { SavedCard } from './SavedCard'

function rd(node: React.ReactElement) {
  return render(<MemoryRouter>{node}</MemoryRouter>)
}

describe('SavedCard', () => {
  it('renders Link with /p/{slug} and aria-label "Ver prompty: {title}"', () => {
    rd(
      <SavedCard
        slug="retrato"
        title="Retrato Cinematográfico"
        cover_url={null}
        cover_gradient="linear-gradient(135deg,#000,#fff)"
      />,
    )
    const link = screen.getByRole('link', { name: 'Ver prompty: Retrato Cinematográfico' })
    expect(link).toBeInTheDocument()
    expect(link).toHaveAttribute('href', '/p/retrato')
  })

  it('renders title with line-clamp 2', () => {
    rd(
      <SavedCard
        slug="x"
        title="Linha 1 muito longa que pode quebrar em duas linhas no card compacto"
        cover_url={null}
        cover_gradient="linear-gradient(135deg,#000,#fff)"
      />,
    )
    const title = screen.getByTestId('saved-card-title')
    expect(title.style.webkitLineClamp).toBe('2')
  })

  it('uses cover_url when present', () => {
    rd(<SavedCard slug="x" title="X" cover_url="https://x/cover.jpg" cover_gradient={null} />)
    const link = screen.getByRole('link')
    expect(link.style.backgroundImage).toContain('https://x/cover.jpg')
  })

  it('uses cover_gradient when cover_url is null', () => {
    rd(
      <SavedCard
        slug="x"
        title="X"
        cover_url={null}
        cover_gradient="linear-gradient(135deg,#abc,#def)"
      />,
    )
    const link = screen.getByRole('link')
    expect(link.style.background).toContain('linear-gradient')
  })

  it('Resultados variant uses result_image_url and renders camera badge', () => {
    rd(
      <SavedCard
        slug="x"
        title="Resultado"
        cover_url={null}
        cover_gradient={null}
        result_image_url="https://x/result.webp"
      />,
    )
    const link = screen.getByRole('link')
    expect(link.style.backgroundImage).toContain('https://x/result.webp')
    expect(screen.getByTestId('saved-card-camera-badge')).toBeInTheDocument()
  })

  it('Non-result variant does NOT render camera badge', () => {
    rd(
      <SavedCard
        slug="x"
        title="X"
        cover_url={null}
        cover_gradient="linear-gradient(135deg,#000,#fff)"
      />,
    )
    expect(screen.queryByTestId('saved-card-camera-badge')).not.toBeInTheDocument()
  })
})

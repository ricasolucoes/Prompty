import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { LevelUpModal } from './LevelUpModal'
import { LEVELS } from '@/lib/constants/levels'

const L2 = LEVELS.find((l) => l.id === 'L2')!
const L3 = LEVELS.find((l) => l.id === 'L3')!

describe('LevelUpModal', () => {
  it('renders the level emoji, name, and description', () => {
    render(<LevelUpModal level={L2} onDismiss={() => {}} />)
    expect(screen.getByText(L2.name)).toBeInTheDocument()
    expect(screen.getByText(L2.desc)).toBeInTheDocument()
  })

  it('LEVL-03: L2 unlock list contains all four items including avaliar/enviar phrasing', () => {
    render(<LevelUpModal level={L2} onDismiss={() => {}} />)
    expect(screen.getByText('Buscar Promptys por estilo')).toBeInTheDocument()
    expect(screen.getByText('Salvar favoritos na sua biblioteca')).toBeInTheDocument()
    expect(screen.getByText('Avaliar Promptys e enviar imagens geradas')).toBeInTheDocument()
    expect(screen.getByText('Seguir criadores')).toBeInTheDocument()
  })

  it('L3 unlock list contains the three creator items (no regression)', () => {
    render(<LevelUpModal level={L3} onDismiss={() => {}} />)
    expect(screen.getByText('Criar e publicar Promptys')).toBeInTheDocument()
    expect(screen.getByText('Ver estatísticas dos seus Promptys')).toBeInTheDocument()
    expect(screen.getByText('Variações simples')).toBeInTheDocument()
  })

  it('renders the "Continuar explorando" CTA', () => {
    render(<LevelUpModal level={L2} onDismiss={() => {}} />)
    expect(screen.getByRole('button', { name: /Continuar explorando/i })).toBeInTheDocument()
  })

  it('clicking the backdrop calls onDismiss', () => {
    let dismissed = false
    const { container } = render(
      <LevelUpModal
        level={L2}
        onDismiss={() => {
          dismissed = true
        }}
      />,
    )
    const backdrop = container.querySelector('[role="dialog"]') as HTMLElement
    expect(backdrop).toBeTruthy()
    backdrop.click()
    expect(dismissed).toBe(true)
  })
})

import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { OptionsSheet } from './OptionsSheet'

const SAMPLE_OPTIONS = [
  { label: 'Sugerir categoria', icon: 'tag' as const, onClick: vi.fn() },
  { label: 'Denunciar', icon: 'flag' as const, onClick: vi.fn(), destructive: true },
]

describe('OptionsSheet', () => {
  it('renders nothing when open=false', () => {
    const { container } = render(
      <OptionsSheet open={false} onClose={() => {}} options={SAMPLE_OPTIONS} />,
    )
    expect(container.firstChild).toBeNull()
  })

  it('renders dialog with provided options when open=true', () => {
    render(<OptionsSheet open onClose={() => {}} options={SAMPLE_OPTIONS} ariaLabel="Test sheet" />)
    const dialog = screen.getByRole('dialog', { name: 'Test sheet' })
    expect(dialog).toBeInTheDocument()
    expect(screen.getByText('Sugerir categoria')).toBeInTheDocument()
    expect(screen.getByText('Denunciar')).toBeInTheDocument()
  })

  it('destructive option has color #FF3B6B', () => {
    render(<OptionsSheet open onClose={() => {}} options={SAMPLE_OPTIONS} />)
    const destructiveButton = screen.getByText('Denunciar').closest('button')
    expect(destructiveButton).not.toBeNull()
    expect(destructiveButton!.style.color).toBe('rgb(255, 59, 107)')
  })

  it('tapping an option calls option.onClick AND onClose', () => {
    const onClose = vi.fn()
    const onClick = vi.fn()
    render(
      <OptionsSheet
        open
        onClose={onClose}
        options={[{ label: 'Sugerir categoria', icon: 'tag', onClick }]}
      />,
    )
    fireEvent.click(screen.getByText('Sugerir categoria'))
    expect(onClick).toHaveBeenCalledTimes(1)
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('tapping backdrop calls onClose', () => {
    const onClose = vi.fn()
    render(<OptionsSheet open onClose={onClose} options={SAMPLE_OPTIONS} />)
    // The dialog element itself is the backdrop
    const dialog = screen.getByRole('dialog')
    fireEvent.click(dialog)
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('non-last options have a border-bottom; last option does not', () => {
    render(<OptionsSheet open onClose={() => {}} options={SAMPLE_OPTIONS} />)
    const firstButton = screen.getByText('Sugerir categoria').closest('button')
    const lastButton = screen.getByText('Denunciar').closest('button')
    expect(firstButton?.style.borderBottom).toContain('1px solid')
    // JSDOM expands 'none' shorthand — borderBottom is '' when no border is set
    expect(lastButton?.style.borderBottom).not.toContain('1px solid')
  })
})

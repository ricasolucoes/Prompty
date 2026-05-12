import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { FilterChipBar } from './FilterChipBar'

const OPTIONS = [
  { value: 'Retrato', label: 'Retrato' },
  { value: 'Paisagem', label: 'Paisagem' },
]

describe('FilterChipBar', () => {
  it('renders one button per option', () => {
    render(<FilterChipBar options={OPTIONS} value={null} onChange={() => {}} />)
    expect(screen.getByRole('button', { name: /retrato filtro/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /paisagem filtro/i })).toBeInTheDocument()
  })

  it('tapping inactive chip calls onChange(value)', () => {
    const onChange = vi.fn()
    render(<FilterChipBar options={OPTIONS} value={null} onChange={onChange} />)
    fireEvent.click(screen.getByRole('button', { name: /retrato filtro/i }))
    expect(onChange).toHaveBeenCalledWith('Retrato')
  })

  it('tapping active chip toggles off — calls onChange(null)', () => {
    const onChange = vi.fn()
    render(<FilterChipBar options={OPTIONS} value="Retrato" onChange={onChange} />)
    fireEvent.click(screen.getByRole('button', { name: /retrato filtro/i }))
    expect(onChange).toHaveBeenCalledWith(null)
  })

  it('active chip has aria-pressed="true"; inactive has aria-pressed="false"', () => {
    render(<FilterChipBar options={OPTIONS} value="Retrato" onChange={() => {}} />)
    expect(screen.getByRole('button', { name: /retrato filtro/i })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: /paisagem filtro/i })).toHaveAttribute('aria-pressed', 'false')
  })

  it('container has overflowX: auto (horizontal scroll)', () => {
    const { container } = render(<FilterChipBar options={OPTIONS} value={null} onChange={() => {}} />)
    const div = container.querySelector('[role="group"]') as HTMLElement
    expect(div.style.overflowX).toBe('auto')
  })
})

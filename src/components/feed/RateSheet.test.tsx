import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'

const submitMock = vi.fn()
vi.mock('@/hooks/useTest', () => ({
  useTest: () => ({ submit: submitMock }),
}))

const { RateSheet } = await import('./RateSheet')

const PROMPTY = { id: 'p1', title: 'Test Prompty' }

describe('RateSheet', () => {
  beforeEach(() => {
    submitMock.mockReset()
    submitMock.mockResolvedValue({ ok: true })
  })

  it('renders stars + textarea + image upload slot (existing Phase 1 baseline)', () => {
    render(<RateSheet open prompty={PROMPTY} onClose={() => {}} onSubmitted={() => {}} />)
    expect(screen.getByRole('radiogroup', { name: /nota/i })).toBeInTheDocument()
    expect(screen.getAllByRole('radio')).toHaveLength(5)
    expect(screen.getByLabelText(/notas \(opcional\)/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/anexar imagem/i)).toBeInTheDocument()
  })

  it('CUR-01/CUR-02: image upload slot accessible for all authenticated users', () => {
    render(<RateSheet open prompty={PROMPTY} onClose={() => {}} onSubmitted={() => {}} />)
    const fileInput = screen.getByLabelText(/anexar imagem/i)
    expect(fileInput).toHaveAttribute('type', 'file')
    expect(fileInput).toHaveAttribute('accept', 'image/png,image/jpeg,image/webp')
    // No level gate: the dropzone button is rendered unconditionally
    expect(screen.getByText(/anexar imagem \(opcional\)/i)).toBeInTheDocument()
  })

  it('submits via useTest with rating + image + notes', async () => {
    const onClose = vi.fn()
    const onSubmitted = vi.fn()
    render(<RateSheet open prompty={PROMPTY} onClose={onClose} onSubmitted={onSubmitted} />)

    fireEvent.click(screen.getByRole('radio', { name: '4 estrelas' }))
    fireEvent.change(screen.getByLabelText(/notas \(opcional\)/i), {
      target: { value: 'Ficou ótimo' },
    })
    const file = new File(['x'], 'result.png', { type: 'image/png' })
    fireEvent.change(screen.getByLabelText(/anexar imagem/i), { target: { files: [file] } })

    fireEvent.click(screen.getByRole('button', { name: /enviar/i }))

    await waitFor(() =>
      expect(submitMock).toHaveBeenCalledWith({
        prompty_id: 'p1',
        rating: 4,
        notes: 'Ficou ótimo',
        image: file,
      }),
    )
    await waitFor(() => expect(onSubmitted).toHaveBeenCalled())
    await waitFor(() => expect(onClose).toHaveBeenCalled())
  })

  it('blocks submission until a rating is selected', () => {
    render(<RateSheet open prompty={PROMPTY} onClose={() => {}} onSubmitted={() => {}} />)
    expect(screen.getByRole('button', { name: /enviar/i })).toBeDisabled()
    fireEvent.click(screen.getByRole('radio', { name: '3 estrelas' }))
    expect(screen.getByRole('button', { name: /enviar/i })).not.toBeDisabled()
  })
})

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'

const submitMock = vi.fn()
vi.mock('@/hooks/useReport', () => ({
  useReport: () => ({ submit: submitMock }),
}))

const { ReportSheet } = await import('./ReportSheet')

const PROMPTY = { id: 'p1', title: 'Test Prompty' }

describe('ReportSheet', () => {
  beforeEach(() => {
    submitMock.mockReset()
    submitMock.mockResolvedValue({ ok: true })
  })

  it('returns null when open=false', () => {
    const { container } = render(
      <ReportSheet open={false} prompty={PROMPTY} onClose={() => {}} onSubmitted={() => {}} />,
    )
    expect(container.firstChild).toBeNull()
  })

  it('renders title and subtitle when open', () => {
    render(<ReportSheet open prompty={PROMPTY} onClose={() => {}} onSubmitted={() => {}} />)
    expect(screen.getByText('Denunciar Prompty')).toBeInTheDocument()
    expect(screen.getByText('Test Prompty')).toBeInTheDocument()
  })

  it('renders reason dropdown with 4 options', () => {
    render(<ReportSheet open prompty={PROMPTY} onClose={() => {}} onSubmitted={() => {}} />)
    const select = screen.getByRole('combobox', { name: /motivo da denúncia/i })
    expect(select).toBeInTheDocument()
    const options = Array.from(select.querySelectorAll('option'))
    // 1 placeholder + 4 reasons = 5
    expect(options).toHaveLength(5)
    expect(options.map((o) => (o as HTMLOptionElement).value)).toEqual(['', 'inappropriate', 'spam', 'plagiarism', 'other'])
  })

  it("'Denunciar' button is disabled until reason is selected", () => {
    render(<ReportSheet open prompty={PROMPTY} onClose={() => {}} onSubmitted={() => {}} />)
    const submitButton = screen.getByRole('button', { name: /denunciar/i })
    expect(submitButton).toBeDisabled()
    const select = screen.getByRole('combobox', { name: /motivo da denúncia/i })
    fireEvent.change(select, { target: { value: 'spam' } })
    expect(submitButton).not.toBeDisabled()
  })

  it('CUR-05/MODR-01: submit calls useReport with type=report and closes on success', async () => {
    const onClose = vi.fn()
    const onSubmitted = vi.fn()
    render(<ReportSheet open prompty={PROMPTY} onClose={onClose} onSubmitted={onSubmitted} />)
    const select = screen.getByRole('combobox', { name: /motivo da denúncia/i })
    fireEvent.change(select, { target: { value: 'spam' } })
    fireEvent.click(screen.getByRole('button', { name: /^denunciar$/i }))
    await waitFor(() => expect(submitMock).toHaveBeenCalledWith({
      prompty_id: 'p1',
      type: 'report',
      reason: 'spam',
    }))
    await waitFor(() => expect(onSubmitted).toHaveBeenCalled())
    await waitFor(() => expect(onClose).toHaveBeenCalled())
  })

  it('submit error shows alert and keeps sheet open', async () => {
    submitMock.mockResolvedValue({ ok: false, error: 'Não foi possível enviar.' })
    const onClose = vi.fn()
    render(<ReportSheet open prompty={PROMPTY} onClose={onClose} onSubmitted={() => {}} />)
    fireEvent.change(screen.getByRole('combobox', { name: /motivo da denúncia/i }), { target: { value: 'spam' } })
    fireEvent.click(screen.getByRole('button', { name: /^denunciar$/i }))
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Não foi possível enviar.'))
    expect(onClose).not.toHaveBeenCalled()
  })
})

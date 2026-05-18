import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'

const submitMock = vi.fn()
vi.mock('@/hooks/useReport', () => ({
  useReport: () => ({ submit: submitMock }),
}))

const { CategorySuggestSheet } = await import('./CategorySuggestSheet')

const PROMPTY = { id: 'p1', title: 'Test Prompty' }

describe('CategorySuggestSheet', () => {
  beforeEach(() => {
    submitMock.mockReset()
    submitMock.mockResolvedValue({ ok: true })
  })

  it('returns null when open=false', () => {
    const { container } = render(
      <CategorySuggestSheet
        open={false}
        prompty={PROMPTY}
        onClose={() => {}}
        onSubmitted={() => {}}
      />,
    )
    expect(container.firstChild).toBeNull()
  })

  it('renders title and subtitle', () => {
    render(
      <CategorySuggestSheet open prompty={PROMPTY} onClose={() => {}} onSubmitted={() => {}} />,
    )
    expect(screen.getByText('Sugerir categoria')).toBeInTheDocument()
    expect(screen.getByText('Test Prompty')).toBeInTheDocument()
  })

  it('renders all CATEGORIES as options plus placeholder', () => {
    render(
      <CategorySuggestSheet open prompty={PROMPTY} onClose={() => {}} onSubmitted={() => {}} />,
    )
    const select = screen.getByRole('combobox', { name: /nova categoria/i })
    const options = Array.from(select.querySelectorAll('option'))
    // 1 placeholder + 10 categories = 11
    expect(options).toHaveLength(11)
    expect((options[0] as HTMLOptionElement).value).toBe('')
    expect(options.some((o) => o.value === 'Retrato')).toBe(true)
    expect(options.some((o) => o.value === 'Arte digital')).toBe(true)
  })

  it("'Enviar sugestão' button is disabled until category selected", () => {
    render(
      <CategorySuggestSheet open prompty={PROMPTY} onClose={() => {}} onSubmitted={() => {}} />,
    )
    const submitBtn = screen.getByRole('button', { name: /enviar sugestão/i })
    expect(submitBtn).toBeDisabled()
    fireEvent.change(screen.getByRole('combobox', { name: /nova categoria/i }), {
      target: { value: 'Retrato' },
    })
    expect(submitBtn).not.toBeDisabled()
  })

  it('CUR-04: submit calls useReport with type=category_suggestion', async () => {
    const onClose = vi.fn()
    const onSubmitted = vi.fn()
    render(
      <CategorySuggestSheet open prompty={PROMPTY} onClose={onClose} onSubmitted={onSubmitted} />,
    )
    fireEvent.change(screen.getByRole('combobox', { name: /nova categoria/i }), {
      target: { value: 'Retrato' },
    })
    fireEvent.click(screen.getByRole('button', { name: /enviar sugestão/i }))
    await waitFor(() =>
      expect(submitMock).toHaveBeenCalledWith({
        prompty_id: 'p1',
        type: 'category_suggestion',
        reason: 'Retrato',
      }),
    )
    await waitFor(() => expect(onSubmitted).toHaveBeenCalled())
    await waitFor(() => expect(onClose).toHaveBeenCalled())
  })
})

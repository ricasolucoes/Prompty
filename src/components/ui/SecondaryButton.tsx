import { cn } from '@/lib/utils'

interface Props {
  children: React.ReactNode
  onClick?: () => void
  disabled?: boolean
  full?: boolean
  type?: 'button' | 'submit'
  className?: string
}

export function SecondaryButton({
  children,
  onClick,
  disabled,
  full,
  type = 'button',
  className,
}: Readonly<Props>) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'inline-flex items-center justify-center rounded-[14px] px-4 py-3 font-bold',
        full && 'w-full',
        disabled && 'cursor-not-allowed opacity-60',
        className,
      )}
      style={{
        background: 'var(--surface-2)',
        border: '1px solid var(--line)',
        color: 'var(--text-1)',
        fontFamily: 'var(--font-sans, sans-serif)',
        fontSize: 13.5,
        lineHeight: 1.2,
      }}
    >
      {children}
    </button>
  )
}

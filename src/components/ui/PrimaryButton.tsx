import { cn } from '@/lib/utils'
import { Icon, type IconName } from './Icon'

interface PrimaryButtonProps {
  children: React.ReactNode
  onClick?: () => void
  disabled?: boolean
  full?: boolean
  icon?: IconName
  color?: string
  type?: 'button' | 'submit'
  className?: string
}

export function PrimaryButton({
  children,
  onClick,
  disabled,
  full,
  icon,
  color,
  type = 'button',
  className,
}: Readonly<PrimaryButtonProps>) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'pressable inline-flex items-center justify-center gap-2 rounded-[14px] px-4 py-4 font-bold tracking-tight text-white',
        full && 'w-full',
        disabled && 'cursor-not-allowed',
        className,
      )}
      style={{
        background: disabled
          ? 'var(--line)'
          : (color ?? 'linear-gradient(180deg, #8B4DF5, #7C3AED)'),
        color: disabled ? 'var(--text-3)' : '#fff',
        fontFamily: 'var(--font-display, sans-serif)',
        fontSize: 22,
        letterSpacing: -0.1,
        lineHeight: 1.1,
      }}
    >
      {icon && <Icon name={icon} size={20} color="#fff" />}
      <span>{children}</span>
    </button>
  )
}

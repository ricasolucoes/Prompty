import { cn } from '@/lib/utils'

interface AvatarProps {
  user: { name?: string | null; avatar_url?: string | null }
  size?: number
  color?: string
  className?: string
}

function getInitials(name?: string | null): string {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/).slice(0, 2)
  return parts.map((p) => p[0]?.toUpperCase() ?? '').join('') || '?'
}

function colorFromName(name?: string | null): string {
  const palette: string[] = ['#7C3AED', '#22D3EE', '#FF6B4A', '#34D399', '#F59E0B', '#EC4899']
  if (!name) return palette[0] ?? '#7C3AED'
  let h = 0
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % palette.length
  return palette[h] ?? '#7C3AED'
}

export function Avatar({ user, size = 40, color, className }: Readonly<AvatarProps>) {
  const initials = getInitials(user.name)
  const bg = color ?? colorFromName(user.name)
  const fontSize = Math.round(size * 0.38)

  if (user.avatar_url) {
    return (
      <img
        src={user.avatar_url}
        alt={user.name ?? ''}
        width={size}
        height={size}
        className={cn('rounded-full object-cover', className)}
        style={{ width: size, height: size, flexShrink: 0 }}
      />
    )
  }

  return (
    <div
      className={cn('inline-flex items-center justify-center rounded-full text-white', className)}
      style={{
        width: size,
        height: size,
        background: bg,
        fontFamily: 'var(--font-display, sans-serif)',
        fontWeight: 700,
        fontSize,
        flexShrink: 0,
        userSelect: 'none',
      }}
      aria-label={user.name ?? 'User'}
    >
      {initials}
    </div>
  )
}

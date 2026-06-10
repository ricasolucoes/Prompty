import { useEffect } from 'react'
import { Icon, type IconName } from './Icon'

interface ToastProps {
  message: string
  icon?: IconName
  iconColor?: string
  points?: string // e.g. "+5p"
  durationMs?: number
  onDismiss?: () => void
}

export function Toast({
  message,
  icon = 'check',
  iconColor = '#34D399',
  points,
  durationMs = 2400,
  onDismiss,
}: Readonly<ToastProps>) {
  useEffect(() => {
    const t = setTimeout(() => onDismiss?.(), durationMs)
    return () => clearTimeout(t)
  }, [durationMs, onDismiss])
  return (
    <div
      role="status"
      style={{
        position: 'fixed',
        left: '50%',
        transform: 'translateX(-50%)',
        bottom: 'calc(112px + env(safe-area-inset-bottom, 0px))',
        zIndex: 90,
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        padding: '8px 16px',
        borderRadius: 999,
        background: 'rgba(20, 20, 30, 0.94)',
        color: '#fff',
        fontSize: 13.5,
        fontWeight: 700,
        fontFamily: 'var(--font-sans, sans-serif)',
        boxShadow: 'var(--shadow-lg)',
        animation: 'fadeIn .2s',
      }}
    >
      <Icon name={icon} size={16} color={iconColor} />
      <span>{message}</span>
      {points && (
        <span
          style={{
            background: 'rgba(124,58,237,0.85)',
            color: '#fff',
            padding: '4px 8px',
            borderRadius: 999,
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: 0.4,
          }}
        >
          {points}
        </span>
      )}
    </div>
  )
}

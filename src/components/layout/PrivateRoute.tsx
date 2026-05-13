import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth.store'
import { levelOf } from '@/lib/constants/levels'

const LEVEL_ORDER = ['L1', 'L2', 'L3', 'L4', 'L5'] as const

interface Props {
  minLevel?: 'L1' | 'L2' | 'L3' | 'L4' | 'L5'
  routeLabel?: string
}

export function PrivateRoute({ minLevel, routeLabel }: Props = {}) {
  const user = useAuthStore((s) => s.user)
  const profile = useAuthStore((s) => s.profile)
  const loading = useAuthStore((s) => s.loading)

  if (loading) return null
  if (!user) return <Navigate to="/login" replace />

  if (minLevel) {
    const currentLevelId = levelOf(profile?.points ?? 0).id
    const currentIdx = LEVEL_ORDER.indexOf(currentLevelId)
    const requiredIdx = LEVEL_ORDER.indexOf(minLevel)
    if (currentIdx < requiredIdx) {
      return (
        <Navigate
          to="/"
          replace
          state={{ levelGate: routeLabel ?? 'esta funcionalidade' }}
        />
      )
    }
  }

  return <Outlet />
}

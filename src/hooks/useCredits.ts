import { useAuthStore } from '@/stores/auth.store'

export function useCredits() {
  const credits = useAuthStore((s) => s.profile?.credits ?? 0)
  return { credits }
}

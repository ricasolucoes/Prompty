import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type Theme = 'light' | 'dark'

interface ThemeStore {
  theme: Theme
  setTheme: (t: Theme) => void
  toggle: () => void
}

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set, get) => ({
      theme: 'light',
      setTheme: (theme) => {
        document.documentElement.classList.remove('theme-light', 'theme-dark')
        document.documentElement.classList.add(`theme-${theme}`)
        set({ theme })
      },
      toggle: () => {
        const next: Theme = get().theme === 'light' ? 'dark' : 'light'
        get().setTheme(next)
      },
    }),
    {
      name: 'promptys-theme',
      onRehydrateStorage: () => (state) => {
        if (state) {
          document.documentElement.classList.remove('theme-light', 'theme-dark')
          document.documentElement.classList.add(`theme-${state.theme}`)
        }
      },
    },
  ),
)

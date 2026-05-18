import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface LevelStore {
  shownLevelUps: string[]
  hasShown: (id: string) => boolean
  markShown: (id: string) => void
}

export const useLevelStore = create<LevelStore>()(
  persist(
    (set, get) => ({
      shownLevelUps: [],
      hasShown: (id) => get().shownLevelUps.includes(id),
      markShown: (id) =>
        set((s) =>
          s.shownLevelUps.includes(id) ? s : { shownLevelUps: [...s.shownLevelUps, id] },
        ),
    }),
    { name: 'promptys-level-store' },
  ),
)

export interface Level {
  id: 'L1' | 'L2' | 'L3' | 'L4' | 'L5'
  name: string
  min: number
  color: string
  emoji: string
  desc: string
}

export const LEVELS: readonly Level[] = [
  {
    id: 'L1',
    name: 'Explorador',
    min: 0,
    color: '#22D3EE',
    emoji: '🌱',
    desc: 'Você está começando — copie, gere, avalie.',
  },
  {
    id: 'L2',
    name: 'Curador',
    min: 50,
    color: '#7C3AED',
    emoji: '✨',
    desc: 'Buscar, salvar, seguir criadores.',
  },
  {
    id: 'L3',
    name: 'Criador',
    min: 250,
    color: '#FF6B4A',
    emoji: '🎨',
    desc: 'Criar Promptys, remixar e disputar o ranking.',
  },
  {
    id: 'L4',
    name: 'Mestre',
    min: 1000,
    color: '#FFB020',
    emoji: '👑',
    desc: 'Reconhecido pela comunidade.',
  },
  { id: 'L5', name: 'Lendário', min: 5000, color: '#EC4899', emoji: '🔮', desc: 'Topo do topo.' },
] as const

export function levelOf(points: number): Level {
  const safe = Number.isFinite(points) ? Math.max(0, points) : 0
  // LEVELS[0] is always defined — the array is non-empty constant
  let cur: Level = LEVELS[0] as Level
  for (const l of LEVELS) if (safe >= l.min) cur = l
  return cur
}

export function nextLevel(current: Level): Level | null {
  const idx = LEVELS.findIndex((l) => l.id === current.id)
  if (idx >= 0 && idx < LEVELS.length - 1) {
    return LEVELS[idx + 1] as Level
  }
  return null
}

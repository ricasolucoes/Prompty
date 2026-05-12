import React from 'react'
import { cn } from '@/lib/utils'

export type IconName =
  | 'home' | 'user' | 'heart' | 'heartFill' | 'copy' | 'check'
  | 'star' | 'starFill' | 'chevronL' | 'x' | 'sparkle' | 'wand'
  | 'gemini' | 'image' | 'flame' | 'search' | 'bookmark' | 'lock'
  | 'moreHorizontal' | 'flag' | 'tag'

interface IconProps {
  name: IconName
  size?: number
  color?: string
  strokeWidth?: number
  className?: string
}

const PATHS: Record<IconName, React.ReactElement> = {
  home: <path d="M3 11.5L12 4l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1V11.5z" />,
  user: <><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4.418 3.582-8 8-8s8 3.582 8 8" /></>,
  heart: <path d="M12 21s-7-4.534-9.5-9C.5 8 3 4 7 4c2.5 0 4 1.5 5 3 1-1.5 2.5-3 5-3 4 0 6.5 4 4.5 8C19 16.466 12 21 12 21z" />,
  heartFill: <path d="M12 21s-7-4.534-9.5-9C.5 8 3 4 7 4c2.5 0 4 1.5 5 3 1-1.5 2.5-3 5-3 4 0 6.5 4 4.5 8C19 16.466 12 21 12 21z" fill="currentColor" />,
  copy: <><rect x="9" y="9" width="11" height="11" rx="2" /><rect x="4" y="4" width="11" height="11" rx="2" /></>,
  check: <path d="M5 12.5l4.5 4.5L19 7" />,
  star: <path d="M12 3l2.9 6.1 6.6.95-4.8 4.7 1.13 6.6L12 18.27 6.17 21.35l1.13-6.6L2.5 10.05l6.6-.95L12 3z" />,
  starFill: <path d="M12 3l2.9 6.1 6.6.95-4.8 4.7 1.13 6.6L12 18.27 6.17 21.35l1.13-6.6L2.5 10.05l6.6-.95L12 3z" fill="currentColor" />,
  chevronL: <path d="M15 6l-6 6 6 6" />,
  x: <path d="M6 6l12 12M18 6l-12 12" />,
  sparkle: <path d="M12 3v6m0 6v6M3 12h6m6 0h6M6.5 6.5l4 4M13.5 13.5l4 4M6.5 17.5l4-4M13.5 10.5l4-4" />,
  wand: <><path d="M14 4l6 6-10 10H4v-6L14 4z" /><path d="M13 5l6 6" /></>,
  gemini: <path d="M12 3l3.5 6L22 10.5l-5.5 4 2 7L12 17.7l-6.5 3.8 2-7L2 10.5 8.5 9 12 3z" />,
  image: <><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M3 16l5-5 4 4 3-3 6 6" /><circle cx="9" cy="10" r="1.5" /></>,
  flame: <path d="M12 3c2 4-2 5-2 8a4 4 0 0 0 8 0c0-2-1-3-1-5 3 2 5 5 5 9a8 8 0 1 1-16 0c0-5 4-7 6-12z" />,
  search: <><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.5-4.5" /></>,
  bookmark: <path d="M6 4h12v17l-6-4-6 4V4z" />,
  lock: <><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 1 1 8 0v3" /></>,
  moreHorizontal: (
    <>
      <circle cx="5"  cy="12" r="1.2" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12" r="1.2" fill="currentColor" stroke="none" />
      <circle cx="19" cy="12" r="1.2" fill="currentColor" stroke="none" />
    </>
  ),
  flag: <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1zM4 22v-7" />,
  tag: (
    <>
      <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
      <line x1="7" y1="7" x2="7.01" y2="7" />
    </>
  ),
}

export function Icon({ name, size = 20, color = 'currentColor', strokeWidth = 1.8, className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn('inline-block', className)}
      aria-hidden="true"
    >
      {PATHS[name]}
    </svg>
  )
}

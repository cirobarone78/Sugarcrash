// Glifi di categoria pieni e colorati (stile del mockup di riferimento):
// ogni stanza ha un'icona solida con il proprio colore. Nessuna emoji.

import type { ReactElement } from 'react'

export type GlyphName =
  | 'speech'
  | 'clip'
  | 'heart'
  | 'mic'
  | 'webcam'
  | 'spark'
  | 'users'
  | 'note'
  | 'gamepad'
  | 'lock'
  | 'unlock'

interface GlyphDef {
  node: ReactElement
  /** true = tracciato (stroke), altrimenti pieno (fill). */
  stroke?: boolean
}

const GLYPHS: Record<GlyphName, GlyphDef> = {
  speech: {
    node: (
      <path d="M6 3.5h12A2.5 2.5 0 0 1 20.5 6v7A2.5 2.5 0 0 1 18 15.5h-6l-4.2 3.8A.8.8 0 0 1 6.5 18.7V15.5H6A2.5 2.5 0 0 1 3.5 13V6A2.5 2.5 0 0 1 6 3.5z" />
    ),
  },
  clip: {
    stroke: true,
    node: (
      <path d="M8 8v8a4 4 0 0 0 8 0V6.5a2.5 2.5 0 0 0-5 0V16a1 1 0 0 0 2 0V8" />
    ),
  },
  heart: {
    node: (
      <path d="M12 20.3l-1.7-1.55C6 14.9 3.5 12.6 3.5 9.6 3.5 7.3 5.3 5.5 7.6 5.5c1.35 0 2.65.62 3.4 1.6l1 1.25 1-1.25c.75-.98 2.05-1.6 3.4-1.6 2.3 0 4.1 1.8 4.1 4.1 0 3-2.5 5.3-6.8 9.15z" />
    ),
  },
  mic: {
    node: (
      <>
        <path d="M12 2.5a3 3 0 0 0-3 3v5a3 3 0 0 0 6 0v-5a3 3 0 0 0-3-3z" />
        <path d="M6.6 10.4a.9.9 0 0 1 1.8 0 3.6 3.6 0 0 0 7.2 0 .9.9 0 0 1 1.8 0 5.5 5.5 0 0 1-4.5 5.4V19h2a.9.9 0 0 1 0 1.8H8.1a.9.9 0 0 1 0-1.8h2v-3.2a5.5 5.5 0 0 1-4.5-5.4z" />
      </>
    ),
  },
  webcam: {
    node: (
      <>
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M4 6.5h9A2.5 2.5 0 0 1 15.5 9v6A2.5 2.5 0 0 1 13 17.5H4A2.5 2.5 0 0 1 1.5 15V9A2.5 2.5 0 0 1 4 6.5zM8.5 9.3a2.7 2.7 0 1 0 0 5.4 2.7 2.7 0 0 0 0-5.4z"
        />
        <path d="M16.6 10.2l4.1-2.35A1 1 0 0 1 22.2 8.7v6.6a1 1 0 0 1-1.5.86l-4.1-2.35z" />
      </>
    ),
  },
  spark: {
    node: (
      <path d="M12 2.4l1.9 5.6a2 2 0 0 0 1.3 1.3l5.6 1.9-5.6 1.9a2 2 0 0 0-1.3 1.3L12 20.2l-1.9-5.6a2 2 0 0 0-1.3-1.3L3.2 11.4l5.6-1.9a2 2 0 0 0 1.3-1.3z" />
    ),
  },
  users: {
    node: (
      <>
        <circle cx="9" cy="8" r="3.4" />
        <path d="M3 19.2a6 6 0 0 1 12 0 .9.9 0 0 1-.9.9H3.9a.9.9 0 0 1-.9-.9z" />
        <path d="M16.4 5.1a3.3 3.3 0 0 1 .3 6 .85.85 0 1 1-.7-1.55 1.6 1.6 0 0 0 0-2.9.85.85 0 0 1 .4-1.55z" />
        <path d="M18.2 13.1a.9.9 0 0 1 1-.05 5.5 5.5 0 0 1 2.8 4.8.9.9 0 0 1-.9.9h-2.7a.85.85 0 0 1 0-1.7h1.6a3.8 3.8 0 0 0-2-2.5.9.9 0 0 1-.8-1.4z" />
      </>
    ),
  },
  note: {
    node: (
      <>
        <path d="M8 5.4a1 1 0 0 1 .78-.98l8-1.9A1 1 0 0 1 18 3.5V13a.85.85 0 0 1-1.7 0V5.35L9.7 6.95V16.5a.85.85 0 0 1-1.7 0z" />
        <circle cx="6.5" cy="16.4" r="2.7" />
        <circle cx="15.5" cy="14.1" r="2.7" />
      </>
    ),
  },
  gamepad: {
    node: (
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M7 7.5h10a4.5 4.5 0 0 1 4.4 5.42l-.82 3.9A2.5 2.5 0 0 1 16.2 18l-1.5-1.9a2 2 0 0 0-1.57-.76h-2.26a2 2 0 0 0-1.57.76L7.8 18a2.5 2.5 0 0 1-4.38-1.18l-.82-3.9A4.5 4.5 0 0 1 7 7.5zm1.6 3.1a.8.8 0 0 0-1.6 0v1.05H5.95a.8.8 0 0 0 0 1.6H7v1.05a.8.8 0 0 0 1.6 0V13.25h1.05a.8.8 0 0 0 0-1.6H8.6zM15 11a1.05 1.05 0 1 0 0 2.1 1.05 1.05 0 0 0 0-2.1zm2.4 2.3a1.05 1.05 0 1 0 0 2.1 1.05 1.05 0 0 0 0-2.1z"
      />
    ),
  },
  lock: {
    node: (
      <>
        <path d="M6 10.5h12a1.5 1.5 0 0 1 1.5 1.5v7a1.5 1.5 0 0 1-1.5 1.5H6A1.5 1.5 0 0 1 4.5 19v-7A1.5 1.5 0 0 1 6 10.5z" />
        <path stroke="currentColor" strokeWidth={1.8} fill="none" d="M8 10.5V8a4 4 0 0 1 8 0v2.5" />
      </>
    ),
  },
  unlock: {
    node: (
      <>
        <path d="M6 10.5h12a1.5 1.5 0 0 1 1.5 1.5v7a1.5 1.5 0 0 1-1.5 1.5H6A1.5 1.5 0 0 1 4.5 19v-7A1.5 1.5 0 0 1 6 10.5z" />
        <path stroke="currentColor" strokeWidth={1.8} fill="none" d="M8 10.5V8a4 4 0 0 1 7.7-1.6" />
      </>
    ),
  },
}

interface GlyphProps {
  name: GlyphName
  /** Colore del glifo (hex). Default: currentColor. */
  color?: string
  size?: number
  className?: string
}

export function Glyph({ name, color, size = 22, className }: GlyphProps) {
  const def = GLYPHS[name]
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={def.stroke ? 'none' : color ?? 'currentColor'}
      stroke={def.stroke ? color ?? 'currentColor' : 'none'}
      strokeWidth={def.stroke ? 2 : undefined}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={color ? { color } : undefined}
      aria-hidden="true"
    >
      {def.node}
    </svg>
  )
}

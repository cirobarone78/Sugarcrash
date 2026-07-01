import type { GlyphName } from '../components/Glyph'
import type { Room } from './types'

export interface RoomVisual {
  glyph: GlyphName
  color: string
}

// Glifo + colore per ogni stanza pubblica (per slug). Colori vivaci e distinti,
// coerenti con il riferimento visivo.
const BY_SLUG: Record<string, RoomVisual> = {
  general: { glyph: 'speech', color: '#38bdf8' },
  random: { glyph: 'clip', color: '#34d399' },
  dating: { glyph: 'heart', color: '#f472b6' },
  flirt: { glyph: 'mic', color: '#fbbf24' },
  cam: { glyph: 'webcam', color: '#2dd4bf' },
  young: { glyph: 'spark', color: '#fb923c' },
  over40: { glyph: 'users', color: '#818cf8' },
  music: { glyph: 'note', color: '#a855f7' },
  gaming: { glyph: 'gamepad', color: '#f43f5e' },
}

const FALLBACK: RoomVisual = { glyph: 'speech', color: '#5b9bff' }

export function roomVisual(room: Room): RoomVisual {
  if (room.kind === 'private') {
    return { glyph: 'lock', color: '#5b9bff' }
  }
  return BY_SLUG[room.slug] ?? FALLBACK
}

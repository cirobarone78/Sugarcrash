import { usePresence } from '../context/PresenceContext'
import { useI18n } from '../lib/i18n'
import { Glyph } from './Glyph'
import { roomVisual } from '../lib/roomVisuals'
import type { Room } from '../lib/types'

interface RoomListProps {
  rooms: Room[]
  selectedRoomId: string | null
  onSelect: (room: Room) => void
}

/** Lista compatta delle stanze (colonna sinistra desktop / tab Stanze mobile). */
export function RoomList({ rooms, selectedRoomId, onSelect }: RoomListProps) {
  const { roomCounts } = usePresence()
  const { t } = useI18n()
  return (
    <nav className="flex flex-col gap-0.5 p-2">
      <h2 className="px-2 py-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-ink-400">
        {t('rooms.title')}
      </h2>
      {rooms.map((room) => {
        const active = room.id === selectedRoomId
        const v = roomVisual(room)
        const count = roomCounts[room.slug] ?? 0
        return (
          <button
            key={room.id}
            onClick={() => onSelect(room)}
            className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors ${
              active
                ? 'bg-gradient-to-r from-brand-500/20 via-brand-500/[0.07] to-transparent'
                : 'hover:bg-white/[0.04]'
            }`}
          >
            {active && (
              <span className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-full bg-brand-400" />
            )}
            <Glyph name={v.glyph} color={v.color} size={22} className="shrink-0" />
            <span className="flex min-w-0 flex-1 flex-col leading-tight">
              <span className={`truncate text-sm font-semibold ${active ? 'text-white' : 'text-ink-200'}`}>
                {room.name}
              </span>
              {room.topic && (
                <span className="truncate text-xs text-ink-400">#{room.topic}</span>
              )}
            </span>
            <span
              className={`flex h-6 min-w-6 items-center justify-center rounded-full px-1.5 text-xs font-semibold ${
                count > 0 ? 'bg-brand-500/15 text-brand-300' : 'bg-white/[0.04] text-ink-400'
              }`}
            >
              {count}
            </span>
          </button>
        )
      })}
    </nav>
  )
}

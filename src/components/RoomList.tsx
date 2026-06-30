import { usePresence } from '../context/PresenceContext'
import { useI18n } from '../lib/i18n'
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
    <nav className="flex flex-col gap-1 p-2">
      <h2 className="px-2 py-1 text-xs font-bold uppercase tracking-wide text-ink-400">
        {t('rooms.title')}
      </h2>
      {rooms.map((room) => {
        const active = room.id === selectedRoomId
        return (
          <button
            key={room.id}
            onClick={() => onSelect(room)}
            className={`flex items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors ${
              active ? 'bg-brand-600 text-white' : 'text-ink-200 hover:bg-ink-800'
            }`}
          >
            <span className="flex flex-col">
              <span className="font-semibold">{room.name}</span>
              {room.topic && (
                <span className={active ? 'text-brand-100' : 'text-ink-400'}>
                  #{room.topic}
                </span>
              )}
            </span>
            <span
              className={`chip ${
                active ? 'bg-brand-700 text-white' : 'bg-ink-800 text-ink-200'
              }`}
            >
              {roomCounts[room.slug] ?? 0}
            </span>
          </button>
        )
      })}
    </nav>
  )
}

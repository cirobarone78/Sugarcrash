import { usePresence } from '../context/PresenceContext'
import { useI18n } from '../lib/i18n'
import type { Room } from '../lib/types'

interface RoomHeaderProps {
  room: Room
  onLeave?: () => void
}

export function RoomHeader({ room, onLeave }: RoomHeaderProps) {
  const { roomCounts } = usePresence()
  const { t } = useI18n()
  return (
    <div className="flex items-center justify-between border-b border-ink-700 bg-ink-900 px-3 py-2.5">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          {onLeave && (
            <button
              onClick={onLeave}
              className="rounded-md px-1.5 py-0.5 text-ink-400 hover:bg-ink-800 hover:text-white lg:hidden"
              aria-label={t('common.back')}
            >
              ←
            </button>
          )}
          <h1 className="truncate text-base font-bold text-white">{room.name}</h1>
          {room.topic && (
            <span className="chip hidden bg-brand-900 text-brand-200 sm:inline-flex">
              #{room.topic}
            </span>
          )}
        </div>
        <p className="truncate text-xs text-ink-400">{room.description}</p>
      </div>
      <span className="chip shrink-0 bg-ink-800 text-ink-200">
        <span className="h-2 w-2 rounded-full bg-accent-green" />
        {roomCounts[room.slug] ?? 0}
      </span>
    </div>
  )
}

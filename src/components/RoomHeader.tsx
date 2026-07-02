import { usePresence } from '../context/PresenceContext'
import { useI18n } from '../lib/i18n'
import { Glyph } from './Glyph'
import { GoLiveButton } from './WebcamPanel'
import { roomVisual } from '../lib/roomVisuals'
import type { Room } from '../lib/types'

interface RoomHeaderProps {
  room: Room
  onLeave?: () => void
}

export function RoomHeader({ room, onLeave }: RoomHeaderProps) {
  const { roomCounts } = usePresence()
  const { t } = useI18n()
  const v = roomVisual(room)
  return (
    <div className="flex items-center justify-between gap-2 border-b border-white/[0.06] bg-ink-900/70 px-3 py-2.5 backdrop-blur-xl">
      <div className="flex min-w-0 items-center gap-2.5">
        {onLeave && (
          <button
            onClick={onLeave}
            className="rounded-lg p-1 text-ink-400 hover:bg-ink-800 hover:text-white lg:hidden"
            aria-label={t('common.back')}
          >
            <span className="text-lg leading-none">‹</span>
          </button>
        )}
        <span
          className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-xl sm:flex"
          style={{ backgroundColor: `${v.color}1f` }}
        >
          <Glyph name={v.glyph} color={v.color} size={20} />
        </span>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="truncate text-base font-bold text-white">{room.name}</h1>
            {room.topic && (
              <span className="chip hidden bg-brand-500/15 text-brand-300 sm:inline-flex">
                #{room.topic}
              </span>
            )}
          </div>
          <p className="truncate text-xs text-ink-400">{room.description}</p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <GoLiveButton roomName={room.name} />
        <span className="chip bg-accent-green/15 text-accent-green">
          <span className="h-1.5 w-1.5 rounded-full bg-accent-green" />
          {roomCounts[room.slug] ?? 0}
        </span>
      </div>
    </div>
  )
}

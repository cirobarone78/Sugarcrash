import type { Room } from '../lib/types'
import { useI18n } from '../lib/i18n'
import { Glyph } from './Glyph'
import { roomVisual } from '../lib/roomVisuals'

interface RoomCardProps {
  room: Room
  onlineCount: number
  onEnter: (room: Room) => void
}

export function RoomCard({ room, onlineCount, onEnter }: RoomCardProps) {
  const { t } = useI18n()
  const v = roomVisual(room)
  return (
    <button
      onClick={() => onEnter(room)}
      className="card group flex flex-col gap-3 p-4 text-left transition-all duration-150 hover:-translate-y-0.5 hover:border-white/15 hover:shadow-soft"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2.5">
          <span
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
            style={{ backgroundColor: `${v.color}1f` }}
          >
            <Glyph name={v.glyph} color={v.color} size={22} />
          </span>
          <div className="min-w-0">
            <h3 className="truncate text-[15px] font-bold text-white">{room.name}</h3>
            {room.topic && (
              <span className="text-xs font-medium text-ink-400">#{room.topic}</span>
            )}
          </div>
        </div>
        <span
          className={`chip shrink-0 ${
            onlineCount > 0 ? 'bg-accent-green/15 text-accent-green' : 'bg-white/[0.05] text-ink-400'
          }`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${onlineCount > 0 ? 'bg-accent-green' : 'bg-ink-600'}`} />
          {onlineCount} {t('rooms.online')}
        </span>
      </div>
      <p className="line-clamp-2 text-sm text-ink-400">{room.description}</p>
      <span className="mt-auto inline-flex items-center gap-1 text-sm font-semibold text-brand-300 transition-colors group-hover:text-brand-200">
        {t('rooms.enter')} <span className="transition-transform group-hover:translate-x-0.5">→</span>
      </span>
    </button>
  )
}

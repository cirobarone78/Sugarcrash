import type { Room } from '../lib/types'
import { useI18n } from '../lib/i18n'

interface RoomCardProps {
  room: Room
  onlineCount: number
  onEnter: (room: Room) => void
}

export function RoomCard({ room, onlineCount, onEnter }: RoomCardProps) {
  const { t } = useI18n()
  return (
    <button
      onClick={() => onEnter(room)}
      className="card group flex flex-col gap-2 p-4 text-left transition-transform hover:-translate-y-0.5 hover:border-brand-500"
    >
      <div className="flex items-center justify-between">
        <h3 className="text-base font-bold text-white">{room.name}</h3>
        <span className="chip bg-ink-800 text-ink-200">
          <span className="h-2 w-2 rounded-full bg-accent-green" />
          {onlineCount} {t('rooms.online')}
        </span>
      </div>
      {room.topic && (
        <span className="chip w-fit bg-brand-900 text-brand-200">#{room.topic}</span>
      )}
      <p className="text-sm text-ink-400">{room.description}</p>
      <span className="mt-1 text-sm font-semibold text-brand-300 group-hover:text-brand-200">
        {t('rooms.enter')} →
      </span>
    </button>
  )
}

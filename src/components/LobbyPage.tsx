import { usePresence } from '../context/PresenceContext'
import { useI18n } from '../lib/i18n'
import { RoomCard } from './RoomCard'
import { Icon } from './Icon'
import { Glyph } from './Glyph'
import type { Room } from '../lib/types'

interface LobbyPageProps {
  rooms: Room[]
  privateRooms: Room[]
  onEnter: (room: Room) => void
  onCreatePrivate: () => void
  isUnlocked: (room: Room) => boolean
}

export function LobbyPage({ rooms, privateRooms, onEnter, onCreatePrivate, isUnlocked }: LobbyPageProps) {
  const { roomCounts, onlineUsers } = usePresence()
  const { t } = useI18n()
  return (
    <div className="h-full overflow-y-auto p-4 sm:p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-white">{t('lobby.welcome')}</h1>
        <p className="mt-1 text-sm text-ink-400">
          {t('lobby.online')}:{' '}
          <span className="font-semibold text-accent-green">{onlineUsers.length}</span>{' '}
          {t('lobby.users')}.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {rooms.map((room) => (
          <RoomCard
            key={room.id}
            room={room}
            onlineCount={roomCounts[room.slug] ?? 0}
            onEnter={onEnter}
          />
        ))}
      </div>

      {/* Stanze private */}
      <div className="mb-3 mt-8 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-lg font-bold text-white">
          <Icon name="lock" size={18} className="text-brand-300" />
          {t('rooms.private')}
        </h2>
        <button onClick={onCreatePrivate} className="btn-primary text-sm">
          <Icon name="plus" size={16} />
          {t('rooms.create')}
        </button>
      </div>

      {privateRooms.length === 0 ? (
        <p className="text-sm text-ink-400">{t('rooms.noPrivate')}</p>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {privateRooms.map((room) => (
            <button
              key={room.id}
              onClick={() => onEnter(room)}
              className="card group flex flex-col gap-3 p-4 text-left transition-all duration-150 hover:-translate-y-0.5 hover:border-white/15 hover:shadow-soft"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2.5">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-500/15">
                    <Glyph name={isUnlocked(room) ? 'unlock' : 'lock'} color="#5b9bff" size={22} />
                  </span>
                  <h3 className="truncate text-[15px] font-bold text-white">{room.name}</h3>
                </div>
                <span className="chip shrink-0 bg-accent-green/15 text-accent-green">
                  <span className="h-1.5 w-1.5 rounded-full bg-accent-green" />
                  {roomCounts[room.slug] ?? 0} {t('rooms.online')}
                </span>
              </div>
              <p className="flex items-center gap-1.5 text-xs text-ink-400">
                <Icon name="image" size={13} /> {t('rooms.imagesAllowed')}
                <span className="text-ink-600">·</span>
                <Icon name="user" size={13} /> {room.owner_username}
              </p>
              <span className="mt-auto inline-flex items-center gap-1 text-sm font-semibold text-brand-300 group-hover:text-brand-200">
                {t('rooms.enter')} <span className="transition-transform group-hover:translate-x-0.5">→</span>
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

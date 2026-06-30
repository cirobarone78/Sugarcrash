import { usePresence } from '../context/PresenceContext'
import { RoomCard } from './RoomCard'
import type { Room } from '../lib/types'

interface LobbyPageProps {
  rooms: Room[]
  onEnter: (room: Room) => void
}

/** Vista lobby al centro quando nessuna stanza è selezionata. */
export function LobbyPage({ rooms, onEnter }: LobbyPageProps) {
  const { roomCounts, onlineUsers } = usePresence()
  return (
    <div className="h-full overflow-y-auto p-4 sm:p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-white">Benvenuto in RetroCam Chat 👋</h1>
        <p className="mt-1 text-sm text-ink-400">
          Scegli una stanza e inizia a chiacchierare. Online ora:{' '}
          <span className="font-semibold text-accent-green">{onlineUsers.length}</span>{' '}
          utenti.
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
    </div>
  )
}

import { useEffect, useRef } from 'react'
import { RoomHeader } from './RoomHeader'
import { MessageList } from './MessageList'
import { MessageInput } from './MessageInput'
import { useRoomMessages } from '../hooks/useRoomMessages'
import { useAuth } from '../context/AuthContext'
import { usePresence } from '../context/PresenceContext'
import { useUI } from '../context/UIContext'
import { supabase } from '../lib/supabase'
import type { Room } from '../lib/types'

interface RoomChatProps {
  room: Room
  onLeave?: () => void
}

export function RoomChat({ room, onLeave }: RoomChatProps) {
  const { profile } = useAuth()
  const { setCurrentRoom } = usePresence()
  const { openUserProfile, openReport } = useUI()
  const { messages, loading, sendMessage, sendSystem } = useRoomMessages(room.id)
  const joinedRef = useRef<string | null>(null)

  // Ingresso / uscita dalla stanza: presence + messaggi di sistema + membership.
  useEffect(() => {
    if (!profile) return
    if (joinedRef.current === room.id) return
    joinedRef.current = room.id

    setCurrentRoom(room.slug)
    void supabase
      .from('room_members')
      .upsert(
        { room_id: room.id, user_id: profile.id, last_seen: new Date().toISOString() },
        { onConflict: 'room_id,user_id' },
      )
    void sendSystem(`${profile.username} è entrato nella stanza`)

    const username = profile.username
    return () => {
      joinedRef.current = null
      void sendSystem(`${username} ha lasciato la stanza`)
      setCurrentRoom(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [room.id, profile?.id])

  return (
    <div className="flex h-full flex-col">
      <RoomHeader room={room} onLeave={onLeave} />
      <MessageList
        messages={messages}
        loading={loading}
        onAuthorClick={openUserProfile}
        onReport={(m) =>
          openReport({
            messageId: m.id,
            reportedUserId: m.user_id ?? undefined,
            label: `messaggio di ${m.author?.username ?? 'utente'}`,
          })
        }
      />
      <MessageInput onSend={sendMessage} placeholder={`Messaggio in ${room.name}…`} />
    </div>
  )
}

import { useEffect, useRef } from 'react'
import { RoomHeader } from './RoomHeader'
import { MessageList } from './MessageList'
import { MessageInput } from './MessageInput'
import { useRoomMessages } from '../hooks/useRoomMessages'
import { useAuth } from '../context/AuthContext'
import { usePresence } from '../context/PresenceContext'
import { useUI } from '../context/UIContext'
import { useI18n } from '../lib/i18n'
import type { Room } from '../lib/types'

interface RoomChatProps {
  room: Room
  onLeave?: () => void
}

export function RoomChat({ room, onLeave }: RoomChatProps) {
  const { profile } = useAuth()
  const { setCurrentRoom } = usePresence()
  const { openUserProfile, openReport } = useUI()
  const { t } = useI18n()
  const isPrivate = room.kind === 'private'
  const { messages, loading, sendMessage, sendImage, sendSystem } = useRoomMessages(
    room.id,
    isPrivate ? 'privateRooms' : 'rooms',
  )
  const joinedRef = useRef<string | null>(null)

  // Ingresso / uscita dalla stanza: presence + messaggi di sistema.
  useEffect(() => {
    if (!profile) return
    if (joinedRef.current === room.id) return
    joinedRef.current = room.id

    setCurrentRoom(room.slug)
    void sendSystem(t('chat.joined', { user: profile.username }))

    const username = profile.username
    return () => {
      joinedRef.current = null
      void sendSystem(t('chat.left', { user: username }))
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
            label: t('report.msgLabel', { name: m.author_username ?? 'user' }),
          })
        }
      />
      <MessageInput
        onSend={sendMessage}
        onSendImage={isPrivate && room.allow_images ? sendImage : undefined}
        placeholder={t('chat.placeholderRoom', { room: room.name })}
      />
    </div>
  )
}

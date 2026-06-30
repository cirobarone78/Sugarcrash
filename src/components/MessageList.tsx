import { useEffect, useRef } from 'react'
import { MessageBubble } from './MessageBubble'
import { useAuth } from '../context/AuthContext'
import { useBlocks } from '../hooks/useBlocks'
import { useI18n } from '../lib/i18n'
import type { Message } from '../lib/types'

interface MessageListProps {
  messages: Message[]
  loading?: boolean
  onAuthorClick?: (userId: string) => void
  onReport?: (message: Message) => void
}

export function MessageList({ messages, loading, onAuthorClick, onReport }: MessageListProps) {
  const { profile } = useAuth()
  const { isBlocked } = useBlocks()
  const { t } = useI18n()
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  if (loading) {
    return <div className="flex h-full items-center justify-center text-sm text-ink-400">{t('chat.loadingMsgs')}</div>
  }

  const visible = messages.filter(
    (m) => m.message_type === 'system' || !m.user_id || !isBlocked(m.user_id),
  )

  return (
    <div className="flex-1 space-y-2 overflow-y-auto p-3">
      {visible.length === 0 && (
        <p className="py-8 text-center text-sm text-ink-400">{t('chat.empty')}</p>
      )}
      {visible.map((m) => (
        <MessageBubble
          key={m.id}
          message={m}
          isOwn={m.user_id === profile?.id}
          onAuthorClick={onAuthorClick}
          onReport={onReport}
        />
      ))}
      <div ref={bottomRef} />
    </div>
  )
}

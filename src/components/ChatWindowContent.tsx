import { useEffect, useRef } from 'react'
import { usePrivateThread } from '../hooks/usePrivateThread'
import { useAuth } from '../context/AuthContext'
import { MessageInput } from './MessageInput'
import { formatTime } from '../lib/utils'
import { useI18n } from '../lib/i18n'
import type { WinOther } from '../context/WindowsContext'

interface ChatWindowContentProps {
  threadId: string
  other: WinOther
  focused: boolean
}

/** Corpo di una finestra di chat privata (indipendente e riducibile). */
export function ChatWindowContent({ threadId, other, focused }: ChatWindowContentProps) {
  const { profile } = useAuth()
  const { t } = useI18n()
  const { messages, send, sendImage } = usePrivateThread(threadId, other.id, focused)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex-1 space-y-2 overflow-y-auto p-3">
        {messages.length === 0 && (
          <p className="py-6 text-center text-sm text-ink-400">
            {t('pm.start', { user: other.username })}
          </p>
        )}
        {messages.map((m) => {
          const isOwn = m.sender_id === profile?.id
          return (
            <div key={m.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
              {m.image_url ? (
                <div className="max-w-[82%]">
                  <a href={m.image_url} target="_blank" rel="noreferrer" className="block">
                    <img
                      src={m.image_url}
                      alt=""
                      loading="lazy"
                      className="max-h-56 max-w-full rounded-2xl border border-ink-700 object-cover"
                    />
                  </a>
                  <span className="mt-0.5 block text-right text-[10px] text-ink-400">
                    {formatTime(m.created_at)}
                  </span>
                </div>
              ) : (
                <div
                  className={`max-w-[82%] whitespace-pre-wrap break-words rounded-2xl px-3.5 py-2 text-sm shadow-sm ${
                    isOwn ? 'rounded-br-md bg-brand-500 text-white' : 'rounded-bl-md bg-teal-600 text-white'
                  }`}
                >
                  {m.body}
                  <span className="mt-0.5 block text-right text-[10px] opacity-70">
                    {formatTime(m.created_at)}
                  </span>
                </div>
              )}
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      <MessageInput
        onSend={send}
        onSendImage={sendImage}
        placeholder={t('pm.placeholder', { user: other.username })}
      />
    </div>
  )
}

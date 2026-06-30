import { useEffect, useRef, type ReactNode } from 'react'
import { usePrivateChat } from '../context/PrivateChatContext'
import { useAuth } from '../context/AuthContext'
import { useUI } from '../context/UIContext'
import { MessageInput } from './MessageInput'
import { Avatar } from './Avatar'
import { formatTime } from '../lib/utils'
import { useI18n } from '../lib/i18n'

interface PrivateChatWindowProps {
  onBack: () => void
  /** Slot per i controlli webcam (Fase 2). */
  headerActions?: ReactNode
  /** Slot per il pannello webcam (Fase 2). */
  webcamArea?: ReactNode
}

export function PrivateChatWindow({ onBack, headerActions, webcamArea }: PrivateChatWindowProps) {
  const { profile } = useAuth()
  const { openUserProfile, openReport, openBlock } = useUI()
  const { threads, activeThreadId, activeMessages, sendPrivate } = usePrivateChat()
  const { t } = useI18n()
  const bottomRef = useRef<HTMLDivElement>(null)

  const current = threads.find((t) => t.thread.id === activeThreadId)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [activeMessages.length])

  if (!current) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-ink-400">
        {t('pm.selectConv')}
      </div>
    )
  }

  const other = current.other

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b border-ink-700 bg-ink-900 px-2 py-2">
        <button
          onClick={onBack}
          className="rounded-md px-2 py-1 text-ink-400 hover:bg-ink-800 hover:text-white"
          aria-label={t('common.back')}
        >
          ←
        </button>
        <button
          onClick={() => openUserProfile(other.id)}
          className="flex min-w-0 flex-1 items-center gap-2"
        >
          <Avatar username={other.username} avatarUrl={other.avatar_url} status={other.status} size={32} showStatus />
          <span className="truncate font-semibold text-ink-200">{other.username}</span>
        </button>
        <div className="flex items-center gap-1">
          {headerActions}
          <button
            onClick={() => openBlock({ id: other.id, username: other.username })}
            className="rounded-md px-2 py-1 text-xs text-ink-400 hover:bg-ink-800 hover:text-white"
            title="Blocca"
          >
            🚫
          </button>
          <button
            onClick={() => openReport({ reportedUserId: other.id, label: other.username })}
            className="rounded-md px-2 py-1 text-xs text-ink-400 hover:bg-ink-800 hover:text-accent-red"
            title="Segnala"
          >
            ⚠️
          </button>
        </div>
      </div>

      {webcamArea}

      <div className="flex-1 space-y-2 overflow-y-auto p-3">
        {activeMessages.length === 0 && (
          <p className="py-6 text-center text-sm text-ink-400">
            {t('pm.start', { user: other.username })}
          </p>
        )}
        {activeMessages.map((m) => {
          const isOwn = m.sender_id === profile?.id
          return (
            <div key={m.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[80%] whitespace-pre-wrap break-words rounded-2xl px-3 py-2 text-sm ${
                  isOwn ? 'rounded-tr-sm bg-brand-600 text-white' : 'rounded-tl-sm bg-ink-800 text-ink-200'
                }`}
              >
                {m.body}
                <span className="mt-0.5 block text-right text-[10px] opacity-70">
                  {formatTime(m.created_at)}
                </span>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      <MessageInput onSend={sendPrivate} placeholder={t('pm.placeholder', { user: other.username })} />
    </div>
  )
}

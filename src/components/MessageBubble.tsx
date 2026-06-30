import { Avatar } from './Avatar'
import { formatTime } from '../lib/utils'
import { useI18n } from '../lib/i18n'
import type { Message } from '../lib/types'

interface MessageBubbleProps {
  message: Message
  isOwn: boolean
  onAuthorClick?: (userId: string) => void
  onReport?: (message: Message) => void
}

export function MessageBubble({ message, isOwn, onAuthorClick, onReport }: MessageBubbleProps) {
  const { t } = useI18n()
  if (message.message_type === 'system') {
    return (
      <div className="my-1 text-center">
        <span className="chip bg-ink-850 text-ink-400">{message.body}</span>
      </div>
    )
  }

  const name = message.author_username ?? 'utente'

  return (
    <div className={`group flex gap-2 ${isOwn ? 'flex-row-reverse' : ''}`}>
      <button
        onClick={() => message.user_id && onAuthorClick?.(message.user_id)}
        className="mt-1 shrink-0"
        aria-label={`Profilo di ${name}`}
      >
        <Avatar username={name} avatarUrl={message.author_avatar_url} size={32} />
      </button>
      <div className={`flex max-w-[78%] flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
        <div className="flex items-center gap-2 px-1">
          <button
            onClick={() => message.user_id && onAuthorClick?.(message.user_id)}
            className="text-xs font-semibold text-brand-300 hover:underline"
          >
            {isOwn ? t('common.you') : name}
          </button>
          {message.author_is_guest && (
            <span className="chip bg-ink-800 text-[9px] text-ink-400">{t('common.guest')}</span>
          )}
          <span className="text-[10px] text-ink-400">{formatTime(message.created_at)}</span>
        </div>
        <div
          className={`whitespace-pre-wrap break-words rounded-2xl px-3 py-2 text-sm ${
            isOwn
              ? 'rounded-tr-sm bg-brand-600 text-white'
              : 'rounded-tl-sm bg-ink-800 text-ink-200'
          }`}
        >
          {message.body}
        </div>
        {!isOwn && onReport && (
          <button
            onClick={() => onReport(message)}
            className="mt-0.5 px-1 text-[10px] text-ink-400 opacity-0 transition-opacity hover:text-accent-red group-hover:opacity-100"
          >
            {t('chat.reportMsg')}
          </button>
        )}
      </div>
    </div>
  )
}

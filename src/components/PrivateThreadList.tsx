import { usePrivateChat } from '../context/PrivateChatContext'
import { Avatar } from './Avatar'
import { formatTime } from '../lib/utils'
import { useI18n } from '../lib/i18n'

export function PrivateThreadList() {
  const { threads, openThread, activeThreadId } = usePrivateChat()
  const { t } = useI18n()

  if (threads.length === 0) {
    return <div className="p-6 text-center text-sm text-ink-400">{t('pm.empty')}</div>
  }

  return (
    <div className="flex-1 overflow-y-auto">
      {threads.map((th) => (
        <button
          key={th.thread.id}
          onClick={() => openThread(th.thread.id)}
          className={`flex w-full items-center gap-3 border-b border-ink-800 px-3 py-2.5 text-left hover:bg-ink-800 ${
            activeThreadId === th.thread.id ? 'bg-ink-800' : ''
          }`}
        >
          <Avatar
            username={th.other.username}
            avatarUrl={th.other.avatar_url}
            status={th.other.status}
            size={40}
            showStatus
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between">
              <span className="truncate font-semibold text-ink-200">{th.other.username}</span>
              {th.lastAt && (
                <span className="text-[10px] text-ink-400">{formatTime(th.lastAt)}</span>
              )}
            </div>
            <p className="truncate text-xs text-ink-400">{th.lastBody ?? t('pm.newConv')}</p>
          </div>
          {th.unread > 0 && <span className="chip bg-brand-600 text-white">{th.unread}</span>}
        </button>
      ))}
    </div>
  )
}

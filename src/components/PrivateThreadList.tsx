import { usePrivateChat } from '../context/PrivateChatContext'
import { Avatar } from './Avatar'
import { formatTime } from '../lib/utils'

export function PrivateThreadList() {
  const { threads, openThread, activeThreadId } = usePrivateChat()

  if (threads.length === 0) {
    return (
      <div className="p-6 text-center text-sm text-ink-400">
        Nessuna conversazione privata.
        <br />
        Apri il profilo di un utente online e premi “Messaggio privato”.
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto">
      {threads.map((t) => (
        <button
          key={t.thread.id}
          onClick={() => openThread(t.thread.id)}
          className={`flex w-full items-center gap-3 border-b border-ink-800 px-3 py-2.5 text-left hover:bg-ink-800 ${
            activeThreadId === t.thread.id ? 'bg-ink-800' : ''
          }`}
        >
          <Avatar
            username={t.other.username}
            avatarUrl={t.other.avatar_url}
            status={t.other.status}
            size={40}
            showStatus
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between">
              <span className="truncate font-semibold text-ink-200">{t.other.username}</span>
              {t.lastAt && (
                <span className="text-[10px] text-ink-400">{formatTime(t.lastAt)}</span>
              )}
            </div>
            <p className="truncate text-xs text-ink-400">{t.lastBody ?? 'Nuova conversazione'}</p>
          </div>
          {t.unread > 0 && (
            <span className="chip bg-brand-600 text-white">{t.unread}</span>
          )}
        </button>
      ))}
    </div>
  )
}

import { usePresence } from '../context/PresenceContext'
import { useUI } from '../context/UIContext'
import { useAuth } from '../context/AuthContext'
import { useI18n } from '../lib/i18n'
import { Avatar } from './Avatar'

interface OnlineUsersPanelProps {
  /** Se valorizzato, mostra solo gli utenti nella stanza indicata. */
  roomSlug?: string | null
}

export function OnlineUsersPanel({ roomSlug }: OnlineUsersPanelProps) {
  const { onlineUsers } = usePresence()
  const { openUserProfile } = useUI()
  const { profile } = useAuth()
  const { t } = useI18n()

  const users = roomSlug
    ? onlineUsers.filter((u) => u.room === roomSlug)
    : onlineUsers

  const sorted = [...users].sort((a, b) => a.username.localeCompare(b.username))

  return (
    <div className="flex h-full flex-col">
      <h2 className="border-b border-ink-700 px-3 py-2.5 text-xs font-bold uppercase tracking-wide text-ink-400">
        {t('users.title')} · {users.length}
      </h2>
      <div className="flex-1 overflow-y-auto p-2">
        {sorted.length === 0 && (
          <p className="px-2 py-4 text-sm text-ink-400">{t('users.empty')}</p>
        )}
        {sorted.map((u) => (
          <button
            key={u.user_id}
            onClick={() => openUserProfile(u.user_id)}
            className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left hover:bg-ink-800"
          >
            <Avatar
              username={u.username}
              avatarUrl={u.avatar_url}
              status={u.status}
              size={32}
              showStatus
              ring
            />
            <span className="flex min-w-0 flex-col">
              <span className="truncate text-sm font-semibold text-ink-200">
                {u.username}
                {u.user_id === profile?.id && (
                  <span className="ml-1 text-xs text-ink-400">({t('common.you')})</span>
                )}
              </span>
              <span className="flex items-center gap-1 text-xs text-ink-400">
                {t(`status.${u.status}`)}
                {u.is_guest && (
                  <span className="chip bg-ink-800 text-[9px] text-ink-400">{t('common.guest')}</span>
                )}
              </span>
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}

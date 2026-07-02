import { useState } from 'react'
import { usePresence } from '../context/PresenceContext'
import { useUI } from '../context/UIContext'
import { useAuth } from '../context/AuthContext'
import { useI18n } from '../lib/i18n'
import { Avatar } from './Avatar'
import { SexBadge } from './SexBadge'
import { Glyph } from './Glyph'
import type { Sex } from '../lib/types'

interface OnlineUsersPanelProps {
  /** Se valorizzato, mostra solo gli utenti nella stanza indicata. */
  roomSlug?: string | null
}

// Filtro per sesso: 'all' = nessun filtro (include anche undisclosed/mancante).
type SexFilter = 'all' | Extract<Sex, 'male' | 'female' | 'couple'>
type UsersSort = 'az' | 'cam'

const FILTER_KEY = 'retrocam.usersFilter'
const SORT_KEY = 'retrocam.usersSort'
const SEX_FILTERS: SexFilter[] = ['all', 'male', 'female', 'couple']

function readFilter(): SexFilter {
  const saved = localStorage.getItem(FILTER_KEY)
  if (saved === 'male' || saved === 'female' || saved === 'couple') return saved
  return 'all'
}

function readSort(): UsersSort {
  return localStorage.getItem(SORT_KEY) === 'cam' ? 'cam' : 'az'
}

export function OnlineUsersPanel({ roomSlug }: OnlineUsersPanelProps) {
  const { onlineUsers } = usePresence()
  const { openUserProfile } = useUI()
  const { profile } = useAuth()
  const { t } = useI18n()

  const [filter, setFilter] = useState<SexFilter>(readFilter)
  const [sort, setSort] = useState<UsersSort>(readSort)

  const changeFilter = (f: SexFilter) => {
    setFilter(f)
    localStorage.setItem(FILTER_KEY, f)
  }
  const changeSort = (s: UsersSort) => {
    setSort(s)
    localStorage.setItem(SORT_KEY, s)
  }

  const users = roomSlug
    ? onlineUsers.filter((u) => u.room === roomSlug)
    : onlineUsers

  const filtered = filter === 'all' ? users : users.filter((u) => u.sex === filter)

  const sorted = [...filtered].sort((a, b) => {
    if (sort === 'cam') {
      const camDiff = (a.cam ? 0 : 1) - (b.cam ? 0 : 1)
      if (camDiff !== 0) return camDiff
    }
    return a.username.localeCompare(b.username)
  })

  return (
    <div className="flex h-full flex-col">
      <h2 className="border-b border-ink-700 px-3 py-2.5 text-xs font-bold uppercase tracking-wide text-ink-400">
        {t('users.title')} · {filter === 'all' ? users.length : `${filtered.length}/${users.length}`}
      </h2>
      <div className="flex flex-wrap items-center gap-1.5 border-b border-ink-700 px-2 py-2">
        {SEX_FILTERS.map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => changeFilter(f)}
            className={`chip transition-colors ${
              filter === f
                ? 'bg-brand-500 text-white'
                : 'bg-ink-800 text-ink-300 hover:bg-ink-700'
            }`}
          >
            {t(`users.filter.${f}`)}
          </button>
        ))}
        <span className="ml-auto flex shrink-0 overflow-hidden rounded-full border border-ink-700">
          {(['az', 'cam'] as UsersSort[]).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => changeSort(s)}
              title={t(`users.sort.${s}`)}
              className={`px-2 py-0.5 text-xs font-medium transition-colors ${
                sort === s
                  ? 'bg-brand-500 text-white'
                  : 'bg-transparent text-ink-300 hover:bg-ink-800'
              }`}
            >
              {t(`users.sort.${s}`)}
            </button>
          ))}
        </span>
      </div>
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
              <span className="flex items-center gap-1.5 text-sm font-semibold text-ink-200">
                <SexBadge sex={u.sex} />
                <span className="truncate">{u.username}</span>
                {u.cam && (
                  <Glyph
                    name="webcam"
                    color="#f97316"
                    size={15}
                    className="shrink-0"
                  />
                )}
                {u.user_id === profile?.id && (
                  <span className="text-xs text-ink-400">({t('common.you')})</span>
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

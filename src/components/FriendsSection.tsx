import { useEffect, useState } from 'react'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { useFriends } from '../context/FriendsContext'
import { useI18n } from '../lib/i18n'
import { Avatar } from './Avatar'
import { Icon } from './Icon'
import { Glyph } from './Glyph'

interface Lite {
  id: string
  username: string
  avatar_url: string | null
}

/** Sezione Impostazioni: richieste di amicizia in entrata + lista amici. */
export function FriendsSection({ open }: { open: boolean }) {
  const { friends, incoming, acceptFriend, removeFriend } = useFriends()
  const { t } = useI18n()
  const [names, setNames] = useState<Record<string, Lite>>({})

  // Risolve i nickname degli id che servono (amici + richieste).
  useEffect(() => {
    if (!open) return
    const ids = Array.from(new Set([...friends, ...incoming]))
    const missing = ids.filter((id) => !names[id])
    if (missing.length === 0) return
    Promise.all(missing.map((id) => getDoc(doc(db, 'profiles', id)))).then((snaps) => {
      setNames((prev) => {
        const next = { ...prev }
        for (const s of snaps) {
          if (!s.exists()) continue
          next[s.id] = {
            id: s.id,
            username: (s.data()!.username as string) ?? 'utente',
            avatar_url: (s.data()!.avatar_url as string | null) ?? null,
          }
        }
        return next
      })
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, friends, incoming])

  const lite = (id: string): Lite => names[id] ?? { id, username: '…', avatar_url: null }

  return (
    <section>
      <h3 className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-ink-400">
        <Glyph name="spark" color="#f59e0b" size={14} />
        {t('friend.friends')} · {friends.length}
      </h3>

      {/* Richieste in entrata */}
      {incoming.length > 0 && (
        <div className="mb-2 space-y-1">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-brand-300">
            {t('friend.requests')} · {incoming.length}
          </p>
          {incoming.map((id) => {
            const u = lite(id)
            return (
              <div key={id} className="flex items-center gap-2 rounded-lg bg-ink-850 px-2 py-1.5">
                <Avatar username={u.username} avatarUrl={u.avatar_url} size={28} />
                <span className="min-w-0 flex-1 truncate text-sm text-ink-200">{u.username}</span>
                <button
                  onClick={() => void acceptFriend(id)}
                  className="fab h-7 w-7 bg-accent-green"
                  title={t('friend.accept')}
                >
                  <Icon name="check" size={15} />
                </button>
                <button
                  onClick={() => void removeFriend(id)}
                  className="fab h-7 w-7 bg-ink-700"
                  title={t('friend.decline')}
                >
                  <Icon name="close" size={15} />
                </button>
              </div>
            )
          })}
        </div>
      )}

      {/* Lista amici */}
      {friends.length === 0 ? (
        <p className="text-sm text-ink-400">{t('friend.none')}</p>
      ) : (
        <div className="space-y-1">
          {friends.map((id) => {
            const u = lite(id)
            return (
              <div key={id} className="flex items-center justify-between rounded-lg bg-ink-850 px-2 py-1.5">
                <span className="flex min-w-0 items-center gap-2">
                  <Avatar username={u.username} avatarUrl={u.avatar_url} size={28} />
                  <span className="truncate text-sm text-ink-200">{u.username}</span>
                </span>
                <button
                  onClick={() => void removeFriend(id)}
                  className="text-xs text-ink-400 hover:text-accent-red"
                >
                  {t('friend.remove')}
                </button>
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}

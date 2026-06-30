import { useEffect, useState } from 'react'
import { doc, getDoc } from 'firebase/firestore'
import { Modal } from './Modal'
import { Avatar } from './Avatar'
import { db } from '../lib/firebase'
import { useAuth } from '../context/AuthContext'
import { usePrivateChat } from '../context/PrivateChatContext'
import { usePresence } from '../context/PresenceContext'
import { useBlocks } from '../hooks/useBlocks'
import { statusColor } from '../lib/utils'
import { useI18n } from '../lib/i18n'
import type { Profile } from '../lib/types'

type ProfileLite = Pick<Profile, 'id' | 'username' | 'avatar_url' | 'status' | 'is_guest'>

interface UserProfilePopoverProps {
  open: boolean
  userId: string | null
  onClose: () => void
  onReport: (target: { reportedUserId: string; label: string }) => void
  onBlock: (user: { id: string; username: string }) => void
}

export function UserProfilePopover({
  open,
  userId,
  onClose,
  onReport,
  onBlock,
}: UserProfilePopoverProps) {
  const { profile: me, isGuest: meIsGuest } = useAuth()
  const { openThreadWith } = usePrivateChat()
  const { onlineUsers } = usePresence()
  const { isBlocked, unblock } = useBlocks()
  const { t } = useI18n()
  const [profile, setProfile] = useState<ProfileLite | null>(null)
  const [failed, setFailed] = useState(false)

  // Dati dell'utente dalla presence (immediati, nessuna lettura Firestore).
  const presenceUser = onlineUsers.find((u) => u.user_id === userId)

  useEffect(() => {
    if (!open || !userId) return
    setFailed(false)

    // 1) se l'utente è online, usiamo subito i dati di presence
    if (presenceUser) {
      setProfile({
        id: presenceUser.user_id,
        username: presenceUser.username,
        avatar_url: presenceUser.avatar_url,
        status: presenceUser.status,
        is_guest: presenceUser.is_guest,
      })
      return
    }

    // 2) altrimenti fallback su Firestore (con gestione errori, niente blocco)
    setProfile(null)
    getDoc(doc(db, 'profiles', userId))
      .then((snap) => {
        if (!snap.exists()) {
          setFailed(true)
          return
        }
        const d = snap.data()
        setProfile({
          id: snap.id,
          username: (d.username as string) ?? 'user',
          avatar_url: (d.avatar_url as string | null) ?? null,
          status: (d.status as Profile['status']) ?? 'online',
          is_guest: Boolean(d.is_guest),
        })
      })
      .catch(() => setFailed(true))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, userId])

  const isSelf = userId === me?.id
  const pmDisabled = meIsGuest || Boolean(profile?.is_guest)

  return (
    <Modal open={open} onClose={onClose} title={t('profile.title')}>
      {failed ? (
        <p className="text-sm text-ink-400">{t('common.error')}</p>
      ) : !profile ? (
        <p className="text-sm text-ink-400">{t('common.loading')}</p>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Avatar username={profile.username} avatarUrl={profile.avatar_url} size={56} />
            <div>
              <p className="text-lg font-bold text-white">{profile.username}</p>
              <p className="flex items-center gap-1 text-sm text-ink-400">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ background: statusColor[profile.status] }}
                />
                {t(`status.${profile.status}`)}
                {profile.is_guest && (
                  <span className="chip bg-ink-800 text-[9px] text-ink-400">{t('common.guest')}</span>
                )}
              </p>
            </div>
          </div>

          {isSelf ? (
            <p className="text-sm text-ink-400">{t('profile.you')}</p>
          ) : (
            <div className="space-y-2">
              {pmDisabled ? (
                <p className="rounded-lg bg-ink-850 px-3 py-2 text-center text-xs text-ink-400">
                  {meIsGuest ? t('profile.guestSelf') : t('profile.guestOther')}
                </p>
              ) : (
                <button
                  className="btn-primary w-full"
                  onClick={() => {
                    void openThreadWith(profile.id)
                    onClose()
                  }}
                >
                  {t('profile.pm')}
                </button>
              )}
              {isBlocked(profile.id) ? (
                <button className="btn-ghost w-full" onClick={() => void unblock(profile.id)}>
                  {t('profile.unblock')}
                </button>
              ) : (
                <button
                  className="btn-ghost w-full"
                  onClick={() => onBlock({ id: profile.id, username: profile.username })}
                >
                  {t('profile.block')}
                </button>
              )}
              <button
                className="btn-ghost w-full text-accent-red"
                onClick={() =>
                  onReport({ reportedUserId: profile.id, label: profile.username })
                }
              >
                {t('profile.report')}
              </button>
            </div>
          )}
        </div>
      )}
    </Modal>
  )
}

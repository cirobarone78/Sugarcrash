import { useEffect, useState } from 'react'
import { doc, getDoc } from 'firebase/firestore'
import { Modal } from './Modal'
import { Avatar } from './Avatar'
import { db } from '../lib/firebase'
import { useAuth } from '../context/AuthContext'
import { useWindows } from '../context/WindowsContext'
import { usePresence } from '../context/PresenceContext'
import { useWebcam } from '../context/WebcamContext'
import { useBlocks } from '../hooks/useBlocks'
import { useFriends } from '../context/FriendsContext'
import { statusColor } from '../lib/utils'
import { useI18n } from '../lib/i18n'
import { Icon } from './Icon'
import { Glyph } from './Glyph'
import { SexBadge } from './SexBadge'
import { SEX_VALUES, type Profile, type Sex } from '../lib/types'

type ProfileLite = Pick<
  Profile,
  'id' | 'username' | 'avatar_url' | 'status' | 'is_guest' | 'sex' | 'age' | 'country'
>

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
  const { openChat } = useWindows()
  const { onlineUsers } = usePresence()
  const { watchBroadcast } = useWebcam()
  const { isBlocked, unblock } = useBlocks()
  const { stateFor, addFriend, acceptFriend, removeFriend } = useFriends()
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
        sex: presenceUser.sex,
        age: presenceUser.age,
        country: presenceUser.country,
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
          sex: SEX_VALUES.includes(d.sex as Sex) ? (d.sex as Sex) : undefined,
          age: typeof d.age === 'number' ? (d.age as number) : undefined,
          country: typeof d.country === 'string' ? (d.country as string) : undefined,
        })
      })
      .catch(() => setFailed(true))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, userId])

  const isSelf = userId === me?.id
  const pmDisabled = meIsGuest || Boolean(profile?.is_guest)
  // Se l'utente è in onda in una stanza pubblica, mostriamo "Guarda la webcam".
  const liveCam = presenceUser?.cam ?? null

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
              <p className="flex items-center gap-2 text-lg font-bold text-white">
                <SexBadge sex={profile.sex} size={18} />
                {profile.username}
              </p>
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
              {(profile.age || profile.country) && (
                <p className="mt-0.5 text-xs text-ink-400">
                  {[profile.age, profile.country].filter(Boolean).join(' · ')}
                </p>
              )}
            </div>
          </div>

          {isSelf ? (
            <p className="text-sm text-ink-400">{t('profile.you')}</p>
          ) : (
            <div className="space-y-2">
              {liveCam && !isBlocked(profile.id) && (
                <button
                  className="btn-primary w-full"
                  onClick={() => {
                    void watchBroadcast(profile.id, liveCam)
                    onClose()
                  }}
                >
                  <Icon name="video" size={16} />
                  {t('cam.watch')}
                </button>
              )}
              {pmDisabled ? (
                <p className="rounded-lg bg-ink-850 px-3 py-2 text-center text-xs text-ink-400">
                  {meIsGuest ? t('profile.guestSelf') : t('profile.guestOther')}
                </p>
              ) : (
                <button
                  className="btn-primary w-full"
                  onClick={() => {
                    openChat({
                      id: profile.id,
                      username: profile.username,
                      avatar_url: profile.avatar_url,
                      status: profile.status,
                    })
                    onClose()
                  }}
                >
                  <Icon name="message" size={16} />
                  {t('profile.pm')}
                </button>
              )}
              {/* Amici (solo tra registrati) */}
              {!pmDisabled && <FriendControls
                userId={profile.id}
                state={stateFor(profile.id)}
                onAdd={() => void addFriend(profile.id)}
                onAccept={() => void acceptFriend(profile.id)}
                onRemove={() => void removeFriend(profile.id)}
              />}
              {isBlocked(profile.id) ? (
                <button className="btn-ghost w-full" onClick={() => void unblock(profile.id)}>
                  <Icon name="unlock" size={16} />
                  {t('profile.unblock')}
                </button>
              ) : (
                <button
                  className="btn-ghost w-full"
                  onClick={() => onBlock({ id: profile.id, username: profile.username })}
                >
                  <Icon name="ban" size={16} />
                  {t('profile.block')}
                </button>
              )}
              <button
                className="btn-ghost w-full text-accent-red"
                onClick={() =>
                  onReport({ reportedUserId: profile.id, label: profile.username })
                }
              >
                <Icon name="flag" size={16} />
                {t('profile.report')}
              </button>
            </div>
          )}
        </div>
      )}
    </Modal>
  )
}

function FriendControls({
  state,
  onAdd,
  onAccept,
  onRemove,
}: {
  userId: string
  state: 'none' | 'friends' | 'incoming' | 'outgoing'
  onAdd: () => void
  onAccept: () => void
  onRemove: () => void
}) {
  const { t } = useI18n()
  if (state === 'friends') {
    return (
      <button className="btn-ghost w-full" onClick={onRemove}>
        <Glyph name="spark" color="#f59e0b" size={16} />
        {t('friend.remove')}
      </button>
    )
  }
  if (state === 'incoming') {
    return (
      <div className="grid grid-cols-2 gap-2">
        <button className="btn-primary" onClick={onAccept}>
          <Icon name="check" size={16} />
          {t('friend.accept')}
        </button>
        <button className="btn-ghost" onClick={onRemove}>
          {t('friend.decline')}
        </button>
      </div>
    )
  }
  if (state === 'outgoing') {
    return (
      <button className="btn-ghost w-full" onClick={onRemove}>
        <Icon name="check" size={16} />
        {t('friend.pending')} · {t('friend.cancel')}
      </button>
    )
  }
  return (
    <button className="btn-ghost w-full" onClick={onAdd}>
      <Glyph name="spark" color="#f59e0b" size={16} />
      {t('friend.add')}
    </button>
  )
}

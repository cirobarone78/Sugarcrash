import { useEffect, useState } from 'react'
import { Modal } from './Modal'
import { Avatar } from './Avatar'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { usePrivateChat } from '../context/PrivateChatContext'
import { useBlocks } from '../hooks/useBlocks'
import { statusColor, statusLabel } from '../lib/utils'
import type { Profile } from '../lib/types'

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
  const { profile: me } = useAuth()
  const { openThreadWith } = usePrivateChat()
  const { isBlocked, unblock } = useBlocks()
  const [profile, setProfile] = useState<Profile | null>(null)

  useEffect(() => {
    if (!open || !userId) return
    setProfile(null)
    supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle()
      .then(({ data }) => setProfile((data as Profile) ?? null))
  }, [open, userId])

  const isSelf = userId === me?.id

  return (
    <Modal open={open} onClose={onClose} title="Profilo utente">
      {!profile ? (
        <p className="text-sm text-ink-400">Caricamento…</p>
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
                {statusLabel[profile.status]}
              </p>
            </div>
          </div>

          {isSelf ? (
            <p className="text-sm text-ink-400">Questo sei tu 🙂</p>
          ) : (
            <div className="space-y-2">
              <button
                className="btn-primary w-full"
                onClick={() => {
                  void openThreadWith(profile.id)
                  onClose()
                }}
              >
                💬 Messaggio privato
              </button>
              {isBlocked(profile.id) ? (
                <button className="btn-ghost w-full" onClick={() => void unblock(profile.id)}>
                  Sblocca utente
                </button>
              ) : (
                <button
                  className="btn-ghost w-full"
                  onClick={() => onBlock({ id: profile.id, username: profile.username })}
                >
                  🚫 Blocca utente
                </button>
              )}
              <button
                className="btn-ghost w-full text-accent-red"
                onClick={() =>
                  onReport({ reportedUserId: profile.id, label: profile.username })
                }
              >
                ⚠️ Segnala utente
              </button>
            </div>
          )}
        </div>
      )}
    </Modal>
  )
}

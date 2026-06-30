import { useEffect, useState } from 'react'
import { Modal } from './Modal'
import { Avatar } from './Avatar'
import { doc, getDoc } from 'firebase/firestore'
import { useAuth } from '../context/AuthContext'
import { useBlocks } from '../hooks/useBlocks'
import { db } from '../lib/firebase'
import { isSoundEnabled, setSoundEnabled } from '../lib/sounds'
import { statusColor, statusLabel } from '../lib/utils'
import type { Profile, UserStatus } from '../lib/types'

interface SettingsPanelProps {
  open: boolean
  onClose: () => void
}

const STATUSES: UserStatus[] = ['online', 'busy', 'invisible']

export function SettingsPanel({ open, onClose }: SettingsPanelProps) {
  const { profile, setStatus, updateProfile, signOut } = useAuth()
  const { blockedIds, unblock } = useBlocks()
  const [sound, setSound] = useState(isSoundEnabled())
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url ?? '')
  const [blockedProfiles, setBlockedProfiles] = useState<Pick<Profile, 'id' | 'username' | 'avatar_url'>[]>([])
  const [savedMsg, setSavedMsg] = useState(false)

  useEffect(() => {
    setAvatarUrl(profile?.avatar_url ?? '')
  }, [profile?.avatar_url])

  useEffect(() => {
    if (!open) return
    const ids = Array.from(blockedIds)
    if (ids.length === 0) {
      setBlockedProfiles([])
      return
    }
    Promise.all(ids.map((id) => getDoc(doc(db, 'profiles', id)))).then((snaps) => {
      setBlockedProfiles(
        snaps
          .filter((s) => s.exists())
          .map((s) => ({
            id: s.id,
            username: (s.data()!.username as string) ?? 'utente',
            avatar_url: (s.data()!.avatar_url as string | null) ?? null,
          })),
      )
    })
  }, [open, blockedIds])

  function toggleSound() {
    const next = !sound
    setSound(next)
    setSoundEnabled(next)
  }

  async function saveAvatar() {
    await updateProfile({ avatar_url: avatarUrl.trim() || null })
    setSavedMsg(true)
    setTimeout(() => setSavedMsg(false), 1500)
  }

  if (!profile) return null

  return (
    <Modal open={open} onClose={onClose} title="Impostazioni" maxWidth="max-w-lg">
      <div className="space-y-5">
        {/* Profilo */}
        <section className="space-y-2">
          <div className="flex items-center gap-3">
            <Avatar username={profile.username} avatarUrl={avatarUrl} size={48} />
            <div>
              <p className="font-bold text-white">{profile.username}</p>
              <p className="text-xs text-ink-400">Modifica l'avatar incollando un URL immagine.</p>
            </div>
          </div>
          <div className="flex gap-2">
            <input
              className="input"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              placeholder="https://…/avatar.jpg"
            />
            <button onClick={saveAvatar} className="btn-ghost shrink-0">
              {savedMsg ? '✓' : 'Salva'}
            </button>
          </div>
        </section>

        {/* Stato */}
        <section>
          <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-ink-400">Stato</h3>
          <div className="grid grid-cols-3 gap-2">
            {STATUSES.map((s) => (
              <button
                key={s}
                onClick={() => void setStatus(s)}
                className={`flex items-center justify-center gap-1.5 rounded-lg border px-2 py-2 text-sm font-semibold ${
                  profile.status === s
                    ? 'border-brand-500 bg-brand-900 text-white'
                    : 'border-ink-700 text-ink-200 hover:bg-ink-800'
                }`}
              >
                <span className="h-2 w-2 rounded-full" style={{ background: statusColor[s] }} />
                {statusLabel[s]}
              </button>
            ))}
          </div>
          {profile.status === 'invisible' && (
            <p className="mt-1.5 text-xs text-ink-400">
              Da invisibile non compari nella lista utenti né nei conteggi, ma continui a ricevere i messaggi.
            </p>
          )}
        </section>

        {/* Suono */}
        <section className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-ink-200">Suono nuovi messaggi</h3>
            <p className="text-xs text-ink-400">Un breve segnale acustico per i nuovi messaggi.</p>
          </div>
          <button
            onClick={toggleSound}
            className={`relative h-6 w-11 rounded-full transition-colors ${sound ? 'bg-brand-600' : 'bg-ink-700'}`}
            aria-pressed={sound}
          >
            <span
              className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${sound ? 'translate-x-5' : 'translate-x-0.5'}`}
            />
          </button>
        </section>

        {/* Utenti bloccati */}
        <section>
          <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-ink-400">
            Utenti bloccati · {blockedProfiles.length}
          </h3>
          {blockedProfiles.length === 0 ? (
            <p className="text-sm text-ink-400">Nessun utente bloccato.</p>
          ) : (
            <div className="space-y-1">
              {blockedProfiles.map((b) => (
                <div key={b.id} className="flex items-center justify-between rounded-lg bg-ink-850 px-2 py-1.5">
                  <span className="flex items-center gap-2">
                    <Avatar username={b.username} avatarUrl={b.avatar_url} size={28} />
                    <span className="text-sm text-ink-200">{b.username}</span>
                  </span>
                  <button onClick={() => void unblock(b.id)} className="text-xs font-semibold text-brand-300 hover:underline">
                    Sblocca
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        <button onClick={() => void signOut()} className="btn-danger w-full">
          Esci dall'account
        </button>
      </div>
    </Modal>
  )
}

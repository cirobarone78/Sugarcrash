import { useEffect, useState } from 'react'
import { doc, getDoc } from 'firebase/firestore'
import { Modal } from './Modal'
import { Avatar } from './Avatar'
import { Icon } from './Icon'
import { LanguageSwitcher } from './LanguageSwitcher'
import { useAuth } from '../context/AuthContext'
import { useBlocks } from '../hooks/useBlocks'
import { db } from '../lib/firebase'
import { isSoundEnabled, setSoundEnabled } from '../lib/sounds'
import {
  notificationsEnabled,
  notificationsSupported,
  notificationPermission,
  requestNotificationPermission,
  setNotificationsEnabled,
} from '../lib/notify'
import { statusColor, validateUsername } from '../lib/utils'
import { useI18n } from '../lib/i18n'
import { SexSelector } from './SexBadge'
import { FriendsSection } from './FriendsSection'
import type { Profile, Sex, UserStatus } from '../lib/types'

interface SettingsPanelProps {
  open: boolean
  onClose: () => void
}

const STATUSES: UserStatus[] = ['online', 'busy', 'invisible']

export function SettingsPanel({ open, onClose }: SettingsPanelProps) {
  const { t } = useI18n()
  const { profile, isGuest, setStatus, updateProfile, signOut } = useAuth()
  const { blockedIds, unblock } = useBlocks()
  const [sound, setSound] = useState(isSoundEnabled())
  const [notify, setNotify] = useState(notificationsEnabled())
  const [notifyDenied, setNotifyDenied] = useState(notificationPermission() === 'denied')
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url ?? '')
  const [nickname, setNickname] = useState(profile?.username ?? '')
  const [nickErr, setNickErr] = useState<string | null>(null)
  const [nickSaved, setNickSaved] = useState(false)
  const [blockedProfiles, setBlockedProfiles] = useState<Pick<Profile, 'id' | 'username' | 'avatar_url'>[]>([])
  const [savedMsg, setSavedMsg] = useState(false)
  const [sex, setSex] = useState<Sex | undefined>(profile?.sex)
  const [age, setAge] = useState(profile?.age ? String(profile.age) : '')
  const [country, setCountry] = useState(profile?.country ?? '')
  const [sexErr, setSexErr] = useState<string | null>(null)
  const [sexSaved, setSexSaved] = useState(false)

  useEffect(() => {
    setAvatarUrl(profile?.avatar_url ?? '')
  }, [profile?.avatar_url])

  useEffect(() => {
    setNickname(profile?.username ?? '')
  }, [profile?.username])

  useEffect(() => {
    setSex(profile?.sex)
  }, [profile?.sex])

  useEffect(() => {
    setAge(profile?.age ? String(profile.age) : '')
  }, [profile?.age])

  useEffect(() => {
    setCountry(profile?.country ?? '')
  }, [profile?.country])

  async function saveSex() {
    setSexErr(null)
    if (!sex) {
      setSexErr(t('setup.sexRequired'))
      return
    }
    let ageValue: number | null = null
    if (age.trim()) {
      const n = Number(age)
      if (!Number.isInteger(n) || n < 18 || n > 120) {
        setSexErr(t('setup.ageInvalid'))
        return
      }
      ageValue = n
    }
    const { error } = await updateProfile({ sex, age: ageValue, country: country.trim() || null })
    if (error) {
      setSexErr(error.includes('.') ? t(error) : error)
      return
    }
    setSexSaved(true)
    setTimeout(() => setSexSaved(false), 1500)
  }

  async function saveNickname() {
    setNickErr(null)
    const vErr = validateUsername(nickname)
    if (vErr) {
      setNickErr(t(vErr))
      return
    }
    const { error } = await updateProfile({ username: nickname.trim() })
    if (error) {
      setNickErr(t(error))
      return
    }
    setNickSaved(true)
    setTimeout(() => setNickSaved(false), 1500)
  }

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

  async function toggleNotify() {
    if (notify) {
      setNotify(false)
      setNotificationsEnabled(false)
      return
    }
    // Attivazione: richiede il permesso browser (gesto utente).
    const granted = await requestNotificationPermission()
    if (!granted) {
      setNotifyDenied(notificationPermission() === 'denied')
      return
    }
    setNotify(true)
    setNotificationsEnabled(true)
  }

  async function saveAvatar() {
    await updateProfile({ avatar_url: avatarUrl.trim() || null })
    setSavedMsg(true)
    setTimeout(() => setSavedMsg(false), 1500)
  }

  if (!profile) return null

  const statusLabels: Record<UserStatus, string> = {
    online: t('status.online'),
    busy: t('status.busy'),
    invisible: t('status.invisible'),
  }

  return (
    <Modal open={open} onClose={onClose} title={t('settings.title')} maxWidth="max-w-lg">
      <div className="space-y-5">
        {/* Lingua */}
        <section className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-ink-200">{t('settings.language')}</h3>
          <LanguageSwitcher />
        </section>

        {/* Account ospite → upgrade */}
        {isGuest && <UpgradeSection />}

        {/* Profilo */}
        <section className="space-y-2">
          <div className="flex items-center gap-3">
            <Avatar username={profile.username} avatarUrl={avatarUrl} size={48} />
            <div>
              <p className="flex items-center gap-2 font-bold text-white">
                {profile.username}
                {isGuest && (
                  <span className="chip bg-ink-800 text-[10px] text-ink-400">{t('common.guest')}</span>
                )}
              </p>
              <p className="text-xs text-ink-400">
                {isGuest ? t('settings.guestAvatarHint') : t('settings.avatarHint')}
              </p>
            </div>
          </div>
          {!isGuest && (
            <>
              <div>
                <label className="mb-1 block text-xs font-medium text-ink-400">
                  {t('setup.nickname')}
                </label>
                <div className="flex gap-2">
                  <input
                    className="input"
                    value={nickname}
                    maxLength={24}
                    onChange={(e) => setNickname(e.target.value)}
                    placeholder={t('setup.nicknamePlaceholder')}
                  />
                  <button onClick={saveNickname} className="btn-ghost shrink-0">
                    {nickSaved ? <Icon name="check" size={16} /> : t('common.save')}
                  </button>
                </div>
                {nickErr && <p className="mt-1 text-xs text-accent-red">{nickErr}</p>}
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-ink-400">
                  {t('setup.avatar')}
                </label>
                <div className="flex gap-2">
                  <input
                    className="input"
                    value={avatarUrl}
                    onChange={(e) => setAvatarUrl(e.target.value)}
                    placeholder="https://…/avatar.jpg"
                  />
                  <button onClick={saveAvatar} className="btn-ghost shrink-0">
                    {savedMsg ? <Icon name="check" size={16} /> : t('common.save')}
                  </button>
                </div>
              </div>
            </>
          )}
        </section>

        {/* Sesso, età, paese */}
        <section>
          <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-ink-400">
            {t('settings.sex')}
          </h3>
          <SexSelector value={sex} onChange={setSex} />
          <div className="mt-2 grid grid-cols-2 gap-2">
            <input
              className="input"
              type="number"
              min={18}
              max={120}
              value={age}
              onChange={(e) => setAge(e.target.value)}
              placeholder={t('setup.age')}
            />
            <input
              className="input"
              value={country}
              maxLength={40}
              onChange={(e) => setCountry(e.target.value)}
              placeholder={t('setup.country')}
            />
          </div>
          {sexErr && <p className="mt-1 text-xs text-accent-red">{sexErr}</p>}
          <button onClick={saveSex} className="btn-ghost mt-2 w-full">
            {sexSaved ? t('settings.sexSaved') : t('common.save')}
          </button>
        </section>

        {/* Stato */}
        <section>
          <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-ink-400">
            {t('settings.status')}
          </h3>
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
                {statusLabels[s]}
              </button>
            ))}
          </div>
          {profile.status === 'invisible' && (
            <p className="mt-1.5 text-xs text-ink-400">{t('settings.invisibleHint')}</p>
          )}
        </section>

        {/* Suono */}
        <section className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-ink-200">{t('settings.sound')}</h3>
            <p className="text-xs text-ink-400">{t('settings.soundHint')}</p>
          </div>
          <button
            onClick={toggleSound}
            className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${sound ? 'bg-brand-600' : 'bg-ink-700'}`}
            aria-pressed={sound}
          >
            <span
              className={`absolute top-1/2 h-5 w-5 -translate-y-1/2 rounded-full bg-white transition-all ${sound ? 'left-[22px]' : 'left-0.5'}`}
            />
          </button>
        </section>

        {/* Notifiche di sistema */}
        {notificationsSupported() && (
          <section className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-ink-200">{t('settings.notify')}</h3>
              <p className="text-xs text-ink-400">{t('settings.notifyHint')}</p>
              {notifyDenied && (
                <p className="mt-1 text-xs text-accent-red">{t('settings.notifyDenied')}</p>
              )}
            </div>
            <button
              onClick={toggleNotify}
              disabled={notifyDenied}
              className={`relative h-6 w-11 shrink-0 rounded-full transition-colors disabled:opacity-40 ${notify ? 'bg-brand-600' : 'bg-ink-700'}`}
              aria-pressed={notify}
            >
              <span
                className={`absolute top-1/2 h-5 w-5 -translate-y-1/2 rounded-full bg-white transition-all ${notify ? 'left-[22px]' : 'left-0.5'}`}
              />
            </button>
          </section>
        )}

        {/* Amici (solo registrati) */}
        {!isGuest && <FriendsSection open={open} />}

        {/* Utenti bloccati */}
        <section>
          <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-ink-400">
            {t('settings.blocked')} · {blockedProfiles.length}
          </h3>
          {blockedProfiles.length === 0 ? (
            <p className="text-sm text-ink-400">{t('settings.noBlocked')}</p>
          ) : (
            <div className="space-y-1">
              {blockedProfiles.map((b) => (
                <div key={b.id} className="flex items-center justify-between rounded-lg bg-ink-850 px-2 py-1.5">
                  <span className="flex items-center gap-2">
                    <Avatar username={b.username} avatarUrl={b.avatar_url} size={28} />
                    <span className="text-sm text-ink-200">{b.username}</span>
                  </span>
                  <button onClick={() => void unblock(b.id)} className="text-xs font-semibold text-brand-300 hover:underline">
                    {t('settings.unblock')}
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        <button onClick={() => void signOut()} className="btn-danger w-full">
          {t('settings.signout')}
        </button>
      </div>
    </Modal>
  )
}

/** Sezione di upgrade da ospite a utente registrato. */
function UpgradeSection() {
  const { t } = useI18n()
  const { upgradeAccount, updateProfile } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    const vErr = validateUsername(username)
    if (vErr) {
      setError(t(vErr))
      return
    }
    setBusy(true)
    setError(null)
    const { error: upErr } = await upgradeAccount(email, password)
    if (upErr) {
      setBusy(false)
      setError(t(upErr))
      return
    }
    const { error: nameErr } = await updateProfile({ username: username.trim() })
    setBusy(false)
    if (nameErr) {
      setError(t(nameErr) + t('upgrade.nameRetry'))
      return
    }
    setDone(true)
  }

  if (done) {
    return (
      <section className="rounded-xl border border-accent-green/40 bg-accent-green/10 p-3 text-sm text-green-100">
        {t('upgrade.done')}
      </section>
    )
  }

  return (
    <section className="space-y-2 rounded-xl border border-brand-500/50 bg-brand-900/30 p-3">
      <h3 className="flex items-center gap-1.5 text-sm font-bold text-white">
        <Icon name="sparkle" size={15} className="text-cyan-400" />
        {t('upgrade.title')}
      </h3>
      <p className="text-xs text-ink-200">{t('upgrade.body')}</p>
      <form onSubmit={submit} className="space-y-2">
        <input
          type="text"
          className="input"
          placeholder={t('upgrade.nickname')}
          value={username}
          maxLength={24}
          onChange={(e) => setUsername(e.target.value)}
        />
        <input
          type="email"
          required
          className="input"
          placeholder={t('auth.email')}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          required
          minLength={6}
          className="input"
          placeholder={t('auth.password')}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {error && <p className="text-xs text-accent-red">{error}</p>}
        <button type="submit" disabled={busy} className="btn-primary w-full">
          {busy ? t('upgrade.submitting') : t('upgrade.submit')}
        </button>
      </form>
    </section>
  )
}

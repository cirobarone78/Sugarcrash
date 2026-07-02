import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { validateUsername } from '../lib/utils'
import { useI18n } from '../lib/i18n'
import { Avatar } from './Avatar'
import { LanguageSwitcher } from './LanguageSwitcher'
import { SexSelector } from './SexBadge'
import type { Sex } from '../lib/types'

// Username provvisorio dei registrati ("user_xxxxxx"): finché è così, chiediamo
// il nickname. Gli ospiti tengono il nickname automatico "Ospite-XXXX".
const PROVISIONAL_RE = /^user_[0-9a-z]{6,}$/i

export function ProfileSetup() {
  const { t } = useI18n()
  const { profile, isGuest, updateProfile, signOut } = useAuth()
  const [username, setUsername] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [sex, setSex] = useState<Sex | undefined>(profile?.sex)
  const [age, setAge] = useState('')
  const [country, setCountry] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // I registrati con username provvisorio scelgono anche il nickname; gli ospiti
  // (e i registrati che hanno già un nome) devono solo dichiarare il sesso.
  const needsNickname = !isGuest && !!profile && PROVISIONAL_RE.test(profile.username)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!sex) {
      setError(t('setup.sexRequired'))
      return
    }
    if (needsNickname) {
      const validation = validateUsername(username)
      if (validation) {
        setError(t(validation))
        return
      }
    }
    // Età opzionale: se compilata dev'essere un intero valido.
    let ageValue: number | null = null
    if (age.trim()) {
      const n = Number(age)
      if (!Number.isInteger(n) || n < 18 || n > 120) {
        setError(t('setup.ageInvalid'))
        return
      }
      ageValue = n
    }

    setBusy(true)
    setError(null)
    const { error } = await updateProfile({
      ...(needsNickname
        ? { username: username.trim(), avatar_url: avatarUrl.trim() || null }
        : {}),
      sex,
      age: ageValue,
      country: country.trim() || null,
    })
    setBusy(false)
    if (error) setError(error.includes('.') ? t(error) : error)
  }

  return (
    <div className="flex min-h-full items-center justify-center p-4">
      <form onSubmit={handleSubmit} className="card w-full max-w-sm space-y-4 p-6">
        <div className="flex justify-end">
          <LanguageSwitcher />
        </div>
        <div className="text-center">
          <h1 className="text-xl font-bold text-white">
            {needsNickname ? t('setup.title') : t('setup.guestTitle')}
          </h1>
          <p className="mt-1 text-sm text-ink-400">
            {needsNickname ? t('setup.subtitle') : t('setup.guestSubtitle')}
          </p>
        </div>

        {needsNickname && (
          <>
            <div className="flex justify-center">
              <Avatar username={username || profile?.username || 'tu'} avatarUrl={avatarUrl} size={72} />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-ink-400">
                {t('setup.nickname')}
              </label>
              <input
                className="input"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={t('setup.nicknamePlaceholder')}
                maxLength={24}
                autoFocus
              />
              <p className="mt-1 text-xs text-ink-400">{t('setup.nicknameHint')}</p>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-ink-400">
                {t('setup.avatar')}
              </label>
              <input
                className="input"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                placeholder="https://…/foto.jpg"
              />
            </div>
          </>
        )}

        {/* Sesso (obbligatorio) */}
        <div>
          <label className="mb-1 block text-xs font-medium text-ink-400">
            {t('setup.sex')}
          </label>
          <SexSelector value={sex} onChange={setSex} />
          <p className="mt-1 text-xs text-ink-400">{t('setup.sexHint')}</p>
        </div>

        {/* Età + Paese (opzionali) */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-ink-400">
              {t('setup.age')}
            </label>
            <input
              className="input"
              type="number"
              min={18}
              max={120}
              value={age}
              onChange={(e) => setAge(e.target.value)}
              placeholder="18+"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-ink-400">
              {t('setup.country')}
            </label>
            <input
              className="input"
              value={country}
              maxLength={40}
              onChange={(e) => setCountry(e.target.value)}
              placeholder={t('setup.countryPlaceholder')}
            />
          </div>
        </div>

        {error && <p className="text-sm text-accent-red">{error}</p>}

        <button type="submit" disabled={busy || !sex} className="btn-primary w-full">
          {busy ? t('setup.saving') : t('setup.enter')}
        </button>
        <button type="button" onClick={signOut} className="btn-ghost w-full">
          {t('setup.exit')}
        </button>
      </form>
    </div>
  )
}

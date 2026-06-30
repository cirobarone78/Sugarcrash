import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { validateUsername } from '../lib/utils'
import { Avatar } from './Avatar'

export function ProfileSetup() {
  const { profile, updateProfile, signOut } = useAuth()
  const [username, setUsername] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const validation = validateUsername(username)
    if (validation) {
      setError(validation)
      return
    }
    setBusy(true)
    setError(null)
    const { error } = await updateProfile({
      username: username.trim(),
      avatar_url: avatarUrl.trim() || null,
    })
    setBusy(false)
    if (error) setError(error)
  }

  return (
    <div className="flex min-h-full items-center justify-center p-4">
      <form onSubmit={handleSubmit} className="card w-full max-w-sm space-y-4 p-6">
        <div className="text-center">
          <h1 className="text-xl font-bold text-white">Scegli il tuo nickname</h1>
          <p className="mt-1 text-sm text-ink-400">
            Sarà il nome con cui ti vedranno nelle stanze.
          </p>
        </div>

        <div className="flex justify-center">
          <Avatar username={username || profile?.username || 'tu'} avatarUrl={avatarUrl} size={72} />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-ink-400">Nickname</label>
          <input
            className="input"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="es. neon_rider"
            maxLength={24}
            autoFocus
          />
          <p className="mt-1 text-xs text-ink-400">3-24 caratteri: lettere, numeri, . _ -</p>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-ink-400">
            URL avatar (opzionale)
          </label>
          <input
            className="input"
            value={avatarUrl}
            onChange={(e) => setAvatarUrl(e.target.value)}
            placeholder="https://…/foto.jpg"
          />
        </div>

        {error && <p className="text-sm text-accent-red">{error}</p>}

        <button type="submit" disabled={busy} className="btn-primary w-full">
          {busy ? 'Salvataggio…' : 'Entra in chat'}
        </button>
        <button type="button" onClick={signOut} className="btn-ghost w-full">
          Esci
        </button>
      </form>
    </div>
  )
}

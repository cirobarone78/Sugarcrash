import { useState } from 'react'
import { supabase } from '../lib/supabase'

export function AuthPage() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setInfo(null)
    setBusy(true)
    try {
      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
        setInfo(
          'Registrazione avviata. Se la conferma email è attiva, controlla la posta e poi accedi.',
        )
        setMode('signin')
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore imprevisto.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex min-h-full items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-600 text-3xl shadow-lg">
            📷
          </div>
          <h1 className="text-2xl font-extrabold text-white">RetroCam Chat</h1>
          <p className="mt-1 text-sm text-ink-400">
            Chatroom tematiche, chat privata e webcam opzionale.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="card space-y-3 p-5">
          <div className="flex rounded-lg bg-ink-900 p-1 text-sm">
            <button
              type="button"
              onClick={() => setMode('signin')}
              className={`flex-1 rounded-md py-1.5 font-semibold ${
                mode === 'signin' ? 'bg-brand-600 text-white' : 'text-ink-400'
              }`}
            >
              Accedi
            </button>
            <button
              type="button"
              onClick={() => setMode('signup')}
              className={`flex-1 rounded-md py-1.5 font-semibold ${
                mode === 'signup' ? 'bg-brand-600 text-white' : 'text-ink-400'
              }`}
            >
              Registrati
            </button>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-ink-400">Email</label>
            <input
              type="email"
              required
              autoComplete="email"
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@esempio.it"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-ink-400">Password</label>
            <input
              type="password"
              required
              minLength={6}
              autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="almeno 6 caratteri"
            />
          </div>

          {error && <p className="text-sm text-accent-red">{error}</p>}
          {info && <p className="text-sm text-accent-green">{info}</p>}

          <button type="submit" disabled={busy} className="btn-primary w-full">
            {busy ? 'Attendi…' : mode === 'signin' ? 'Accedi' : 'Crea account'}
          </button>
        </form>

        <p className="mt-4 text-center text-xs text-ink-400">
          Accedendo accetti di usare la piattaforma nel rispetto degli altri
          utenti. Niente contenuti illegali, molestie o spam.
        </p>
      </div>
    </div>
  )
}

import { useState } from 'react'
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInAnonymously,
} from 'firebase/auth'
import { FirebaseError } from 'firebase/app'
import { auth } from '../lib/firebase'
import { useI18n } from '../lib/i18n'
import { LanguageSwitcher } from './LanguageSwitcher'

export function AuthPage() {
  const { t } = useI18n()
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setBusy(true)
    try {
      if (mode === 'signup') {
        await createUserWithEmailAndPassword(auth, email, password)
      } else {
        await signInWithEmailAndPassword(auth, email, password)
      }
    } catch (err) {
      setError(t(authErrorKey(err)))
    } finally {
      setBusy(false)
    }
  }

  async function handleGuest() {
    setError(null)
    setBusy(true)
    try {
      await signInAnonymously(auth)
    } catch (err) {
      const code = err instanceof FirebaseError ? err.code : ''
      setError(
        t(code === 'auth/operation-not-allowed' ? 'auth.err.guestNotAllowed' : 'auth.err.guest'),
      )
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex min-h-full items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="mb-4 flex justify-end">
          <LanguageSwitcher />
        </div>
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-600 text-3xl shadow-lg">
            📷
          </div>
          <h1 className="text-2xl font-extrabold text-white">RetroCam Chat</h1>
          <p className="mt-1 text-sm text-ink-400">{t('app.tagline')}</p>
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
              {t('auth.signin')}
            </button>
            <button
              type="button"
              onClick={() => setMode('signup')}
              className={`flex-1 rounded-md py-1.5 font-semibold ${
                mode === 'signup' ? 'bg-brand-600 text-white' : 'text-ink-400'
              }`}
            >
              {t('auth.signup')}
            </button>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-ink-400">
              {t('auth.email')}
            </label>
            <input
              type="email"
              required
              autoComplete="email"
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t('auth.emailPlaceholder')}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-ink-400">
              {t('auth.password')}
            </label>
            <input
              type="password"
              required
              minLength={6}
              autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t('auth.passwordHint')}
            />
          </div>

          {error && <p className="text-sm text-accent-red">{error}</p>}

          <button type="submit" disabled={busy} className="btn-primary w-full">
            {busy ? t('common.wait') : mode === 'signin' ? t('auth.signin') : t('auth.create')}
          </button>

          <div className="flex items-center gap-2 py-1">
            <span className="h-px flex-1 bg-ink-700" />
            <span className="text-xs text-ink-400">{t('common.or')}</span>
            <span className="h-px flex-1 bg-ink-700" />
          </div>

          <button type="button" disabled={busy} onClick={handleGuest} className="btn-ghost w-full">
            {t('auth.guest')}
          </button>
          <p className="text-center text-[11px] text-ink-400">{t('auth.guestHint')}</p>
        </form>

        <p className="mt-4 text-center text-xs text-ink-400">{t('auth.terms')}</p>
      </div>
    </div>
  )
}

function authErrorKey(err: unknown): string {
  if (err instanceof FirebaseError) {
    switch (err.code) {
      case 'auth/invalid-email':
        return 'auth.err.invalidEmail'
      case 'auth/email-already-in-use':
        return 'auth.err.emailInUse'
      case 'auth/weak-password':
        return 'auth.err.weakPassword'
      case 'auth/invalid-credential':
      case 'auth/wrong-password':
      case 'auth/user-not-found':
        return 'auth.err.badCredentials'
      case 'auth/too-many-requests':
        return 'auth.err.tooMany'
      case 'auth/operation-not-allowed':
        return 'auth.err.notAllowed'
      default:
        return 'auth.err.generic'
    }
  }
  return 'auth.err.generic'
}

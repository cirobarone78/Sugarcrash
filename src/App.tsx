import { AuthProvider, useAuth } from './context/AuthContext'
import { PresenceProvider } from './context/PresenceContext'
import { PrivateChatProvider } from './context/PrivateChatContext'
import { BlocksProvider } from './hooks/useBlocks'
import { UIProvider } from './context/UIContext'
import { WebcamProvider } from './context/WebcamContext'
import { AuthPage } from './components/AuthPage'
import { ProfileSetup } from './components/ProfileSetup'
import { ChatLayout } from './components/ChatLayout'
import { WebcamInviteBanner } from './components/WebcamInviteBanner'
import { isSupabaseConfigured } from './lib/supabase'

function ConfigNotice() {
  return (
    <div className="flex min-h-full items-center justify-center p-6">
      <div className="card max-w-lg space-y-3 p-6">
        <h1 className="text-xl font-bold text-white">⚙️ Configurazione necessaria</h1>
        <p className="text-sm text-ink-200">
          Le variabili d'ambiente di Supabase non sono impostate. Crea un file{' '}
          <code className="rounded bg-ink-800 px-1">.env</code> partendo da{' '}
          <code className="rounded bg-ink-800 px-1">.env.example</code> e inserisci:
        </p>
        <pre className="overflow-x-auto rounded-lg bg-ink-950 p-3 text-xs text-brand-200">
{`VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=la-tua-anon-key`}
        </pre>
        <p className="text-sm text-ink-400">
          Poi riavvia il dev server. Le istruzioni complete sono nel README.
        </p>
      </div>
    </div>
  )
}

function Loading() {
  return (
    <div className="flex min-h-full items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-ink-700 border-t-brand-500" />
    </div>
  )
}

function AuthedApp() {
  return (
    <BlocksProvider>
      <PresenceProvider>
        <PrivateChatProvider>
          <UIProvider>
            <WebcamProvider>
              <ChatLayout />
              <WebcamInviteBanner />
            </WebcamProvider>
          </UIProvider>
        </PrivateChatProvider>
      </PresenceProvider>
    </BlocksProvider>
  )
}

function Gate() {
  const { session, loading, needsProfileSetup } = useAuth()
  if (loading) return <Loading />
  if (!session) return <AuthPage />
  if (needsProfileSetup) return <ProfileSetup />
  return <AuthedApp />
}

export default function App() {
  if (!isSupabaseConfigured) return <ConfigNotice />
  return (
    <AuthProvider>
      <Gate />
    </AuthProvider>
  )
}

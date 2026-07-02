import { useState } from 'react'
import { AuthProvider, useAuth } from './context/AuthContext'
import { PresenceProvider } from './context/PresenceContext'
import { PrivateChatProvider } from './context/PrivateChatContext'
import { WindowsProvider } from './context/WindowsContext'
import { BlocksProvider } from './hooks/useBlocks'
import { UIProvider } from './context/UIContext'
import { WebcamProvider } from './context/WebcamContext'
import { I18nProvider, useI18n } from './lib/i18n'
import { AuthPage } from './components/AuthPage'
import { ProfileSetup } from './components/ProfileSetup'
import { ChatLayout } from './components/ChatLayout'
import { WindowsLayer } from './components/WindowsLayer'
import { PrivateNotifier } from './components/PrivateNotifier'
import { WebcamInviteBanner } from './components/WebcamInviteBanner'
import { AgeGate } from './components/AgeGate'
import { isFirebaseConfigured } from './lib/firebase'

const AGE_KEY = 'retrocam.age18'

function ConfigNotice() {
  const { t } = useI18n()
  return (
    <div className="flex min-h-full items-center justify-center p-6">
      <div className="card max-w-lg space-y-3 p-6">
        <h1 className="text-xl font-bold text-white">{t('config.title')}</h1>
        <p className="text-sm text-ink-200">{t('config.body')}</p>
        <pre className="overflow-x-auto rounded-lg bg-ink-950 p-3 text-xs text-brand-200">
{`VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_DATABASE_URL=...`}
        </pre>
        <p className="text-sm text-ink-400">{t('config.after')}</p>
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
          <WindowsProvider>
            {/* WebcamProvider sopra UIProvider: UserProfilePopover (reso da
                UIProvider) usa useWebcam per "Guarda la webcam", quindi deve
                stare dentro WebcamProvider. */}
            <WebcamProvider>
              <UIProvider>
                <ChatLayout />
                <WindowsLayer />
                <PrivateNotifier />
                <WebcamInviteBanner />
              </UIProvider>
            </WebcamProvider>
          </WindowsProvider>
        </PrivateChatProvider>
      </PresenceProvider>
    </BlocksProvider>
  )
}

function Gate() {
  const { user, loading, needsProfileSetup } = useAuth()
  if (loading) return <Loading />
  if (!user) return <AuthPage />
  if (needsProfileSetup) return <ProfileSetup />
  return <AuthedApp />
}

function AppInner() {
  const [ageOk, setAgeOk] = useState(() => localStorage.getItem(AGE_KEY) === 'true')

  if (!isFirebaseConfigured) return <ConfigNotice />
  if (!ageOk) {
    return (
      <AgeGate
        onConfirm={() => {
          localStorage.setItem(AGE_KEY, 'true')
          setAgeOk(true)
        }}
      />
    )
  }
  return (
    <AuthProvider>
      <Gate />
    </AuthProvider>
  )
}

export default function App() {
  return (
    <I18nProvider>
      <AppInner />
    </I18nProvider>
  )
}

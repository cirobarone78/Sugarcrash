import { useState } from 'react'
import { useWebcam } from '../context/WebcamContext'
import { useAuth } from '../context/AuthContext'
import { useUI } from '../context/UIContext'
import { LocalVideoPreview } from './LocalVideoPreview'
import { RemoteVideoViewer } from './RemoteVideoViewer'
import { WebcamControls } from './WebcamControls'
import { WebcamConsentModal } from './WebcamConsentModal'

interface WebcamLaunchButtonProps {
  otherId: string
  otherName: string
}

/** Pulsante "Apri webcam" + modale di consenso (va nell'header della chat). */
export function WebcamLaunchButton({ otherId, otherName }: WebcamLaunchButtonProps) {
  const { supported, outgoing, hasConsent, giveConsent, startBroadcast } = useWebcam()
  const { isGuest } = useAuth()
  const [open, setOpen] = useState(false)

  // La webcam è una funzione riservata agli utenti registrati.
  if (isGuest) return null

  if (!supported) {
    return (
      <button
        disabled
        title="Webcam non supportata da questo browser"
        className="rounded-md px-2 py-1 text-xs text-ink-600"
      >
        📷
      </button>
    )
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        disabled={!!outgoing}
        className="rounded-md px-2 py-1 text-xs text-ink-400 hover:bg-ink-800 hover:text-white disabled:opacity-40"
        title={outgoing ? 'Webcam già attiva' : 'Apri webcam'}
      >
        📷
      </button>
      <WebcamConsentModal
        open={open}
        onClose={() => setOpen(false)}
        alreadyConsented={hasConsent}
        onGiveConsent={giveConsent}
        targetName={otherName}
        onConfirm={(withAudio) => {
          setOpen(false)
          void startBroadcast(otherId, withAudio)
        }}
      />
    </>
  )
}

interface WebcamPanelProps {
  otherId: string
  otherName: string
}

/** Area webcam attiva nella chat privata (locale e/o remota). */
export function WebcamPanel({ otherId, otherName }: WebcamPanelProps) {
  const { profile } = useAuth()
  const { openBlock, openReport } = useUI()
  const {
    outgoing,
    incoming,
    error,
    clearError,
    toggleMic,
    toggleVideo,
    endOutgoing,
    endIncoming,
  } = useWebcam()

  if (!outgoing && !incoming && !error) return null

  return (
    <div className="space-y-3 border-b border-ink-700 bg-ink-950 p-3">
      {error && (
        <div className="flex items-center justify-between gap-2 rounded-lg bg-accent-red/15 px-3 py-2 text-sm text-red-200">
          <span>{error}</span>
          <button onClick={clearError} className="text-red-200 hover:text-white">
            ✕
          </button>
        </div>
      )}

      {/* Video remoto (l'altro mi sta trasmettendo) */}
      {incoming && (
        <div className="space-y-2">
          <RemoteVideoViewer
            stream={incoming.remoteStream}
            connState={incoming.connState}
            watermarkName={profile?.username ?? 'utente'}
            sessionId={incoming.session.id}
          />
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs text-ink-400">Webcam di {otherName}</span>
            <div className="flex gap-1.5">
              <button
                onClick={() => openBlock({ id: otherId, username: otherName })}
                className="btn-ghost text-xs"
              >
                🚫 Blocca
              </button>
              <button
                onClick={() => openReport({ reportedUserId: otherId, label: otherName })}
                className="btn-ghost text-xs text-accent-red"
              >
                ⚠️ Segnala
              </button>
              <button onClick={() => void endIncoming()} className="btn-danger text-xs">
                Chiudi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Video locale (sto trasmettendo io) */}
      {outgoing && (
        <div className="space-y-2">
          <LocalVideoPreview stream={outgoing.localStream} videoEnabled={outgoing.videoEnabled} />
          <WebcamControls
            audioEnabled={outgoing.audioEnabled}
            videoEnabled={outgoing.videoEnabled}
            hasAudio={outgoing.session.audio_enabled}
            onToggleMic={toggleMic}
            onToggleVideo={toggleVideo}
            onClose={() => void endOutgoing()}
          />
          {outgoing.connState !== 'connected' && (
            <p className="text-center text-xs text-ink-400">
              In attesa che {otherName} accetti l'invito…
            </p>
          )}
        </div>
      )}

      <p className="text-center text-[10px] text-ink-400">
        Webcam non registrata dalla piattaforma. Nessuno stream viene salvato sui server.
      </p>
    </div>
  )
}

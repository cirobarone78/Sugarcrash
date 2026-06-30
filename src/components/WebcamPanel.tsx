import { useState } from 'react'
import { useWebcam } from '../context/WebcamContext'
import { useAuth } from '../context/AuthContext'
import { useUI } from '../context/UIContext'
import { useI18n } from '../lib/i18n'
import { Icon } from './Icon'
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
  const { t } = useI18n()
  const [open, setOpen] = useState(false)

  // La webcam è una funzione riservata agli utenti registrati.
  if (isGuest) return null

  if (!supported) {
    return (
      <button disabled title={t('cam.notSupported')} className="rounded-md p-1.5 text-ink-600">
        <Icon name="camera" size={18} />
      </button>
    )
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        disabled={!!outgoing}
        className="rounded-md p-1.5 text-ink-400 hover:bg-ink-800 hover:text-white disabled:opacity-40"
        title={outgoing ? t('cam.alreadyOn') : t('cam.open')}
      >
        <Icon name="camera" size={18} />
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
  const { t } = useI18n()
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
          <button onClick={clearError} className="text-red-200 hover:text-white" aria-label={t('common.close')}>
            <Icon name="close" size={16} />
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
            <span className="text-xs text-ink-400">{t('cam.webcamOf', { name: otherName })}</span>
            <div className="flex gap-1.5">
              <button
                onClick={() => openBlock({ id: otherId, username: otherName })}
                className="btn-ghost text-xs"
              >
                <Icon name="ban" size={14} />
                {t('cam.block')}
              </button>
              <button
                onClick={() => openReport({ reportedUserId: otherId, label: otherName })}
                className="btn-ghost text-xs text-accent-red"
              >
                <Icon name="flag" size={14} />
                {t('cam.report')}
              </button>
              <button onClick={() => void endIncoming()} className="btn-danger text-xs">
                {t('common.close')}
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
            <p className="text-center text-xs text-ink-400">{t('cam.waiting', { name: otherName })}</p>
          )}
        </div>
      )}

      <p className="text-center text-[10px] text-ink-400">{t('cam.noRecordingNote')}</p>
    </div>
  )
}

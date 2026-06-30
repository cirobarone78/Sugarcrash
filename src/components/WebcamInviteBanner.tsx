import { useWebcam } from '../context/WebcamContext'

/** Banner globale di invito webcam in arrivo (Accetta / Rifiuta). */
export function WebcamInviteBanner() {
  const { pendingInvite, acceptInvite, declineInvite } = useWebcam()
  if (!pendingInvite) return null

  return (
    <div className="fixed left-1/2 top-3 z-[60] w-[calc(100%-1.5rem)] max-w-sm -translate-x-1/2 animate-slide-up">
      <div className="card border-brand-500 p-3 shadow-2xl">
        <p className="text-sm text-ink-200">
          📷 <span className="font-bold text-white">{pendingInvite.fromUsername}</span> vuole
          aprire la webcam{pendingInvite.session.audio_enabled ? ' (con audio)' : ''}.
        </p>
        <p className="mt-1 text-xs text-ink-400">
          Accettando vedrai il suo video. Potrai chiudere o segnalare in qualsiasi momento.
        </p>
        <div className="mt-2 flex gap-2">
          <button onClick={() => void declineInvite()} className="btn-ghost flex-1">
            Rifiuta
          </button>
          <button onClick={() => void acceptInvite()} className="btn-primary flex-1">
            Accetta
          </button>
        </div>
      </div>
    </div>
  )
}

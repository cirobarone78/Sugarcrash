import { useState } from 'react'
import { Modal } from './Modal'

interface WebcamConsentModalProps {
  open: boolean
  onClose: () => void
  /** Conferma con scelta audio. */
  onConfirm: (withAudio: boolean) => void
  alreadyConsented: boolean
  onGiveConsent: () => Promise<void>
  targetName: string
}

const PRIVACY_TEXT =
  'La piattaforma non registra né salva webcam o audio. Tuttavia, non è ' +
  'tecnicamente possibile impedire a un altro utente di registrare lo schermo ' +
  'o usare un dispositivo esterno. Usa la webcam solo con persone di cui ti fidi.'

export function WebcamConsentModal({
  open,
  onClose,
  onConfirm,
  alreadyConsented,
  onGiveConsent,
  targetName,
}: WebcamConsentModalProps) {
  const [checked, setChecked] = useState(alreadyConsented)
  const [busy, setBusy] = useState(false)

  async function confirm(withAudio: boolean) {
    if (!checked) return
    setBusy(true)
    await onGiveConsent()
    setBusy(false)
    onConfirm(withAudio)
  }

  return (
    <Modal open={open} onClose={onClose} title="Apri webcam — leggi prima questo">
      <div className="space-y-4">
        <div className="rounded-lg border border-accent-amber/40 bg-accent-amber/10 p-3 text-sm text-amber-100">
          ⚠️ {PRIVACY_TEXT}
        </div>

        <p className="text-sm text-ink-400">
          Stai per aprire la tua webcam verso{' '}
          <span className="font-semibold text-ink-200">{targetName}</span>. La webcam
          è <span className="font-semibold">non registrata dalla piattaforma</span>.
        </p>

        <label className="flex cursor-pointer items-start gap-2 text-sm text-ink-200">
          <input
            type="checkbox"
            checked={checked}
            onChange={(e) => setChecked(e.target.checked)}
            className="mt-0.5 h-4 w-4 accent-brand-600"
          />
          Ho capito e accetto di procedere.
        </label>

        <div className="grid grid-cols-2 gap-2">
          <button
            disabled={!checked || busy}
            onClick={() => confirm(false)}
            className="btn-ghost"
          >
            📷 Solo video
          </button>
          <button
            disabled={!checked || busy}
            onClick={() => confirm(true)}
            className="btn-primary"
          >
            🎙️ Video + audio
          </button>
        </div>
        <button onClick={onClose} className="w-full text-center text-xs text-ink-400 hover:text-ink-200">
          Annulla
        </button>
      </div>
    </Modal>
  )
}

import { useState } from 'react'
import { useWebcam } from '../context/WebcamContext'
import { useAuth } from '../context/AuthContext'
import { useI18n } from '../lib/i18n'
import { Icon } from './Icon'
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
      <button disabled title={t('cam.notSupported')} className="rounded-md p-1 text-ink-600">
        <Icon name="camera" size={16} />
      </button>
    )
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        disabled={!!outgoing}
        className="rounded-md p-1 text-ink-400 hover:bg-ink-800 hover:text-white disabled:opacity-40"
        title={outgoing ? t('cam.alreadyOn') : t('cam.open')}
      >
        <Icon name="camera" size={16} />
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

/**
 * Pulsante "Vai in onda" per il broadcast pubblico in stanza (P5).
 * Solo utenti registrati; apre il modale di consenso con scelta video/solo audio.
 */
export function GoLiveButton({ roomName }: { roomName: string }) {
  const { supported, broadcast, hasConsent, giveConsent, goLive } = useWebcam()
  const { isGuest } = useAuth()
  const { t } = useI18n()
  const [open, setOpen] = useState(false)

  // Trasmettere è riservato agli utenti registrati: per gli ospiti mostriamo il
  // pulsante disattivato con spiegazione (così non sembra sparito e invita a
  // registrarsi) invece di nasconderlo.
  if (isGuest) {
    return (
      <button
        disabled
        className="inline-flex items-center gap-1.5 rounded-full bg-ink-800 px-2.5 py-1 text-xs font-semibold text-ink-500"
        title={t('cam.goLiveGuest')}
      >
        <Icon name="video" size={15} />
        {t('cam.goLive')}
      </button>
    )
  }

  // Webcam non supportata dal browser (es. PWA standalone su iOS vecchi):
  // mostriamo il pulsante disattivato con spiegazione invece di nasconderlo.
  if (!supported) {
    return (
      <button
        disabled
        className="inline-flex items-center gap-1.5 rounded-full bg-ink-800 px-2.5 py-1 text-xs font-semibold text-ink-500"
        title={t('cam.notSupported')}
      >
        <Icon name="video" size={15} />
        {t('cam.goLive')}
      </button>
    )
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        disabled={!!broadcast}
        className="inline-flex items-center gap-1.5 rounded-full bg-accent-orange/15 px-2.5 py-1 text-xs font-semibold text-accent-orange hover:bg-accent-orange/25 disabled:opacity-40"
        title={broadcast ? t('cam.alreadyOn') : t('cam.goLive')}
      >
        <Icon name="video" size={15} />
        {t('cam.goLive')}
      </button>
      <WebcamConsentModal
        open={open}
        onClose={() => setOpen(false)}
        alreadyConsented={hasConsent}
        onGiveConsent={giveConsent}
        variant="broadcast"
        roomName={roomName}
        onConfirmMode={(mode) => {
          setOpen(false)
          void goLive(mode)
        }}
      />
    </>
  )
}

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

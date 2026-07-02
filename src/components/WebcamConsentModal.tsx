import { useState } from 'react'
import { Modal } from './Modal'
import { useI18n } from '../lib/i18n'
import { Icon } from './Icon'
import type { BroadcastMode } from '../context/WebcamContext'

interface WebcamConsentModalProps {
  open: boolean
  onClose: () => void
  alreadyConsented: boolean
  onGiveConsent: () => Promise<void>
  /** 'invite' = webcam 1:1 privata; 'broadcast' = broadcast pubblico in stanza. */
  variant?: 'invite' | 'broadcast'
  // Variante 'invite' (1:1)
  targetName?: string
  onConfirm?: (withAudio: boolean) => void
  // Variante 'broadcast' (pubblico)
  roomName?: string
  onConfirmMode?: (mode: BroadcastMode) => void
}

export function WebcamConsentModal({
  open,
  onClose,
  alreadyConsented,
  onGiveConsent,
  variant = 'invite',
  targetName,
  onConfirm,
  roomName,
  onConfirmMode,
}: WebcamConsentModalProps) {
  const { t } = useI18n()
  const [checked, setChecked] = useState(alreadyConsented)
  const [busy, setBusy] = useState(false)
  const isBroadcast = variant === 'broadcast'

  async function proceed(action: () => void) {
    if (!checked) return
    setBusy(true)
    await onGiveConsent()
    setBusy(false)
    action()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isBroadcast ? t('cam.goLiveTitle') : t('cam.consentTitle')}
    >
      <div className="space-y-4">
        <div className="flex gap-2 rounded-lg border border-accent-amber/40 bg-accent-amber/10 p-3 text-sm text-amber-100">
          <Icon name="alert" size={18} className="mt-0.5 shrink-0 text-accent-amber" />
          <span>{t('cam.privacy')}</span>
        </div>

        <p className="text-sm text-ink-400">
          {isBroadcast
            ? t('cam.goLiveIntro', { room: roomName ?? '' })
            : t('cam.targetIntro', { name: targetName ?? '' })}
          <span className="font-semibold">{t('cam.notRecorded')}</span>.
        </p>

        <label className="flex cursor-pointer items-start gap-2 text-sm text-ink-200">
          <input
            type="checkbox"
            checked={checked}
            onChange={(e) => setChecked(e.target.checked)}
            className="mt-0.5 h-4 w-4 accent-brand-600"
          />
          {t('cam.understood')}
        </label>

        {isBroadcast ? (
          <div className="grid grid-cols-2 gap-2">
            <button
              disabled={!checked || busy}
              onClick={() => proceed(() => onConfirmMode?.('audio'))}
              className="btn-ghost"
            >
              <Icon name="mic" size={16} />
              {t('cam.modeAudioOnly')}
            </button>
            <button
              disabled={!checked || busy}
              onClick={() => proceed(() => onConfirmMode?.('video'))}
              className="btn-primary"
            >
              <Icon name="video" size={16} />
              {t('cam.modeVideo')}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            <button
              disabled={!checked || busy}
              onClick={() => proceed(() => onConfirm?.(false))}
              className="btn-ghost"
            >
              <Icon name="camera" size={16} />
              {t('cam.videoOnly')}
            </button>
            <button
              disabled={!checked || busy}
              onClick={() => proceed(() => onConfirm?.(true))}
              className="btn-primary"
            >
              <Icon name="mic" size={16} />
              {t('cam.videoAudio')}
            </button>
          </div>
        )}
        <button onClick={onClose} className="w-full text-center text-xs text-ink-400 hover:text-ink-200">
          {t('common.cancel')}
        </button>
      </div>
    </Modal>
  )
}

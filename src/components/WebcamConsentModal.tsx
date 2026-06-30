import { useState } from 'react'
import { Modal } from './Modal'
import { useI18n } from '../lib/i18n'
import { Icon } from './Icon'

interface WebcamConsentModalProps {
  open: boolean
  onClose: () => void
  onConfirm: (withAudio: boolean) => void
  alreadyConsented: boolean
  onGiveConsent: () => Promise<void>
  targetName: string
}

export function WebcamConsentModal({
  open,
  onClose,
  onConfirm,
  alreadyConsented,
  onGiveConsent,
  targetName,
}: WebcamConsentModalProps) {
  const { t } = useI18n()
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
    <Modal open={open} onClose={onClose} title={t('cam.consentTitle')}>
      <div className="space-y-4">
        <div className="flex gap-2 rounded-lg border border-accent-amber/40 bg-accent-amber/10 p-3 text-sm text-amber-100">
          <Icon name="alert" size={18} className="mt-0.5 shrink-0 text-accent-amber" />
          <span>{t('cam.privacy')}</span>
        </div>

        <p className="text-sm text-ink-400">
          {t('cam.targetIntro', { name: targetName })}
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

        <div className="grid grid-cols-2 gap-2">
          <button disabled={!checked || busy} onClick={() => confirm(false)} className="btn-ghost">
            <Icon name="camera" size={16} />
            {t('cam.videoOnly')}
          </button>
          <button disabled={!checked || busy} onClick={() => confirm(true)} className="btn-primary">
            <Icon name="mic" size={16} />
            {t('cam.videoAudio')}
          </button>
        </div>
        <button onClick={onClose} className="w-full text-center text-xs text-ink-400 hover:text-ink-200">
          {t('common.cancel')}
        </button>
      </div>
    </Modal>
  )
}

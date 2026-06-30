import { useWebcam } from '../context/WebcamContext'
import { useI18n } from '../lib/i18n'
import { Icon } from './Icon'

/** Banner globale di invito webcam in arrivo (Accetta / Rifiuta). */
export function WebcamInviteBanner() {
  const { pendingInvite, acceptInvite, declineInvite } = useWebcam()
  const { t } = useI18n()
  if (!pendingInvite) return null

  return (
    <div className="fixed left-1/2 top-3 z-[60] w-[calc(100%-1.5rem)] max-w-sm -translate-x-1/2 animate-slide-up">
      <div className="card border-brand-500/60 p-3 shadow-soft">
        <p className="flex items-center gap-2 text-sm text-ink-200">
          <Icon name="camera" size={16} className="shrink-0 text-brand-300" />
          <span>
            {t('cam.inviteText', { name: pendingInvite.fromUsername })}
            {pendingInvite.session.audio_enabled ? t('cam.inviteWithAudio') : ''}
          </span>
        </p>
        <p className="mt-1 text-xs text-ink-400">{t('cam.inviteHint')}</p>
        <div className="mt-2 flex gap-2">
          <button onClick={() => void declineInvite()} className="btn-ghost flex-1">
            {t('cam.decline')}
          </button>
          <button onClick={() => void acceptInvite()} className="btn-primary flex-1">
            {t('cam.accept')}
          </button>
        </div>
      </div>
    </div>
  )
}

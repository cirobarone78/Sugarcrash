import { useI18n } from '../lib/i18n'
import { LanguageSwitcher } from './LanguageSwitcher'
import { Icon } from './Icon'

interface AgeGateProps {
  onConfirm: () => void
}

export function AgeGate({ onConfirm }: AgeGateProps) {
  const { t } = useI18n()
  return (
    <div className="flex min-h-full items-center justify-center p-4">
      <div className="card w-full max-w-md space-y-4 p-6">
        <div className="flex items-center justify-between">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-500 text-white shadow-glow">
            <Icon name="shield" size={24} />
          </div>
          <LanguageSwitcher />
        </div>
        <h1 className="text-xl font-extrabold text-white">{t('age.title')}</h1>
        <p className="text-sm text-ink-200">{t('age.body')}</p>
        <button onClick={onConfirm} className="btn-primary w-full">
          {t('age.confirm')}
        </button>
        <a href="https://www.google.com" className="block text-center text-xs text-ink-400 hover:text-ink-200">
          {t('age.exit')}
        </a>
      </div>
    </div>
  )
}

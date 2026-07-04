import { useState } from 'react'
import { useI18n } from '../lib/i18n'
import { LanguageSwitcher } from './LanguageSwitcher'
import { Icon } from './Icon'
import { LegalModal } from './LegalModal'
import type { LegalDocId } from '../lib/legal'

interface AgeGateProps {
  onConfirm: () => void
}

export function AgeGate({ onConfirm }: AgeGateProps) {
  const { t } = useI18n()
  const [legal, setLegal] = useState<LegalDocId | null>(null)
  const features = [t('seo.f1'), t('seo.f2'), t('seo.f3'), t('seo.f4'), t('seo.f5')]
  return (
    <div className="flex min-h-full flex-col items-center justify-center gap-6 p-4">
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
        <p className="text-center text-[11px] text-ink-400">
          {t('legal.acceptNote')}{' '}
          <button onClick={() => setLegal('terms')} className="underline hover:text-ink-200">
            {t('legal.terms')}
          </button>{' '}·{' '}
          <button onClick={() => setLegal('privacy')} className="underline hover:text-ink-200">
            {t('legal.privacy')}
          </button>
        </p>
        <a href="https://www.google.com" className="block text-center text-xs text-ink-400 hover:text-ink-200">
          {t('age.exit')}
        </a>
      </div>

      {/* Sezione descrittiva indicizzabile (SEO): è la prima pagina che vede un
          visitatore/crawler, quindi contiene testo reale su cos'è CamRooms. */}
      <section className="w-full max-w-md space-y-3 text-center">
        <h2 className="text-lg font-bold text-white">{t('seo.h2')}</h2>
        <p className="text-sm text-ink-300">{t('seo.p1')}</p>
        <div className="card space-y-1.5 p-4 text-left">
          <h3 className="text-xs font-bold uppercase tracking-wide text-brand-300">
            {t('seo.featTitle')}
          </h3>
          <ul className="space-y-1 text-sm text-ink-300">
            {features.map((f) => (
              <li key={f} className="flex items-start gap-2">
                <Icon name="check" size={15} className="mt-0.5 shrink-0 text-accent-green" />
                {f}
              </li>
            ))}
          </ul>
        </div>
        <p className="text-xs text-ink-400">{t('seo.free')}</p>
      </section>

      <LegalModal open={legal !== null} initial={legal ?? 'terms'} onClose={() => setLegal(null)} />
    </div>
  )
}

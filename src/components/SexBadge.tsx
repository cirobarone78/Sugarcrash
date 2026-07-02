import { useI18n } from '../lib/i18n'
import { SEX_VALUES, type Sex } from '../lib/types'

// Colori per sesso (vedi ROADMAP P4-U3). Tenui e coerenti con la palette.
const SEX_COLOR: Record<Sex, string> = {
  male: '#3b82f6',
  female: '#f472b6',
  couple: '#a855f7',
  undisclosed: '#64748b',
}

interface SexBadgeProps {
  sex: Sex | undefined
  /** Lato del chip quadrato in px. Default 16. */
  size?: number
  className?: string
}

/**
 * Indicatore sesso: piccolo chip colorato con la lettera localizzata.
 * Nessuna emoji — chip pieno tinta categoria. Usato in lista utenti e profilo.
 */
export function SexBadge({ sex, size = 16, className }: SexBadgeProps) {
  const { t } = useI18n()
  if (!sex) return null
  const color = SEX_COLOR[sex]
  return (
    <span
      title={t(`sex.${sex}`)}
      aria-label={t(`sex.${sex}`)}
      className={`inline-flex shrink-0 items-center justify-center rounded font-bold leading-none text-white ${className ?? ''}`}
      style={{
        background: color,
        width: size,
        height: size,
        fontSize: Math.round(size * 0.62),
      }}
    >
      {t(`sex.short.${sex}`)}
    </span>
  )
}

interface SexSelectorProps {
  value: Sex | undefined
  onChange: (sex: Sex) => void
}

/** Selettore sesso a pillole colorate. Riusato in onboarding e impostazioni. */
export function SexSelector({ value, onChange }: SexSelectorProps) {
  const { t } = useI18n()
  return (
    <div className="grid grid-cols-2 gap-2">
      {SEX_VALUES.map((s) => {
        const active = value === s
        return (
          <button
            key={s}
            type="button"
            onClick={() => onChange(s)}
            className={`flex items-center justify-center gap-2 rounded-lg border px-2 py-2 text-sm font-semibold ${
              active
                ? 'border-brand-500 bg-brand-900 text-white'
                : 'border-ink-700 text-ink-200 hover:bg-ink-800'
            }`}
          >
            <SexBadge sex={s} size={16} />
            {t(`sex.${s}`)}
          </button>
        )
      })}
    </div>
  )
}

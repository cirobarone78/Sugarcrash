import { useI18n, type Lang } from '../lib/i18n'

const LANGS: { code: Lang; label: string }[] = [
  { code: 'en', label: 'EN' },
  { code: 'it', label: 'IT' },
]

export function LanguageSwitcher({ className = '' }: { className?: string }) {
  const { lang, setLang } = useI18n()
  return (
    <div className={`flex rounded-lg bg-ink-900 p-0.5 ${className}`}>
      {LANGS.map((l) => (
        <button
          key={l.code}
          onClick={() => setLang(l.code)}
          className={`rounded-md px-2 py-1 text-xs font-bold ${
            lang === l.code ? 'bg-brand-600 text-white' : 'text-ink-400 hover:text-ink-200'
          }`}
        >
          {l.label}
        </button>
      ))}
    </div>
  )
}

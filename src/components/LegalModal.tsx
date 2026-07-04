import { useEffect, useState } from 'react'
import { Modal } from './Modal'
import { useI18n } from '../lib/i18n'
import { getLegalDoc, type LegalDocId } from '../lib/legal'

interface LegalModalProps {
  open: boolean
  initial?: LegalDocId
  onClose: () => void
}

const TABS: LegalDocId[] = ['terms', 'privacy', 'guidelines']

/** Mostra Termini / Privacy / Linee guida con schede, nella lingua corrente. */
export function LegalModal({ open, initial = 'terms', onClose }: LegalModalProps) {
  const { lang, t } = useI18n()
  const [tab, setTab] = useState<LegalDocId>(initial)

  useEffect(() => {
    if (open) setTab(initial)
  }, [open, initial])

  const doc = getLegalDoc(lang, tab)

  return (
    <Modal open={open} onClose={onClose} title={doc.title}>
      <div className="space-y-4">
        <div className="flex gap-1 rounded-lg bg-ink-900 p-1 text-xs">
          {TABS.map((id) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex-1 rounded-md py-1.5 font-semibold ${
                tab === id ? 'bg-brand-600 text-white' : 'text-ink-400 hover:text-ink-200'
              }`}
            >
              {t(`legal.tab.${id}`)}
            </button>
          ))}
        </div>

        <p className="text-[11px] text-ink-500">{doc.updated}</p>
        <p className="text-sm text-ink-300">{doc.intro}</p>

        {doc.sections.map((s) => (
          <section key={s.title} className="space-y-1.5">
            <h3 className="text-sm font-bold text-white">{s.title}</h3>
            {s.body.map((line, i) =>
              line.startsWith('- ') ? (
                <p key={i} className="flex gap-2 pl-1 text-sm text-ink-300">
                  <span className="text-brand-400">•</span>
                  <span>{line.slice(2)}</span>
                </p>
              ) : (
                <p key={i} className="text-sm text-ink-300">
                  {line}
                </p>
              ),
            )}
          </section>
        ))}
      </div>
    </Modal>
  )
}

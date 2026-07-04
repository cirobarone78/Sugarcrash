import { useEffect, useState } from 'react'
import { isSafeImageDataUrl } from '../lib/utils'
import { loadFullImage } from '../lib/images'
import { useI18n } from '../lib/i18n'
import { Icon } from './Icon'

interface ImageMessageProps {
  /** Miniatura incorporata nel messaggio (data-URL). */
  thumbUrl: string
  /**
   * Path del documento messaggio (es. `privateThreads/<id>/messages/<id>`) da
   * cui caricare l'originale al click. `null` se non c'è un originale separato:
   * in quel caso la miniatura è già l'immagine piena.
   */
  fullPath: string | null
  className?: string
}

/**
 * Rende una miniatura cliccabile; al click apre una lightbox a schermo intero
 * caricando l'originale (E2) solo su richiesta. Se `fullPath` è null usa la
 * miniatura anche a piena vista.
 */
export function ImageMessage({ thumbUrl, fullPath, className }: ImageMessageProps) {
  const { t } = useI18n()
  const [open, setOpen] = useState(false)
  const [full, setFull] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open) return
    // Niente originale separato: mostra direttamente la miniatura ingrandita.
    if (!fullPath) {
      setFull(thumbUrl)
      return
    }
    let alive = true
    setLoading(true)
    void loadFullImage(fullPath).then((url) => {
      if (!alive) return
      setFull(url && isSafeImageDataUrl(url) ? url : thumbUrl)
      setLoading(false)
    })
    return () => {
      alive = false
    }
  }, [open, fullPath, thumbUrl])

  // Chiudi con Esc.
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  if (!isSafeImageDataUrl(thumbUrl)) {
    return (
      <div className="rounded-2xl border border-ink-700 bg-white/[0.04] px-3.5 py-2 text-sm text-ink-400">
        {t('chat.invalidImage')}
      </div>
    )
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="block"
        aria-label={t('chat.viewImage')}
      >
        <img
          src={thumbUrl}
          alt=""
          loading="lazy"
          className={
            className ??
            'max-h-64 max-w-full rounded-2xl border border-ink-700 object-cover'
          }
        />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center bg-black/85 p-4"
          onClick={() => setOpen(false)}
          role="dialog"
          aria-modal="true"
        >
          <button
            type="button"
            className="fab absolute right-4 top-[calc(1rem_+_env(safe-area-inset-top))] h-10 w-10 bg-white/10 hover:bg-white/20"
            onClick={() => setOpen(false)}
            aria-label={t('common.close')}
          >
            <Icon name="close" size={20} />
          </button>
          {loading && (
            <span className="text-sm text-ink-300">{t('chat.uploading')}</span>
          )}
          {full && (
            <img
              src={full}
              alt=""
              className="max-h-[90vh] max-w-full rounded-lg object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          )}
        </div>
      )}
    </>
  )
}

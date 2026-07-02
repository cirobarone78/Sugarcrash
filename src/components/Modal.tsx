import { useEffect, type ReactNode } from 'react'
import { Icon } from './Icon'

interface ModalProps {
  open: boolean
  onClose: () => void
  title?: string
  children: ReactNode
  /** Se false, il click sullo sfondo non chiude (es. consenso obbligatorio). */
  dismissable?: boolean
  maxWidth?: string
}

export function Modal({
  open,
  onClose,
  title,
  children,
  dismissable = true,
  maxWidth = 'max-w-md',
}: ModalProps) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && dismissable) onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, dismissable, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-3 sm:p-4"
      onClick={() => dismissable && onClose()}
    >
      <div
        // Altezza limitata al viewport (dvh gestisce le barre del browser mobile)
        // + corpo scrollabile e header sticky: la X è sempre raggiungibile.
        className={`card flex max-h-[92dvh] w-full ${maxWidth} flex-col animate-slide-up shadow-2xl`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {title ? (
          <div className="flex shrink-0 items-center justify-between border-b border-white/[0.06] px-5 py-3">
            <h2 className="text-lg font-bold text-white">{title}</h2>
            {dismissable && (
              <button
                onClick={onClose}
                className="rounded-md p-1.5 text-ink-400 hover:bg-ink-800 hover:text-white"
                aria-label="Close"
              >
                <Icon name="close" size={18} />
              </button>
            )}
          </div>
        ) : (
          dismissable && (
            <button
              onClick={onClose}
              className="absolute right-3 top-3 z-10 rounded-md p-1.5 text-ink-400 hover:bg-ink-800 hover:text-white"
              aria-label="Close"
            >
              <Icon name="close" size={18} />
            </button>
          )
        )}
        <div className="min-h-0 flex-1 overflow-y-auto p-5">{children}</div>
      </div>
    </div>
  )
}

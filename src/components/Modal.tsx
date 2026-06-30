import { useEffect, type ReactNode } from 'react'

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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onClick={() => dismissable && onClose()}
    >
      <div
        className={`card w-full ${maxWidth} animate-slide-up p-5 shadow-2xl`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {title && (
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-bold text-white">{title}</h2>
            {dismissable && (
              <button
                onClick={onClose}
                className="rounded-md p-1 text-ink-400 hover:bg-ink-800 hover:text-white"
                aria-label="Chiudi"
              >
                ✕
              </button>
            )}
          </div>
        )}
        {children}
      </div>
    </div>
  )
}

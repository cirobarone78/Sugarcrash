import { useRef, type ReactNode } from 'react'
import { Icon } from './Icon'

interface FloatingWindowProps {
  title: ReactNode
  x: number
  y: number
  z: number
  width?: number
  onMove: (x: number, y: number) => void
  onFocus: () => void
  onClose: () => void
  headerExtra?: ReactNode
  children: ReactNode
}

/**
 * Finestra mobile trascinabile (stile vecchia chat). Si sposta afferrando la
 * barra del titolo; porta in primo piano al click; funziona con mouse e touch.
 */
export function FloatingWindow({
  title,
  x,
  y,
  z,
  width = 340,
  onMove,
  onFocus,
  onClose,
  headerExtra,
  children,
}: FloatingWindowProps) {
  const drag = useRef<{ dx: number; dy: number } | null>(null)

  function onPointerDown(e: React.PointerEvent) {
    // non trascinare se si preme un bottone nell'header
    if ((e.target as HTMLElement).closest('button')) return
    onFocus()
    drag.current = { dx: e.clientX - x, dy: e.clientY - y }
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
  }
  function onPointerMove(e: React.PointerEvent) {
    if (!drag.current) return
    const maxX = window.innerWidth - 80
    const maxY = window.innerHeight - 60
    const nx = Math.min(Math.max(0, e.clientX - drag.current.dx), maxX)
    const ny = Math.min(Math.max(0, e.clientY - drag.current.dy), maxY)
    onMove(nx, ny)
  }
  function onPointerUp() {
    drag.current = null
  }

  return (
    <div
      className="pointer-events-auto fixed flex max-h-[80vh] flex-col overflow-hidden rounded-2xl border border-white/10 bg-ink-850 shadow-soft"
      style={{ left: x, top: y, zIndex: z, width: `min(${width}px, 94vw)` }}
      onPointerDown={onFocus}
    >
      <div
        className="flex cursor-grab items-center gap-2 border-b border-white/[0.06] bg-ink-900 px-2.5 py-2 active:cursor-grabbing"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
      >
        <div className="flex min-w-0 flex-1 items-center gap-2">{title}</div>
        {headerExtra}
        <button
          onClick={onClose}
          className="rounded-md p-1 text-ink-400 hover:bg-ink-800 hover:text-white"
          aria-label="Close"
        >
          <Icon name="close" size={16} />
        </button>
      </div>
      <div className="flex min-h-0 flex-1 flex-col">{children}</div>
    </div>
  )
}

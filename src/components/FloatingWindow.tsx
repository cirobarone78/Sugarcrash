import { useRef, type ReactNode } from 'react'
import { Icon } from './Icon'

interface FloatingWindowProps {
  title: ReactNode
  x: number
  y: number
  z: number
  w: number
  h: number
  minWidth?: number
  minHeight?: number
  resizable?: boolean
  onMove: (x: number, y: number) => void
  onResize: (w: number, h: number) => void
  onFocus: () => void
  onMinimize?: () => void
  onClose: () => void
  headerExtra?: ReactNode
  children: ReactNode
}

/**
 * Finestra mobile: trascinabile dalla barra del titolo, ridimensionabile
 * dall'angolo in basso a destra, riducibile e chiudibile. Mouse e touch.
 */
export function FloatingWindow({
  title,
  x,
  y,
  z,
  w,
  h,
  minWidth = 240,
  minHeight = 180,
  resizable = true,
  onMove,
  onResize,
  onFocus,
  onMinimize,
  onClose,
  headerExtra,
  children,
}: FloatingWindowProps) {
  const drag = useRef<{ dx: number; dy: number } | null>(null)
  const rez = useRef<{ sx: number; sy: number; sw: number; sh: number } | null>(null)

  function onHeaderDown(e: React.PointerEvent) {
    if ((e.target as HTMLElement).closest('button')) return
    onFocus()
    drag.current = { dx: e.clientX - x, dy: e.clientY - y }
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
  }
  function onHeaderMove(e: React.PointerEvent) {
    if (!drag.current) return
    const maxX = window.innerWidth - 60
    const maxY = window.innerHeight - 48
    const nx = Math.min(Math.max(0, e.clientX - drag.current.dx), maxX)
    const ny = Math.min(Math.max(0, e.clientY - drag.current.dy), maxY)
    onMove(nx, ny)
  }
  function onHeaderUp() {
    drag.current = null
  }

  function onRezDown(e: React.PointerEvent) {
    e.stopPropagation()
    onFocus()
    rez.current = { sx: e.clientX, sy: e.clientY, sw: w, sh: h }
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
  }
  function onRezMove(e: React.PointerEvent) {
    if (!rez.current) return
    const maxW = window.innerWidth - x - 8
    const maxH = window.innerHeight - y - 8
    const nw = Math.min(Math.max(minWidth, rez.current.sw + (e.clientX - rez.current.sx)), maxW)
    const nh = Math.min(Math.max(minHeight, rez.current.sh + (e.clientY - rez.current.sy)), maxH)
    onResize(nw, nh)
  }
  function onRezUp() {
    rez.current = null
  }

  return (
    <div
      className="pointer-events-auto fixed flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-ink-850 shadow-soft"
      style={{
        left: x,
        top: y,
        zIndex: z,
        width: `min(${w}px, 96vw)`,
        height: `min(${h}px, 88vh)`,
      }}
      onPointerDown={onFocus}
    >
      <div
        className="flex shrink-0 cursor-grab touch-none items-center gap-2 border-b border-white/[0.06] bg-ink-900 px-2.5 py-2 active:cursor-grabbing"
        onPointerDown={onHeaderDown}
        onPointerMove={onHeaderMove}
        onPointerUp={onHeaderUp}
      >
        <div className="flex min-w-0 flex-1 items-center gap-2">{title}</div>
        {headerExtra}
        {onMinimize && (
          <button
            onClick={onMinimize}
            className="rounded-md p-1 text-ink-400 hover:bg-ink-800 hover:text-white"
            aria-label="Minimize"
          >
            <Icon name="minus" size={16} />
          </button>
        )}
        <button
          onClick={onClose}
          className="rounded-md p-1 text-ink-400 hover:bg-ink-800 hover:text-white"
          aria-label="Close"
        >
          <Icon name="close" size={16} />
        </button>
      </div>

      <div className="flex min-h-0 flex-1 flex-col">{children}</div>

      {resizable && (
        <div
          onPointerDown={onRezDown}
          onPointerMove={onRezMove}
          onPointerUp={onRezUp}
          className="absolute bottom-0 right-0 z-10 h-5 w-5 cursor-nwse-resize touch-none"
          aria-label="Resize"
        >
          <svg viewBox="0 0 10 10" className="absolute bottom-1 right-1 h-2.5 w-2.5 text-ink-600">
            <path d="M9 1v8H1" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
        </div>
      )}
    </div>
  )
}

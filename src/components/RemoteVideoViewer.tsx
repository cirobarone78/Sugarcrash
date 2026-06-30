import { useEffect, useRef, useState } from 'react'
import { shortSessionId } from '../lib/utils'
import { useI18n } from '../lib/i18n'

interface RemoteVideoViewerProps {
  stream: MediaStream | null
  connState: RTCPeerConnectionState
  /** Nickname di chi sta guardando (per il watermark anti-diffusione). */
  watermarkName: string
  sessionId: string
}

/**
 * Mostra il video remoto con watermark dinamico sovrapposto.
 * Il watermark riporta nickname del ricevente, data/ora e ID sessione breve:
 * serve a SCORAGGIARE registrazioni/diffusioni non autorizzate (non le impedisce).
 */
export function RemoteVideoViewer({
  stream,
  connState,
  watermarkName,
  sessionId,
}: RemoteVideoViewerProps) {
  const { t } = useI18n()
  const ref = useRef<HTMLVideoElement>(null)
  const [clock, setClock] = useState(() => new Date().toLocaleTimeString())

  useEffect(() => {
    if (ref.current) ref.current.srcObject = stream
  }, [stream])

  useEffect(() => {
    const id = setInterval(() => setClock(new Date().toLocaleTimeString()), 1000)
    return () => clearInterval(id)
  }, [])

  const connecting = connState !== 'connected' && !stream

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-black">
      <video ref={ref} autoPlay playsInline className="h-full w-full object-cover" />

      {connecting && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-ink-950/90 text-sm text-ink-400">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-ink-700 border-t-brand-500" />
          {t('cam.connecting')}
        </div>
      )}

      {/* Watermark dinamico ripetuto */}
      <div className="pointer-events-none absolute inset-0 select-none overflow-hidden">
        <div className="absolute -inset-10 grid grid-cols-2 gap-10 rotate-[-20deg] opacity-[0.18]">
          {Array.from({ length: 8 }).map((_, i) => (
            <span key={i} className="whitespace-nowrap text-[11px] font-bold text-white">
              {watermarkName} · {clock} · #{shortSessionId(sessionId)}
            </span>
          ))}
        </div>
      </div>

      {/* Indicatore "webcam attiva" */}
      <span className="absolute left-2 top-2 chip animate-pulse-ring bg-accent-red font-semibold text-white">
        <span className="h-1.5 w-1.5 rounded-full bg-white" />
        {t('cam.live')}
      </span>

      {/* Avviso anti-diffusione */}
      <p className="pointer-events-none absolute bottom-1 left-0 right-0 text-center text-[10px] text-white/80">
        {t('cam.recordingWarning')}
      </p>
    </div>
  )
}

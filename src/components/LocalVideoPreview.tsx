import { useEffect, useRef } from 'react'
import { useI18n } from '../lib/i18n'

interface LocalVideoPreviewProps {
  stream: MediaStream
  videoEnabled: boolean
}

/** Anteprima locale (specchiata) per chi trasmette. Audio sempre muto qui. */
export function LocalVideoPreview({ stream, videoEnabled }: LocalVideoPreviewProps) {
  const { t } = useI18n()
  const ref = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    if (ref.current) ref.current.srcObject = stream
  }, [stream])

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-black">
      <video
        ref={ref}
        autoPlay
        muted
        playsInline
        className="h-full w-full -scale-x-100 object-cover"
      />
      {!videoEnabled && (
        <div className="absolute inset-0 flex items-center justify-center bg-ink-950/90 text-sm text-ink-400">
          {t('cam.videoOff')}
        </div>
      )}
      <span className="absolute left-2 top-2 chip bg-black/60 text-white">{t('cam.youPreview')}</span>
    </div>
  )
}

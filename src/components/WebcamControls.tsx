import { useEffect, useState } from 'react'
import { formatDuration } from '../lib/utils'
import { useI18n } from '../lib/i18n'
import { Icon } from './Icon'

interface WebcamControlsProps {
  audioEnabled: boolean
  videoEnabled: boolean
  hasAudio: boolean
  onToggleMic: () => void
  onToggleVideo: () => void
  onClose: () => void
}

/** Timer che conta da quando il componente è montato. */
function useElapsed() {
  const [seconds, setSeconds] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setSeconds((s) => s + 1), 1000)
    return () => clearInterval(id)
  }, [])
  return seconds
}

export function WebcamControls({
  audioEnabled,
  videoEnabled,
  hasAudio,
  onToggleMic,
  onToggleVideo,
  onClose,
}: WebcamControlsProps) {
  const { t } = useI18n()
  const elapsed = useElapsed()
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="chip bg-ink-800 font-mono tabular-nums text-ink-200" title={t('cam.duration')}>
        {formatDuration(elapsed)}
      </span>
      <div className="flex items-center gap-2.5 rounded-full bg-ink-950/80 px-3 py-2 shadow-pill backdrop-blur">
        {hasAudio && (
          <button
            onClick={onToggleMic}
            className={`fab ${audioEnabled ? 'bg-cyan-400' : 'bg-ink-700'}`}
            title={audioEnabled ? t('cam.micOn') : t('cam.micOff')}
          >
            <Icon name={audioEnabled ? 'mic' : 'micOff'} size={19} />
          </button>
        )}
        <button
          onClick={onToggleVideo}
          className={`fab ${videoEnabled ? 'bg-accent-orange' : 'bg-ink-700'}`}
          title={videoEnabled ? t('cam.videoToggleOff') : t('cam.videoToggleOn')}
        >
          <Icon name={videoEnabled ? 'video' : 'videoOff'} size={19} />
        </button>
        <button
          onClick={onClose}
          className="fab bg-accent-red hover:brightness-110"
          title={t('cam.closeCam')}
          aria-label={t('cam.closeCam')}
        >
          <Icon name="stop" size={18} />
        </button>
      </div>
    </div>
  )
}

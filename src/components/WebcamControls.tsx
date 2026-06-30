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
    <div className="flex items-center justify-between gap-2 rounded-xl bg-ink-850/80 p-2">
      <span className="chip bg-ink-800 font-mono tabular-nums text-ink-200" title={t('cam.duration')}>
        {formatDuration(elapsed)}
      </span>
      <div className="flex items-center gap-1.5">
        {hasAudio && (
          <button
            onClick={onToggleMic}
            className={`icon-btn ${audioEnabled ? 'text-white' : 'text-ink-400'}`}
            title={audioEnabled ? t('cam.micOn') : t('cam.micOff')}
          >
            <Icon name={audioEnabled ? 'mic' : 'micOff'} size={18} />
          </button>
        )}
        <button
          onClick={onToggleVideo}
          className={`icon-btn ${videoEnabled ? 'text-white' : 'text-ink-400'}`}
          title={videoEnabled ? t('cam.videoToggleOff') : t('cam.videoToggleOn')}
        >
          <Icon name={videoEnabled ? 'video' : 'videoOff'} size={18} />
        </button>
        <button onClick={onClose} className="btn-danger" title={t('cam.closeCam')}>
          <Icon name="stop" size={16} />
          {t('cam.closeCam')}
        </button>
      </div>
    </div>
  )
}

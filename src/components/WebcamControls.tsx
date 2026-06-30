import { useEffect, useState } from 'react'
import { formatDuration } from '../lib/utils'
import { useI18n } from '../lib/i18n'

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
    <div className="flex items-center justify-between gap-2 rounded-lg bg-ink-850 p-2">
      <span className="chip bg-ink-800 font-mono text-ink-200" title={t('cam.duration')}>
        ⏱ {formatDuration(elapsed)}
      </span>
      <div className="flex items-center gap-1.5">
        {hasAudio && (
          <button
            onClick={onToggleMic}
            className={`btn ${audioEnabled ? 'bg-ink-700 text-white' : 'bg-ink-800 text-ink-400'}`}
            title={audioEnabled ? t('cam.micOn') : t('cam.micOff')}
          >
            {audioEnabled ? '🎙️' : '🔇'}
          </button>
        )}
        <button
          onClick={onToggleVideo}
          className={`btn ${videoEnabled ? 'bg-ink-700 text-white' : 'bg-ink-800 text-ink-400'}`}
          title={videoEnabled ? t('cam.videoToggleOff') : t('cam.videoToggleOn')}
        >
          {videoEnabled ? '📹' : '🚫'}
        </button>
        <button onClick={onClose} className="btn-danger" title={t('cam.closeCam')}>
          {t('cam.closeCam')}
        </button>
      </div>
    </div>
  )
}

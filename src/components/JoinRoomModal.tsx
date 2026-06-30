import { useState } from 'react'
import { Modal } from './Modal'
import { useI18n } from '../lib/i18n'
import type { Room } from '../lib/types'

interface JoinRoomModalProps {
  room: Room | null
  onClose: () => void
  onJoin: (roomId: string, password: string) => Promise<{ errorKey?: string }>
  onJoined: (room: Room) => void
}

export function JoinRoomModal({ room, onClose, onJoin, onJoined }: JoinRoomModalProps) {
  const { t } = useI18n()
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!room) return
    setBusy(true)
    setError(null)
    const { errorKey } = await onJoin(room.id, password)
    setBusy(false)
    if (errorKey) {
      setError(t(errorKey))
      return
    }
    setPassword('')
    onJoined(room)
  }

  return (
    <Modal open={room !== null} onClose={onClose} title={t('rooms.joinTitle', { room: room?.name ?? '' })}>
      <form onSubmit={submit} className="space-y-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-ink-400">
            {t('rooms.enterPassword')}
          </label>
          <input
            type="password"
            className="input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••"
            autoFocus
          />
        </div>
        {error && <p className="text-sm text-accent-red">{error}</p>}
        <div className="flex gap-2">
          <button type="button" onClick={onClose} className="btn-ghost flex-1">
            {t('common.cancel')}
          </button>
          <button type="submit" disabled={busy} className="btn-primary flex-1">
            {busy ? t('rooms.joining') : t('rooms.joinBtn')}
          </button>
        </div>
      </form>
    </Modal>
  )
}

import { useState } from 'react'
import { Modal } from './Modal'
import { useI18n } from '../lib/i18n'
import type { Room } from '../lib/types'

interface CreateRoomModalProps {
  open: boolean
  onClose: () => void
  onCreate: (name: string, password: string) => Promise<{ room?: Room; errorKey?: string }>
  onCreated: (room: Room) => void
}

export function CreateRoomModal({ open, onClose, onCreate, onCreated }: CreateRoomModalProps) {
  const { t } = useI18n()
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    const { room, errorKey } = await onCreate(name, password)
    setBusy(false)
    if (errorKey || !room) {
      setError(t(errorKey ?? 'rooms.createFailed'))
      return
    }
    setName('')
    setPassword('')
    onCreated(room)
  }

  return (
    <Modal open={open} onClose={onClose} title={t('rooms.createTitle')}>
      <form onSubmit={submit} className="space-y-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-ink-400">{t('rooms.name')}</label>
          <input
            className="input"
            value={name}
            maxLength={40}
            onChange={(e) => setName(e.target.value)}
            placeholder={t('rooms.namePlaceholder')}
            autoFocus
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-ink-400">{t('rooms.password')}</label>
          <input
            type="password"
            className="input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••"
          />
          <p className="mt-1 text-xs text-ink-400">{t('rooms.passwordHint')}</p>
        </div>
        {error && <p className="text-sm text-accent-red">{error}</p>}
        <div className="flex gap-2">
          <button type="button" onClick={onClose} className="btn-ghost flex-1">
            {t('common.cancel')}
          </button>
          <button type="submit" disabled={busy} className="btn-primary flex-1">
            {busy ? t('rooms.creating') : t('rooms.createBtn')}
          </button>
        </div>
      </form>
    </Modal>
  )
}

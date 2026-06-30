import { useState } from 'react'
import { Modal } from './Modal'
import { useBlocks } from '../hooks/useBlocks'

interface BlockUserDialogProps {
  open: boolean
  onClose: () => void
  userId: string | null
  username: string
}

export function BlockUserDialog({ open, onClose, userId, username }: BlockUserDialogProps) {
  const { block } = useBlocks()
  const [busy, setBusy] = useState(false)

  async function confirm() {
    if (!userId) return
    setBusy(true)
    await block(userId)
    setBusy(false)
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title={`Bloccare ${username}?`}>
      <div className="space-y-4">
        <p className="text-sm text-ink-400">
          Non vedrai più i suoi messaggi pubblici e non potrà inviarti messaggi
          privati né inviti webcam. Puoi sbloccarlo in seguito dalle impostazioni.
        </p>
        <div className="flex gap-2">
          <button onClick={onClose} className="btn-ghost flex-1">
            Annulla
          </button>
          <button onClick={confirm} disabled={busy} className="btn-danger flex-1">
            {busy ? 'Attendi…' : 'Blocca utente'}
          </button>
        </div>
      </div>
    </Modal>
  )
}

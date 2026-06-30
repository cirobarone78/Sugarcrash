import { useState } from 'react'
import { Modal } from './Modal'
import { useBlocks } from '../hooks/useBlocks'
import { useI18n } from '../lib/i18n'

interface BlockUserDialogProps {
  open: boolean
  onClose: () => void
  userId: string | null
  username: string
}

export function BlockUserDialog({ open, onClose, userId, username }: BlockUserDialogProps) {
  const { block } = useBlocks()
  const { t } = useI18n()
  const [busy, setBusy] = useState(false)

  async function confirm() {
    if (!userId) return
    setBusy(true)
    await block(userId)
    setBusy(false)
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title={t('block.title', { name: username })}>
      <div className="space-y-4">
        <p className="text-sm text-ink-400">{t('block.body')}</p>
        <div className="flex gap-2">
          <button onClick={onClose} className="btn-ghost flex-1">
            {t('common.cancel')}
          </button>
          <button onClick={confirm} disabled={busy} className="btn-danger flex-1">
            {busy ? t('common.wait') : t('block.confirm')}
          </button>
        </div>
      </div>
    </Modal>
  )
}

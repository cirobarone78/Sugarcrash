import { useState } from 'react'
import { addDoc, collection, serverTimestamp } from 'firebase/firestore'
import { Modal } from './Modal'
import { db } from '../lib/firebase'
import { useAuth } from '../context/AuthContext'
import { useI18n } from '../lib/i18n'

export interface ReportTarget {
  reportedUserId?: string | null
  messageId?: string | null
  privateMessageId?: string | null
  label: string
}

interface ReportDialogProps {
  open: boolean
  onClose: () => void
  target: ReportTarget | null
}

const REASON_KEYS = [
  'report.reasonHarass',
  'report.reasonSpam',
  'report.reasonSexual',
  'report.reasonThreat',
  'report.reasonOther',
]

export function ReportDialog({ open, onClose, target }: ReportDialogProps) {
  const { profile } = useAuth()
  const { t } = useI18n()
  const [reasonKey, setReasonKey] = useState(REASON_KEYS[0])
  const [details, setDetails] = useState('')
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)

  async function submit() {
    if (!profile || !target) return
    setBusy(true)
    const reason = t(reasonKey)
    const fullReason = details.trim() ? `${reason} — ${details.trim()}` : reason
    await addDoc(collection(db, 'reports'), {
      reporter_id: profile.id,
      reported_user_id: target.reportedUserId ?? null,
      message_id: target.messageId ?? null,
      private_message_id: target.privateMessageId ?? null,
      reason: fullReason.slice(0, 1000),
      created_at: serverTimestamp(),
    })
    await addDoc(collection(db, 'moderation_events'), {
      user_id: profile.id,
      event_type: 'report',
      metadata: { ...target, reason: fullReason },
      created_at: serverTimestamp(),
    })
    setBusy(false)
    setDone(true)
  }

  function handleClose() {
    setDone(false)
    setDetails('')
    setReasonKey(REASON_KEYS[0])
    onClose()
  }

  return (
    <Modal open={open} onClose={handleClose} title={t('report.title')}>
      {done ? (
        <div className="space-y-4 text-center">
          <p className="text-sm text-ink-200">{t('report.done')}</p>
          <button onClick={handleClose} className="btn-primary w-full">
            {t('common.close')}
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-ink-400">
            {t('report.reporting')}{' '}
            <span className="font-semibold text-ink-200">{target?.label}</span>
          </p>
          <div>
            <label className="mb-1 block text-xs font-medium text-ink-400">
              {t('report.reason')}
            </label>
            <select className="input" value={reasonKey} onChange={(e) => setReasonKey(e.target.value)}>
              {REASON_KEYS.map((k) => (
                <option key={k} value={k}>
                  {t(k)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-ink-400">
              {t('report.details')}
            </label>
            <textarea
              className="input resize-none"
              rows={3}
              value={details}
              maxLength={1000}
              onChange={(e) => setDetails(e.target.value)}
              placeholder={t('report.detailsPlaceholder')}
            />
          </div>
          <div className="flex gap-2">
            <button onClick={handleClose} className="btn-ghost flex-1">
              {t('common.cancel')}
            </button>
            <button onClick={submit} disabled={busy} className="btn-danger flex-1">
              {busy ? t('report.sending') : t('report.send')}
            </button>
          </div>
        </div>
      )}
    </Modal>
  )
}

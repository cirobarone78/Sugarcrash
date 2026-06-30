import { useState } from 'react'
import { Modal } from './Modal'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

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

const REASONS = [
  'Molestie o insulti',
  'Spam o pubblicità',
  'Contenuti sessuali non richiesti',
  'Minaccia o comportamento pericoloso',
  'Altro',
]

export function ReportDialog({ open, onClose, target }: ReportDialogProps) {
  const { profile } = useAuth()
  const [reason, setReason] = useState(REASONS[0])
  const [details, setDetails] = useState('')
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)

  async function submit() {
    if (!profile || !target) return
    setBusy(true)
    const fullReason = details.trim() ? `${reason} — ${details.trim()}` : reason
    await supabase.from('reports').insert({
      reporter_id: profile.id,
      reported_user_id: target.reportedUserId ?? null,
      message_id: target.messageId ?? null,
      private_message_id: target.privateMessageId ?? null,
      reason: fullReason.slice(0, 1000),
    })
    await supabase.from('moderation_events').insert({
      user_id: profile.id,
      event_type: 'report',
      metadata: { ...target, reason: fullReason },
    })
    setBusy(false)
    setDone(true)
  }

  function handleClose() {
    setDone(false)
    setDetails('')
    setReason(REASONS[0])
    onClose()
  }

  return (
    <Modal open={open} onClose={handleClose} title="Segnala abuso">
      {done ? (
        <div className="space-y-4 text-center">
          <p className="text-sm text-ink-200">
            Grazie. La segnalazione è stata inviata allo staff.
          </p>
          <button onClick={handleClose} className="btn-primary w-full">
            Chiudi
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-ink-400">
            Stai segnalando: <span className="font-semibold text-ink-200">{target?.label}</span>
          </p>
          <div>
            <label className="mb-1 block text-xs font-medium text-ink-400">Motivo</label>
            <select className="input" value={reason} onChange={(e) => setReason(e.target.value)}>
              {REASONS.map((r) => (
                <option key={r}>{r}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-ink-400">
              Dettagli (opzionale)
            </label>
            <textarea
              className="input resize-none"
              rows={3}
              value={details}
              maxLength={1000}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Cosa è successo?"
            />
          </div>
          <div className="flex gap-2">
            <button onClick={handleClose} className="btn-ghost flex-1">
              Annulla
            </button>
            <button onClick={submit} disabled={busy} className="btn-danger flex-1">
              {busy ? 'Invio…' : 'Invia segnalazione'}
            </button>
          </div>
        </div>
      )}
    </Modal>
  )
}

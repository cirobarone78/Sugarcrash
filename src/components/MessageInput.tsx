import { useRef, useState } from 'react'
import { EmojiPicker } from './EmojiPicker'
import { MAX_MESSAGE_LENGTH } from '../lib/utils'
import { useI18n } from '../lib/i18n'
import { compressImageToDataUrl } from '../lib/upload'
import { Icon } from './Icon'

interface MessageInputProps {
  onSend: (body: string) => Promise<{ error: string | null }>
  /** Invio immagine (URL Storage). Se assente, il pulsante allega non compare. */
  onSendImage?: (url: string) => Promise<{ error: string | null }>
  placeholder?: string
  disabled?: boolean
}

export function MessageInput({ onSend, onSendImage, placeholder, disabled }: MessageInputProps) {
  const { t } = useI18n()
  const [value, setValue] = useState('')
  const [emojiOpen, setEmojiOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  // B7: guardia "in-flight" — l'auto-repeat di Enter può lanciare più submit
  // prima che lastBody/rate-limit si aggiornino, causando invii doppi.
  const sending = useRef(false)

  async function submit() {
    if (!value.trim() || disabled || sending.current) return
    sending.current = true
    try {
      const { error } = await onSend(value)
      if (error) {
        setError(error)
        return
      }
      setError(null)
      setValue('')
    } finally {
      sending.current = false
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      void submit()
    }
  }

  async function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = '' // consente di re-inviare lo stesso file
    if (!file || !onSendImage) return
    setError(null)
    setUploading(true)
    const { url, errorKey } = await compressImageToDataUrl(file)
    if (errorKey || !url) {
      setUploading(false)
      setError(t(errorKey ?? 'chat.uploadFailed'))
      return
    }
    const { error } = await onSendImage(url)
    setUploading(false)
    if (error) setError(error)
  }

  const busy = disabled || uploading

  return (
    <div className="shrink-0 border-t border-white/[0.06] bg-ink-900 p-3">
      {error && <p className="px-2 pb-1.5 text-xs text-accent-red">{error}</p>}
      <div className="relative flex items-center gap-2 rounded-full border border-ink-700 bg-ink-850 py-1.5 pl-4 pr-1.5">
        <button
          type="button"
          onClick={() => setEmojiOpen((v) => !v)}
          className="shrink-0 text-ink-400 transition-colors hover:text-accent-yellow"
          aria-label="Emoji"
          disabled={busy}
        >
          <Icon name="smile" size={22} />
        </button>
        <EmojiPicker
          open={emojiOpen}
          onClose={() => setEmojiOpen(false)}
          onPick={(emoji) => setValue((v) => v + emoji)}
        />
        <textarea
          rows={1}
          className="max-h-32 flex-1 resize-none border-0 bg-transparent py-1.5 text-sm text-ink-200 outline-none placeholder:text-ink-400"
          placeholder={uploading ? t('chat.uploading') : placeholder ?? t('chat.placeholder')}
          value={value}
          maxLength={MAX_MESSAGE_LENGTH}
          disabled={busy}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={onKeyDown}
        />
        {onSendImage && (
          <>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={onPickFile}
            />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="fab h-9 w-9 shrink-0 bg-cyan-400 hover:brightness-110"
              aria-label={t('chat.attachImage')}
              title={t('chat.attachImage')}
              disabled={busy}
            >
              <Icon name="image" size={17} />
            </button>
          </>
        )}
        <button
          type="button"
          onClick={submit}
          disabled={busy || !value.trim()}
          className="fab h-9 w-9 shrink-0 bg-accent-green hover:brightness-110 disabled:opacity-40"
          aria-label={t('common.send')}
        >
          <Icon name="send" size={17} />
        </button>
      </div>
    </div>
  )
}

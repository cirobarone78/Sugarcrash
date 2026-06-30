import { useRef, useState } from 'react'
import { EmojiPicker } from './EmojiPicker'
import { MAX_MESSAGE_LENGTH } from '../lib/utils'
import { useI18n } from '../lib/i18n'
import { compressImageToDataUrl } from '../lib/upload'

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

  async function submit() {
    if (!value.trim() || disabled) return
    const { error } = await onSend(value)
    if (error) {
      setError(error)
      return
    }
    setError(null)
    setValue('')
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
    <div className="border-t border-ink-700 bg-ink-900 p-2">
      {error && <p className="px-2 pb-1 text-xs text-accent-red">{error}</p>}
      <div className="relative flex items-end gap-2">
        <button
          type="button"
          onClick={() => setEmojiOpen((v) => !v)}
          className="btn-ghost h-10 px-3 text-lg"
          aria-label="Emoji"
          disabled={busy}
        >
          😊
        </button>
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
              className="btn-ghost h-10 px-3 text-lg"
              aria-label={t('chat.attachImage')}
              title={t('chat.attachImage')}
              disabled={busy}
            >
              🖼️
            </button>
          </>
        )}
        <EmojiPicker
          open={emojiOpen}
          onClose={() => setEmojiOpen(false)}
          onPick={(emoji) => setValue((v) => v + emoji)}
        />
        <textarea
          rows={1}
          className="input max-h-32 flex-1 resize-none py-2.5"
          placeholder={uploading ? t('chat.uploading') : placeholder ?? t('chat.placeholder')}
          value={value}
          maxLength={MAX_MESSAGE_LENGTH}
          disabled={busy}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={onKeyDown}
        />
        <button
          type="button"
          onClick={submit}
          disabled={busy || !value.trim()}
          className="btn-primary h-10"
        >
          {t('common.send')}
        </button>
      </div>
    </div>
  )
}

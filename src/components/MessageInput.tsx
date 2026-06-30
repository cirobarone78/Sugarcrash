import { useState } from 'react'
import { EmojiPicker } from './EmojiPicker'
import { MAX_MESSAGE_LENGTH } from '../lib/utils'

interface MessageInputProps {
  onSend: (body: string) => Promise<{ error: string | null }>
  placeholder?: string
  disabled?: boolean
}

export function MessageInput({ onSend, placeholder, disabled }: MessageInputProps) {
  const [value, setValue] = useState('')
  const [emojiOpen, setEmojiOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)

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

  return (
    <div className="border-t border-ink-700 bg-ink-900 p-2">
      {error && <p className="px-2 pb-1 text-xs text-accent-red">{error}</p>}
      <div className="relative flex items-end gap-2">
        <button
          type="button"
          onClick={() => setEmojiOpen((v) => !v)}
          className="btn-ghost h-10 px-3 text-lg"
          aria-label="Emoticon"
          disabled={disabled}
        >
          😊
        </button>
        <EmojiPicker
          open={emojiOpen}
          onClose={() => setEmojiOpen(false)}
          onPick={(emoji) => setValue((v) => v + emoji)}
        />
        <textarea
          rows={1}
          className="input max-h-32 flex-1 resize-none py-2.5"
          placeholder={placeholder ?? 'Scrivi un messaggio…'}
          value={value}
          maxLength={MAX_MESSAGE_LENGTH}
          disabled={disabled}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={onKeyDown}
        />
        <button
          type="button"
          onClick={submit}
          disabled={disabled || !value.trim()}
          className="btn-primary h-10"
        >
          Invia
        </button>
      </div>
    </div>
  )
}

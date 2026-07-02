import { useEffect, useRef } from 'react'
import { EMOJI_GROUPS } from '../lib/emoji'
import { useI18n } from '../lib/i18n'

interface EmojiPickerProps {
  open: boolean
  onClose: () => void
  onPick: (emoji: string) => void
}

export function EmojiPicker({ open, onClose, onPick }: EmojiPickerProps) {
  const ref = useRef<HTMLDivElement>(null)
  const { t } = useI18n()

  useEffect(() => {
    if (!open) return
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    window.addEventListener('mousedown', onClick)
    return () => window.removeEventListener('mousedown', onClick)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      ref={ref}
      className="card absolute bottom-12 left-0 z-30 max-h-64 w-64 overflow-y-auto p-2 shadow-xl"
    >
      {EMOJI_GROUPS.map((group) => (
        <div key={group.labelKey} className="mb-2">
          <p className="px-1 pb-1 text-xs font-semibold text-ink-400">{t(group.labelKey)}</p>
          <div className="grid grid-cols-8 gap-0.5">
            {group.emojis.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => onPick(emoji)}
                className="rounded-md p-1 text-xl hover:bg-ink-800"
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

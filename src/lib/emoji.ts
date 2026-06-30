// Set base di emoticon per il picker. Niente librerie esterne: emoji unicode.
export const EMOJI_GROUPS: { label: string; emojis: string[] }[] = [
  {
    label: 'Faccine',
    emojis: [
      '😀', '😁', '😂', '🤣', '😊', '😍', '😘', '😜', '🤔', '😎',
      '😏', '😅', '😇', '🙂', '😉', '😢', '😭', '😡', '😱', '🥳',
    ],
  },
  {
    label: 'Gesti',
    emojis: ['👍', '👎', '👏', '🙏', '👋', '🤝', '✌️', '🤙', '💪', '🫶'],
  },
  {
    label: 'Cuori & simboli',
    emojis: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🔥', '⭐', '✨', '💯'],
  },
  {
    label: 'Varie',
    emojis: ['🎵', '🎮', '⚽', '🍕', '☕', '🎉', '📷', '🌙', '☀️', '🌈'],
  },
]

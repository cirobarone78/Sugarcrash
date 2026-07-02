// Set base di emoticon per il picker. Niente librerie esterne: emoji unicode.
// `labelKey` è una chiave i18n tradotta nel componente EmojiPicker.
export const EMOJI_GROUPS: { labelKey: string; emojis: string[] }[] = [
  {
    labelKey: 'emoji.faces',
    emojis: [
      '😀', '😁', '😂', '🤣', '😊', '😍', '😘', '😜', '🤔', '😎',
      '😏', '😅', '😇', '🙂', '😉', '😢', '😭', '😡', '😱', '🥳',
    ],
  },
  {
    labelKey: 'emoji.gestures',
    emojis: ['👍', '👎', '👏', '🙏', '👋', '🤝', '✌️', '🤙', '💪', '🫶'],
  },
  {
    labelKey: 'emoji.hearts',
    emojis: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🔥', '⭐', '✨', '💯'],
  },
  {
    labelKey: 'emoji.misc',
    emojis: ['🎵', '🎮', '⚽', '🍕', '☕', '🎉', '📷', '🌙', '☀️', '🌈'],
  },
]

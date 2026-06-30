// Utility varie: sanitizzazione, formattazione tempo, id thread, ecc.

/**
 * Sanitizza un messaggio lato frontend.
 * - rimuove caratteri di controllo
 * - colla gli spazi multipli
 * - taglia alla lunghezza massima
 * NB: React esegue di suo l'escape del testo, quindi non c'è rischio XSS dal
 * rendering; questa funzione serve a normalizzare e limitare l'input.
 */
export const MAX_MESSAGE_LENGTH = 2000

export function sanitizeMessage(input: string): string {
  return input
    // rimuovi caratteri di controllo (mantiene \n e \t)
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    // newline multipli -> max 2
    .replace(/\n{3,}/g, '\n\n')
    .trimEnd()
    .slice(0, MAX_MESSAGE_LENGTH)
}

/** Valida un nickname: 3-24 caratteri, lettere/numeri/._- */
export function validateUsername(name: string): string | null {
  const trimmed = name.trim()
  if (trimmed.length < 3) return 'Il nickname deve avere almeno 3 caratteri.'
  if (trimmed.length > 24) return 'Il nickname può avere al massimo 24 caratteri.'
  if (!/^[a-zA-Z0-9._-]+$/.test(trimmed))
    return 'Usa solo lettere, numeri, punto, trattino o underscore.'
  return null
}

/** Coppia ordinata (a,b) per i thread privati: user_a è sempre l'id minore. */
export function orderedPair(id1: string, id2: string): [string, string] {
  return id1 < id2 ? [id1, id2] : [id2, id1]
}

/** Orario breve HH:MM */
export function formatTime(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })
}

/** Durata mm:ss da un numero di secondi */
export function formatDuration(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60)
  const s = totalSeconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

/** ID di sessione breve per watermark (prime 8 cifre dell'uuid). */
export function shortSessionId(sessionId: string): string {
  return sessionId.replace(/-/g, '').slice(0, 8).toUpperCase()
}

/** Iniziali per avatar fallback. */
export function initials(username: string): string {
  return username.slice(0, 2).toUpperCase()
}

/** Colore deterministico da stringa (per avatar fallback). */
export function colorFromString(str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash)
  }
  const hue = Math.abs(hash) % 360
  return `hsl(${hue} 60% 45%)`
}

/** Etichetta leggibile per uno stato utente. */
export const statusLabel: Record<string, string> = {
  online: 'Online',
  busy: 'Occupato',
  invisible: 'Invisibile',
}

export const statusColor: Record<string, string> = {
  online: '#22c55e',
  busy: '#f59e0b',
  invisible: '#6b6b85',
}

/** Parsing degli ICE server dalla variabile d'ambiente. */
export function getIceServers(): RTCIceServer[] {
  const raw = import.meta.env.VITE_ICE_SERVERS
  if (!raw) return [{ urls: 'stun:stun.l.google.com:19302' }]
  try {
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed)) return parsed as RTCIceServer[]
  } catch {
    // eslint-disable-next-line no-console
    console.warn('[RetroCam] VITE_ICE_SERVERS non è un JSON valido, uso STUN di default.')
  }
  return [{ urls: 'stun:stun.l.google.com:19302' }]
}

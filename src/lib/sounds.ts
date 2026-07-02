// Suono "nuovo messaggio" generato via WebAudio (nessun file binario da caricare).
// Attivabile/disattivabile dall'utente; la preferenza è in localStorage.

const STORAGE_KEY = 'retrocam.sound.enabled'

let audioCtx: AudioContext | null = null

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null
  const Ctor =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext
  if (!Ctor) return null
  if (!audioCtx) audioCtx = new Ctor()
  return audioCtx
}

export function isSoundEnabled(): boolean {
  return localStorage.getItem(STORAGE_KEY) !== 'false'
}

export function setSoundEnabled(enabled: boolean): void {
  localStorage.setItem(STORAGE_KEY, enabled ? 'true' : 'false')
}

/** Breve "blip" a due toni. */
export function playMessageSound(): void {
  if (!isSoundEnabled()) return
  const ctx = getCtx()
  if (!ctx) return
  // alcuni browser sospendono il contesto finché non c'è interazione
  if (ctx.state === 'suspended') void ctx.resume()

  const now = ctx.currentTime
  const gain = ctx.createGain()
  gain.gain.setValueAtTime(0.0001, now)
  gain.gain.exponentialRampToValueAtTime(0.18, now + 0.01)
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.25)
  gain.connect(ctx.destination)

  const osc = ctx.createOscillator()
  osc.type = 'sine'
  osc.frequency.setValueAtTime(660, now)
  osc.frequency.setValueAtTime(880, now + 0.08)
  osc.connect(gain)
  osc.start(now)
  osc.stop(now + 0.26)
}

/** Suono invito webcam (più "squillante"). */
export function playInviteSound(): void {
  if (!isSoundEnabled()) return
  const ctx = getCtx()
  if (!ctx) return
  if (ctx.state === 'suspended') void ctx.resume()
  const now = ctx.currentTime
  const gain = ctx.createGain()
  gain.gain.setValueAtTime(0.0001, now)
  gain.gain.exponentialRampToValueAtTime(0.2, now + 0.02)
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.5)
  gain.connect(ctx.destination)
  const osc = ctx.createOscillator()
  osc.type = 'triangle'
  osc.frequency.setValueAtTime(523, now)
  osc.frequency.setValueAtTime(659, now + 0.12)
  osc.frequency.setValueAtTime(784, now + 0.24)
  osc.connect(gain)
  osc.start(now)
  osc.stop(now + 0.52)
}

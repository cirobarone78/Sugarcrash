// Notifiche di sistema (Web Notification API) — SENZA backend né FCM.
//
// Mostrano un avviso di sistema per nuovi messaggi privati e inviti webcam
// QUANDO l'app è aperta ma in background (scheda non visibile / PWA minimizzata).
// Per la consegna ad app COMPLETAMENTE chiusa servirebbe Firebase Cloud
// Messaging + una Cloud Function (piano Blaze): vedi ROADMAP.
//
// La preferenza utente è in localStorage `retrocam.notify` (default: off finché
// non la si attiva dalle Impostazioni, che chiedono anche il permesso browser).

const NOTIFY_KEY = 'retrocam.notify'

export function notificationsSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window
}

/** L'utente ha attivato le notifiche nelle Impostazioni. */
export function notificationsEnabled(): boolean {
  return notificationsSupported() && localStorage.getItem(NOTIFY_KEY) === 'true'
}

export function setNotificationsEnabled(v: boolean): void {
  localStorage.setItem(NOTIFY_KEY, String(v))
}

export function notificationPermission(): NotificationPermission {
  return notificationsSupported() ? Notification.permission : 'denied'
}

/** Richiede il permesso browser (da un gesto utente). Ritorna true se concesso. */
export async function requestNotificationPermission(): Promise<boolean> {
  if (!notificationsSupported()) return false
  if (Notification.permission === 'granted') return true
  if (Notification.permission === 'denied') return false
  try {
    const res = await Notification.requestPermission()
    return res === 'granted'
  } catch {
    return false
  }
}

/**
 * Mostra una notifica di sistema SOLO se: attiva nelle preferenze, permesso
 * concesso e la scheda NON è visibile (altrimenti la si vede già a schermo).
 */
export function showSystemNotification(title: string, body: string, tag?: string): void {
  if (!notificationsEnabled()) return
  if (Notification.permission !== 'granted') return
  if (typeof document !== 'undefined' && document.visibilityState === 'visible') return
  try {
    const n = new Notification(title, { body, tag, icon: '/pwa-192x192.png' })
    n.onclick = () => {
      window.focus()
      n.close()
    }
  } catch {
    /* alcune piattaforme richiedono la notifica dal service worker: no-op */
  }
}

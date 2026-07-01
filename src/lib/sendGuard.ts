// Guardia anti-spam per l'invio messaggi: rate-limit + blocco del doppio invio
// dello stesso testo. Condivisa tra stanze pubbliche (useRoomMessages) e chat
// private (usePrivateThread), che prima duplicavano la stessa logica (C2).

// RATE_LIMIT era 5 nelle stanze e 6 nelle chat private: unificato a 6.
const RATE_LIMIT = 6
const RATE_WINDOW_MS = 7000

export interface SendGuard {
  /** Ritorna la chiave i18n dell'errore se l'invio va bloccato, altrimenti null. */
  check: (body?: string) => string | null
  /** Registra l'invio avvenuto (da chiamare dopo il successo della write). */
  record: (body?: string) => void
}

export function createSendGuard(): SendGuard {
  let sendTimes: number[] = []
  let lastBody = ''

  return {
    check(body) {
      if (body !== undefined && body === lastBody) return 'chat.dupMessage'
      const now = Date.now()
      sendTimes = sendTimes.filter((ts) => now - ts < RATE_WINDOW_MS)
      if (sendTimes.length >= RATE_LIMIT) return 'chat.tooFast'
      return null
    },
    record(body) {
      sendTimes.push(Date.now())
      if (body !== undefined) lastBody = body
    },
  }
}

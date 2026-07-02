// Condivisione/link: usa la Web Share API nativa quando disponibile
// (mobile/PWA), altrimenti copia negli appunti. Nessuna dipendenza.

export type ShareResult = 'shared' | 'copied' | 'failed'

/** Base URL dell'app (origine, senza query/hash). */
export function appBaseUrl(): string {
  if (typeof window === 'undefined') return ''
  return window.location.origin + window.location.pathname
}

/** Link condivisibile per una stanza pubblica (deep-link `?room=slug`). */
export function roomShareUrl(slug: string): string {
  return `${appBaseUrl()}?room=${encodeURIComponent(slug)}`
}

/**
 * Condivide (o copia) un URL. Ritorna 'shared' se ha usato il foglio nativo,
 * 'copied' se ha copiato negli appunti, 'failed' se nulla è riuscito.
 */
export async function shareOrCopy(url: string, title: string, text: string): Promise<ShareResult> {
  const nav = typeof navigator !== 'undefined' ? navigator : undefined
  if (nav?.share) {
    try {
      await nav.share({ title, text, url })
      return 'shared'
    } catch (err) {
      // L'utente ha annullato il foglio nativo: non è un errore da segnalare.
      if (err instanceof DOMException && err.name === 'AbortError') return 'shared'
      // altrimenti proviamo la copia
    }
  }
  try {
    await nav?.clipboard?.writeText(url)
    return 'copied'
  } catch {
    return 'failed'
  }
}

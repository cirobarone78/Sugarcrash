import { useEffect, useRef } from 'react'
import { usePrivateChat } from '../context/PrivateChatContext'
import { useWindows } from '../context/WindowsContext'
import { useAuth } from '../context/AuthContext'
import { playMessageSound } from '../lib/sounds'

/**
 * UNICA sorgente dei suoni per i messaggi privati.
 *
 * Invariante: esattamente UN "ding" per ogni nuovo messaggio in arrivo; MAI per
 * i propri messaggi; MAI quando la finestra del thread è aperta E il documento è
 * visibile (in quel caso è un normale messaggio "a schermo").
 *
 * Vive dentro <WindowsProvider> così può leggere sia i thread (usePrivateChat)
 * sia le finestre aperte (useWindows). `usePrivateThread` non suona più: qui
 * abbiamo un'unica fonte, quindi niente doppioni.
 *
 * Funziona su delta di `lastAt` per thread: al primo caricamento registra i
 * thread esistenti come baseline (nessun suono), poi suona quando un thread
 * aggiorna `lastAt` con un messaggio altrui. Residuo noto: se all'avvio non hai
 * ancora alcun thread, il primissimo messaggio che crea la tua prima
 * conversazione non emette suono (viene preso come baseline).
 */
export function PrivateNotifier() {
  const { threads } = usePrivateChat()
  const { chats, geom } = useWindows()
  const { profile } = useAuth()
  const myId = profile?.id ?? null

  const lastAtRef = useRef<Map<string, number>>(new Map())
  const warmedUp = useRef(false)

  useEffect(() => {
    const seen = lastAtRef.current

    // Baseline: al primo batch non vuoto registra tutto senza suonare.
    if (!warmedUp.current) {
      for (const th of threads) seen.set(th.thread.id, th.lastAt ?? 0)
      if (threads.length > 0) warmedUp.current = true
      return
    }

    const visible =
      typeof document === 'undefined' || document.visibilityState === 'visible'

    for (const th of threads) {
      const id = th.thread.id
      const lastAt = th.lastAt ?? 0
      const baseline = seen.get(id) ?? 0 // thread mai visto = nuova conversazione
      seen.set(id, lastAt)
      if (lastAt <= baseline) continue // nessun nuovo messaggio
      if (!th.lastSender || th.lastSender === myId) continue // messaggio mio
      // finestra aperta e non minimizzata + documento visibile → nessun suono
      const g = geom[id]
      const windowOpen = chats.some((c) => c.id === id) && !!g && !g.min
      if (windowOpen && visible) continue
      playMessageSound()
    }
  }, [threads, chats, geom, myId])

  return null
}

// Utility condivise per i thread di chat privata: id deterministico e
// creazione "ensure" (idempotente) del documento thread. Centralizza la
// logica duplicata in usePrivateThread/WindowsContext/WebcamContext (C2).
import { doc, setDoc } from 'firebase/firestore'
import { db } from './firebase'
import { orderedPair } from './utils'

/** Id deterministico del thread privato: `${a}__${b}` con a,b ordinati. */
export function privateThreadId(a: string, b: string): string {
  const [x, y] = orderedPair(a, b)
  return `${x}__${y}`
}

/**
 * Assicura l'esistenza del documento thread con i soli campi base
 * (user_a/user_b/participants), senza toccare created_at/reads: usa
 * `merge: true` per non sovrascrivere un thread già esistente.
 * NB: non adatta per WebcamContext.startBroadcast, che deve scrivere
 * created_at/reads SOLO alla prima creazione (vedi commento lì).
 */
export async function ensurePrivateThread(myId: string, otherId: string): Promise<void> {
  const [a, b] = orderedPair(myId, otherId)
  const tid = privateThreadId(myId, otherId)
  await setDoc(
    doc(db, 'privateThreads', tid),
    { user_a: a, user_b: b, participants: [a, b] },
    { merge: true },
  ).catch(() => undefined)
}

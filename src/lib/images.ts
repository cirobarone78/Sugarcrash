// E2 — helper per l'immagine originale salvata a parte dal messaggio.
//
// Il messaggio incorpora solo la miniatura (`image_url`). L'originale vive in un
// sottodoc write-once `<messaggio>/blob/full` con campo `value` (data-URL), e
// viene letto SOLO quando l'utente apre la lightbox. Così la lista messaggi non
// trasmette mai i data-URL pieni.

import {
  collection,
  doc,
  getDoc,
  setDoc,
  type DocumentReference,
} from 'firebase/firestore'
import { db } from './firebase'

/** Scrive l'originale nel sottodoc `blob/full` del messaggio (write-once). */
export async function writeFullImage(
  msgRef: DocumentReference,
  full: string,
): Promise<void> {
  await setDoc(doc(collection(msgRef, 'blob'), 'full'), { value: full })
}

/**
 * Carica l'originale dato il path del documento messaggio
 * (es. `privateThreads/<id>/messages/<id>`). Ritorna null se assente/errore.
 */
export async function loadFullImage(messageDocPath: string): Promise<string | null> {
  try {
    const snap = await getDoc(doc(db, `${messageDocPath}/blob/full`))
    const value = snap.data()?.value
    return typeof value === 'string' ? value : null
  } catch {
    return null
  }
}

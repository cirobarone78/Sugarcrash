import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore'
import { db } from '../lib/firebase'
import { useAuth } from '../context/AuthContext'
import { sanitizeMessage, tsToMillis } from '../lib/utils'
import { ensurePrivateThread } from '../lib/threads'
import { writeFullImage } from '../lib/images'
import { createSendGuard } from '../lib/sendGuard'
import { useI18n } from '../lib/i18n'
import type { PrivateMessage } from '../lib/types'

/** Messaggi + invio per un singolo thread privato (una finestra indipendente). */
export function usePrivateThread(threadId: string, otherId: string, focused: boolean) {
  const { profile } = useAuth()
  const { t } = useI18n()
  const [allMessages, setAllMessages] = useState<PrivateMessage[]>([])
  const [clearedAt, setClearedAt] = useState(0)
  const guard = useRef(createSendGuard()).current
  const myId = profile?.id ?? null

  // Ref sempre aggiornata a fuoco/visibilità così markRead resta stabile.
  const focusedRef = useRef(focused)
  focusedRef.current = focused
  // created_at dell'ultimo messaggio noto e ultimo valore già segnato "letto":
  // servono a evitare riscritture inutili (write amplification).
  const latestAtRef = useRef(0)
  const lastReadAtRef = useRef(0)

  // B3: segna "letto" SOLO se la finestra è a fuoco (non minimizzata) e la scheda
  // è visibile; salta la scrittura se abbiamo già segnato letto fino all'ultimo
  // messaggio. B6: scrive serverTimestamp() per coerenza con last_at.
  const markRead = useCallback(async () => {
    if (!myId) return
    if (!focusedRef.current) return
    if (typeof document !== 'undefined' && document.visibilityState !== 'visible') return
    const latest = latestAtRef.current
    if (latest === 0 || latest <= lastReadAtRef.current) return
    lastReadAtRef.current = latest
    await updateDoc(doc(db, 'privateThreads', threadId), {
      [`reads.${myId}`]: serverTimestamp(),
    }).catch(() => {
      // in caso di errore, riprova al prossimo trigger
      lastReadAtRef.current = 0
    })
  }, [myId, threadId])

  const ensureThread = useCallback(async () => {
    if (!myId) return
    await ensurePrivateThread(myId, otherId)
  }, [myId, otherId])

  useEffect(() => {
    latestAtRef.current = 0
    lastReadAtRef.current = 0
    const q = query(
      collection(db, 'privateThreads', threadId, 'messages'),
      orderBy('created_at'),
    )
    const unsub = onSnapshot(q, (snap) => {
      const mapped = snap.docs.map((d) => {
        const data = d.data()
        return {
          id: d.id,
          thread_id: threadId,
          sender_id: (data.sender_id as string) ?? '',
          body: (data.body as string) ?? '',
          image_url: (data.image_url as string | null) ?? null,
          has_full: Boolean(data.image_full),
          created_at: tsToMillis(data.created_at),
          read_at: null,
        }
      })
      setAllMessages(mapped)
      latestAtRef.current = mapped.length ? mapped[mapped.length - 1].created_at : 0
      // segna letto all'ingresso e ad ogni nuovo messaggio; markRead gestisce le
      // condizioni (a fuoco + visibile) e la deduplica. Il SUONO NON è più qui:
      // è gestito da <PrivateNotifier> (unica sorgente, vedi B2).
      void markRead()
    })
    return () => unsub()
  }, [threadId, myId, markRead])

  // Legge il timestamp di "eliminazione" per nascondere la vecchia cronologia.
  useEffect(() => {
    if (!myId) return
    const unsub = onSnapshot(doc(db, 'privateThreads', threadId), (snap) => {
      const c = snap.data()?.cleared as Record<string, unknown> | undefined
      setClearedAt(c?.[myId] != null ? tsToMillis(c[myId]) : 0)
    })
    return () => unsub()
  }, [threadId, myId])

  const messages = useMemo(
    () => (clearedAt ? allMessages.filter((m) => m.created_at > clearedAt) : allMessages),
    [allMessages, clearedAt],
  )

  useEffect(() => {
    if (focused) void markRead()
  }, [focused, messages.length, markRead])

  // Aprendo/mostrando la scheda mentre la chat è visibile, segna letto.
  useEffect(() => {
    if (typeof document === 'undefined') return
    const onVis = () => {
      if (document.visibilityState === 'visible') void markRead()
    }
    document.addEventListener('visibilitychange', onVis)
    return () => document.removeEventListener('visibilitychange', onVis)
  }, [markRead])

  const send = useCallback(
    async (raw: string): Promise<{ error: string | null }> => {
      if (!myId) return { error: t('common.error') }
      const body = sanitizeMessage(raw)
      if (!body.trim()) return { error: null }
      const guardError = guard.check(body)
      if (guardError) return { error: t(guardError) }
      try {
        await ensureThread()
        await addDoc(collection(db, 'privateThreads', threadId, 'messages'), {
          sender_id: myId,
          body,
          message_type: 'text',
          created_at: serverTimestamp(),
        })
        await updateDoc(doc(db, 'privateThreads', threadId), {
          last_body: body,
          last_at: serverTimestamp(),
          last_sender: myId,
          [`reads.${myId}`]: serverTimestamp(),
        })
      } catch {
        return { error: t('pm.cantSend') }
      }
      guard.record(body)
      return { error: null }
    },
    [myId, threadId, ensureThread, t, guard],
  )

  const sendImage = useCallback(
    async (thumb: string, full: string, hasFull: boolean): Promise<{ error: string | null }> => {
      if (!myId) return { error: t('common.error') }
      const guardError = guard.check()
      if (guardError) return { error: t(guardError) }
      try {
        await ensureThread()
        // E2: miniatura nel messaggio, originale nel sottodoc blob (on demand).
        const ref = await addDoc(collection(db, 'privateThreads', threadId, 'messages'), {
          sender_id: myId,
          body: '',
          message_type: 'image',
          image_url: thumb,
          image_full: hasFull,
          created_at: serverTimestamp(),
        })
        if (hasFull) await writeFullImage(ref, full).catch(() => undefined)
        await updateDoc(doc(db, 'privateThreads', threadId), {
          last_body: t('chat.photo'),
          last_at: serverTimestamp(),
          last_sender: myId,
          [`reads.${myId}`]: serverTimestamp(),
        })
      } catch {
        return { error: t('pm.cantSend') }
      }
      guard.record()
      return { error: null }
    },
    [myId, threadId, ensureThread, t, guard],
  )

  return { messages, send, sendImage }
}

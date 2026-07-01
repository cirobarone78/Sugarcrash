import { useCallback, useEffect, useRef, useState } from 'react'
import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore'
import { db } from '../lib/firebase'
import { useAuth } from '../context/AuthContext'
import { sanitizeMessage, orderedPair, tsToMillis } from '../lib/utils'
import { playMessageSound } from '../lib/sounds'
import { useI18n } from '../lib/i18n'
import type { PrivateMessage } from '../lib/types'

const RATE_LIMIT = 6
const RATE_WINDOW_MS = 7000

/** Messaggi + invio per un singolo thread privato (una finestra indipendente). */
export function usePrivateThread(threadId: string, otherId: string, focused: boolean) {
  const { profile } = useAuth()
  const { t } = useI18n()
  const [messages, setMessages] = useState<PrivateMessage[]>([])
  const initialized = useRef(false)
  const sendTimes = useRef<number[]>([])
  const lastBody = useRef('')
  const myId = profile?.id ?? null

  const markRead = useCallback(async () => {
    if (!myId) return
    await updateDoc(doc(db, 'privateThreads', threadId), {
      [`reads.${myId}`]: Date.now(),
    }).catch(() => undefined)
  }, [myId, threadId])

  const ensureThread = useCallback(async () => {
    if (!myId) return
    const [a, b] = orderedPair(myId, otherId)
    await setDoc(
      doc(db, 'privateThreads', threadId),
      { user_a: a, user_b: b, participants: [a, b] },
      { merge: true },
    ).catch(() => undefined)
  }, [myId, otherId, threadId])

  useEffect(() => {
    initialized.current = false
    const q = query(
      collection(db, 'privateThreads', threadId, 'messages'),
      orderBy('created_at'),
    )
    const unsub = onSnapshot(q, (snap) => {
      setMessages(
        snap.docs.map((d) => {
          const data = d.data()
          return {
            id: d.id,
            thread_id: threadId,
            sender_id: (data.sender_id as string) ?? '',
            body: (data.body as string) ?? '',
            image_url: (data.image_url as string | null) ?? null,
            created_at: tsToMillis(data.created_at),
            read_at: null,
          }
        }),
      )
      if (initialized.current) {
        for (const c of snap.docChanges()) {
          if (c.type === 'added' && c.doc.data().sender_id !== myId) {
            playMessageSound()
            void markRead()
          }
        }
      }
      initialized.current = true
    })
    void markRead()
    return () => unsub()
  }, [threadId, myId, markRead])

  useEffect(() => {
    if (focused) void markRead()
  }, [focused, messages.length, markRead])

  const send = useCallback(
    async (raw: string): Promise<{ error: string | null }> => {
      if (!myId) return { error: t('common.error') }
      const body = sanitizeMessage(raw)
      if (!body.trim()) return { error: null }
      if (body === lastBody.current) return { error: t('chat.dupMessage') }
      const now = Date.now()
      sendTimes.current = sendTimes.current.filter((ts) => now - ts < RATE_WINDOW_MS)
      if (sendTimes.current.length >= RATE_LIMIT) return { error: t('chat.tooFast') }
      try {
        await ensureThread()
        await addDoc(collection(db, 'privateThreads', threadId, 'messages'), {
          sender_id: myId,
          body,
          created_at: serverTimestamp(),
        })
        await updateDoc(doc(db, 'privateThreads', threadId), {
          last_body: body,
          last_at: serverTimestamp(),
          last_sender: myId,
          [`reads.${myId}`]: Date.now(),
        })
      } catch {
        return { error: t('pm.cantSend') }
      }
      sendTimes.current.push(now)
      lastBody.current = body
      return { error: null }
    },
    [myId, threadId, ensureThread, t],
  )

  const sendImage = useCallback(
    async (url: string): Promise<{ error: string | null }> => {
      if (!myId) return { error: t('common.error') }
      const now = Date.now()
      sendTimes.current = sendTimes.current.filter((ts) => now - ts < RATE_WINDOW_MS)
      if (sendTimes.current.length >= RATE_LIMIT) return { error: t('chat.tooFast') }
      try {
        await ensureThread()
        await addDoc(collection(db, 'privateThreads', threadId, 'messages'), {
          sender_id: myId,
          body: '',
          image_url: url,
          created_at: serverTimestamp(),
        })
        await updateDoc(doc(db, 'privateThreads', threadId), {
          last_body: t('chat.photo'),
          last_at: serverTimestamp(),
          last_sender: myId,
          [`reads.${myId}`]: Date.now(),
        })
      } catch {
        return { error: t('pm.cantSend') }
      }
      sendTimes.current.push(now)
      return { error: null }
    },
    [myId, threadId, ensureThread, t],
  )

  return { messages, send, sendImage }
}

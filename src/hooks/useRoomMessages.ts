import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  addDoc,
  collection,
  limitToLast,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
  where,
} from 'firebase/firestore'
import { db } from '../lib/firebase'
import { useAuth } from '../context/AuthContext'
import { sanitizeMessage, tsToMillis } from '../lib/utils'
import { playMessageSound } from '../lib/sounds'
import { createSendGuard } from '../lib/sendGuard'
import { useI18n } from '../lib/i18n'
import type { Message } from '../lib/types'

const PAGE_SIZE = 80
// I messaggi delle stanze scadono dopo 24 ore (le chat private 1:1 restano).
const RETENTION_MS = 24 * 60 * 60 * 1000
// Granularità con cui il "cutoff" della query avanza (E1): non serve
// rifare la subscription ad ogni render, basta ogni mezz'ora.
const CUTOFF_BUCKET_MS = 30 * 60 * 1000

// 'rooms' = stanze pubbliche statiche · 'privateRooms' = stanze private create dagli utenti
export type RoomCollection = 'rooms' | 'privateRooms'

function mapMessage(id: string, roomId: string, data: Record<string, unknown>): Message {
  return {
    id,
    room_id: roomId,
    user_id: (data.user_id as string | null) ?? null,
    body: (data.body as string) ?? '',
    message_type: (data.message_type as Message['message_type']) ?? 'text',
    image_url: (data.image_url as string | null) ?? null,
    created_at: tsToMillis(data.created_at),
    author_username: (data.author_username as string | null) ?? null,
    author_avatar_url: (data.author_avatar_url as string | null) ?? null,
    author_is_guest: Boolean(data.author_is_guest),
  }
}

export function useRoomMessages(roomId: string | null, coll: RoomCollection = 'rooms') {
  const { profile } = useAuth()
  const { t } = useI18n()
  const [allMessages, setAllMessages] = useState<Message[]>([])
  const [now, setNow] = useState(() => Date.now())
  const [loading, setLoading] = useState(true)
  const initialized = useRef(false)
  const guard = useRef(createSendGuard()).current
  const expiryTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // E1: bucket "grezzo" (avanza ogni 30 min) usato solo per far scorrere in
  // avanti il cutoff della query lato server senza risottoscrivere ad ogni
  // render (la query stessa filtra già `created_at`, vedi sotto).
  const [cutoffBucket, setCutoffBucket] = useState(() => Math.floor(Date.now() / CUTOFF_BUCKET_MS))
  useEffect(() => {
    const id = setInterval(
      () => setCutoffBucket(Math.floor(Date.now() / CUTOFF_BUCKET_MS)),
      CUTOFF_BUCKET_MS,
    )
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    if (!roomId) {
      setAllMessages([])
      return
    }
    setLoading(true)
    initialized.current = false
    const col = collection(db, coll, roomId, 'messages')
    // E1: il cutoff di retention è applicato lato server (where + orderBy sullo
    // stesso campo `created_at`: query composta valida, nessun indice composito
    // richiesto). I documenti già scaduti non vengono più letti/fatturati.
    const cutoff = Timestamp.fromMillis(Date.now() - RETENTION_MS)
    const q = query(
      col,
      where('created_at', '>', cutoff),
      orderBy('created_at'),
      limitToLast(PAGE_SIZE),
    )
    const unsub = onSnapshot(q, (snap) => {
      // I vecchi avvisi "è entrato/uscito" (message_type 'system') non vengono
      // più mostrati: la presenza è già nella lista utenti online.
      setAllMessages(
        snap.docs
          .map((d) => mapMessage(d.id, roomId, d.data()))
          .filter((m) => m.message_type !== 'system'),
      )
      setLoading(false)
      if (initialized.current) {
        for (const change of snap.docChanges()) {
          if (change.type === 'added') {
            const data = change.doc.data()
            if (data.message_type !== 'system' && data.user_id !== profile?.id) {
              playMessageSound()
            }
          }
        }
      }
      initialized.current = true
    })
    return () => unsub()
  }, [roomId, coll, profile?.id, cutoffBucket])

  // Mostra solo i messaggi degli ultimi RETENTION_MS: rete di sicurezza lato
  // client (la query server-side già esclude i più vecchi, vedi sopra).
  const messages = useMemo(
    () => allMessages.filter((m) => now - m.created_at < RETENTION_MS),
    [allMessages, now],
  )

  // E1: invece di un heartbeat fisso ogni 60s (che ri-renderizzava ogni stanza
  // montata anche da ferma), pianifica un singolo setTimeout sulla scadenza
  // reale del messaggio più vecchio visibile, riprogrammato quando `messages`
  // cambia (nuovo arrivo o scadenza già applicata).
  useEffect(() => {
    if (expiryTimer.current) {
      clearTimeout(expiryTimer.current)
      expiryTimer.current = null
    }
    if (messages.length === 0) return
    const oldest = messages[0]
    const delay = Math.max(0, oldest.created_at + RETENTION_MS - Date.now())
    expiryTimer.current = setTimeout(() => setNow(Date.now()), delay + 50)
    return () => {
      if (expiryTimer.current) {
        clearTimeout(expiryTimer.current)
        expiryTimer.current = null
      }
    }
  }, [messages])

  const sendMessage = useCallback(
    async (raw: string): Promise<{ error: string | null }> => {
      if (!roomId || !profile) return { error: t('common.error') }
      const body = sanitizeMessage(raw)
      if (!body.trim()) return { error: null }
      const guardError = guard.check(body)
      if (guardError) return { error: t(guardError) }

      try {
        await addDoc(collection(db, coll, roomId, 'messages'), {
          user_id: profile.id,
          body,
          message_type: 'text',
          author_username: profile.username,
          author_avatar_url: profile.avatar_url,
          author_is_guest: profile.is_guest,
          created_at: serverTimestamp(),
          expire_at: Timestamp.fromMillis(Date.now() + RETENTION_MS),
        })
      } catch {
        return { error: t('chat.sendFailed') }
      }
      guard.record(body)
      return { error: null }
    },
    [roomId, coll, profile, t, guard],
  )

  const sendImage = useCallback(
    async (url: string): Promise<{ error: string | null }> => {
      if (!roomId || !profile) return { error: t('common.error') }
      const guardError = guard.check()
      if (guardError) return { error: t(guardError) }
      try {
        await addDoc(collection(db, coll, roomId, 'messages'), {
          user_id: profile.id,
          body: '',
          message_type: 'image',
          image_url: url,
          author_username: profile.username,
          author_avatar_url: profile.avatar_url,
          author_is_guest: profile.is_guest,
          created_at: serverTimestamp(),
          expire_at: Timestamp.fromMillis(Date.now() + RETENTION_MS),
        })
      } catch {
        return { error: t('chat.sendFailed') }
      }
      guard.record()
      return { error: null }
    },
    [roomId, coll, profile, t, guard],
  )

  return { messages, loading, sendMessage, sendImage }
}

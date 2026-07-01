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
} from 'firebase/firestore'
import { db } from '../lib/firebase'
import { useAuth } from '../context/AuthContext'
import { sanitizeMessage, tsToMillis } from '../lib/utils'
import { playMessageSound } from '../lib/sounds'
import { useI18n } from '../lib/i18n'
import type { Message } from '../lib/types'

const PAGE_SIZE = 80
const RATE_LIMIT = 5
const RATE_WINDOW_MS = 7000
// I messaggi delle stanze scadono dopo 24 ore (le chat private 1:1 restano).
const RETENTION_MS = 24 * 60 * 60 * 1000

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

  // Ricontrolla periodicamente per far sparire i messaggi scaduti anche senza
  // nuovi arrivi.
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60_000)
    return () => clearInterval(id)
  }, [])
  const sendTimes = useRef<number[]>([])
  const lastBody = useRef<string>('')

  useEffect(() => {
    if (!roomId) {
      setAllMessages([])
      return
    }
    setLoading(true)
    initialized.current = false
    const col = collection(db, coll, roomId, 'messages')
    const q = query(col, orderBy('created_at'), limitToLast(PAGE_SIZE))
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
  }, [roomId, coll, profile?.id])

  // Mostra solo i messaggi degli ultimi RETENTION_MS: i più vecchi spariscono.
  const messages = useMemo(
    () => allMessages.filter((m) => now - m.created_at < RETENTION_MS),
    [allMessages, now],
  )

  const sendMessage = useCallback(
    async (raw: string): Promise<{ error: string | null }> => {
      if (!roomId || !profile) return { error: t('common.error') }
      const body = sanitizeMessage(raw)
      if (!body.trim()) return { error: null }
      if (body === lastBody.current) return { error: t('chat.dupMessage') }
      const now = Date.now()
      sendTimes.current = sendTimes.current.filter((ts) => now - ts < RATE_WINDOW_MS)
      if (sendTimes.current.length >= RATE_LIMIT) return { error: t('chat.tooFast') }

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
      sendTimes.current.push(now)
      lastBody.current = body
      return { error: null }
    },
    [roomId, coll, profile, t],
  )

  const sendImage = useCallback(
    async (url: string): Promise<{ error: string | null }> => {
      if (!roomId || !profile) return { error: t('common.error') }
      const now = Date.now()
      sendTimes.current = sendTimes.current.filter((ts) => now - ts < RATE_WINDOW_MS)
      if (sendTimes.current.length >= RATE_LIMIT) return { error: t('chat.tooFast') }
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
      sendTimes.current.push(now)
      return { error: null }
    },
    [roomId, coll, profile, t],
  )

  return { messages, loading, sendMessage, sendImage }
}

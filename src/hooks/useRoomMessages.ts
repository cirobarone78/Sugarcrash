import { useCallback, useEffect, useRef, useState } from 'react'
import {
  addDoc,
  collection,
  limitToLast,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
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
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const initialized = useRef(false)
  const sendTimes = useRef<number[]>([])
  const lastBody = useRef<string>('')

  useEffect(() => {
    if (!roomId) {
      setMessages([])
      return
    }
    setLoading(true)
    initialized.current = false
    const col = collection(db, coll, roomId, 'messages')
    const q = query(col, orderBy('created_at'), limitToLast(PAGE_SIZE))
    const unsub = onSnapshot(q, (snap) => {
      setMessages(snap.docs.map((d) => mapMessage(d.id, roomId, d.data())))
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
        })
      } catch {
        return { error: t('chat.sendFailed') }
      }
      sendTimes.current.push(now)
      return { error: null }
    },
    [roomId, coll, profile, t],
  )

  const sendSystem = useCallback(
    async (body: string) => {
      if (!roomId || !profile) return
      await addDoc(collection(db, coll, roomId, 'messages'), {
        user_id: profile.id,
        body,
        message_type: 'system',
        author_username: null,
        author_avatar_url: null,
        created_at: serverTimestamp(),
      })
    },
    [roomId, coll, profile],
  )

  return { messages, loading, sendMessage, sendImage, sendSystem }
}

import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { sanitizeMessage } from '../lib/utils'
import { playMessageSound } from '../lib/sounds'
import type { Message, Profile } from '../lib/types'

const PAGE_SIZE = 80
// Anti-spam: max 5 messaggi ogni 7 secondi + niente duplicati consecutivi.
const RATE_LIMIT = 5
const RATE_WINDOW_MS = 7000

type AuthorLite = Pick<Profile, 'id' | 'username' | 'avatar_url'>

export function useRoomMessages(roomId: string | null) {
  const { profile } = useAuth()
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const authorCache = useRef<Map<string, AuthorLite>>(new Map())
  const sendTimes = useRef<number[]>([])
  const lastBody = useRef<string>('')

  const fetchAuthors = useCallback(async (ids: string[]) => {
    const missing = ids.filter((id) => id && !authorCache.current.has(id))
    if (missing.length === 0) return
    const { data } = await supabase
      .from('profiles')
      .select('id, username, avatar_url')
      .in('id', missing)
    for (const p of (data as AuthorLite[]) ?? []) {
      authorCache.current.set(p.id, p)
    }
  }, [])

  // Caricamento iniziale
  useEffect(() => {
    if (!roomId) {
      setMessages([])
      return
    }
    let active = true
    setLoading(true)
    ;(async () => {
      const { data } = await supabase
        .from('messages')
        .select('*')
        .eq('room_id', roomId)
        .order('created_at', { ascending: false })
        .limit(PAGE_SIZE)
      const rows = ((data as Message[]) ?? []).reverse()
      await fetchAuthors(rows.map((m) => m.user_id ?? '').filter(Boolean))
      if (!active) return
      setMessages(
        rows.map((m) => ({
          ...m,
          author: m.user_id ? authorCache.current.get(m.user_id) ?? null : null,
        })),
      )
      setLoading(false)
    })()
    return () => {
      active = false
    }
  }, [roomId, fetchAuthors])

  // Realtime
  useEffect(() => {
    if (!roomId) return
    const channel = supabase
      .channel(`room-messages:${roomId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `room_id=eq.${roomId}`,
        },
        async (payload) => {
          const row = payload.new as Message
          if (row.user_id) await fetchAuthors([row.user_id])
          const enriched: Message = {
            ...row,
            author: row.user_id
              ? authorCache.current.get(row.user_id) ?? null
              : null,
          }
          setMessages((prev) => {
            if (prev.some((m) => m.id === enriched.id)) return prev
            return [...prev, enriched]
          })
          if (
            row.message_type === 'text' &&
            row.user_id !== profile?.id
          ) {
            playMessageSound()
          }
        },
      )
      .subscribe()
    return () => {
      void supabase.removeChannel(channel)
    }
  }, [roomId, profile?.id, fetchAuthors])

  const sendMessage = useCallback(
    async (raw: string): Promise<{ error: string | null }> => {
      if (!roomId || !profile) return { error: 'Non disponibile.' }
      const body = sanitizeMessage(raw)
      if (!body.trim()) return { error: null }

      // anti-spam: duplicato consecutivo
      if (body === lastBody.current)
        return { error: 'Hai appena inviato lo stesso messaggio.' }

      // anti-spam: rate limit
      const now = Date.now()
      sendTimes.current = sendTimes.current.filter((t) => now - t < RATE_WINDOW_MS)
      if (sendTimes.current.length >= RATE_LIMIT)
        return { error: 'Stai scrivendo troppo in fretta, rallenta un attimo.' }

      const { error } = await supabase.from('messages').insert({
        room_id: roomId,
        user_id: profile.id,
        body,
        message_type: 'text',
      })
      if (error) return { error: error.message }
      sendTimes.current.push(now)
      lastBody.current = body
      return { error: null }
    },
    [roomId, profile],
  )

  const sendSystem = useCallback(
    async (body: string) => {
      if (!roomId || !profile) return
      await supabase.from('messages').insert({
        room_id: roomId,
        user_id: profile.id,
        body,
        message_type: 'system',
      })
    },
    [roomId, profile],
  )

  return { messages, loading, sendMessage, sendSystem }
}

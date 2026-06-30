import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './AuthContext'
import { sanitizeMessage, orderedPair } from '../lib/utils'
import { playMessageSound } from '../lib/sounds'
import type { PrivateMessage, PrivateThread, Profile } from '../lib/types'

type AuthorLite = Pick<Profile, 'id' | 'username' | 'avatar_url' | 'status'>

export interface ThreadView {
  thread: PrivateThread
  other: AuthorLite
  lastBody: string | null
  lastAt: string | null
  unread: number
}

interface PrivateChatContextValue {
  threads: ThreadView[]
  totalUnread: number
  activeThreadId: string | null
  activeMessages: PrivateMessage[]
  drawerOpen: boolean
  setDrawerOpen: (open: boolean) => void
  openThreadWith: (userId: string) => Promise<void>
  openThread: (threadId: string) => void
  closeThread: () => void
  sendPrivate: (body: string) => Promise<{ error: string | null }>
}

const PrivateChatContext = createContext<PrivateChatContextValue | undefined>(undefined)

// anti-spam privati
const RATE_LIMIT = 6
const RATE_WINDOW_MS = 7000

export function PrivateChatProvider({ children }: { children: ReactNode }) {
  const { profile } = useAuth()
  const [threads, setThreads] = useState<ThreadView[]>([])
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null)
  const [messagesByThread, setMessagesByThread] = useState<Record<string, PrivateMessage[]>>({})
  const [drawerOpen, setDrawerOpen] = useState(false)
  const activeRef = useRef<string | null>(null)
  const sendTimes = useRef<number[]>([])
  const lastBody = useRef<string>('')

  const myId = profile?.id ?? null

  const loadThreads = useCallback(async () => {
    if (!myId) {
      setThreads([])
      return
    }
    const { data } = await supabase
      .from('private_threads')
      .select('*')
      .or(`user_a.eq.${myId},user_b.eq.${myId}`)
    const rows = (data as PrivateThread[]) ?? []
    if (rows.length === 0) {
      setThreads([])
      return
    }
    const otherIds = rows.map((t) => (t.user_a === myId ? t.user_b : t.user_a))
    const { data: profs } = await supabase
      .from('profiles')
      .select('id, username, avatar_url, status')
      .in('id', otherIds)
    const profMap = new Map<string, AuthorLite>(
      ((profs as AuthorLite[]) ?? []).map((p) => [p.id, p]),
    )
    // ultimo messaggio + unread per ogni thread
    const views: ThreadView[] = []
    for (const t of rows) {
      const otherId = t.user_a === myId ? t.user_b : t.user_a
      const { data: lastArr } = await supabase
        .from('private_messages')
        .select('*')
        .eq('thread_id', t.id)
        .order('created_at', { ascending: false })
        .limit(1)
      const last = (lastArr as PrivateMessage[])?.[0] ?? null
      const { count } = await supabase
        .from('private_messages')
        .select('*', { count: 'exact', head: true })
        .eq('thread_id', t.id)
        .is('read_at', null)
        .neq('sender_id', myId)
      views.push({
        thread: t,
        other: profMap.get(otherId) ?? {
          id: otherId,
          username: 'utente',
          avatar_url: null,
          status: 'online',
        },
        lastBody: last?.body ?? null,
        lastAt: last?.created_at ?? null,
        unread: count ?? 0,
      })
    }
    views.sort((a, b) => (b.lastAt ?? '').localeCompare(a.lastAt ?? ''))
    setThreads(views)
  }, [myId])

  useEffect(() => {
    void loadThreads()
  }, [loadThreads])

  const loadMessages = useCallback(async (threadId: string) => {
    const { data } = await supabase
      .from('private_messages')
      .select('*')
      .eq('thread_id', threadId)
      .order('created_at', { ascending: true })
      .limit(200)
    setMessagesByThread((prev) => ({ ...prev, [threadId]: (data as PrivateMessage[]) ?? [] }))
  }, [])

  const markRead = useCallback(
    async (threadId: string) => {
      if (!myId) return
      await supabase
        .from('private_messages')
        .update({ read_at: new Date().toISOString() })
        .eq('thread_id', threadId)
        .neq('sender_id', myId)
        .is('read_at', null)
      setThreads((prev) =>
        prev.map((t) => (t.thread.id === threadId ? { ...t, unread: 0 } : t)),
      )
    },
    [myId],
  )

  // Realtime su tutti i messaggi privati (RLS limita a quelli che posso vedere).
  useEffect(() => {
    if (!myId) return
    const channel = supabase
      .channel('private-messages')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'private_messages' },
        (payload) => {
          const row = payload.new as PrivateMessage
          setMessagesByThread((prev) => {
            const list = prev[row.thread_id]
            if (!list) return prev
            if (list.some((m) => m.id === row.id)) return prev
            return { ...prev, [row.thread_id]: [...list, row] }
          })
          const fromOther = row.sender_id !== myId
          if (fromOther) {
            if (activeRef.current === row.thread_id && drawerOpen) {
              void markRead(row.thread_id)
            } else {
              playMessageSound()
            }
          }
          // aggiorna anteprima/threads (e crea il thread se è nuovo)
          void loadThreads()
        },
      )
      .subscribe()
    return () => {
      void supabase.removeChannel(channel)
    }
  }, [myId, drawerOpen, loadThreads, markRead])

  const openThread = useCallback(
    (threadId: string) => {
      activeRef.current = threadId
      setActiveThreadId(threadId)
      setDrawerOpen(true)
      void loadMessages(threadId)
      void markRead(threadId)
    },
    [loadMessages, markRead],
  )

  const openThreadWith = useCallback(
    async (userId: string) => {
      if (!myId || userId === myId) return
      const [a, b] = orderedPair(myId, userId)
      const { data: existing } = await supabase
        .from('private_threads')
        .select('*')
        .eq('user_a', a)
        .eq('user_b', b)
        .maybeSingle()
      let thread = existing as PrivateThread | null
      if (!thread) {
        const { data: created } = await supabase
          .from('private_threads')
          .insert({ user_a: a, user_b: b })
          .select()
          .single()
        thread = created as PrivateThread
      }
      if (!thread) return
      await loadThreads()
      openThread(thread.id)
    },
    [myId, loadThreads, openThread],
  )

  const closeThread = useCallback(() => {
    activeRef.current = null
    setActiveThreadId(null)
  }, [])

  const sendPrivate = useCallback(
    async (raw: string): Promise<{ error: string | null }> => {
      if (!myId || !activeThreadId) return { error: 'Nessuna conversazione attiva.' }
      const body = sanitizeMessage(raw)
      if (!body.trim()) return { error: null }
      if (body === lastBody.current)
        return { error: 'Hai appena inviato lo stesso messaggio.' }
      const now = Date.now()
      sendTimes.current = sendTimes.current.filter((t) => now - t < RATE_WINDOW_MS)
      if (sendTimes.current.length >= RATE_LIMIT)
        return { error: 'Stai scrivendo troppo in fretta, rallenta un attimo.' }

      const { error } = await supabase.from('private_messages').insert({
        thread_id: activeThreadId,
        sender_id: myId,
        body,
      })
      if (error) {
        // RLS blocca l'invio se l'altro utente ti ha bloccato.
        if (error.code === '42501' || error.message.includes('policy'))
          return { error: 'Non puoi inviare messaggi a questo utente.' }
        return { error: error.message }
      }
      sendTimes.current.push(now)
      lastBody.current = body
      return { error: null }
    },
    [myId, activeThreadId],
  )

  const totalUnread = useMemo(
    () => threads.reduce((sum, t) => sum + t.unread, 0),
    [threads],
  )

  const activeMessages = activeThreadId ? messagesByThread[activeThreadId] ?? [] : []

  const value = useMemo<PrivateChatContextValue>(
    () => ({
      threads,
      totalUnread,
      activeThreadId,
      activeMessages,
      drawerOpen,
      setDrawerOpen,
      openThreadWith,
      openThread,
      closeThread,
      sendPrivate,
    }),
    [threads, totalUnread, activeThreadId, activeMessages, drawerOpen, openThreadWith, openThread, closeThread, sendPrivate],
  )

  return <PrivateChatContext.Provider value={value}>{children}</PrivateChatContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function usePrivateChat(): PrivateChatContextValue {
  const ctx = useContext(PrivateChatContext)
  if (!ctx) throw new Error('usePrivateChat deve essere usato dentro <PrivateChatProvider>')
  return ctx
}

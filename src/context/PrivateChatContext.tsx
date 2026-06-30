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
import {
  addDoc,
  collection,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore'
import { db } from '../lib/firebase'
import { useAuth } from './AuthContext'
import { usePresence } from './PresenceContext'
import { sanitizeMessage, orderedPair, tsToMillis } from '../lib/utils'
import { playMessageSound } from '../lib/sounds'
import { useI18n } from '../lib/i18n'
import type { PrivateMessage, UserStatus } from '../lib/types'

interface OtherLite {
  id: string
  username: string
  avatar_url: string | null
  status: UserStatus
}

export interface ThreadView {
  thread: { id: string; user_a: string; user_b: string }
  other: OtherLite
  lastBody: string | null
  lastAt: number | null
  unread: number
}

interface ThreadDoc {
  user_a: string
  user_b: string
  participants: string[]
  last_body?: string | null
  last_at?: unknown
  last_sender?: string | null
  reads?: Record<string, number>
}

interface PrivateChatContextValue {
  threads: ThreadView[]
  totalUnread: number
  activeThreadId: string | null
  activeMessages: PrivateMessage[]
  drawerOpen: boolean
  setDrawerOpen: (open: boolean) => void
  /** Partecipante della conversazione attiva (fallback finché i thread si sincronizzano). */
  activeOther: OtherLite | null
  openThreadWith: (userId: string) => Promise<void>
  openThread: (threadId: string) => void
  closeThread: () => void
  sendPrivate: (body: string) => Promise<{ error: string | null }>
  sendPrivateImage: (url: string) => Promise<{ error: string | null }>
}

const PrivateChatContext = createContext<PrivateChatContextValue | undefined>(undefined)

const RATE_LIMIT = 6
const RATE_WINDOW_MS = 7000

function threadId(a: string, b: string): string {
  const [x, y] = orderedPair(a, b)
  return `${x}__${y}`
}

export function PrivateChatProvider({ children }: { children: ReactNode }) {
  const { profile } = useAuth()
  const { onlineUsers } = usePresence()
  const { t } = useI18n()
  const [threads, setThreads] = useState<ThreadView[]>([])
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null)
  const [activeOther, setActiveOther] = useState<OtherLite | null>(null)
  const [activeMessages, setActiveMessages] = useState<PrivateMessage[]>([])
  const [drawerOpen, setDrawerOpen] = useState(false)
  const activeRef = useRef<string | null>(null)
  const drawerRef = useRef(false)
  const sendTimes = useRef<number[]>([])
  const lastBodyRef = useRef<string>('')
  const profileCache = useRef<Map<string, OtherLite>>(new Map())
  const lastSeenAt = useRef<Map<string, number>>(new Map())

  const myId = profile?.id ?? null

  useEffect(() => {
    drawerRef.current = drawerOpen
  }, [drawerOpen])

  const fetchOther = useCallback(async (id: string): Promise<OtherLite> => {
    const cached = profileCache.current.get(id)
    if (cached) return cached
    const snap = await getDoc(doc(db, 'profiles', id))
    const d = snap.data()
    const lite: OtherLite = {
      id,
      username: (d?.username as string) ?? 'utente',
      avatar_url: (d?.avatar_url as string | null) ?? null,
      status: (d?.status as UserStatus) ?? 'online',
    }
    profileCache.current.set(id, lite)
    return lite
  }, [])

  const markRead = useCallback(
    async (tid: string) => {
      if (!myId) return
      try {
        await updateDoc(doc(db, 'privateThreads', tid), { [`reads.${myId}`]: Date.now() })
      } catch {
        /* il thread potrebbe non esistere ancora */
      }
    },
    [myId],
  )

  // Listener sui thread dell'utente
  useEffect(() => {
    if (!myId) {
      setThreads([])
      return
    }
    const q = query(
      collection(db, 'privateThreads'),
      where('participants', 'array-contains', myId),
    )
    const unsub = onSnapshot(q, async (snap) => {
      const views: ThreadView[] = []
      for (const docSnap of snap.docs) {
        const t = docSnap.data() as ThreadDoc
        const otherId = t.user_a === myId ? t.user_b : t.user_a
        const other = await fetchOther(otherId)
        const lastAt = t.last_at ? tsToMillis(t.last_at) : null
        const myRead = t.reads?.[myId] ?? 0
        const unread =
          t.last_sender && t.last_sender !== myId && lastAt && myRead < lastAt ? 1 : 0
        views.push({
          thread: { id: docSnap.id, user_a: t.user_a, user_b: t.user_b },
          other,
          lastBody: t.last_body ?? null,
          lastAt,
          unread,
        })

        // suono per nuovi messaggi in arrivo (thread non attivo o drawer chiuso)
        const prev = lastSeenAt.current.get(docSnap.id) ?? 0
        if (lastAt && lastAt > prev) {
          lastSeenAt.current.set(docSnap.id, lastAt)
          const isFromOther = t.last_sender && t.last_sender !== myId
          const isActiveOpen = activeRef.current === docSnap.id && drawerRef.current
          if (isFromOther && !isActiveOpen && prev !== 0) playMessageSound()
        }
      }
      views.sort((a, b) => (b.lastAt ?? 0) - (a.lastAt ?? 0))
      setThreads(views)
    })
    return () => unsub()
  }, [myId, fetchOther])

  // Listener sui messaggi del thread attivo
  useEffect(() => {
    if (!activeThreadId) {
      setActiveMessages([])
      return
    }
    const q = query(
      collection(db, 'privateThreads', activeThreadId, 'messages'),
      orderBy('created_at'),
    )
    const unsub = onSnapshot(q, (snap) => {
      setActiveMessages(
        snap.docs.map((d) => {
          const data = d.data()
          return {
            id: d.id,
            thread_id: activeThreadId,
            sender_id: (data.sender_id as string) ?? '',
            body: (data.body as string) ?? '',
            image_url: (data.image_url as string | null) ?? null,
            created_at: tsToMillis(data.created_at),
            read_at: data.read_at ? tsToMillis(data.read_at) : null,
          }
        }),
      )
      if (drawerRef.current) void markRead(activeThreadId)
    })
    return () => unsub()
  }, [activeThreadId, markRead])

  const openThread = useCallback(
    (tid: string) => {
      activeRef.current = tid
      setActiveThreadId(tid)
      // imposta subito l'interlocutore dal thread già noto (se presente)
      const known = threads.find((th) => th.thread.id === tid)
      if (known) setActiveOther(known.other)
      setDrawerOpen(true)
      void markRead(tid)
    },
    [markRead, threads],
  )

  const openThreadWith = useCallback(
    async (userId: string) => {
      if (!myId || userId === myId) return
      const [a, b] = orderedPair(myId, userId)
      const tid = threadId(a, b)

      // 1) APRI SUBITO la finestra: interlocutore dalla presence o dalla cache
      //    (nessuna lettura Firestore bloccante nel percorso critico)
      const pres = onlineUsers.find((u) => u.user_id === userId)
      const other: OtherLite =
        (pres && {
          id: pres.user_id,
          username: pres.username,
          avatar_url: pres.avatar_url,
          status: pres.status,
        }) ||
        profileCache.current.get(userId) || {
          id: userId,
          username: 'user',
          avatar_url: null,
          status: 'online',
        }
      profileCache.current.set(userId, other)
      setActiveOther(other)
      activeRef.current = tid
      setActiveThreadId(tid)
      setDrawerOpen(true)

      // 2) in BACKGROUND: crea il thread se manca, segna letto, rifinisci i dati
      ;(async () => {
        try {
          const ref = doc(db, 'privateThreads', tid)
          const snap = await getDoc(ref)
          if (!snap.exists()) {
            await setDoc(ref, {
              user_a: a,
              user_b: b,
              participants: [a, b],
              created_at: serverTimestamp(),
              reads: {},
            })
          }
          void markRead(tid)
        } catch (err) {
          // eslint-disable-next-line no-console
          console.error('[RetroCam] creazione thread privato fallita', err)
        }
        if (!pres) fetchOther(userId).then(setActiveOther)
      })()
    },
    [myId, onlineUsers, fetchOther, markRead],
  )

  const closeThread = useCallback(() => {
    activeRef.current = null
    setActiveThreadId(null)
    setActiveOther(null)
  }, [])

  const sendPrivate = useCallback(
    async (raw: string): Promise<{ error: string | null }> => {
      if (!myId || !activeThreadId) return { error: t('pm.noActive') }
      const body = sanitizeMessage(raw)
      if (!body.trim()) return { error: null }
      if (body === lastBodyRef.current) return { error: t('chat.dupMessage') }
      const now = Date.now()
      sendTimes.current = sendTimes.current.filter((ts) => now - ts < RATE_WINDOW_MS)
      if (sendTimes.current.length >= RATE_LIMIT) return { error: t('chat.tooFast') }

      try {
        // assicura che il thread esista (potrebbe non essere stato creato
        // se un tentativo precedente era stato rifiutato dalle regole)
        if (activeOther) {
          const [a, b] = orderedPair(myId, activeOther.id)
          await setDoc(
            doc(db, 'privateThreads', activeThreadId),
            { user_a: a, user_b: b, participants: [a, b] },
            { merge: true },
          )
        }
        await addDoc(collection(db, 'privateThreads', activeThreadId, 'messages'), {
          sender_id: myId,
          body,
          created_at: serverTimestamp(),
          read_at: null,
        })
        await updateDoc(doc(db, 'privateThreads', activeThreadId), {
          last_body: body,
          last_at: serverTimestamp(),
          last_sender: myId,
          [`reads.${myId}`]: Date.now(),
        })
      } catch {
        // Le Security Rules bloccano l'invio se l'altro utente ti ha bloccato.
        return { error: t('pm.cantSend') }
      }
      sendTimes.current.push(now)
      lastBodyRef.current = body
      return { error: null }
    },
    [myId, activeThreadId, activeOther, t],
  )

  const sendPrivateImage = useCallback(
    async (url: string): Promise<{ error: string | null }> => {
      if (!myId || !activeThreadId) return { error: t('pm.noActive') }
      const now = Date.now()
      sendTimes.current = sendTimes.current.filter((ts) => now - ts < RATE_WINDOW_MS)
      if (sendTimes.current.length >= RATE_LIMIT) return { error: t('chat.tooFast') }
      try {
        if (activeOther) {
          const [a, b] = orderedPair(myId, activeOther.id)
          await setDoc(
            doc(db, 'privateThreads', activeThreadId),
            { user_a: a, user_b: b, participants: [a, b] },
            { merge: true },
          )
        }
        await addDoc(collection(db, 'privateThreads', activeThreadId, 'messages'), {
          sender_id: myId,
          body: '',
          image_url: url,
          created_at: serverTimestamp(),
          read_at: null,
        })
        await updateDoc(doc(db, 'privateThreads', activeThreadId), {
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
    [myId, activeThreadId, activeOther, t],
  )

  const totalUnread = useMemo(
    () => threads.reduce((sum, t) => sum + t.unread, 0),
    [threads],
  )

  const value = useMemo<PrivateChatContextValue>(
    () => ({
      threads,
      totalUnread,
      activeThreadId,
      activeOther,
      activeMessages,
      drawerOpen,
      setDrawerOpen,
      openThreadWith,
      openThread,
      closeThread,
      sendPrivate,
      sendPrivateImage,
    }),
    [threads, totalUnread, activeThreadId, activeOther, activeMessages, drawerOpen, openThreadWith, openThread, closeThread, sendPrivate, sendPrivateImage],
  )

  return <PrivateChatContext.Provider value={value}>{children}</PrivateChatContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function usePrivateChat(): PrivateChatContextValue {
  const ctx = useContext(PrivateChatContext)
  if (!ctx) throw new Error('usePrivateChat deve essere usato dentro <PrivateChatProvider>')
  return ctx
}

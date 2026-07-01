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
  collection,
  doc,
  getDoc,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore'
import { db } from '../lib/firebase'
import { useAuth } from './AuthContext'
import { tsToMillis } from '../lib/utils'
import type { UserStatus } from '../lib/types'

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
  /** Autore dell'ultimo messaggio (serve al notifier per distinguere i propri). */
  lastSender: string | null
  unread: number
}

interface ThreadDoc {
  user_a: string
  user_b: string
  participants: string[]
  last_body?: string | null
  last_at?: unknown
  last_sender?: string | null
  reads?: Record<string, unknown>
  cleared?: Record<string, unknown>
}

interface PrivateChatContextValue {
  threads: ThreadView[]
  totalUnread: number
  /** Elimina la conversazione dal proprio elenco (soft-delete per-utente). */
  clearThread: (threadId: string) => Promise<void>
}

const PrivateChatContext = createContext<PrivateChatContextValue | undefined>(undefined)

export function PrivateChatProvider({ children }: { children: ReactNode }) {
  const { profile } = useAuth()
  const [threads, setThreads] = useState<ThreadView[]>([])
  const profileCache = useRef<Map<string, OtherLite>>(new Map())

  const myId = profile?.id ?? null

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
    const unsub = onSnapshot(q, (snap) => {
      // E4: prima si raccolgono gli id da risolvere, poi si scaricano i
      // profili mancanti IN PARALLELO (Promise.all) invece che in serie
      // (un await per thread), e infine si costruiscono le view in modo
      // sincrono dalla cache già popolata.
      void (async () => {
        interface Pending {
          docSnap: (typeof snap.docs)[number]
          t: ThreadDoc
          otherId: string
          lastAt: number
        }
        const pending: Pending[] = []
        const otherIds = new Set<string>()
        for (const docSnap of snap.docs) {
          const t = docSnap.data() as ThreadDoc
          const otherId = t.user_a === myId ? t.user_b : t.user_a
          const lastAt = t.last_at ? tsToMillis(t.last_at) : null
          // reads/cleared sono serverTimestamp() (vedi B6): convertili in ms.
          const cleared = t.cleared?.[myId] != null ? tsToMillis(t.cleared[myId]) : 0
          // Conversazione eliminata dall'utente: nascondila finché non arriva
          // un nuovo messaggio più recente della cancellazione.
          if (!lastAt || lastAt <= cleared) continue
          pending.push({ docSnap, t, otherId, lastAt })
          otherIds.add(otherId)
        }

        const missing = [...otherIds].filter((id) => !profileCache.current.has(id))
        if (missing.length > 0) {
          await Promise.all(missing.map((id) => fetchOther(id)))
        }

        const views: ThreadView[] = pending.map(({ docSnap, t, otherId, lastAt }) => {
          // Già risolto sopra (cache o Promise.all): sempre presente qui.
          const other = profileCache.current.get(otherId)!
          const myRead = t.reads?.[myId] != null ? tsToMillis(t.reads[myId]) : 0
          const unread =
            t.last_sender && t.last_sender !== myId && lastAt && myRead < lastAt ? 1 : 0
          return {
            thread: { id: docSnap.id, user_a: t.user_a, user_b: t.user_b },
            other,
            lastBody: t.last_body ?? null,
            lastAt,
            lastSender: t.last_sender ?? null,
            unread,
          }
        })
        views.sort((a, b) => (b.lastAt ?? 0) - (a.lastAt ?? 0))
        setThreads(views)
      })()
    })
    return () => unsub()
  }, [myId, fetchOther])

  const clearThread = useCallback(
    async (tid: string) => {
      if (!myId) return
      // serverTimestamp() per coerenza con last_at (evita clock skew, vedi B6).
      await updateDoc(doc(db, 'privateThreads', tid), {
        [`cleared.${myId}`]: serverTimestamp(),
      }).catch(() => undefined)
    },
    [myId],
  )

  const totalUnread = useMemo(
    () => threads.reduce((sum, t) => sum + t.unread, 0),
    [threads],
  )

  const value = useMemo<PrivateChatContextValue>(
    () => ({ threads, totalUnread, clearThread }),
    [threads, totalUnread, clearThread],
  )

  return <PrivateChatContext.Provider value={value}>{children}</PrivateChatContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function usePrivateChat(): PrivateChatContextValue {
  const ctx = useContext(PrivateChatContext)
  if (!ctx) throw new Error('usePrivateChat deve essere usato dentro <PrivateChatProvider>')
  return ctx
}

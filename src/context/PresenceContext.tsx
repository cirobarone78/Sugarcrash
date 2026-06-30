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
  ref,
  set,
  remove,
  onValue,
  onDisconnect,
} from 'firebase/database'
import { rtdb } from '../lib/firebase'
import { useAuth } from './AuthContext'
import type { PresenceUser } from '../lib/types'

interface PresenceContextValue {
  onlineUsers: PresenceUser[]
  roomCounts: Record<string, number>
  setCurrentRoom: (slug: string | null) => void
}

const PresenceContext = createContext<PresenceContextValue | undefined>(undefined)

export function PresenceProvider({ children }: { children: ReactNode }) {
  const { user, profile } = useAuth()
  const [onlineUsers, setOnlineUsers] = useState<PresenceUser[]>([])
  const roomRef = useRef<string | null>(null)
  const connectedRef = useRef(false)
  const uid = user?.uid ?? null

  const pushPresence = useCallback(async () => {
    if (!uid || !profile || !connectedRef.current) return
    const myRef = ref(rtdb, `status/${uid}`)
    // Gli utenti invisibili non vengono pubblicati: restano online (ricevono i
    // messaggi) ma non compaiono nella lista né nei conteggi.
    if (profile.status === 'invisible') {
      await remove(myRef)
      return
    }
    onDisconnect(myRef).remove()
    const payload: PresenceUser = {
      user_id: uid,
      username: profile.username,
      avatar_url: profile.avatar_url,
      status: profile.status,
      room: roomRef.current,
      online_at: Date.now(),
    }
    await set(myRef, payload)
  }, [uid, profile])

  // Ascolta lo stato di connessione e l'elenco presenze.
  useEffect(() => {
    if (!uid) {
      setOnlineUsers([])
      return
    }

    const connRef = ref(rtdb, '.info/connected')
    const unsubConn = onValue(connRef, (snap) => {
      connectedRef.current = snap.val() === true
      if (connectedRef.current) void pushPresence()
    })

    const statusRef = ref(rtdb, 'status')
    const unsubStatus = onValue(statusRef, (snap) => {
      const val = (snap.val() as Record<string, PresenceUser> | null) ?? {}
      setOnlineUsers(Object.values(val))
    })

    return () => {
      unsubConn()
      unsubStatus()
      void remove(ref(rtdb, `status/${uid}`))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid])

  // Aggiorna la presenza quando cambia il profilo (status/username/avatar).
  useEffect(() => {
    void pushPresence()
  }, [pushPresence])

  const setCurrentRoom = useCallback(
    (slug: string | null) => {
      roomRef.current = slug
      void pushPresence()
    },
    [pushPresence],
  )

  const roomCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const u of onlineUsers) {
      if (u.room) counts[u.room] = (counts[u.room] ?? 0) + 1
    }
    return counts
  }, [onlineUsers])

  const value = useMemo<PresenceContextValue>(
    () => ({ onlineUsers, roomCounts, setCurrentRoom }),
    [onlineUsers, roomCounts, setCurrentRoom],
  )

  return <PresenceContext.Provider value={value}>{children}</PresenceContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function usePresence(): PresenceContextValue {
  const ctx = useContext(PresenceContext)
  if (!ctx) throw new Error('usePresence deve essere usato dentro <PresenceProvider>')
  return ctx
}

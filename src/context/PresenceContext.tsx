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
import type { RealtimeChannel } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { useAuth } from './AuthContext'
import type { UserStatus } from '../lib/types'

export interface PresenceUser {
  user_id: string
  username: string
  avatar_url: string | null
  status: UserStatus
  room: string | null
  online_at: string
}

interface PresenceContextValue {
  /** Tutti gli utenti attualmente online (esclusi gli invisibili). */
  onlineUsers: PresenceUser[]
  /** Conteggio per slug di stanza. */
  roomCounts: Record<string, number>
  /** Imposta in quale stanza ci si trova (null = lobby). */
  setCurrentRoom: (slug: string | null) => void
}

const PresenceContext = createContext<PresenceContextValue | undefined>(undefined)

export function PresenceProvider({ children }: { children: ReactNode }) {
  const { session, profile } = useAuth()
  const [onlineUsers, setOnlineUsers] = useState<PresenceUser[]>([])
  const channelRef = useRef<RealtimeChannel | null>(null)
  const roomRef = useRef<string | null>(null)

  const buildPayload = useCallback((): PresenceUser | null => {
    if (!session || !profile) return null
    return {
      user_id: profile.id,
      username: profile.username,
      avatar_url: profile.avatar_url,
      status: profile.status,
      room: roomRef.current,
      online_at: new Date().toISOString(),
    }
  }, [session, profile])

  const pushPresence = useCallback(async () => {
    const channel = channelRef.current
    if (!channel) return
    const payload = buildPayload()
    // Gli utenti invisibili non vengono tracciati: restano online (ricevono i
    // messaggi) ma non compaiono nella lista né nei conteggi.
    if (!payload || payload.status === 'invisible') {
      await channel.untrack()
      return
    }
    await channel.track(payload)
  }, [buildPayload])

  useEffect(() => {
    if (!session || !profile) {
      setOnlineUsers([])
      return
    }

    const channel = supabase.channel('global-presence', {
      config: { presence: { key: profile.id } },
    })
    channelRef.current = channel

    channel.on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState<PresenceUser>()
      const users: PresenceUser[] = []
      for (const key of Object.keys(state)) {
        const metas = state[key]
        if (metas && metas.length > 0) users.push(metas[0])
      }
      setOnlineUsers(users)
    })

    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') void pushPresence()
    })

    return () => {
      void supabase.removeChannel(channel)
      channelRef.current = null
    }
    // ricreiamo il canale solo al cambio di utente
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user.id])

  // Quando cambia il profilo (status/username/avatar) aggiorniamo la presenza.
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

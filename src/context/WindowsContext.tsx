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
import { useAuth } from './AuthContext'
import { privateThreadId } from '../lib/threads'
import type { UserStatus } from '../lib/types'

export interface WinOther {
  id: string
  username: string
  avatar_url: string | null
  status: UserStatus
}

export interface WinGeom {
  x: number
  y: number
  z: number
  w: number
  h: number
  min: boolean
}

export interface ChatWin {
  /** id finestra = id thread */
  id: string
  other: WinOther
}

interface WindowsContextValue {
  chats: ChatWin[]
  geom: Record<string, WinGeom>
  messagesOpen: boolean
  openChat: (other: WinOther) => void
  closeChat: (id: string) => void
  openMessages: () => void
  closeMessages: () => void
  focus: (id: string) => void
  move: (id: string, x: number, y: number) => void
  resize: (id: string, w: number, h: number) => void
  setMin: (id: string, min: boolean) => void
  /** Assicura l'esistenza di una geometria (per finestre esterne: webcam). */
  ensureGeom: (id: string, defaults: Omit<WinGeom, 'z' | 'min'>) => void
  removeGeom: (id: string) => void
}

const WindowsContext = createContext<WindowsContextValue | undefined>(undefined)

// Posizione a cascata: parte in basso a destra e sfalsa a ogni nuova finestra.
function cascade(index: number, w: number, h: number): { x: number; y: number } {
  const vw = typeof window !== 'undefined' ? window.innerWidth : 1200
  const vh = typeof window !== 'undefined' ? window.innerHeight : 800
  const off = (index % 6) * 30
  const baseX = Math.max(12, vw - w - 32 - off)
  const baseY = Math.max(64, vh - h - 96 - off)
  return { x: baseX, y: baseY }
}

export function WindowsProvider({ children }: { children: ReactNode }) {
  const { profile } = useAuth()
  const myId = profile?.id ?? null
  const [chats, setChats] = useState<ChatWin[]>([])
  const [geom, setGeom] = useState<Record<string, WinGeom>>({})
  const [messagesOpen, setMessagesOpen] = useState(false)
  const zTop = useRef(10)
  const created = useRef(0)

  const bumpZ = useCallback(() => {
    zTop.current += 1
    return zTop.current
  }, [])

  const focus = useCallback(
    (id: string) => {
      setGeom((g) => (g[id] ? { ...g, [id]: { ...g[id], z: bumpZ() } } : g))
    },
    [bumpZ],
  )

  const move = useCallback((id: string, x: number, y: number) => {
    setGeom((g) => (g[id] ? { ...g, [id]: { ...g[id], x, y } } : g))
  }, [])

  const resize = useCallback((id: string, w: number, h: number) => {
    setGeom((g) => (g[id] ? { ...g, [id]: { ...g[id], w, h } } : g))
  }, [])

  const setMin = useCallback(
    (id: string, min: boolean) => {
      setGeom((g) => (g[id] ? { ...g, [id]: { ...g[id], min, z: min ? g[id].z : bumpZ() } } : g))
    },
    [bumpZ],
  )

  const ensureGeom = useCallback(
    (id: string, defaults: Omit<WinGeom, 'z' | 'min'>) => {
      setGeom((g) => {
        if (g[id]) return g
        return { ...g, [id]: { ...defaults, z: bumpZ(), min: false } }
      })
    },
    [bumpZ],
  )

  const removeGeom = useCallback((id: string) => {
    setGeom((g) => {
      if (!g[id]) return g
      const next = { ...g }
      delete next[id]
      return next
    })
  }, [])

  // B8: al ridimensionamento/rotazione del viewport ri-vincola ogni finestra
  // dentro lo schermo, così non resta "incagliata" fuori vista (stessi limiti
  // usati durante il drag in FloatingWindow).
  useEffect(() => {
    if (typeof window === 'undefined') return
    const onResize = () => {
      setGeom((g) => {
        const maxX = Math.max(0, window.innerWidth - 60)
        const maxY = Math.max(0, window.innerHeight - 48)
        let changed = false
        const next: Record<string, WinGeom> = {}
        for (const [id, w] of Object.entries(g)) {
          const nx = Math.min(Math.max(0, w.x), maxX)
          const ny = Math.min(Math.max(0, w.y), maxY)
          if (nx !== w.x || ny !== w.y) {
            changed = true
            next[id] = { ...w, x: nx, y: ny }
          } else {
            next[id] = w
          }
        }
        return changed ? next : g
      })
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const openChat = useCallback(
    (other: WinOther) => {
      if (!myId || other.id === myId) return
      const id = privateThreadId(myId, other.id)
      const w = 340
      const h = 460
      setChats((prev) => (prev.some((c) => c.id === id) ? prev : [...prev, { id, other }]))
      setGeom((g) => {
        if (g[id]) return { ...g, [id]: { ...g[id], min: false, z: bumpZ() } }
        const pos = cascade(created.current++, w, h)
        return { ...g, [id]: { ...pos, w, h, z: bumpZ(), min: false } }
      })
    },
    [myId, bumpZ],
  )

  const closeChat = useCallback(
    (id: string) => {
      setChats((prev) => prev.filter((c) => c.id !== id))
      removeGeom(id)
    },
    [removeGeom],
  )

  const openMessages = useCallback(() => {
    const id = 'messages'
    const w = 300
    const h = 440
    setMessagesOpen(true)
    setGeom((g) => {
      if (g[id]) return { ...g, [id]: { ...g[id], min: false, z: bumpZ() } }
      const vw = typeof window !== 'undefined' ? window.innerWidth : 1200
      const x = Math.max(12, vw - w - 24)
      return { ...g, [id]: { x, y: 72, w, h, z: bumpZ(), min: false } }
    })
  }, [bumpZ])

  const closeMessages = useCallback(() => {
    setMessagesOpen(false)
    removeGeom('messages')
  }, [removeGeom])

  const value = useMemo<WindowsContextValue>(
    () => ({
      chats,
      geom,
      messagesOpen,
      openChat,
      closeChat,
      openMessages,
      closeMessages,
      focus,
      move,
      resize,
      setMin,
      ensureGeom,
      removeGeom,
    }),
    [chats, geom, messagesOpen, openChat, closeChat, openMessages, closeMessages, focus, move, resize, setMin, ensureGeom, removeGeom],
  )

  return <WindowsContext.Provider value={value}>{children}</WindowsContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useWindows(): WindowsContextValue {
  const ctx = useContext(WindowsContext)
  if (!ctx) throw new Error('useWindows deve essere usato dentro <WindowsProvider>')
  return ctx
}

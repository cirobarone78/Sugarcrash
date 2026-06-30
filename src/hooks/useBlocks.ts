import {
  createContext,
  createElement,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { collection, deleteDoc, doc, onSnapshot, serverTimestamp, setDoc } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { useAuth } from '../context/AuthContext'

interface BlocksContextValue {
  blockedIds: Set<string>
  isBlocked: (userId: string) => boolean
  block: (userId: string) => Promise<void>
  unblock: (userId: string) => Promise<void>
}

const BlocksContext = createContext<BlocksContextValue | undefined>(undefined)

export function BlocksProvider({ children }: { children: ReactNode }) {
  const { profile } = useAuth()
  const [blockedIds, setBlockedIds] = useState<Set<string>>(new Set())
  const myId = profile?.id ?? null

  // Blocchi: subcollection blocks/{myId}/list/{blockedId}
  useEffect(() => {
    if (!myId) {
      setBlockedIds(new Set())
      return
    }
    const listRef = collection(db, 'blocks', myId, 'list')
    const unsub = onSnapshot(listRef, (snap) => {
      setBlockedIds(new Set(snap.docs.map((d) => d.id)))
    })
    return () => unsub()
  }, [myId])

  const block = useCallback(
    async (userId: string) => {
      if (!myId || userId === myId) return
      await setDoc(doc(db, 'blocks', myId, 'list', userId), {
        created_at: serverTimestamp(),
      })
      await setDoc(doc(collection(db, 'moderation_events')), {
        user_id: myId,
        event_type: 'block_user',
        metadata: { blocked_id: userId },
        created_at: serverTimestamp(),
      })
    },
    [myId],
  )

  const unblock = useCallback(
    async (userId: string) => {
      if (!myId) return
      await deleteDoc(doc(db, 'blocks', myId, 'list', userId))
    },
    [myId],
  )

  const isBlocked = useCallback((userId: string) => blockedIds.has(userId), [blockedIds])

  const value = useMemo<BlocksContextValue>(
    () => ({ blockedIds, isBlocked, block, unblock }),
    [blockedIds, isBlocked, block, unblock],
  )

  return createElement(BlocksContext.Provider, { value }, children)
}

// eslint-disable-next-line react-refresh/only-export-components
export function useBlocks(): BlocksContextValue {
  const ctx = useContext(BlocksContext)
  if (!ctx) throw new Error('useBlocks deve essere usato dentro <BlocksProvider>')
  return ctx
}

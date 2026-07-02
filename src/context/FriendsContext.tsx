import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore'
import { db } from '../lib/firebase'
import { useAuth } from './AuthContext'
import { orderedPair } from '../lib/utils'

// Amici/preferiti con accettazione RECIPROCA.
//
// Un unico documento per coppia: `friendships/{pairId}` con
//   pairId = `${a}__${b}` (uid ordinati, come i thread privati),
//   participants: [a, b], requester: chi ha inviato, status: 'pending'|'accepted'.
// Il richiedente crea `pending`; SOLO l'altro può portarlo ad `accepted`
// (regole). Entrambi possono eliminare (rifiuta / annulla / rimuovi amico).

export type FriendState = 'none' | 'friends' | 'incoming' | 'outgoing'

interface FriendEntry {
  otherId: string
  requester: string
  status: 'pending' | 'accepted'
}

interface FriendsContextValue {
  friends: string[]
  incoming: string[]
  outgoing: string[]
  stateFor: (userId: string) => FriendState
  isFriend: (userId: string) => boolean
  addFriend: (userId: string) => Promise<void>
  acceptFriend: (userId: string) => Promise<void>
  removeFriend: (userId: string) => Promise<void>
}

const FriendsContext = createContext<FriendsContextValue | undefined>(undefined)

function pairId(a: string, b: string): string {
  const [x, y] = orderedPair(a, b)
  return `${x}__${y}`
}

export function FriendsProvider({ children }: { children: ReactNode }) {
  const { profile } = useAuth()
  const myId = profile?.id ?? null
  const [entries, setEntries] = useState<FriendEntry[]>([])

  useEffect(() => {
    if (!myId) {
      setEntries([])
      return
    }
    const q = query(
      collection(db, 'friendships'),
      where('participants', 'array-contains', myId),
    )
    const unsub = onSnapshot(
      q,
      (snap) => {
        const list: FriendEntry[] = []
        for (const d of snap.docs) {
          const data = d.data()
          const parts = (data.participants as string[]) ?? []
          const otherId = parts.find((p) => p !== myId)
          if (!otherId) continue
          list.push({
            otherId,
            requester: (data.requester as string) ?? '',
            status: (data.status as 'pending' | 'accepted') ?? 'pending',
          })
        }
        setEntries(list)
      },
      () => setEntries([]),
    )
    return () => unsub()
  }, [myId])

  const friends = useMemo(
    () => entries.filter((e) => e.status === 'accepted').map((e) => e.otherId),
    [entries],
  )
  const incoming = useMemo(
    () =>
      entries
        .filter((e) => e.status === 'pending' && e.requester === e.otherId)
        .map((e) => e.otherId),
    [entries],
  )
  const outgoing = useMemo(
    () =>
      entries
        .filter((e) => e.status === 'pending' && e.requester === myId)
        .map((e) => e.otherId),
    [entries, myId],
  )

  const stateFor = useCallback(
    (userId: string): FriendState => {
      if (friends.includes(userId)) return 'friends'
      if (incoming.includes(userId)) return 'incoming'
      if (outgoing.includes(userId)) return 'outgoing'
      return 'none'
    },
    [friends, incoming, outgoing],
  )

  const isFriend = useCallback((userId: string) => friends.includes(userId), [friends])

  // Invia richiesta; se l'altro mi aveva già richiesto, accetto direttamente.
  const addFriend = useCallback(
    async (userId: string) => {
      if (!myId || userId === myId) return
      const ref = doc(db, 'friendships', pairId(myId, userId))
      const snap = await getDoc(ref).catch(() => null)
      if (snap?.exists()) {
        const d = snap.data()
        if (d.status === 'pending' && d.requester !== myId) {
          await updateDoc(ref, { status: 'accepted', accepted_at: serverTimestamp() }).catch(
            () => undefined,
          )
        }
        return
      }
      const [a, b] = orderedPair(myId, userId)
      await setDoc(ref, {
        participants: [a, b],
        requester: myId,
        status: 'pending',
        created_at: serverTimestamp(),
        accepted_at: null,
      }).catch(() => undefined)
    },
    [myId],
  )

  const acceptFriend = useCallback(
    async (userId: string) => {
      if (!myId) return
      await updateDoc(doc(db, 'friendships', pairId(myId, userId)), {
        status: 'accepted',
        accepted_at: serverTimestamp(),
      }).catch(() => undefined)
    },
    [myId],
  )

  // Rifiuta richiesta / annulla la mia / rimuovi amico: elimina il documento.
  const removeFriend = useCallback(
    async (userId: string) => {
      if (!myId) return
      await deleteDoc(doc(db, 'friendships', pairId(myId, userId))).catch(() => undefined)
    },
    [myId],
  )

  const value = useMemo<FriendsContextValue>(
    () => ({ friends, incoming, outgoing, stateFor, isFriend, addFriend, acceptFriend, removeFriend }),
    [friends, incoming, outgoing, stateFor, isFriend, addFriend, acceptFriend, removeFriend],
  )

  return <FriendsContext.Provider value={value}>{children}</FriendsContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useFriends(): FriendsContextValue {
  const ctx = useContext(FriendsContext)
  if (!ctx) throw new Error('useFriends deve essere usato dentro <FriendsProvider>')
  return ctx
}

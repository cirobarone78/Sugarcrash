import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore'
import { db } from '../lib/firebase'
import { useAuth } from '../context/AuthContext'
import { sha256Hex } from '../lib/hash'
import { tsToMillis } from '../lib/utils'
import type { Room } from '../lib/types'

const UNLOCKED_KEY = 'retrocam.unlockedRooms'

function loadUnlocked(): Set<string> {
  try {
    const raw = localStorage.getItem(UNLOCKED_KEY)
    return new Set(raw ? (JSON.parse(raw) as string[]) : [])
  } catch {
    return new Set()
  }
}

function mapRoom(id: string, d: Record<string, unknown>): Room & { created_at: number } {
  return {
    id,
    slug: id,
    name: (d.name as string) ?? 'Room',
    description: null,
    topic: (d.topic as string | null) ?? null,
    is_public: false,
    kind: 'private',
    allow_images: d.allow_images !== false,
    owner_id: (d.owner_id as string) ?? '',
    owner_username: (d.owner_username as string) ?? '',
    created_at: tsToMillis(d.created_at),
  }
}

export function usePrivateRooms() {
  const { profile } = useAuth()
  const [rooms, setRooms] = useState<Room[]>([])
  const [unlocked, setUnlocked] = useState<Set<string>>(() => loadUnlocked())
  const myId = profile?.id ?? null

  useEffect(() => {
    const q = query(collection(db, 'privateRooms'), orderBy('created_at', 'desc'))
    const unsub = onSnapshot(
      q,
      (snap) => setRooms(snap.docs.map((d) => mapRoom(d.id, d.data()))),
      () => setRooms([]),
    )
    return () => unsub()
  }, [])

  const persistUnlocked = useCallback((next: Set<string>) => {
    setUnlocked(new Set(next))
    localStorage.setItem(UNLOCKED_KEY, JSON.stringify(Array.from(next)))
  }, [])

  const isUnlocked = useCallback(
    (room: Room) => room.owner_id === myId || unlocked.has(room.id),
    [unlocked, myId],
  )

  /** Crea una stanza privata; restituisce la stanza o un errorKey. */
  const createRoom = useCallback(
    async (name: string, password: string): Promise<{ room?: Room; errorKey?: string }> => {
      if (!profile) return { errorKey: 'common.error' }
      const cleanName = name.trim()
      if (cleanName.length < 2) return { errorKey: 'rooms.nameTooShort' }
      if (password.length < 3) return { errorKey: 'rooms.pwdTooShort' }
      const pwd_hash = await sha256Hex(password)
      try {
        const finalName = cleanName.slice(0, 40)
        const ref = await addDoc(collection(db, 'privateRooms'), {
          name: finalName,
          topic: null,
          owner_id: profile.id,
          owner_username: profile.username,
          pwd_hash,
          allow_images: true,
          created_at: serverTimestamp(),
        })
        // il proprietario è automaticamente membro
        await setDoc(doc(db, 'privateRooms', ref.id, 'members', profile.id), {
          pwd_hash,
          joined_at: serverTimestamp(),
        })
        const next = new Set(unlocked)
        next.add(ref.id)
        persistUnlocked(next)
        const room: Room = {
          id: ref.id,
          slug: ref.id,
          name: finalName,
          description: null,
          topic: null,
          is_public: false,
          kind: 'private',
          allow_images: true,
          owner_id: profile.id,
          owner_username: profile.username,
        }
        return { room }
      } catch {
        return { errorKey: 'rooms.createFailed' }
      }
    },
    [profile, unlocked, persistUnlocked],
  )

  /** Entra in una stanza privata fornendo la password. */
  const joinRoom = useCallback(
    async (roomId: string, password: string): Promise<{ errorKey?: string }> => {
      if (!profile) return { errorKey: 'common.error' }
      const pwd_hash = await sha256Hex(password)
      try {
        // la regola consente la membership solo se l'hash coincide con quello
        // della stanza → password sbagliata = permesso negato
        await setDoc(doc(db, 'privateRooms', roomId, 'members', profile.id), {
          pwd_hash,
          joined_at: serverTimestamp(),
        })
        const next = new Set(unlocked)
        next.add(roomId)
        persistUnlocked(next)
        return {}
      } catch {
        return { errorKey: 'rooms.wrongPassword' }
      }
    },
    [profile, unlocked, persistUnlocked],
  )

  return useMemo(
    () => ({ rooms, isUnlocked, createRoom, joinRoom }),
    [rooms, isUnlocked, createRoom, joinRoom],
  )
}

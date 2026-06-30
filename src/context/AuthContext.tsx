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
  onAuthStateChanged,
  signOut as firebaseSignOut,
  type User,
} from 'firebase/auth'
import {
  doc,
  onSnapshot,
  updateDoc,
  runTransaction,
  serverTimestamp,
} from 'firebase/firestore'
import { auth, db } from '../lib/firebase'
import { tsToMillis } from '../lib/utils'
import type { Profile, UserStatus } from '../lib/types'

interface AuthContextValue {
  user: User | null
  profile: Profile | null
  loading: boolean
  needsProfileSetup: boolean
  refreshProfile: () => Promise<void>
  updateProfile: (patch: Partial<Profile>) => Promise<{ error: string | null }>
  setStatus: (status: UserStatus) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

const PROVISIONAL_RE = /^user_[0-9a-z]{6,}$/i

function mapProfile(id: string, data: Record<string, unknown>): Profile {
  return {
    id,
    username: (data.username as string) ?? '',
    username_lower: data.username_lower as string | undefined,
    avatar_url: (data.avatar_url as string | null) ?? null,
    status: (data.status as UserStatus) ?? 'online',
    is_invisible: Boolean(data.is_invisible),
    created_at: tsToMillis(data.created_at),
    updated_at: tsToMillis(data.updated_at),
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const profileUnsub = useRef<(() => void) | null>(null)

  // Garantisce l'esistenza del doc profilo (username provvisorio al 1° accesso).
  const ensureProfile = useCallback(async (u: User) => {
    const ref = doc(db, 'profiles', u.uid)
    const provisional = 'user_' + u.uid.replace(/[^a-z0-9]/gi, '').slice(0, 10).toLowerCase()
    await runTransaction(db, async (tx) => {
      const snap = await tx.get(ref)
      if (!snap.exists()) {
        tx.set(ref, {
          username: provisional,
          username_lower: provisional,
          avatar_url: null,
          status: 'online',
          is_invisible: false,
          created_at: serverTimestamp(),
          updated_at: serverTimestamp(),
        })
      }
    }).catch(() => undefined)
  }, [])

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      // chiudi eventuale listener profilo precedente
      profileUnsub.current?.()
      profileUnsub.current = null
      setUser(u)

      if (!u) {
        setProfile(null)
        setLoading(false)
        return
      }

      await ensureProfile(u)
      const ref = doc(db, 'profiles', u.uid)
      profileUnsub.current = onSnapshot(ref, (snap) => {
        setProfile(snap.exists() ? mapProfile(snap.id, snap.data()) : null)
        setLoading(false)
      })
    })
    return () => {
      unsub()
      profileUnsub.current?.()
    }
  }, [ensureProfile])

  const refreshProfile = useCallback(async () => {
    // con onSnapshot il profilo è già live: no-op mantenuto per compatibilità.
  }, [])

  const updateProfile = useCallback(
    async (patch: Partial<Profile>): Promise<{ error: string | null }> => {
      if (!user) return { error: 'Non autenticato.' }
      const ref = doc(db, 'profiles', user.uid)

      // Cambio username → transazione per garantire l'unicità.
      if (patch.username !== undefined) {
        const newName = patch.username.trim()
        const lower = newName.toLowerCase()
        try {
          await runTransaction(db, async (tx) => {
            const unameRef = doc(db, 'usernames', lower)
            const unameSnap = await tx.get(unameRef)
            if (unameSnap.exists() && unameSnap.data().uid !== user.uid) {
              throw new Error('USERNAME_TAKEN')
            }
            const profSnap = await tx.get(ref)
            const oldLower = profSnap.data()?.username_lower as string | undefined
            if (oldLower && oldLower !== lower) {
              tx.delete(doc(db, 'usernames', oldLower))
            }
            tx.set(unameRef, { uid: user.uid })
            tx.set(
              ref,
              {
                username: newName,
                username_lower: lower,
                avatar_url: patch.avatar_url ?? profSnap.data()?.avatar_url ?? null,
                updated_at: serverTimestamp(),
              },
              { merge: true },
            )
          })
        } catch (err) {
          if (err instanceof Error && err.message === 'USERNAME_TAKEN')
            return { error: 'Questo nickname è già in uso. Scegline un altro.' }
          return { error: 'Impossibile aggiornare il profilo.' }
        }
        return { error: null }
      }

      // Altri aggiornamenti (avatar, status, ...)
      const data: Record<string, unknown> = { updated_at: serverTimestamp() }
      if (patch.avatar_url !== undefined) data.avatar_url = patch.avatar_url
      if (patch.status !== undefined) data.status = patch.status
      if (patch.is_invisible !== undefined) data.is_invisible = patch.is_invisible
      try {
        await updateDoc(ref, data)
      } catch {
        return { error: 'Impossibile aggiornare il profilo.' }
      }
      return { error: null }
    },
    [user],
  )

  const setStatus = useCallback(
    async (status: UserStatus) => {
      await updateProfile({ status, is_invisible: status === 'invisible' })
    },
    [updateProfile],
  )

  const signOut = useCallback(async () => {
    await firebaseSignOut(auth)
    setProfile(null)
  }, [])

  const needsProfileSetup = useMemo(() => {
    if (!profile) return false
    return PROVISIONAL_RE.test(profile.username)
  }, [profile])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      profile,
      loading,
      needsProfileSetup,
      refreshProfile,
      updateProfile,
      setStatus,
      signOut,
    }),
    [user, profile, loading, needsProfileSetup, refreshProfile, updateProfile, setStatus, signOut],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth deve essere usato dentro <AuthProvider>')
  return ctx
}

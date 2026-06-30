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
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import type { Profile, UserStatus } from '../lib/types'

interface AuthContextValue {
  session: Session | null
  profile: Profile | null
  loading: boolean
  /** true finché l'utente non ha scelto un nickname definitivo */
  needsProfileSetup: boolean
  refreshProfile: () => Promise<void>
  updateProfile: (patch: Partial<Profile>) => Promise<{ error: string | null }>
  setStatus: (status: UserStatus) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

// Lo username provvisorio creato dal trigger SQL ha la forma user_<12hex>.
const PROVISIONAL_RE = /^user_[0-9a-f]{12}$/

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const userIdRef = useRef<string | null>(null)

  const loadProfile = useCallback(async (userId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle()
    setProfile((data as Profile) ?? null)
  }, [])

  const refreshProfile = useCallback(async () => {
    if (userIdRef.current) await loadProfile(userIdRef.current)
  }, [loadProfile])

  useEffect(() => {
    let active = true

    supabase.auth.getSession().then(async ({ data }) => {
      if (!active) return
      setSession(data.session)
      userIdRef.current = data.session?.user.id ?? null
      if (data.session) await loadProfile(data.session.user.id)
      setLoading(false)
    })

    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession)
      userIdRef.current = newSession?.user.id ?? null
      if (newSession) {
        void loadProfile(newSession.user.id)
      } else {
        setProfile(null)
      }
    })

    return () => {
      active = false
      sub.subscription.unsubscribe()
    }
  }, [loadProfile])

  const updateProfile = useCallback(
    async (patch: Partial<Profile>): Promise<{ error: string | null }> => {
      if (!userIdRef.current) return { error: 'Non autenticato.' }
      const { error } = await supabase
        .from('profiles')
        .update(patch)
        .eq('id', userIdRef.current)
      if (error) {
        if (error.code === '23505')
          return { error: 'Questo nickname è già in uso. Scegline un altro.' }
        return { error: error.message }
      }
      await refreshProfile()
      return { error: null }
    },
    [refreshProfile],
  )

  const setStatus = useCallback(
    async (status: UserStatus) => {
      await updateProfile({ status, is_invisible: status === 'invisible' })
    },
    [updateProfile],
  )

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
    setProfile(null)
  }, [])

  const needsProfileSetup = useMemo(() => {
    if (!profile) return false
    return PROVISIONAL_RE.test(profile.username)
  }, [profile])

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      profile,
      loading,
      needsProfileSetup,
      refreshProfile,
      updateProfile,
      setStatus,
      signOut,
    }),
    [session, profile, loading, needsProfileSetup, refreshProfile, updateProfile, setStatus, signOut],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth deve essere usato dentro <AuthProvider>')
  return ctx
}

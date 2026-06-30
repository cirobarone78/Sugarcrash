import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { createElement } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import type { BlockedUser } from '../lib/types'

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

  const reload = useCallback(async () => {
    if (!profile) {
      setBlockedIds(new Set())
      return
    }
    const { data } = await supabase
      .from('blocked_users')
      .select('blocked_id')
      .eq('blocker_id', profile.id)
    setBlockedIds(new Set(((data as Pick<BlockedUser, 'blocked_id'>[]) ?? []).map((r) => r.blocked_id)))
  }, [profile])

  useEffect(() => {
    void reload()
  }, [reload])

  const block = useCallback(
    async (userId: string) => {
      if (!profile || userId === profile.id) return
      await supabase
        .from('blocked_users')
        .insert({ blocker_id: profile.id, blocked_id: userId })
      await supabase.from('moderation_events').insert({
        user_id: profile.id,
        event_type: 'block_user',
        metadata: { blocked_id: userId },
      })
      setBlockedIds((prev) => new Set(prev).add(userId))
    },
    [profile],
  )

  const unblock = useCallback(
    async (userId: string) => {
      if (!profile) return
      await supabase
        .from('blocked_users')
        .delete()
        .eq('blocker_id', profile.id)
        .eq('blocked_id', userId)
      setBlockedIds((prev) => {
        const next = new Set(prev)
        next.delete(userId)
        return next
      })
    },
    [profile],
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

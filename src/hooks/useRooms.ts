import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Room } from '../lib/types'

/** Carica l'elenco delle stanze pubbliche. */
export function useRooms() {
  const [rooms, setRooms] = useState<Room[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    supabase
      .from('rooms')
      .select('*')
      .eq('is_public', true)
      .order('created_at', { ascending: true })
      .then(({ data }) => {
        if (!active) return
        setRooms((data as Room[]) ?? [])
        setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  return { rooms, loading }
}

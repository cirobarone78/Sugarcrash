import { useMemo } from 'react'
import { localizeRooms } from '../lib/rooms'
import { useI18n } from '../lib/i18n'
import type { Room } from '../lib/types'

/** Elenco delle stanze pubbliche (config statica, localizzata). */
export function useRooms(): { rooms: Room[]; loading: boolean } {
  const { lang } = useI18n()
  const rooms = useMemo(() => localizeRooms(lang), [lang])
  return { rooms, loading: false }
}

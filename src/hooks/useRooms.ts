import { ROOMS } from '../lib/rooms'
import type { Room } from '../lib/types'

/** Elenco delle stanze pubbliche (config statica). */
export function useRooms(): { rooms: Room[]; loading: boolean } {
  return { rooms: ROOMS, loading: false }
}

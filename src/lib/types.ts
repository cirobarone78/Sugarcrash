// Tipi condivisi dell'applicazione, allineati allo schema SQL.

export type UserStatus = 'online' | 'busy' | 'invisible'

export interface Profile {
  id: string
  username: string
  avatar_url: string | null
  status: UserStatus
  is_invisible: boolean
  created_at: string
  updated_at: string
}

export interface Room {
  id: string
  name: string
  slug: string
  description: string | null
  topic: string | null
  is_public: boolean
  created_at: string
}

export type MessageType = 'text' | 'system'

export interface Message {
  id: string
  room_id: string
  user_id: string | null
  body: string
  message_type: MessageType
  created_at: string
  // arricchito lato client
  author?: Pick<Profile, 'id' | 'username' | 'avatar_url'> | null
}

export interface PrivateThread {
  id: string
  user_a: string
  user_b: string
  created_at: string
}

export interface PrivateMessage {
  id: string
  thread_id: string
  sender_id: string
  body: string
  created_at: string
  read_at: string | null
}

export interface BlockedUser {
  id: string
  blocker_id: string
  blocked_id: string
  created_at: string
}

export type WebcamStatus =
  | 'pending'
  | 'accepted'
  | 'declined'
  | 'ended'
  | 'cancelled'

export interface WebcamSession {
  id: string
  thread_id: string
  broadcaster_id: string
  viewer_id: string
  audio_enabled: boolean
  status: WebcamStatus
  created_at: string
  accepted_at: string | null
  ended_at: string | null
}

export type SignalType = 'offer' | 'answer' | 'ice'

export interface WebrtcSignal {
  id: string
  session_id: string
  sender_id: string
  recipient_id: string
  signal_type: SignalType
  payload: unknown
  created_at: string
}

// Presence payload condiviso via Supabase Presence
export interface PresenceState {
  user_id: string
  username: string
  avatar_url: string | null
  status: UserStatus
  online_at: string
}

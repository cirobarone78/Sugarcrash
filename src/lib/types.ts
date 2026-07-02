// Tipi condivisi dell'applicazione (modello dati Firebase/Firestore).
// I timestamp sono epoch in millisecondi (number) per semplicità lato client.

export type UserStatus = 'online' | 'busy' | 'invisible'

// Sesso auto-dichiarato dall'utente. Obbligatorio in onboarding (lato client),
// ma facoltativo nel tipo perché il doc profilo viene creato prima della scelta.
export type Sex = 'male' | 'female' | 'couple' | 'undisclosed'

// Valori consentiti, riusati da UI e validazione client.
export const SEX_VALUES: Sex[] = ['male', 'female', 'couple', 'undisclosed']

export interface Profile {
  id: string
  username: string
  username_lower?: string
  avatar_url: string | null
  status: UserStatus
  is_invisible: boolean
  is_guest: boolean
  /** Sesso auto-dichiarato (obbligatorio in onboarding, opzionale nel modello). */
  sex?: Sex
  /** Età opzionale (18-120). */
  age?: number
  /** Nazionalità/paese opzionale (testo libero, ≤40 caratteri). */
  country?: string
  created_at: number
  updated_at: number
}

export type RoomKind = 'public' | 'private'

export interface Room {
  id: string
  name: string
  slug: string
  description: string | null
  topic: string | null
  is_public: boolean
  kind: RoomKind
  /** Solo stanze private: consenti l'invio di immagini. */
  allow_images?: boolean
  owner_id?: string
  owner_username?: string
}

export type MessageType = 'text' | 'system' | 'image'

export interface Message {
  id: string
  room_id: string
  user_id: string | null
  body: string
  message_type: MessageType
  image_url?: string | null
  created_at: number
  // denormalizzati al momento dell'invio (Firestore-friendly)
  author_username?: string | null
  author_avatar_url?: string | null
  author_is_guest?: boolean
}

export interface PrivateThread {
  id: string
  user_a: string
  user_b: string
  participants: string[]
  created_at: number
}

export interface PrivateMessage {
  id: string
  thread_id: string
  sender_id: string
  body: string
  image_url?: string | null
  created_at: number
  read_at: number | null
}

export interface BlockedUser {
  id: string
  blocker_id: string
  blocked_id: string
  created_at: number
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
  participants: string[]
  audio_enabled: boolean
  status: WebcamStatus
  created_at: number
  accepted_at: number | null
  ended_at: number | null
}

// Stato di presence pubblicato su Realtime Database
export interface PresenceUser {
  user_id: string
  username: string
  avatar_url: string | null
  status: UserStatus
  is_guest: boolean
  /** Sesso propagato via presence per l'indicatore in lista (zero letture Firestore). */
  sex?: Sex
  age?: number
  country?: string
  room: string | null
  online_at: number
}

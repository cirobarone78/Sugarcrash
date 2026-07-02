import type { Lang } from './i18n'
import type { Room } from './types'

interface RoomDef {
  id: string
  slug: string
  is_public: boolean
  name: Record<Lang, string>
  description: Record<Lang, string>
  topic: Record<Lang, string>
  /** Stanza pensata principalmente per incontri in webcam (18+). */
  cam?: boolean
}

// Stanze 18+ (config statica). La webcam resta sempre 1:1 in privato:
// la "Cam Lounge" è il punto d'incontro pubblico da cui partire.
export const ROOM_DEFS: RoomDef[] = [
  {
    id: 'general',
    slug: 'general',
    is_public: true,
    name: { en: 'General', it: 'Generale' },
    description: {
      en: 'The main square: introduce yourself and chat about anything.',
      it: 'La piazza principale: presentati e chiacchiera di tutto.',
    },
    topic: { en: 'Social', it: 'Social' },
  },
  {
    id: 'random',
    slug: 'random',
    is_public: true,
    name: { en: 'Random', it: 'Random' },
    description: {
      en: 'Off-topic, anything goes.',
      it: 'Off-topic, si parla di tutto.',
    },
    topic: { en: 'Off-topic', it: 'Off-topic' },
  },
  {
    id: 'dating',
    slug: 'dating',
    is_public: true,
    name: { en: 'Dating', it: 'Dating' },
    description: {
      en: 'Meet new people (18+).',
      it: 'Conoscere gente nuova (18+).',
    },
    topic: { en: 'Dating', it: 'Dating' },
  },
  {
    id: 'flirt',
    slug: 'flirt',
    is_public: true,
    name: { en: 'Flirt & Sexy', it: 'Flirt & Sexy' },
    description: {
      en: 'Flirty chat for adults (18+).',
      it: 'Chat di flirt per adulti (18+).',
    },
    topic: { en: '18+', it: '18+' },
  },
  {
    id: 'cam',
    slug: 'cam',
    is_public: true,
    cam: true,
    name: { en: 'Cam Lounge', it: 'Cam Lounge' },
    description: {
      en: 'Meet here, then go on private webcam 1:1 (18+).',
      it: 'Incontratevi qui, poi webcam privata 1:1 (18+).',
    },
    topic: { en: 'Webcam', it: 'Webcam' },
  },
  {
    id: 'young',
    slug: 'young',
    is_public: true,
    name: { en: 'Young adults (18-25)', it: 'Giovani (18-25)' },
    description: {
      en: 'A space for young adults, 18 and over.',
      it: 'Uno spazio per i più giovani, dai 18 anni in su.',
    },
    topic: { en: 'Community', it: 'Community' },
  },
  {
    id: 'over40',
    slug: 'over40',
    is_public: true,
    name: { en: 'Over 40', it: 'Over 40' },
    description: {
      en: 'A place to chat for the over 40 crowd.',
      it: 'Spazio di confronto per chat over 40.',
    },
    topic: { en: 'Community', it: 'Community' },
  },
  {
    id: 'music',
    slug: 'music',
    is_public: true,
    name: { en: 'Music', it: 'Musica' },
    description: {
      en: 'Tips, current listens and musical discoveries.',
      it: 'Consigli, ascolti del momento e scoperte musicali.',
    },
    topic: { en: 'Music', it: 'Musica' },
  },
  {
    id: 'gaming',
    slug: 'gaming',
    is_public: true,
    name: { en: 'Gaming', it: 'Gaming' },
    description: {
      en: 'Console, PC, retro and new releases.',
      it: 'Console, PC, retro e nuove uscite.',
    },
    topic: { en: 'Games', it: 'Videogiochi' },
  },
]

export function localizeRooms(lang: Lang): Room[] {
  return ROOM_DEFS.map((r) => ({
    id: r.id,
    slug: r.slug,
    is_public: r.is_public,
    kind: 'public' as const,
    name: r.name[lang],
    description: r.description[lang],
    topic: r.topic[lang],
  }))
}

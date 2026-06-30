import type { Room } from './types'

// Le stanze pubbliche sono configurazione statica (sono fisse e demo).
// In futuro si possono spostare su Firestore senza toccare i componenti.
export const ROOMS: Room[] = [
  {
    id: 'generale',
    slug: 'generale',
    name: 'Generale',
    description: 'La piazza principale: presentati e chiacchiera di tutto.',
    topic: 'Social',
    is_public: true,
  },
  {
    id: 'musica',
    slug: 'musica',
    name: 'Musica',
    description: 'Consigli, ascolti del momento e scoperte musicali.',
    topic: 'Musica',
    is_public: true,
  },
  {
    id: 'gaming',
    slug: 'gaming',
    name: 'Gaming',
    description: 'Console, PC, retro e nuove uscite.',
    topic: 'Videogiochi',
    is_public: true,
  },
  {
    id: 'napoli',
    slug: 'napoli',
    name: 'Napoli',
    description: 'La stanza dedicata a Napoli e dintorni.',
    topic: 'Città',
    is_public: true,
  },
  {
    id: 'over-40',
    slug: 'over-40',
    name: 'Over 40',
    description: 'Spazio di confronto per chat over 40.',
    topic: 'Community',
    is_public: true,
  },
  {
    id: 'tecnologia',
    slug: 'tecnologia',
    name: 'Tecnologia',
    description: 'Gadget, software, AI e novità tech.',
    topic: 'Tech',
    is_public: true,
  },
]

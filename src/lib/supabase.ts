import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Avviso esplicito in dev se mancano le variabili: la app mostrerà comunque
// una schermata di configurazione (vedi App.tsx), ma logghiamo per chiarezza.
export const isSupabaseConfigured = Boolean(url && anonKey)

if (!isSupabaseConfigured) {
  // eslint-disable-next-line no-console
  console.warn(
    '[RetroCam] VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY non configurate. ' +
      'Copia .env.example in .env e inserisci i valori del tuo progetto Supabase.',
  )
}

// In assenza di config usiamo placeholder per non far crashare createClient;
// la UI bloccherà comunque l'accesso mostrando le istruzioni.
export const supabase = createClient(
  url || 'https://placeholder.supabase.co',
  anonKey || 'placeholder-anon-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
    realtime: {
      params: { eventsPerSecond: 10 },
    },
  },
)

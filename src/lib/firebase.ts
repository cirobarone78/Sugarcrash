import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getDatabase } from 'firebase/database'
import { getStorage } from 'firebase/storage'

const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
}

// La config Firebase è pubblica: la sicurezza è nelle Security Rules.
export const isFirebaseConfigured = Boolean(
  config.apiKey && config.projectId && config.databaseURL,
)

if (!isFirebaseConfigured) {
  // eslint-disable-next-line no-console
  console.warn(
    '[RetroCam] Config Firebase mancante. Copia .env.example in .env e ' +
      'inserisci i valori del tuo progetto Firebase.',
  )
}

// In assenza di config usiamo placeholder per non far crashare l'init;
// la UI mostra comunque le istruzioni e blocca l'accesso.
const app = initializeApp({
  ...config,
  apiKey: config.apiKey || 'placeholder-api-key',
  projectId: config.projectId || 'placeholder',
  databaseURL: config.databaseURL || 'https://placeholder.firebasedatabase.app',
})

export const auth = getAuth(app)
export const db = getFirestore(app)
export const rtdb = getDatabase(app)
export const storage = getStorage(app)

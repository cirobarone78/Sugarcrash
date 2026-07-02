# 🔧 Guida passo-passo: configurare Firebase per RetroCam Chat

Questa guida ti accompagna dalla creazione del progetto fino all'app funzionante,
con **accesso ospite** e **utenti registrati**. Tempo stimato: ~15 minuti.
Tutto ciò che serve è gratuito (piano **Spark**).

---

## 1) Crea il progetto Firebase
1. Vai su <https://console.firebase.google.com> e accedi con un account Google.
2. Clicca **“Aggiungi progetto”** (o *Create a project*).
3. Dai un nome (es. `retrocam-chat`) → **Continua**.
4. Google Analytics: puoi **disattivarlo** (non serve) → **Crea progetto**.
5. Attendi qualche secondo e poi **Continua**.

---

## 2) Registra l'app Web e copia la configurazione
1. Nella home del progetto, clicca l'icona **`</>`** (“App web”).
2. Nickname app: `retrocam` → **NON** spuntare “Firebase Hosting” per ora → **Registra app**.
3. Comparirà un blocco `const firebaseConfig = { … }`. **Copia questi valori**:
   - `apiKey` → `VITE_FIREBASE_API_KEY`
   - `authDomain` → `VITE_FIREBASE_AUTH_DOMAIN`
   - `projectId` → `VITE_FIREBASE_PROJECT_ID`
   - `storageBucket` → `VITE_FIREBASE_STORAGE_BUCKET`
   - `messagingSenderId` → `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - `appId` → `VITE_FIREBASE_APP_ID`
4. Puoi sempre ritrovarli in **⚙ Impostazioni progetto → Le tue app**.

---

## 3) Abilita l'autenticazione (Email + Ospite)
1. Menu a sinistra → **Build → Authentication** → **Get started**.
2. Tab **Sign-in method** → **Add new provider**.
3. Abilita **Email/Password** → *Enable* (lascia disattivato “Email link”) → **Salva**.
4. Abilita anche **Anonimo** (*Anonymous*) → *Enable* → **Salva**.
   👉 Questo è ciò che permette l'**“Entra come ospite”**.

> Suggerimento per testare in fretta: in **Authentication → Settings → User
> actions** puoi lasciare attiva la registrazione email. Non serve verificare
> l'email per accedere.

---

## 4) Crea il Firestore Database
1. Menu → **Build → Firestore Database** → **Create database**.
2. Scegli una **location** vicina (es. `eur3` / `europe-west`).
3. Modalità: scegli **Production mode** (carichiamo regole nostre tra poco) → **Enable**.

### Carica le regole Firestore
1. In Firestore, vai sul tab **Rules**.
2. **Cancella** il contenuto e **incolla** quello del file
   [`firebase/firestore.rules`](../firebase/firestore.rules) del progetto.
3. Clicca **Publish**.

---

## 5) Crea il Realtime Database
Serve per **presence** (utenti online) e **signaling WebRTC**.
1. Menu → **Build → Realtime Database** → **Create database**.
2. Scegli una location → **Next**.
3. Modalità: **Start in locked mode** → **Enable**.
4. In alto vedrai l'**URL** del database, tipo
   `https://retrocam-chat-default-rtdb.europe-west1.firebasedatabase.app`.
   **Copialo** in `VITE_FIREBASE_DATABASE_URL`.

### Carica le regole del Realtime Database
1. Nel Realtime Database, tab **Rules**.
2. **Incolla** il contenuto di
   [`firebase/database.rules.json`](../firebase/database.rules.json).
3. Clicca **Publish**.

---

## 6) Crea il file `.env`
Nella cartella del progetto:
```bash
cp .env.example .env
```
Apri `.env` e incolla i valori copiati ai passi 2 e 5:
```env
VITE_FIREBASE_API_KEY=AIza...
VITE_FIREBASE_AUTH_DOMAIN=retrocam-chat.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=retrocam-chat
VITE_FIREBASE_STORAGE_BUCKET=retrocam-chat.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:abcdef...
VITE_FIREBASE_DATABASE_URL=https://retrocam-chat-default-rtdb.europe-west1.firebasedatabase.app
```
> Questi valori sono **pubblici** per design: la sicurezza è nelle regole.

---

## 7) Avvia l'app
```bash
npm install
npm run dev
```
Apri <http://localhost:5173>.

### Prova il flusso completo
1. **Entra come ospite** → entri subito con un nome “Ospite-XXXX”, puoi leggere e
   chattare in pubblico. Privati e webcam sono bloccati (è voluto).
2. Apri **Impostazioni → ⭐ Diventa membro**: scegli nickname + email + password →
   diventi **registrato mantenendo lo stesso account e la cronologia**.
3. In alternativa registrati subito dalla schermata iniziale.
4. Da registrato: nickname **riservato e unico**, **messaggi privati** e **webcam**.

---

## 8) (Facoltativo) Deploy su Firebase Hosting
```bash
npm i -g firebase-tools
firebase login
firebase use --add        # seleziona il tuo progetto
npm run build
firebase deploy --only hosting,firestore:rules,database
```
Il file [`firebase.json`](../firebase.json) è già pronto (publish `dist`, rewrite SPA).
Dopo il deploy, in **Authentication → Settings → Authorized domains** aggiungi il
dominio di produzione (es. `retrocam-chat.web.app`).

---

## ❓ Problemi comuni
- **“Accesso ospite non abilitato”** → manca il provider **Anonimo** (passo 3).
- **“auth/operation-not-allowed”** sulla registrazione → manca **Email/Password** (passo 3).
- **Errore sul Realtime Database / presence assente** → `VITE_FIREBASE_DATABASE_URL`
  mancante o errato (passo 5).
- **“Missing or insufficient permissions”** → regole non pubblicate: ripeti i
  passi 4 e 5 (tab **Rules → Publish**).
- **La webcam non parte** → richiede **HTTPS** (in locale `localhost` è ok) e i
  permessi del browser; su rete mobile può servire un **TURN** (vedi README).
- **Dopo aver cambiato `.env`** → riavvia `npm run dev` (Vite legge le env all'avvio).

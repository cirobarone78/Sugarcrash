# 📷 RetroCam Chat

PWA di **chatroom tematiche** in tempo reale, ispirata nello spirito alle vecchie
webchat anni 2000 (stanze pubbliche, lista utenti online, messaggi privati,
webcam opzionale nel privato) ma con interfaccia **moderna, responsive e più
sicura**. Nessun marchio, grafica, testo o contenuto di altri siti: è un
progetto **originale**.

> ⚠️ **Privacy webcam**: la piattaforma **non registra né salva** webcam o
> audio. Lo streaming avviene **peer-to-peer (WebRTC)** e non transita né viene
> archiviato sui server. Non è però tecnicamente possibile impedire a un altro
> utente di registrare lo schermo o usare un dispositivo esterno — usa la
> webcam solo con persone di cui ti fidi.

---

## ✨ Funzionalità

### Fase 1 — Chat (MVP)
- 🔐 Login con **Firebase Auth** (email + password).
- 🙋 Profilo con **nickname unico** e avatar opzionale.
- 🟢🟠⚫ Stato utente: **online / occupato / invisibile**.
- 🏠 **Lobby** con stanze pubbliche tematiche (nome, descrizione, topic, n° online).
- 🗂️ Stanze demo: Generale, Musica, Gaming, Napoli, Over 40, Tecnologia.
- 💬 **Chat pubblica realtime** con messaggi di sistema (entra/esce).
- 👥 **Lista utenti online** via Realtime Database Presence (`onDisconnect`).
- 🪪 Click sull'utente → scheda profilo → **messaggio privato**.
- 📨 **Chat privata 1:1** realtime con indicatore non letti.
- 😊 **Emoticon** base.
- 🚫 **Blocco** utente · ⚠️ **segnalazione** utente/messaggio.
- 🔔 **Suono** opzionale per i nuovi messaggi.
- 🛡️ Anti-spam (rate limit, blocco duplicati), sanitizzazione e limite lunghezza.
- 📲 **PWA** installabile (manifest + service worker).

### Fase 2 — Webcam privata opzionale (WebRTC)
- 📷 Pulsante **"Apri webcam"** nella chat privata.
- Scelta **solo video** o **video + audio** (`getUserMedia`).
- 🪟 **Anteprima locale** per chi trasmette.
- ✉️ **Invito** all'altro utente con **Accetta / Rifiuta**.
- 🔗 Connessione **WebRTC 1:1** monodirezionale (broadcaster → viewer).
  La webcam **bidirezionale** è opzionale: ogni utente può aprire la propria.
- 🎛️ Controlli: mute microfono, on/off video, **chiudi** (rosso).
- ⏱️ **Timer** di sessione · indicatore **● LIVE**.
- 🧾 **Consenso obbligatorio** (avviso privacy + checkbox "Ho capito"), salvato
  nel client e come `moderation_events` su Firestore.
- 💧 **Watermark dinamico** sul video remoto (nickname ricevente, data/ora, ID
  sessione breve) + avviso "Registrazione e diffusione non autorizzata sono
  vietate".
- Gestione di: permessi negati, browser non supportato, disconnessione, rifiuto
  invito, utente bloccato, cooldown inviti.
- 🚭 **Nessuna registrazione**, nessun salvataggio stream, nessun pulsante "registra".

---

## 🧱 Stack

React + Vite + TypeScript · Tailwind CSS · **Firebase** (Authentication,
Firestore, Realtime Database, Storage) · WebRTC (`RTCPeerConnection`) ·
`vite-plugin-pwa`.

**Come usiamo Firebase**
- **Auth** → login email/password.
- **Firestore** → profili, messaggi delle stanze, thread e messaggi privati,
  sessioni webcam, blocchi, segnalazioni, eventi di moderazione.
- **Realtime Database** → **presence** (utenti online con `onDisconnect`) e
  **signaling WebRTC** (nodo effimero `signals/<sessionId>`, nulla viene salvato).
- **Security Rules** (Firestore + RTDB) al posto della RLS.
- Le **stanze** sono configurazione statica (`src/lib/rooms.ts`): nessun seeding.

---

## 🚀 Avvio rapido (locale)

### 1. Prerequisiti
- Node.js 18+ (testato su 20/22)
- Un progetto **Firebase** gratuito (piano Spark)

### 2. Crea e configura il progetto Firebase
Nella [console Firebase](https://console.firebase.google.com):
1. **Crea un progetto** (o usane uno esistente).
2. **Authentication** → *Get started* → abilita il provider **Email/Password**.
3. **Firestore Database** → *Create database* (modalità produzione va bene,
   tanto carichiamo regole nostre) e scegli una region.
4. **Realtime Database** → *Create database* → scegli una region → modalità
   bloccata. Copia l'**URL** (serve per `VITE_FIREBASE_DATABASE_URL`).
5. **Project settings → Le tue app → App Web (</>)**: registra un'app web e
   copia l'oggetto di configurazione (apiKey, authDomain, projectId, ecc.).
6. **(Opzionale) Storage** se vuoi caricare avatar lato Storage.

### 3. Carica le Security Rules
- **Firestore** → *Regole*: incolla il contenuto di
  [`firebase/firestore.rules`](./firebase/firestore.rules) e pubblica.
- **Realtime Database** → *Regole*: incolla
  [`firebase/database.rules.json`](./firebase/database.rules.json) e pubblica.

> Con la **Firebase CLI**: `npm i -g firebase-tools && firebase login && firebase deploy --only firestore:rules,database` (il repo include `firebase.json`).

### 4. Variabili d'ambiente
```bash
cp .env.example .env
```
Compila con la config della tua app web (sono valori **pubblici**: la sicurezza
è nelle Security Rules):
```env
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=il-tuo-progetto.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=il-tuo-progetto
VITE_FIREBASE_STORAGE_BUCKET=il-tuo-progetto.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=000000000000
VITE_FIREBASE_APP_ID=1:000000000000:web:xxxx
VITE_FIREBASE_DATABASE_URL=https://il-tuo-progetto-default-rtdb.firebasedatabase.app
# opzionale (Fase 2): ICE server
VITE_ICE_SERVERS=[{"urls":"stun:stun.l.google.com:19302"}]
```
> Non inserire MAI service account o chiavi private nel frontend.

### 5. Installa e avvia
```bash
npm install
npm run dev
```
Apri http://localhost:5173.

### Altri comandi
```bash
npm run build      # typecheck + build di produzione (genera anche il service worker)
npm run preview    # anteprima della build
npm run lint       # ESLint
npm run icons      # rigenera le icone PWA in /public
```

---

## 🔌 WebRTC: signaling, STUN e TURN

Il **signaling** (scambio di offerte/risposte SDP e candidati ICE) usa il
**Realtime Database** di Firebase, sotto il nodo effimero `signals/<sessionId>`:
i messaggi vengono aggiunti con `push()`, letti con `onChildAdded` e il nodo è
**rimosso alla chiusura** (anche via `onDisconnect`). I segnali **non vengono
mai conservati**.

- In `signaling/` trovi un **piccolo signaling server WebSocket Node.js**
  alternativo (relay puro in memoria) per reti dove il websocket di Firebase non
  è raggiungibile. È opzionale e non necessario nella configurazione standard.

### STUN / TURN
- Di default è configurato lo **STUN pubblico di Google**
  (`stun:stun.l.google.com:19302`), sufficiente per molte reti casalinghe.
- **Per reti difficili** — mobile/4G/5G, firewall aziendali, NAT simmetrici —
  serve un **TURN server** (relay), altrimenti la connessione P2P può fallire.
  Configuralo via `VITE_ICE_SERVERS`:
  ```env
  VITE_ICE_SERVERS=[{"urls":"stun:stun.l.google.com:19302"},{"urls":"turn:turn.tuo-dominio.com:3478","username":"utente","credential":"password"}]
  ```
  Puoi self-hostare [coturn](https://github.com/coturn/coturn) o usare un
  servizio TURN gestito. Usa credenziali a tempo/effimere quando possibile.

---

## 🔐 Sicurezza & Privacy (sintesi tecnica)

- **Security Rules** su Firestore e RTDB (vedi cartella `firebase/`):
  - le stanze sono di sola lettura per gli autenticati;
  - si può scrivere **solo con il proprio `user_id` / `sender_id`**;
  - i **messaggi privati** e le **sessioni webcam** sono accessibili **solo ai
    due partecipanti** (controllo su `participants`);
  - un utente **bloccato non può** inviare privati né inviti webcam al blocker
    (le rules verificano l'assenza del doc in `blocks/<altro>/list/<me>`);
  - **nickname univoco** garantito da una transazione su `usernames/{nickname}`.
- **Sanitizzazione** input + **limite lunghezza** messaggi (2000) lato client e
  nelle rules; React fa di suo l'escape del testo (no XSS dal rendering).
- **Anti-spam**: rate limit (msg/intervallo), blocco duplicati consecutivi,
  **cooldown** sugli inviti webcam.
- **Nessun segreto nel frontend**: la config Firebase è pubblica per design.
- **Webcam**: streaming P2P, nessuna registrazione/salvataggio. La UI dice
  sempre *"non registrata dalla piattaforma"* e **mai** "impossibile da
  registrare", "anti-recording garantito" o "sicura al 100%".

> Nota sul signaling RTDB: le regole consentono lettura/scrittura del nodo
> `signals` agli utenti autenticati. Gli id di sessione sono casuali e i dati
> effimeri; per un ambiente di produzione ad alta sensibilità si possono
> irrigidire le regole salvando i due uid partecipanti accanto al nodo.

---

## 🌐 Deploy

La PWA è un sito statico (cartella `dist/`). Imposta le variabili `VITE_FIREBASE_*`
(ed eventuale `VITE_ICE_SERVERS`) nel pannello del provider. Aggiungi il dominio
di produzione tra i **domini autorizzati** in Firebase → Authentication →
Settings → *Authorized domains*.

### Firebase Hosting (consigliato con Firebase)
```bash
npm run build
firebase deploy --only hosting
```
(`firebase.json` è già configurato con publish `dist` e rewrite SPA.)

### Netlify
1. *Add new site → Import from Git*, seleziona il repo.
2. Build command: `npm run build` · Publish directory: `dist`
   (già in [`netlify.toml`](./netlify.toml), incluso il redirect SPA).
3. *Site settings → Environment variables*: aggiungi le `VITE_FIREBASE_*`.
4. Deploy.

### Vercel
1. *Add New → Project*, importa il repo.
2. Framework preset: **Vite** · Build: `npm run build` · Output: `dist`
   (vedi [`vercel.json`](./vercel.json), include rewrite SPA).
3. *Settings → Environment Variables*: aggiungi le `VITE_FIREBASE_*`.
4. Deploy.

> Tutte servono il sito su **HTTPS**: requisito necessario sia per la PWA sia
> per `getUserMedia` (webcam).

---

## ✅ Checklist di test

### Desktop (Chrome/Edge/Firefox)
- [ ] Registrazione + login; al primo accesso viene chiesto il **nickname**.
- [ ] Nickname duplicato → errore chiaro.
- [ ] Lobby mostra le 6 stanze con conteggio online.
- [ ] Entrando in una stanza appare il messaggio di sistema "è entrato".
- [ ] Due browser/utenti diversi: i messaggi pubblici arrivano **in tempo reale**.
- [ ] Lista utenti online aggiornata; stato *invisibile* → l'utente sparisce.
- [ ] Click su utente → profilo → **messaggio privato** → chat 1:1 realtime.
- [ ] Emoji picker inserisce le emoticon.
- [ ] **Blocco** utente: non vedo più i suoi messaggi e non può scrivermi.
- [ ] **Segnalazione** utente/messaggio → conferma invio.
- [ ] Suono nuovo messaggio attivabile/disattivabile dalle Impostazioni.
- [ ] Layout a 3 colonne (stanze / chat / utenti) corretto.
- [ ] **Webcam**: invito → Accetta/Rifiuta; video visibile; watermark presente;
      mute/video/chiudi e timer funzionano; chiusura pulita da entrambi i lati.
- [ ] Installazione PWA dall'icona della barra indirizzi.

### iPhone / iPad (Safari)
- [ ] Apertura su HTTPS; layout a **tab** (Stanze/Chat/Utenti/Privati) corretto.
- [ ] *Aggiungi a schermata Home* → l'app parte a schermo intero (standalone).
- [ ] Safe-area rispettata (notch/barra inferiore).
- [ ] Chat pubblica e privata realtime funzionano.
- [ ] Suono: su iOS parte solo dopo la prima interazione utente (atteso).
- [ ] **Webcam**: al primo `getUserMedia` Safari chiede i permessi; video e
      watermark ok; con audio, verifica il consenso microfono.
- [ ] Permesso negato → messaggio di errore gestito.

### Android (Chrome)
- [ ] Banner/menu **"Installa app"** funzionante; avvio standalone.
- [ ] Tab mobile e drawer privati ok; badge messaggi non letti.
- [ ] **Webcam**: permessi, video, watermark, controlli, timer ok.
- [ ] Su rete mobile/4G la webcam può richiedere un **TURN** (vedi sopra).
- [ ] Disconnessione di rete → la sessione webcam si chiude senza bloccare la UI.

---

## 🗺️ Roadmap futura
- 🔒 Stanze private (con invito/password).
- 🛠️ Ruoli **admin/moderatore** e dashboard moderazione (`reports` e
  `moderation_events` sono già pronte su Firestore).
- ⏳ Ban temporanei.
- 🧹 Filtri parole / profanity filter.
- ⭐ Sistema di reputazione.
- 👫 Amici / preferiti.
- 🔔 Notifiche push (Firebase Cloud Messaging).
- 🖼️ Invio immagini (Firebase Storage già nello stack).
- 🎤 Voice memo.
- 🎨 Temi grafici / skin.
- 🎮 Mini giochi da chat.
- 🤖 Bot AI moderatore.
- 📱 App nativa futura, se la PWA mostra limiti su iOS.

---

## 📁 Struttura del progetto
```
.
├─ index.html
├─ vite.config.ts            # Vite + plugin PWA (manifest, service worker)
├─ tailwind.config.js
├─ firebase.json             # config Firebase (hosting + rules)
├─ firebase/                 # firestore.rules + database.rules.json
├─ netlify.toml / vercel.json
├─ scripts/generate-icons.mjs  # genera le icone PWA (no dipendenze)
├─ signaling/                # signaling server WebSocket alternativo (opzionale)
└─ src/
   ├─ App.tsx                # provider + gating auth/profilo
   ├─ lib/                   # firebase, types, rooms, utils, sanitize, sounds, emoji, webrtc
   ├─ context/               # Auth, Presence, PrivateChat, UI, Webcam
   ├─ hooks/                 # useRooms (statico), useRoomMessages, useBlocks
   └─ components/            # tutti i componenti UI
```

Componenti principali: `AuthPage`, `ProfileSetup`, `LobbyPage`, `RoomList`,
`RoomCard`, `ChatLayout`, `RoomChat`, `RoomHeader`, `MessageList`,
`MessageBubble`, `MessageInput`, `OnlineUsersPanel`, `UserProfilePopover`,
`PrivateChatDrawer`, `PrivateThreadList`, `PrivateChatWindow`, `EmojiPicker`,
`WebcamConsentModal`, `WebcamInviteBanner`, `WebcamPanel`, `LocalVideoPreview`,
`RemoteVideoViewer`, `WebcamControls`, `ReportDialog`, `BlockUserDialog`,
`SettingsPanel`.

---

## 📄 Licenza
Progetto originale a scopo dimostrativo/educativo. Usa, adatta e distribuisci nel
rispetto delle leggi applicabili e della privacy degli utenti.

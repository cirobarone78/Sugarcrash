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
- 🔐 Login con **Supabase Auth** (email + password).
- 🙋 Profilo con **nickname unico** e avatar opzionale.
- 🟢🟠⚫ Stato utente: **online / occupato / invisibile**.
- 🏠 **Lobby** con stanze pubbliche tematiche (nome, descrizione, topic, n° online).
- 🗂️ Stanze demo: Generale, Musica, Gaming, Napoli, Over 40, Tecnologia.
- 💬 **Chat pubblica realtime** con messaggi di sistema (entra/esce).
- 👥 **Lista utenti online** aggiornata via Supabase Presence.
- 🪪 Click sull'utente → scheda profilo → **messaggio privato**.
- 📨 **Chat privata 1:1** realtime con stato di lettura.
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
  nel client e come `moderation_event` nel DB.
- 💧 **Watermark dinamico** sul video remoto (nickname ricevente, data/ora, ID
  sessione breve) + avviso "Registrazione e diffusione non autorizzata sono
  vietate".
- Gestione di: permessi negati, browser non supportato, disconnessione, rifiuto
  invito, utente bloccato, cooldown inviti.
- 🚭 **Nessuna registrazione**, nessun salvataggio stream, nessun pulsante "registra".

---

## 🧱 Stack

React + Vite + TypeScript · Tailwind CSS · Supabase (Auth, PostgreSQL, Realtime,
Presence, Storage) · WebRTC (`RTCPeerConnection`) · `vite-plugin-pwa`.

---

## 🚀 Avvio rapido (locale)

### 1. Prerequisiti
- Node.js 18+ (testato su 20/22)
- Un progetto **Supabase** gratuito

### 2. Crea il database
Nel pannello Supabase → **SQL Editor** → incolla ed esegui l'intero file
[`supabase/schema.sql`](./supabase/schema.sql). Crea tabelle, indici, trigger,
**RLS + policy**, abilita il Realtime sulle tabelle giuste e inserisce le stanze
demo.

> Suggerimento: in **Authentication → Providers** abilita *Email*. Per provare
> più velocemente in locale puoi disattivare *Confirm email* (Authentication →
> Settings) così l'accesso è immediato dopo la registrazione.

### 3. Variabili d'ambiente
```bash
cp .env.example .env
```
Compila con i valori del tuo progetto (Project Settings → API):
```env
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=la-tua-anon-key
# opzionale (Fase 2): ICE server
VITE_ICE_SERVERS=[{"urls":"stun:stun.l.google.com:19302"}]
```
> Usa **solo** `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`. Non inserire mai
> la *service_role key* o altri segreti nel frontend.

### 4. Installa e avvia
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

Il **signaling** (scambio di offerte/risposte SDP e candidati ICE) usa di
default **Supabase Realtime** con un canale *broadcast* dedicato per ogni
sessione (`webrtc:<sessionId>`). È la scelta più semplice e privacy-friendly:
i segnali **non vengono mai salvati** sul database, viaggiano solo in tempo
reale e svaniscono.

- La tabella `webrtc_signals` esiste nello schema come **fallback persistente
  documentato**, ma di default non viene usata. Se la usi, ricordati di
  ripulire periodicamente i segnali vecchi (sono effimeri).
- In `signaling/` trovi un **piccolo signaling server WebSocket Node.js**
  alternativo (relay puro in memoria) per reti dove il websocket di Supabase non
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
  servizio TURN gestito. Le credenziali TURN sono pensate per stare lato client,
  ma usa credenziali a tempo/effimere quando possibile.

---

## 🔐 Sicurezza & Privacy (sintesi tecnica)

- **Row Level Security** attiva su tutte le tabelle (vedi `schema.sql`):
  - le stanze leggibili sono **solo quelle pubbliche**;
  - si può scrivere **solo con il proprio `user_id`**;
  - i **messaggi privati** sono leggibili **solo dai due partecipanti**;
  - i **segnali WebRTC** sono leggibili **solo da mittente e destinatario**;
  - un utente **bloccato non può** inviare privati né inviti webcam al blocker
    (enforced lato DB con policy + funzioni `is_blocked_by` / `is_session_party`).
- **Sanitizzazione** input + **limite lunghezza** messaggi (2000) lato client e
  con `CHECK` lato DB; React fa di suo l'escape del testo (no XSS dal rendering).
- **Anti-spam**: rate limit (msg/intervallo), blocco duplicati consecutivi,
  **cooldown** sugli inviti webcam.
- **Nessun segreto nel frontend**: solo chiavi pubbliche `VITE_*`.
- **Webcam**: streaming P2P, nessuna registrazione/salvataggio. La UI dice
  sempre *"non registrata dalla piattaforma"* e **mai** "impossibile da
  registrare", "anti-recording garantito" o "sicura al 100%".

---

## 🌐 Deploy

La PWA è un sito statico (cartella `dist/`). Imposta le variabili d'ambiente
`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` (ed eventuale `VITE_ICE_SERVERS`)
nel pannello del provider. Aggiungi l'URL di produzione tra i **Redirect URLs**
in Supabase → Authentication → URL Configuration.

### Netlify
1. *Add new site → Import from Git*, seleziona il repo.
2. Build command: `npm run build` · Publish directory: `dist`
   (già impostati in [`netlify.toml`](./netlify.toml), incluso il redirect SPA).
3. *Site settings → Environment variables*: aggiungi le `VITE_*`.
4. Deploy. (CLI alternativa: `npm i -g netlify-cli && netlify deploy --prod`.)

### Vercel
1. *Add New → Project*, importa il repo.
2. Framework preset: **Vite** · Build: `npm run build` · Output: `dist`
   (vedi [`vercel.json`](./vercel.json), include rewrite SPA).
3. *Settings → Environment Variables*: aggiungi le `VITE_*`.
4. Deploy. (CLI alternativa: `npm i -g vercel && vercel --prod`.)

> Entrambe servono il sito su **HTTPS**: requisito necessario sia per la PWA sia
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
- 🛠️ Ruoli **admin/moderatore** e dashboard moderazione (le `reports` e
  `moderation_events` sono già pronte lato DB).
- ⏳ Ban temporanei.
- 🧹 Filtri parole / profanity filter.
- ⭐ Sistema di reputazione.
- 👫 Amici / preferiti.
- 🔔 Notifiche push (Web Push).
- 🖼️ Invio immagini (Supabase Storage già nello stack).
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
├─ netlify.toml / vercel.json
├─ scripts/generate-icons.mjs  # genera le icone PWA (no dipendenze)
├─ supabase/schema.sql       # tabelle, indici, trigger, RLS, demo data
├─ signaling/                # signaling server WebSocket alternativo (opzionale)
└─ src/
   ├─ App.tsx                # provider + gating auth/profilo
   ├─ lib/                   # supabase, types, utils, sanitize, sounds, emoji, webrtc
   ├─ context/               # Auth, Presence, PrivateChat, UI, Webcam
   ├─ hooks/                 # useRooms, useRoomMessages, useBlocks
   └─ components/            # tutti i componenti UI (vedi sotto)
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

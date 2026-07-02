# ROADMAP — CamRooms

Piano di lavoro derivato dalla review completa (7 agenti finder + verifica).
Legenda stato: ⬜ da fare · 🟦 in corso · ✅ fatto.
Modello assegnato: **Opus 4.8** (correttezza complessa/sicurezza) ·
**Sonnet 5** (meccanico/pulizia) · supervisione **Fable**.

---

## 🔴 P0 — Sicurezza (bloccante) — Opus 4.8 ✅ (codice) — regole DA RI-PUBBLICARE in console
> ⚠️ Migrazione: le stanze private create prima di S3 (senza salt/secret) non
> sono più accessibili e vanno ricreate.

- ✅ **S1** Validare i messaggi nelle Security Rules (`validMessage`): `message_type
  ∈ {text,image}`; image → allowlist `^data:image/...;base64` + `size()<=210000`;
  text → `image_url` assente.
- ✅ **S2** Autori legati al profilo del chiamante (`authorBound`) su messaggi
  stanze pubbliche/private.
- ✅ **S3** Password stanze private: `pwd_hash` salato in sottodoc
  `privateRooms/{id}/secret/hash` (`allow read: false`); doc principale espone
  solo il `salt`.
- ✅ **S4** Signaling WebRTC: `signals/$sessionId` vincolato all'allowlist
  `participants/$uid` + `from === auth.uid`.
- ✅ **S5** Presence: `.validate` `user_id === $uid` su `status/$uid`.
- ✅ **S6** Client: `isSafeImageDataUrl()` prima del render; rimosso il link
  `<a href>` a `data:`; immagine non valida → placeholder.
- 🟦 **S7** Attivare **App Check** + budget alert Firestore; rate-limit server-side.
  *(azioni in console — guida pronta: `docs/CONSOLE_HARDENING.md`)*

## 🟠 P1 — Bug funzionali — Opus 4.8 ✅
- ✅ **B1** Un solo layout montato via `useIsDesktop()` (breakpoint JS 1024px):
  `WindowsLayer` e `center` in `ChatLayout`. Stop a subscription/suoni doppi.
- ✅ **B2** Rimosso il codice morto in `PrivateChatContext` (-282 righe). Suono PM
  centralizzato in `PrivateNotifier` (unica sorgente, un ding per messaggio).
- ✅ **B3** `markRead` solo se visibile+focused, e non riscrive se già letto.
- ✅ **B4** Pillola globale "cam attiva" + Stop, indipendente dalla scheda.
- ✅ **B5** Inviti fantasma: ignora `pending` più vecchi di 60s; `endOutgoing`
  scrive `cancelled` se non accettato.
- ✅ **B6** `reads`/`cleared` con `serverTimestamp()` (no più clock skew).
- ✅ **B7** `MessageInput`: guardia in-flight anti doppio invio.
- ✅ **B8** Ri-vincolo x/y delle finestre su `window.resize`.

## 🟡 P2 — Efficienza/costi — Sonnet 5
- ✅ **E1** Retention lato query: `where('created_at','>', cutoff)` + timer alla
  scadenza reale (niente più heartbeat 60s). *(TTL su `expire_at` = azione console)*
- ✅ **E2** Immagini: **miniatura** (~≤420px) incorporata nel messaggio +
  **originale** (~≤1280px) in sottodoc write-once `blob/full`, caricato solo
  al click (lightbox). La lista messaggi non trasmette più i data-URL pieni
  (grande risparmio sulle chat private, che caricano tutta la cronologia).
  Regole `blob` aggiunte (privateThreads + privateRooms) — **DA RI-PUBBLICARE**.
- ✅ **E3** `markRead` scrive solo se davvero non letto *(coperto da B3)*.
- ✅ **E4** Lista thread: profili risolti in parallelo (`Promise.all`).

## ⚪ P3 — Pulizia/refactor — Sonnet 5
- ✅ **C1** Rimossi `netlify.toml`/`vercel.json` (deploy solo Firebase Hosting);
  README aggiornato. `signaling/server.js` **mantenuto**: è il signaling server
  WebSocket alternativo opzionale documentato in `webrtc.ts`/README (non morto).
- ✅ **C2** Deduplicati (helper): `sendGuard` (rate-limit unificato a 6) e
  `threads` (`privateThreadId`/`ensurePrivateThread`).
  ⬜ residuo: componenti UI duplicati (riga-lista, pannelli webcam) — rimandati
  per non toccare i file appena modificati in P1.

---

## 🟢 P4 — Profilo utente: sesso obbligatorio + campi opzionali — Opus 4.8 ✅ (Modello A)
> Regole Firestore DA RI-PUBBLICARE in console (validazione campi profilo).

- ✅ **U1** `sex` enum + `age`/`country` opzionali su `Profile`/`PresenceUser`;
  regole `profiles` validano i campi se presenti (`profileFieldsOk`).
- ✅ **U2** Onboarding esteso a TUTTI: `needsProfileSetup` true se manca `sex`.
  `ProfileSetup` adatta il flusso (registrati: nickname+sesso; ospiti: solo sesso).
- ✅ **U3** `SexBadge` accanto al nome in lista utenti + profilo (età·nazionalità
  nel profilo). ⬜ residuo: filtro lista per sesso (nice-to-have).
- ✅ **U4** Presence propaga `sex`/`age`/`country` (solo se definiti).
- ✅ **U6** Barra utenti: filtro per sesso (Tutti/Uomini/Donne/Coppie) +
  ordinamento (alfabetico | webcam accesa prima), persistiti in localStorage.
- ⏸️ **U5** Data di nascita alla registrazione (deterrente) — non richiesto ora.
- ✅ Modifica sesso/età/nazionalità da Impostazioni.

## 🎥 P5 — Webcam nelle stanze pubbliche (MVP mesh con tetto) — Opus 4.8 ✅ TESTATA OK
> Testata dal vivo con 2 dispositivi sulla stessa rete: trasmissione + visione
> multi-spettatore funzionanti. Regole `webcamSessions` pubblicate.

- ✅ **W1** "Vai in onda" (GoLiveButton in RoomHeader, registrati); consenso
  con scelta **video** o **solo audio**; flag presence `cam`.
- ✅ **W2** Qualità ridotta cam pubblica (~320×240, ~150 kbps via
  `applyLowBitrate`); cam privata 1:1 invariata.
- ✅ **W3** Glifo webcam accanto al nome; "Guarda la webcam" nel profilo.
- ✅ **W4** Multi-viewer mesh (`kind:'watch'`), tetto `PUBLIC_CAM_CAP`=8;
  finestra desktop / overlay mobile.
- ✅ **W5** Lista spettatori con espelli/blocca; indicatore "Sei in onda" + Stop.
- ✅ **W6** Regole `webcamSessions`: consentito sia invite 1:1 (broadcaster) sia
  watch pubblico (viewer); blocco → espulsione automatica.
- ✅ Fix WebRTC (debug live): signaling serializzato + coda candidati ICE;
  listener broadcaster stabile (una sottoscrizione) + baseline snapshot iniziale
  (no spettatori fantasma / no dipendenza dall'orologio); query broadcaster
  conforme alle regole (`participants array-contains`); provider order
  (WebcamProvider sopra UIProvider); ErrorBoundary anti pagina-vuota.
- ⏸️ Scala: oltre il mesh serve un **SFU** (a pagamento) — fase futura.
  TURN (relay) se servisse su reti NAT difficili (finora STUN basta su stessa rete).

---

## 🚀 Backlog — Crescita
- 🟦 Notifiche push PWA (nuovi PM, inviti cam).
  - ✅ **Layer gratuito (no backend)**: Notification API di sistema per nuovi PM
    e inviti webcam quando l'app è aperta ma in background; toggle in
    Impostazioni (chiede il permesso browser); preferenza in `retrocam.notify`.
  - ⏸️ **App COMPLETAMENTE chiusa**: richiede FCM + Cloud Function (piano
    **Blaze**). Da decidere insieme (vedi Hardening console). Non attivato.
- ⬜ Contro il "ghost town": conteggio online globale, eventi/orari a tema,
  fusione stanze poco frequentate.
- ⬜ Link diretti a stanza condivisibili + "invita un amico".
- ✅ **Cam-roulette 1:1 casuale** (gancio virale): matchmaking su RTDB
  (transazioni atomiche + onDisconnect), webcam **bidirezionale** (una sola
  peer connection sendrecv), "Avanti"/Stop, mute/video, blocca/segnala, skip di
  30s per non ri-pescare lo stesso utente. Solo registrati. Regole RTDB `roulette`
  aggiunte — **DA RI-PUBBLICARE** (Realtime Database → Regole).
- ⬜ Moderazione/sicurezza come feature (già: block/report/watermark) da valorizzare.
- ⏸️ **Stima età dal volto**: valutata e NON consigliata ora. Gratis+affidabile
  non coesistono (modelli in-browser ±4-8 anni = falsa sicurezza); soluzioni serie
  (Yoti/Incode) a pagamento; dato biometrico (GDPR art. 9 → consenso/DPIA) e
  attrito d'ingresso alto. Da riconsiderare con provider a pagamento se il
  progetto scala. Per ora: age-gate + termini (+ eventuale data di nascita).
- ⏸️ **SFU per webcam su larga scala** (LiveKit/Cloudflare): supera il tetto del
  mesh quando i numeri crescono. A pagamento.

## 💰 Backlog — Monetizzazione (freemium)
- ⬜ Premium (no ads, badge, più cam, immagini più grandi, invisibile, storico).
- ⬜ Regali/gift virtuali in cam & chat.
- ⬜ Boost/evidenza stanze; stanze a ingresso.
- ⬜ Cosmetici (cornici avatar, temi).
- ⬜ Pubblicità (network adult-friendly) + rewarded video.
- ⚠️ Nota legale: 18+ + pagamenti + webcam = verifica età, KYC payout,
  moderazione, GDPR; Apple/Google limitano l'adult → distribuzione **web/PWA**.

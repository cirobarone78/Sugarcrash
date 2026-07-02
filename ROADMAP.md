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
- ⬜ **S7** Attivare **App Check** + budget alert Firestore; rate-limit server-side
  (token-bucket doc o Cloud Function). *(richiede azione in console)*

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
- ⏸️ **E2** Immagini: miniatura + originale a parte; cap; pulizia immagini chat
  private. *(rimandato: scelta di prodotto da confermare)*
- ✅ **E3** `markRead` scrive solo se davvero non letto *(coperto da B3)*.
- ✅ **E4** Lista thread: profili risolti in parallelo (`Promise.all`).

## ⚪ P3 — Pulizia/refactor — Sonnet 5
- ⏸️ **C1** Rimuovere `netlify.toml`/`vercel.json`/`signaling/server.js`.
  *(rimandato: confermare se non si usa Netlify/Vercel)*
- ✅ **C2** Deduplicati (helper): `sendGuard` (rate-limit unificato a 6) e
  `threads` (`privateThreadId`/`ensurePrivateThread`).
  ⬜ residuo: componenti UI duplicati (riga-lista, pannelli webcam) — rimandati
  per non toccare i file appena modificati in P1.

---

## 🟢 P4 — Profilo utente: sesso obbligatorio + campi opzionali — Opus 4.8 (dati/regole) + Sonnet 5 (UI)
> Obiettivo: ogni utente (anche ospite) dichiara il sesso; età e nazionalità opzionali.
> Decisione aperta: **modello A** (campo unico Sesso: Uomo/Donna/Coppia/Non dichiarato)
> vs **modello B** (Sesso + "Interessato a"). Default proposto: A ora, B dopo.

- ⬜ **U1** Modello dati: aggiungere `sex` (obbligatorio) a `profiles`; `age`,
  `country` opzionali. Aggiornare `Profile` type + Security Rules (valore `sex`
  in enum consentito; nessun campo sensibile extra obbligatorio).
- ⬜ **U2** Onboarding: step di scelta sesso in `ProfileSetup` (registrati) e
  all'ingresso ospite (guest) — bloccante finché non selezionato. i18n EN/IT.
- ⬜ **U3** UI: indicatore sesso (pallino/lettera colorata o glifo) accanto al
  nome nella lista utenti online, nel profilo e (facoltativo) nelle bolle.
  Filtro lista utenti per sesso (nice-to-have).
- ⬜ **U4** Presence: propagare `sex` (+ eventuale `age`/`country`) nel nodo
  presence così è visibile senza extra letture Firestore.
- ⬜ **U5** (opzionale) Data di nascita alla registrazione come deterrente età
  (non prova legale).

## 🎥 P5 — Webcam nelle stanze pubbliche (MVP mesh con tetto) — Opus 4.8 (WebRTC) + Sonnet 5 (UI)
> 1-a-molti via mesh (nessun media server). Qualità RIDOTTA sulle cam pubbliche
> per alzare il tetto spettatori. Solo utenti registrati possono trasmettere.

- ⬜ **W1** "Vai in onda" in stanza: consenso esplicito (riuso WebcamConsentModal),
  opzione **video** o **solo audio**. Flag in presence `cam: 'video'|'audio'|null`
  (+ `audio` on/off).
- ⬜ **W2** Qualità adattiva: cam pubblica a bassa qualità (~320×240, 12-15 fps,
  ~150 kbps) via `getUserMedia` constraints + `RTCRtpSender.setParameters`
  (maxBitrate/maxFramerate/scaleResolutionDownBy). Cam privata 1:1 resta a
  qualità piena.
- ⬜ **W3** Glifo webcam accanto al nome dei broadcaster nella lista utenti;
  click sul nome → "Guarda la webcam".
- ⬜ **W4** Multi-viewer: ogni spettatore apre una sessione 1:1 verso il
  broadcaster (riuso webcamSessions/WebcamPeer/signaling). **Tetto ~8** viewer
  (config); oltre → "trasmissione al completo". Viewer vede il flusso in
  finestra (desktop) / pagina (mobile).
- ⬜ **W5** Pannello broadcaster: **lista spettatori** (da sessioni attive con
  broadcaster=me) con **blocca/espelli** per singolo; indicatore globale
  "Sei in onda · N spettatori" + Stop (estende la pillola di B4).
- ⬜ **W6** Regole: `webcamSessions` già limita ai partecipanti; verificare che
  viewer→broadcaster sia consentito e che il blocco reciso chiuda la sessione.
- ⚠️ Scala: oltre il mesh serve un **SFU** (a pagamento) — fase futura.
- ⚠️ Moderazione: watermark (già), report, blocco rapido, ruolo moderatore
  (futuro) per chiudere stream abusivi.

---

## 🚀 Backlog — Crescita
- ⬜ Notifiche push PWA (nuovi PM, inviti cam, "c'è gente in stanza").
- ⬜ Contro il "ghost town": conteggio online globale, eventi/orari a tema,
  fusione stanze poco frequentate.
- ⬜ Link diretti a stanza condivisibili + "invita un amico".
- ⬜ Modalità cam 1-a-1 casuale (gancio virale).
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

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
- ⬜ **E1** Retention lato query: `where('created_at','>', cutoff)`; attivare TTL
  su `expire_at`.
- ⬜ **E2** Immagini: salvare miniatura nel messaggio + originale a parte; cap
  dimensione; pulizia immagini chat private.
- ⬜ **E3** `markRead`: scrivere solo se davvero non letto, con debounce.
- ⬜ **E4** Lista thread: `Promise.all` sui profili (ora seriale) o denormalizzare.

## ⚪ P3 — Pulizia/refactor — Sonnet 5
- ⬜ **C1** Rimuovere config deploy inutilizzate (`netlify.toml`, `vercel.json`) e
  `signaling/server.js` (o documentarlo come opzionale).
- ⬜ **C2** Deduplicare: rate-limit (×3), `threadId`/`ensureThread` (×4), mapper
  messaggi, riga-lista conversazioni e pannelli webcam (desktop/mobile).

---

## 🚀 Backlog — Crescita
- ⬜ Notifiche push PWA (nuovi PM, inviti cam, "c'è gente in stanza").
- ⬜ Contro il "ghost town": conteggio online globale, eventi/orari a tema,
  fusione stanze poco frequentate.
- ⬜ Link diretti a stanza condivisibili + "invita un amico".
- ⬜ Modalità cam 1-a-1 casuale (gancio virale).
- ⬜ Moderazione/sicurezza come feature (già: block/report/watermark) da valorizzare.

## 💰 Backlog — Monetizzazione (freemium)
- ⬜ Premium (no ads, badge, più cam, immagini più grandi, invisibile, storico).
- ⬜ Regali/gift virtuali in cam & chat.
- ⬜ Boost/evidenza stanze; stanze a ingresso.
- ⬜ Cosmetici (cornici avatar, temi).
- ⬜ Pubblicità (network adult-friendly) + rewarded video.
- ⚠️ Nota legale: 18+ + pagamenti + webcam = verifica età, KYC payout,
  moderazione, GDPR; Apple/Google limitano l'adult → distribuzione **web/PWA**.

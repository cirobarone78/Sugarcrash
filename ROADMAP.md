# ROADMAP — CamRooms

Piano di lavoro derivato dalla review completa (7 agenti finder + verifica).
Legenda stato: ⬜ da fare · 🟦 in corso · ✅ fatto.
Modello assegnato: **Opus 4.8** (correttezza complessa/sicurezza) ·
**Sonnet 5** (meccanico/pulizia) · supervisione **Fable**.

---

## 🔴 P0 — Sicurezza (bloccante) — Opus 4.8
> Le regole vanno **ri-pubblicate in console** dall'utente dopo la modifica.

- ⬜ **S1** Validare i messaggi nelle Security Rules: `message_type ∈ {text,image}`;
  se image → `image_url` allowlist `^data:image/(png|jpe?g|webp);base64,...` +
  `size() <= 200000`. (`firebase/firestore.rules`, tutte le collezioni messaggi)
- ⬜ **S2** Legare gli autori: `author_username/avatar/is_guest` vincolati al
  profilo del chiamante, oppure rimossi e risolti a runtime da `profiles/{uid}`.
- ⬜ **S3** Password stanze private: non esporre `pwd_hash` (sottodoc owner-only o
  verifica via Cloud Function); salare l'hash.
- ⬜ **S4** Signaling WebRTC: vincolare `signals/$sessionId` ai due partecipanti e
  validare `from === auth.uid`. (`firebase/database.rules.json`)
- ⬜ **S5** Presence: `.validate` `user_id === $uid` su `status/$uid`.
- ⬜ **S6** Client: validare `image_url` con allowlist prima del render; togliere il
  link `<a href>` a `data:` (aprire in modale). (`MessageBubble.tsx`,
  `ChatWindowContent.tsx`, helper in `src/lib/`)
- ⬜ **S7** Attivare **App Check** + budget alert Firestore; rate-limit server-side
  (token-bucket doc o Cloud Function).

## 🟠 P1 — Bug funzionali — Opus 4.8
- ⬜ **B1** Doppio montaggio mobile+desktop: montare **un solo** layout via
  breakpoint JS (`useMediaQuery`). Vale per `WindowsLayer`/`MobilePrivateChats`
  e per `center` in `ChatLayout`. (causa di suoni doppi e "letto" errato)
- ⬜ **B2** Rimuovere il codice morto in `PrivateChatContext` (drawer/active/
  sendPrivate, ~200 righe) → una sola sorgente di suono (`usePrivateThread`).
- ⬜ **B3** `markRead` solo se `document.visibilityState==='visible' && focused`,
  e non riscrivere se già letto.
- ⬜ **B4** Webcam: indicatore globale "cam attiva" + Stop indipendente dalla
  scheda; terminare il broadcast su chiusura chat.
- ⬜ **B5** Inviti webcam fantasma: scrivere `cancelled` alla chiusura
  (`onDisconnect`/`beforeunload`) e ignorare i `pending` più vecchi di ~60s.
- ⬜ **B6** Clock skew: `reads`/`cleared` con `serverTimestamp()`.
- ⬜ **B7** `MessageInput`: guardia "in-flight" (anti doppio invio con Enter).
- ⬜ **B8** `FloatingWindow`: ri-vincolare x/y su `window.resize`.

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

# CLAUDE.md — CamRooms

Regole di progetto per chiunque (umano o agente) lavori su questo repo.
Leggere **prima** di modificare codice.

## Cos'è
**CamRooms** — PWA di chatroom tematiche in tempo reale (piattaforma 18+),
ispirata nello spirito alle vecchie webchat: stanze pubbliche a tema, chat di
gruppo, lista utenti online, chat privata 1:1, webcam opzionale (WebRTC 1:1),
moderazione e privacy by design. Live su `https://retrocam-chat.web.app`
(dominio in arrivo: `camrooms.app`).

## Stack
- React 18 + Vite 5 + TypeScript (strict) + Tailwind CSS 3 + vite-plugin-pwa
- Firebase: **Auth** (anonima per ospiti, email/Google per registrati),
  **Firestore** (messaggi, thread, stanze private, blocchi, report, sessioni
  webcam), **Realtime DB** (presence + signaling WebRTC). **NO** Firebase
  Storage (le immagini sono data-URL nei documenti — vedi note).
- i18n custom: `useI18n()` → `t('chiave', {var})`. **Inglese default**, Italiano
  seconda lingua. Ogni testo visibile passa da `t()`.

## Comandi (obbligatori prima di ogni commit)
```bash
npm run build   # tsc -b && vite build — deve passare
npm run lint    # eslint — zero errori
```
Non committare se build o lint falliscono.

## Regole di design (NON derogabili)
- **MAI emoji come icone.** Si usano gli SVG custom di `src/components/Icon.tsx`
  (line-icons) e `src/components/Glyph.tsx` (glifi pieni colorati per categoria).
- Palette: sfondo navy `#0b1120`, gradiente marchio **teal→blu** (`#2dd4bf`→`#3b82f6`),
  bolle `bg-brand-500` (mie) / `bg-teal-600` (altri). Le stanze hanno un glifo +
  colore in `src/lib/roomVisuals.ts`.
- Stile moderno/elegante/originale: niente look "generico da AI". Riferimento:
  navy messenger pulito, icone colorate piene, controlli a pillola.

## Invarianti infrastruttura (NON toccare)
- Project id Firebase `retrocam-chat`, URL hosting `*.web.app`, `authDomain`,
  `storageBucket`, `databaseURL`, branch di deploy, workflow GitHub Actions.
- I valori `firebaseConfig` sono **pubblici per progettazione** (safe nel repo).
- Le chiavi `localStorage` (`retrocam.*`) restano invariate: cambiarle resetta
  le preferenze salvate degli utenti.
- **Quando cambi `firebase/*.rules`**: il deploy NON le pubblica. L'utente deve
  ri-pubblicarle in console (Firestore → Regole; RTDB → Regole). Segnalarlo.

## Principi di sicurezza (imparati da review)
- I controlli lato client **non sono sicurezza**: chiunque può chiamare le API
  Firebase col proprio token. La sicurezza vive nelle **Security Rules**.
- Valida sempre server-side: `message_type ∈ {text,image}`, `image_url` con
  allowlist `^data:image/(png|jpe?g|webp);base64,...` e dimensione limitata.
- Lega i campi identità (author/username/user_id) all'`uid` del chiamante, o
  non denormalizzarli affatto.
- Considera **App Check** + budget alert per l'anti-abuso.

## Modello dati (note utili)
- Thread privato: id = `` `${a}__${b}` `` con `a,b` = uid ordinati (`orderedPair`).
- `reads.{uid}` / `cleared.{uid}`: usare `serverTimestamp()` per coerenza con
  `last_at`/`created_at` (evita bug di clock skew).
- Messaggi di stanza: `expire_at` + retention 24h. Chat private 1:1: **persistono**.
- Immagini: data-URL compressi (`src/lib/upload.ts`). Preferire miniature +
  cap dimensione per non saturare Firestore.

## Git
- Sviluppo su branch **`claude/retrocam-chat-pwa-yhh6et`**.
- `git push -u origin <branch>`; PR come **draft**.
- Ogni commit termina con:
  ```
  Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
  Claude-Session: https://claude.ai/code/session_015xbwkBLRcpuBdqps1sEWCY
  ```
- **Non** inserire l'identificatore tecnico del modello in commit, PR, commenti
  o altri artefatti del repo.
- Commenti nel codice in italiano (coerenza con l'esistente).

## Come lavoriamo (orchestrazione)
- Planning e stato in **ROADMAP.md**.
- Gli step vengono eseguiti da agenti (Opus 4.8 per sicurezza/architettura/
  correttezza complessa; Sonnet 5 per pulizia/refactor meccanico/efficienza),
  **supervisionati da Fable**, che rivede diff + build/lint prima del commit.

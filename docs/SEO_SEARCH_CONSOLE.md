# 🔎 Farsi trovare su Google — guida passo-passo

Dominio ufficiale: **camrooms.app**. L'app è una PWA (SPA) 18+: il contenuto è
dietro il gate di accesso, quindi Google indicizza soprattutto la **home** e il
testo `<noscript>` che abbiamo aggiunto. La condivisione (Open Graph) mostra ora
anteprime ricche su social/messaggistica.

---

## 0) 🔴 Prerequisito: pubblicare le modifiche

Il deploy automatico parte **solo con un push su `main`**
(`.github/workflows/deploy.yml`). Il lavoro è sul branch di sviluppo, quindi per
mandare online il pacchetto SEO (e le altre novità):

- **Opzione A (consigliata):** apri la **PR**, marcala *Ready*, **merge su `main`**
  → il workflow builda e pubblica da solo.
- **Opzione B (subito, da locale):**
  ```bash
  npm run build
  firebase deploy --only hosting
  ```

Verifica dopo il deploy: apri la home, `Visualizza sorgente pagina` e controlla
che ci siano i tag `og:title`, `canonical` = `https://camrooms.app/` e il blocco
`<noscript>`. Controlla anche che rispondano
`https://camrooms.app/robots.txt` e `https://camrooms.app/sitemap.xml`.

---

## 1) Google Search Console (gratis)

1. Vai su <https://search.google.com/search-console>, accedi con Google.
2. **Aggiungi proprietà** → tipo **Dominio** → inserisci `camrooms.app`.
3. Google chiede un **record TXT** da mettere nel DNS. Su **Cloudflare**:
   *DNS → Records → Add record* → Type **TXT**, Name `@`, Content = il valore
   dato da Google → Save. Poi torna su Search Console e premi **Verifica**
   (a volte serve attendere qualche minuto per la propagazione).
4. Verificata la proprietà: menu **Sitemap** → inserisci `sitemap.xml` →
   **Invia**.
5. Menu in alto **Controllo URL** → incolla `https://camrooms.app/` →
   **Richiedi indicizzazione**.

Tempi: da qualche giorno a qualche settimana per comparire nei risultati.

---

## 2) Bing (bonus, gratis)

Bing Webmaster Tools (<https://www.bing.com/webmasters>) permette di importare
direttamente la proprietà da Search Console. Copre Bing + assistenti che usano
il suo indice. Due minuti, vale la pena.

---

## 3) Come salire nei risultati (SEO organico)

- **Backlink**: altri siti che linkano camrooms.app = il segnale più forte.
  Directory di chat/adult, forum di settore, profili social, elenchi di webchat.
- **Parole chiave**: punta su nicchie a bassa concorrenza (es. "chat webcam
  [città/tema]", "cam roulette italiana", "webchat a tema X") invece di termini
  generici saturi.
- **Contenuto**: se in futuro vuoi, una o due pagine pubbliche descrittive
  (es. `/chat-webcam`, `/come-funziona`) danno a Google molto più testo da
  indicizzare rispetto alla sola home.
- **Velocità/mobile**: già ok (PWA, build ottimizzata).

---

## 4) Pubblicità a pagamento — attenzione al 18+

I canali mainstream **vietano** i contenuti adult:
- ❌ Google Ads, Meta/Instagram, TikTok, App Store/Play Store.

Canali che accettano il settore (a pagamento):
- ✅ **Reti adult**: ExoClick, TrafficJunky, JuicyAds, EroAdvertising.
- ✅ **Community**: subreddit NSFW pertinenti (rispetta le regole di ogni sub),
  forum e directory adult, canali Telegram.
- ✅ **Affiliazione/scambio traffico** con siti dello stesso pubblico.

Compliance: la pubblicità 18+ non deve raggiungere minori; tieni termini d'uso
chiari, età dichiarata e attenzione al GDPR.

---

## 5) Leva gratuita già in app

Sono attivi **"Condividi stanza"** (link `?room=slug` che apre la stanza) e
**"Invita un amico"**: il passaparola è il canale più efficace e a costo zero
per un'app nuova. Incoraggialo.

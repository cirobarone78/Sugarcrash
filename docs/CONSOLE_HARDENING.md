# 🛡️ Hardening console — azioni da fare in Firebase/GCP

Questa guida raccoglie le azioni che **NON** si fanno da codice ma dalla console
Firebase/Google Cloud. Sono ordinate per priorità. Progetto: **`retrocam-chat`**.

> Promemoria fondamentale: il deploy **non** pubblica le Security Rules. Ogni
> volta che cambiano `firebase/firestore.rules` o `firebase/database.rules.json`
> vanno **ri-pubblicate a mano** in console (o con `firebase deploy --only
> firestore:rules,database`).

---

## 0) 🔴 Ri-pubblicare le regole (OBBLIGATORIO, altrimenti le nuove feature non vanno)

Le ultime modifiche hanno cambiato **entrambi** i set di regole:

### a) Firestore (per E2 — immagini miniatura + originale)
1. Console → **Firestore Database** → scheda **Regole**.
2. Incolla il contenuto aggiornato di `firebase/firestore.rules`
   (include la nuova sottocollezione `blob` con `fullImageOk`).
3. **Pubblica**.

### b) Realtime Database (per la Cam-roulette)
1. Console → **Realtime Database** → scheda **Regole**.
2. Incolla il contenuto aggiornato di `firebase/database.rules.json`
   (include il nodo `roulette`).
3. **Pubblica**.

Senza questi due passaggi: l'apertura dell'immagine a piena risoluzione e la
cam-roulette falliranno con *permission denied*.

---

## 1) 🟠 Firestore TTL — pulizia automatica dei messaggi di stanza

I messaggi delle stanze hanno già il campo `expire_at` (24h). Il TTL li cancella
davvero da solo, azzerando i costi di storage nel tempo.

1. Console → **Firestore Database** → scheda **TTL** (o *Time-to-live*).
2. **Crea criterio (policy)**.
3. Collection group: `messages` · Campo timestamp: `expire_at`.
4. Crea. Da quel momento Firestore elimina i documenti scaduti entro ~24-72h.

> Nota: il TTL si applica al *collection group* `messages`. Le chat private 1:1
> (`privateThreads/*/messages`) **non** hanno `expire_at`, quindi restano — è
> voluto. Solo i messaggi di stanza (`rooms`/`privateRooms`) hanno `expire_at`.

---

## 2) 🟠 App Check — anti-abuso (blocca chi non usa la tua app)

App Check verifica che le chiamate a Firestore/RTDB arrivino davvero dalla tua
app (via reCAPTCHA v3 sul web), non da script esterni con un token rubato.

1. Console → **App Check**.
2. Registra l'app **Web** con provider **reCAPTCHA v3**: ti dà una *site key*.
3. Nel codice va aggiunta l'inizializzazione (posso farlo io quando hai la key):
   ```ts
   import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check'
   initializeAppCheck(app, {
     provider: new ReCaptchaV3Provider('LA_TUA_SITE_KEY'),
     isTokenAutoRefreshEnabled: true,
   })
   ```
4. Metti App Check in **modalità enforcement** su Firestore e RTDB **solo dopo**
   aver verificato che l'app registrata funziona (altrimenti blocchi te stesso).

> Quando hai la site key, dimmelo: aggiungo l'init e un fallback di debug per lo
> sviluppo locale.

---

## 3) 🟡 Budget alert (avvisi di spesa)

Anche restando su piano gratuito, imposta un avviso: se un domani passi a Blaze
o l'uso cresce, vieni avvisato prima di sorprese.

1. [Google Cloud Console](https://console.cloud.google.com) → stesso progetto.
2. **Billing** → **Budgets & alerts** → **Create budget**.
3. Importo es. **5 €/mese**, soglie di avviso 50/90/100%. Salva.

---

## 4) ⚪ (Opzionale, a pagamento) Notifiche push ad app CHIUSA — FCM + Cloud Function

Le notifiche "app aperta/in background" sono **già attive** e gratuite
(Notification API, toggle in Impostazioni). Per notificare quando l'app è
**completamente chiusa** serve Firebase Cloud Messaging + una Cloud Function che
invii il push: le Functions richiedono il piano **Blaze** (a consumo, con carta;
esiste una quota gratuita mensile ma serve la carta registrata).

Se decidi di attivarlo, il flusso è:

1. Console → **Project settings → Cloud Messaging**: genera la **chiave VAPID**
   (Web Push certificates).
2. Passa il progetto a **Blaze** e imposta un budget alert (punto 3).
3. Lato client (posso implementarlo io): service worker `firebase-messaging-sw.js`,
   richiesta permesso, `getToken(messaging, { vapidKey })`, salvataggio del token
   in `profiles/{uid}.fcm_tokens`.
4. Cloud Function che, su nuovo messaggio privato / invito webcam, legge il token
   del destinatario e invia il push. Schema:
   ```ts
   import { onDocumentCreated } from 'firebase-functions/v2/firestore'
   import { getMessaging } from 'firebase-admin/messaging'
   import { getFirestore } from 'firebase-admin/firestore'
   import { initializeApp } from 'firebase-admin/app'
   initializeApp()

   export const onPrivateMessage = onDocumentCreated(
     'privateThreads/{threadId}/messages/{msgId}',
     async (event) => {
       const msg = event.data?.data()
       if (!msg) return
       const thread = await getFirestore()
         .doc(`privateThreads/${event.params.threadId}`).get()
       const parts: string[] = thread.get('participants') ?? []
       const recipient = parts.find((p) => p !== msg.sender_id)
       if (!recipient) return
       const prof = await getFirestore().doc(`profiles/${recipient}`).get()
       const tokens: string[] = prof.get('fcm_tokens') ?? []
       if (!tokens.length) return
       await getMessaging().sendEachForMulticast({
         tokens,
         notification: { title: 'Nuovo messaggio', body: 'Hai un messaggio privato' },
       })
     },
   )
   ```

> Consiglio: attiva questo **solo** se noti che gli utenti non tornano senza un
> promemoria. Per iniziare, il layer gratuito già in app è sufficiente.

---

## Checklist rapida

- [ ] **Firestore → Regole**: incollate e pubblicate (E2 `blob`).
- [ ] **Realtime Database → Regole**: incollate e pubblicate (`roulette`).
- [ ] **Firestore → TTL**: policy su `messages.expire_at`.
- [ ] **App Check**: app Web + reCAPTCHA v3 (enforcement dopo il test).
- [ ] **Budget alert** impostato.
- [ ] (Opz.) FCM + Blaze se vuoi il push ad app chiusa.

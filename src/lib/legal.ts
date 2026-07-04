// Testi legali di CamRooms (Termini, Privacy, Linee guida) in EN e IT.
//
// ⚠️ NOTA: sono modelli redatti sulle pratiche dati reali dell'app; NON
// costituiscono consulenza legale. Prima di affidarcisi del tutto, farli
// rivedere da un avvocato. Titolare: Ciro Barone, ditta individuale,
// P.IVA 11079361215.
import type { Lang } from './i18n'

export type LegalDocId = 'terms' | 'privacy' | 'guidelines'

export interface LegalSection {
  title: string
  // Ogni riga è un paragrafo; le righe che iniziano con "- " sono elenco puntato.
  body: string[]
}

export interface LegalDoc {
  title: string
  updated: string
  intro: string
  sections: LegalSection[]
}

export const LEGAL_UPDATED_EN = 'Last updated: 4 July 2026'
export const LEGAL_UPDATED_IT = 'Ultimo aggiornamento: 4 luglio 2026'

const EN: Record<LegalDocId, LegalDoc> = {
  terms: {
    title: 'Terms of Service',
    updated: LEGAL_UPDATED_EN,
    intro:
      'Welcome to CamRooms (the "Service"), operated by Ciro Barone (sole proprietor, Italian VAT/P.IVA IT11079361215). By accessing or using the Service you agree to these Terms. If you do not agree, do not use the Service.',
    sections: [
      {
        title: '1. Eligibility (18+)',
        body: [
          'CamRooms is an adult platform strictly reserved for people aged 18 or older (or the age of majority in your jurisdiction, if higher).',
          'By using the Service you represent and warrant that you are at least 18. We do not technically verify age; a false declaration is a breach of these Terms and may be a criminal offence.',
        ],
      },
      {
        title: '2. Accounts and guest access',
        body: [
          'You can use the Service as a guest (anonymous) or by creating a registered account (email or Google sign-in). A guest identity is tied to a single device and may be lost.',
          'You are responsible for your account, your login credentials and all activity under your account. Choose a nickname that does not infringe others’ rights.',
        ],
      },
      {
        title: '3. Acceptable use',
        body: [
          'You agree NOT to use the Service to:',
          '- publish, request or share any content involving minors (CSAM) — this is a zero-tolerance offence that we report to the competent authorities;',
          '- share sexual or intimate content of a person without their consent, or record/redistribute another user’s webcam;',
          '- harass, threaten, defame, stalk, dox or discriminate against anyone;',
          '- impersonate other people or misrepresent your identity;',
          '- post illegal content, malware, spam, scams or unsolicited advertising;',
          '- attempt to bypass security, moderation, blocks or rate limits, or scrape the Service.',
        ],
      },
      {
        title: '4. Webcam and live content',
        body: [
          'Webcam sessions are peer-to-peer (WebRTC). We do NOT record or store your video/audio streams. However, other participants could capture them with external tools outside our control: share only what you are comfortable being seen.',
          'Turning on your webcam requires your explicit consent. You must not record, screenshot or redistribute another user’s stream without their consent.',
        ],
      },
      {
        title: '5. Your content and licence',
        body: [
          'You retain your rights to the content you send (messages, images). You grant us a limited licence to host and display it as needed to operate the Service (e.g. delivering messages to recipients).',
          'You are solely responsible for the content you send and confirm you have the right to send it.',
        ],
      },
      {
        title: '6. Moderation and enforcement',
        body: [
          'We may remove content and suspend or terminate accounts that breach these Terms or the law, with or without notice.',
          'Users can block and report others. Reports may be reviewed and acted upon. Serious violations (e.g. content involving minors) are reported to the authorities.',
        ],
      },
      {
        title: '7. Disclaimers',
        body: [
          'The Service is provided "as is" and "as available", without warranties of any kind. We do not guarantee that user declarations (including age) are true, that the Service is uninterrupted or error-free, or that content is lawful.',
          'We do not monitor live webcam streams in real time and are not responsible for user conduct.',
        ],
      },
      {
        title: '8. Limitation of liability',
        body: [
          'To the maximum extent permitted by law, Ciro Barone is not liable for indirect, incidental or consequential damages, or for user-generated content or conduct. Nothing limits liability that cannot be limited by law.',
        ],
      },
      {
        title: '9. Termination',
        body: [
          'You may stop using the Service at any time. We may suspend or terminate access for breach of these Terms or where required by law.',
        ],
      },
      {
        title: '10. Changes and contact',
        body: [
          'We may update these Terms; material changes will be indicated by updating the date above. Continued use means acceptance.',
          'Governing law: Italy. For consumers, the mandatory competent court is the consumer’s place of residence. Contact: support@camrooms.app.',
        ],
      },
    ],
  },
  privacy: {
    title: 'Privacy Policy',
    updated: LEGAL_UPDATED_EN,
    intro:
      'This Policy explains how CamRooms, operated by Ciro Barone (sole proprietor, Italian VAT/P.IVA IT11079361215) — the "data controller" — processes your personal data. Contact: support@camrooms.app.',
    sections: [
      {
        title: '1. Data we process',
        body: [
          '- Account: for guests, an anonymous identifier; for registered users, your email address and chosen nickname (via Firebase Authentication).',
          '- Profile: nickname, avatar, self-declared sex (required), and optional age and country.',
          '- Presence: your online status and current room while you are connected.',
          '- Messages: public/room messages and private 1:1 messages, including images embedded in the message (we do not use external file storage).',
          '- Webcam: sessions are peer-to-peer and NOT recorded by us; we store only minimal session metadata (participants, timestamps) to run the session; signaling data is ephemeral.',
          '- Cam-roulette: temporary matchmaking data (nickname, chosen preference), deleted when you leave.',
          '- Safety: blocks, reports (including the reported content/user) and moderation events (e.g. webcam consent).',
          '- Friends: your friend relationships.',
          '- Technical: preferences and consent stored in your browser (localStorage), plus standard server logs from our hosting provider.',
        ],
      },
      {
        title: '2. Why and legal bases (GDPR)',
        body: [
          '- To provide the Service (performance of a contract).',
          '- For safety, moderation and abuse prevention (legitimate interests and legal obligations).',
          '- For optional features and webcam (your consent, which you can withdraw).',
        ],
      },
      {
        title: '3. Retention',
        body: [
          '- Public/room messages are automatically deleted after 24 hours.',
          '- Private 1:1 messages are kept until you delete them or your account is removed.',
          '- Presence and cam-roulette data are ephemeral.',
          '- Reports and moderation records are kept only as long as needed for safety and legal purposes.',
        ],
      },
      {
        title: '4. Who can see your data',
        body: [
          'By nature of a chat service, other users see your nickname, profile, the messages you send them and your webcam when you enable it.',
          'We use Google Firebase (Authentication, Firestore, Realtime Database, Hosting) as a processor to run the Service. Data is hosted on Google infrastructure (EU region). We do not sell your personal data.',
        ],
      },
      {
        title: '5. International transfers',
        body: [
          'Where data is transferred outside the EEA by our providers, appropriate safeguards (e.g. EU Standard Contractual Clauses) apply.',
        ],
      },
      {
        title: '6. Your rights',
        body: [
          'Under the GDPR you may request access, rectification, erasure, restriction, portability, and object to processing, and withdraw consent at any time. You can edit your profile and delete chats in the app; for other requests or account deletion, contact support@camrooms.app.',
          'You may also lodge a complaint with your data protection authority.',
        ],
      },
      {
        title: '7. Children',
        body: [
          'The Service is for adults (18+) only. We do not knowingly process data of minors. If you believe a minor is using the Service, contact support@camrooms.app immediately.',
        ],
      },
      {
        title: '8. Security',
        body: [
          'We apply technical measures (server-side security rules, access controls). No method is 100% secure; we cannot guarantee absolute security.',
        ],
      },
      {
        title: '9. Cookies and local storage',
        body: [
          'We use your browser’s local storage for preferences, age confirmation and consent. Firebase may set cookies strictly necessary for authentication. We do not currently use third-party advertising cookies; this Policy will be updated if that changes.',
        ],
      },
      {
        title: '10. Changes and contact',
        body: [
          'We may update this Policy; the date above reflects the latest version. Data controller: Ciro Barone (VAT/P.IVA IT11079361215). Contact: support@camrooms.app.',
        ],
      },
    ],
  },
  guidelines: {
    title: 'Community Guidelines & Content Policy',
    updated: LEGAL_UPDATED_EN,
    intro:
      'These rules keep CamRooms safe. Breaking them can lead to content removal, bans and, for serious cases, reports to the authorities.',
    sections: [
      {
        title: '1. Zero tolerance — minors',
        body: [
          'Any content that sexualises, depicts or involves minors is strictly forbidden and reported to the competent authorities (and, where applicable, to organisations such as NCMEC). No exceptions.',
        ],
      },
      {
        title: '2. Consent and privacy',
        body: [
          'Do not share sexual or intimate content of anyone without their consent. Do not record, screenshot or redistribute another user’s webcam. Do not publish someone else’s personal data (doxxing).',
        ],
      },
      {
        title: '3. Respect',
        body: [
          'No harassment, threats, hate speech, discrimination or targeted abuse. Treat others as you want to be treated.',
        ],
      },
      {
        title: '4. No illegal or harmful content',
        body: [
          'No content that promotes violence, self-harm, trafficking, drugs, weapons, scams, malware or any illegal activity.',
        ],
      },
      {
        title: '5. No spam',
        body: [
          'No unsolicited advertising, mass links, bots or automated scraping.',
        ],
      },
      {
        title: '6. Reporting and copyright (DMCA)',
        body: [
          'Use the in-app Block and Report tools. To report a violation or a copyright infringement (DMCA), contact support@camrooms.app with a description and the URL/username involved. We remove infringing content and repeat infringers.',
        ],
      },
    ],
  },
}

const IT: Record<LegalDocId, LegalDoc> = {
  terms: {
    title: 'Termini di Servizio',
    updated: LEGAL_UPDATED_IT,
    intro:
      'Benvenuto su CamRooms (il "Servizio"), gestito da Ciro Barone (ditta individuale, P.IVA 11079361215). Usando il Servizio accetti questi Termini. Se non li accetti, non usare il Servizio.',
    sections: [
      {
        title: '1. Requisiti (18+)',
        body: [
          'CamRooms è una piattaforma per adulti, riservata esclusivamente a chi ha almeno 18 anni (o la maggiore età prevista dal proprio Paese, se superiore).',
          'Usando il Servizio dichiari e garantisci di avere almeno 18 anni. Non verifichiamo tecnicamente l’età; una dichiarazione falsa viola questi Termini e può costituire reato.',
        ],
      },
      {
        title: '2. Account e accesso ospite',
        body: [
          'Puoi usare il Servizio come ospite (anonimo) o creando un account registrato (email o accesso Google). L’identità ospite è legata a un solo dispositivo e può andare persa.',
          'Sei responsabile del tuo account, delle credenziali e di ogni attività svolta con esso. Scegli un nickname che non violi i diritti altrui.',
        ],
      },
      {
        title: '3. Uso consentito',
        body: [
          'Ti impegni a NON usare il Servizio per:',
          '- pubblicare, richiedere o condividere contenuti che coinvolgono minori (materiale pedopornografico) — tolleranza zero: lo segnaliamo alle autorità competenti;',
          '- condividere contenuti sessuali o intimi di una persona senza il suo consenso, o registrare/ridistribuire la webcam di un altro utente;',
          '- molestare, minacciare, diffamare, perseguitare, diffondere dati personali altrui o discriminare;',
          '- impersonare altre persone o falsificare la propria identità;',
          '- pubblicare contenuti illegali, malware, spam, truffe o pubblicità non richiesta;',
          '- aggirare sicurezza, moderazione, blocchi o limiti, o effettuare scraping del Servizio.',
        ],
      },
      {
        title: '4. Webcam e contenuti in diretta',
        body: [
          'Le sessioni webcam sono peer-to-peer (WebRTC). NON registriamo né conserviamo i tuoi flussi video/audio. Tuttavia altri partecipanti potrebbero catturarli con strumenti esterni fuori dal nostro controllo: mostra solo ciò che ti va di far vedere.',
          'Attivare la webcam richiede il tuo consenso esplicito. Non devi registrare, fare screenshot o ridistribuire il flusso di un altro utente senza il suo consenso.',
        ],
      },
      {
        title: '5. I tuoi contenuti e licenza',
        body: [
          'Mantieni i diritti sui contenuti che invii (messaggi, immagini). Ci concedi una licenza limitata per ospitarli e mostrarli quanto serve a far funzionare il Servizio (es. consegnare i messaggi ai destinatari).',
          'Sei l’unico responsabile dei contenuti che invii e confermi di averne il diritto.',
        ],
      },
      {
        title: '6. Moderazione ed enforcement',
        body: [
          'Possiamo rimuovere contenuti e sospendere o chiudere account che violano questi Termini o la legge, con o senza preavviso.',
          'Gli utenti possono bloccare e segnalare. Le segnalazioni possono essere esaminate. Le violazioni gravi (es. contenuti che coinvolgono minori) sono segnalate alle autorità.',
        ],
      },
      {
        title: '7. Esclusioni di garanzia',
        body: [
          'Il Servizio è fornito "così com’è" e "secondo disponibilità", senza garanzie. Non garantiamo che le dichiarazioni degli utenti (inclusa l’età) siano veritiere, che il Servizio sia continuo o privo di errori, né la liceità dei contenuti.',
          'Non monitoriamo i flussi webcam in tempo reale e non siamo responsabili della condotta degli utenti.',
        ],
      },
      {
        title: '8. Limitazione di responsabilità',
        body: [
          'Nei limiti massimi consentiti dalla legge, Ciro Barone non è responsabile per danni indiretti, incidentali o consequenziali, né per contenuti o condotte degli utenti. Nulla limita responsabilità non limitabili per legge.',
        ],
      },
      {
        title: '9. Cessazione',
        body: [
          'Puoi smettere di usare il Servizio in qualsiasi momento. Possiamo sospendere o chiudere l’accesso in caso di violazione o quando richiesto dalla legge.',
        ],
      },
      {
        title: '10. Modifiche e contatti',
        body: [
          'Possiamo aggiornare questi Termini; le modifiche rilevanti sono indicate aggiornando la data in alto. L’uso continuato vale come accettazione.',
          'Legge applicabile: Italia. Per i consumatori resta competente, in via inderogabile, il foro del luogo di residenza o domicilio del consumatore. Contatto: support@camrooms.app.',
        ],
      },
    ],
  },
  privacy: {
    title: 'Informativa sulla privacy',
    updated: LEGAL_UPDATED_IT,
    intro:
      'Questa Informativa spiega come CamRooms, gestito da Ciro Barone (ditta individuale, P.IVA 11079361215) — il "titolare del trattamento" — tratta i tuoi dati personali. Contatto: support@camrooms.app.',
    sections: [
      {
        title: '1. Dati che trattiamo',
        body: [
          '- Account: per gli ospiti, un identificatore anonimo; per i registrati, l’indirizzo email e il nickname scelto (via Firebase Authentication).',
          '- Profilo: nickname, avatar, sesso auto-dichiarato (obbligatorio) ed età e nazionalità (facoltativi).',
          '- Presenza: stato online e stanza corrente mentre sei connesso.',
          '- Messaggi: messaggi pubblici/di stanza e messaggi privati 1:1, incluse le immagini incorporate nel messaggio (non usiamo storage esterno).',
          '- Webcam: le sessioni sono peer-to-peer e NON vengono registrate; conserviamo solo minimi metadati di sessione (partecipanti, orari); i dati di signaling sono effimeri.',
          '- Cam-roulette: dati temporanei di abbinamento (nickname, preferenza), eliminati quando esci.',
          '- Sicurezza: blocchi, segnalazioni (incluso il contenuto/utente segnalato) ed eventi di moderazione (es. consenso webcam).',
          '- Amici: le tue relazioni di amicizia.',
          '- Tecnici: preferenze e consensi salvati nel tuo browser (localStorage) e log di server standard del fornitore di hosting.',
        ],
      },
      {
        title: '2. Finalità e basi giuridiche (GDPR)',
        body: [
          '- Fornire il Servizio (esecuzione di un contratto).',
          '- Sicurezza, moderazione e prevenzione degli abusi (legittimo interesse e obblighi di legge).',
          '- Funzioni facoltative e webcam (il tuo consenso, revocabile).',
        ],
      },
      {
        title: '3. Conservazione',
        body: [
          '- I messaggi pubblici/di stanza sono eliminati automaticamente dopo 24 ore.',
          '- I messaggi privati 1:1 restano finché non li elimini o non viene rimosso l’account.',
          '- Presenza e dati cam-roulette sono effimeri.',
          '- Segnalazioni e registri di moderazione sono conservati solo per il tempo necessario a fini di sicurezza e legali.',
        ],
      },
      {
        title: '4. Chi può vedere i tuoi dati',
        body: [
          'Per la natura di una chat, gli altri utenti vedono il tuo nickname, il profilo, i messaggi che invii loro e la tua webcam quando la attivi.',
          'Usiamo Google Firebase (Authentication, Firestore, Realtime Database, Hosting) come responsabile del trattamento per erogare il Servizio. I dati sono ospitati su infrastruttura Google (regione UE). Non vendiamo i tuoi dati personali.',
        ],
      },
      {
        title: '5. Trasferimenti internazionali',
        body: [
          'Quando i dati sono trasferiti fuori dallo SEE dai nostri fornitori, si applicano garanzie adeguate (es. Clausole Contrattuali Standard UE).',
        ],
      },
      {
        title: '6. I tuoi diritti',
        body: [
          'In base al GDPR puoi chiedere accesso, rettifica, cancellazione, limitazione, portabilità, opporti al trattamento e revocare il consenso in ogni momento. Puoi modificare il profilo ed eliminare le chat nell’app; per altre richieste o la cancellazione dell’account scrivi a support@camrooms.app.',
          'Puoi anche presentare reclamo all’autorità di controllo (in Italia, il Garante per la protezione dei dati personali).',
        ],
      },
      {
        title: '7. Minori',
        body: [
          'Il Servizio è riservato agli adulti (18+). Non trattiamo consapevolmente dati di minori. Se ritieni che un minore stia usando il Servizio, scrivi subito a support@camrooms.app.',
        ],
      },
      {
        title: '8. Sicurezza',
        body: [
          'Applichiamo misure tecniche (regole di sicurezza lato server, controlli di accesso). Nessun metodo è sicuro al 100%; non possiamo garantire una sicurezza assoluta.',
        ],
      },
      {
        title: '9. Cookie e archiviazione locale',
        body: [
          'Usiamo l’archiviazione locale del browser per preferenze, conferma dell’età e consensi. Firebase può impostare cookie strettamente necessari all’autenticazione. Al momento non usiamo cookie pubblicitari di terze parti; aggiorneremo l’informativa in caso di cambiamento.',
        ],
      },
      {
        title: '10. Modifiche e contatti',
        body: [
          'Possiamo aggiornare questa Informativa; la data in alto indica l’ultima versione. Titolare del trattamento: Ciro Barone (P.IVA 11079361215). Contatto: support@camrooms.app.',
        ],
      },
    ],
  },
  guidelines: {
    title: 'Linee guida della community e contenuti',
    updated: LEGAL_UPDATED_IT,
    intro:
      'Queste regole tengono CamRooms al sicuro. Violarle può comportare rimozione dei contenuti, ban e, nei casi gravi, segnalazione alle autorità.',
    sections: [
      {
        title: '1. Tolleranza zero — minori',
        body: [
          'Qualsiasi contenuto che sessualizzi, raffiguri o coinvolga minori è severamente vietato e segnalato alle autorità competenti (e, ove applicabile, a organizzazioni come NCMEC). Nessuna eccezione.',
        ],
      },
      {
        title: '2. Consenso e privacy',
        body: [
          'Non condividere contenuti sessuali o intimi di nessuno senza il suo consenso. Non registrare, fotografare o ridistribuire la webcam di un altro utente. Non pubblicare dati personali altrui (doxxing).',
        ],
      },
      {
        title: '3. Rispetto',
        body: [
          'Niente molestie, minacce, incitamento all’odio, discriminazioni o abusi mirati. Tratta gli altri come vorresti essere trattato.',
        ],
      },
      {
        title: '4. Nessun contenuto illegale o dannoso',
        body: [
          'Nessun contenuto che promuova violenza, autolesionismo, tratta, droghe, armi, truffe, malware o attività illegali.',
        ],
      },
      {
        title: '5. Niente spam',
        body: [
          'Nessuna pubblicità non richiesta, link di massa, bot o scraping automatizzato.',
        ],
      },
      {
        title: '6. Segnalazioni e copyright (DMCA)',
        body: [
          'Usa gli strumenti Blocca e Segnala nell’app. Per segnalare una violazione o una violazione di copyright (DMCA), scrivi a support@camrooms.app indicando descrizione e URL/username coinvolti. Rimuoviamo i contenuti illeciti e i recidivi.',
        ],
      },
    ],
  },
}

export function getLegalDoc(lang: Lang, id: LegalDocId): LegalDoc {
  return (lang === 'it' ? IT : EN)[id]
}

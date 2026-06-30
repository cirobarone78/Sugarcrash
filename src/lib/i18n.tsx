import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

export type Lang = 'en' | 'it'

const STORAGE_KEY = 'retrocam.lang'

// Inglese come lingua principale, italiano come seconda scelta.
const dict: Record<Lang, Record<string, string>> = {
  en: {
    // generale
    'app.tagline': 'Themed chatrooms, private chat and optional webcam.',
    'common.or': 'or',
    'common.cancel': 'Cancel',
    'common.close': 'Close',
    'common.save': 'Save',
    'common.send': 'Send',
    'common.back': 'Back',
    'common.you': 'You',
    'common.guest': 'guest',
    'common.loading': 'Loading…',
    'common.wait': 'Please wait…',
    'common.error': 'Something went wrong.',

    // age gate
    'age.title': 'Adults only — 18+',
    'age.body':
      'This platform contains dating and flirty (adult) rooms. By entering you confirm you are at least 18 years old. Note: without ID verification, age cannot be technically guaranteed.',
    'age.confirm': 'I am 18 or older — enter',
    'age.exit': 'Leave',
    'age.exited': 'You have left. Come back when you are 18+.',

    // auth
    'auth.signin': 'Sign in',
    'auth.signup': 'Sign up',
    'auth.email': 'Email',
    'auth.password': 'Password',
    'auth.emailPlaceholder': 'you@example.com',
    'auth.passwordHint': 'at least 6 characters',
    'auth.create': 'Create account',
    'auth.guest': '👤 Enter as guest',
    'auth.guestHint':
      'As a guest you can read and chat in public. Sign up for a reserved nickname, private messages and webcam.',
    'auth.terms':
      'By entering you agree to use the platform respectfully. No illegal content, harassment or spam.',
    'auth.err.invalidEmail': 'Invalid email.',
    'auth.err.emailInUse': 'An account with this email already exists. Try signing in.',
    'auth.err.weakPassword': 'Password too weak (at least 6 characters).',
    'auth.err.badCredentials': 'Wrong email or password.',
    'auth.err.tooMany': 'Too many attempts. Try again later.',
    'auth.err.notAllowed': 'Email/password sign-in is not enabled in the Firebase project.',
    'auth.err.generic': 'Authentication error. Try again.',
    'auth.err.guest': 'Guest sign-in failed. Try again.',
    'auth.err.guestNotAllowed':
      'Guest access is not enabled in the Firebase project (Authentication → Sign-in method → Anonymous).',

    // profile setup
    'setup.title': 'Choose your nickname',
    'setup.subtitle': 'This is the name people will see in the rooms.',
    'setup.nickname': 'Nickname',
    'setup.nicknamePlaceholder': 'e.g. neon_rider',
    'setup.nicknameHint': '3-24 characters: letters, numbers, . _ -',
    'setup.avatar': 'Avatar URL (optional)',
    'setup.enter': 'Enter chat',
    'setup.saving': 'Saving…',
    'setup.exit': 'Sign out',

    // username validation
    'username.tooShort': 'Nickname must be at least 3 characters.',
    'username.tooLong': 'Nickname can be at most 24 characters.',
    'username.invalid': 'Use only letters, numbers, dot, dash or underscore.',
    'username.taken': 'This nickname is already taken. Choose another.',

    // lobby / rooms
    'lobby.welcome': 'Welcome to RetroCam Chat 👋',
    'lobby.online': 'Online now',
    'lobby.users': 'users',
    'rooms.title': 'Rooms',
    'rooms.enter': 'Enter',
    'rooms.online': 'online',

    // chat
    'chat.placeholder': 'Type a message…',
    'chat.placeholderRoom': 'Message in {room}…',
    'chat.loadingMsgs': 'Loading messages…',
    'chat.empty': 'No messages yet. Break the ice! 👋',
    'chat.reportMsg': 'Report message',
    'chat.joined': '{user} joined the room',
    'chat.left': '{user} left the room',
    'chat.dupMessage': 'You just sent the same message.',
    'chat.tooFast': 'You are typing too fast, slow down a little.',
    'chat.sendFailed': 'Send failed.',
    'chat.photo': '📷 Photo',
    'chat.attachImage': 'Send image',
    'chat.uploading': 'Uploading…',
    'chat.imageType': 'Only image files are allowed.',
    'chat.imageTooBig': 'Image too large (max 5 MB).',
    'chat.uploadFailed': 'Image upload failed.',

    // online users
    'users.title': 'Online users',
    'users.empty': 'Nobody here yet.',

    // status
    'status.online': 'Online',
    'status.busy': 'Busy',
    'status.invisible': 'Invisible',

    // user profile
    'profile.title': 'User profile',
    'profile.you': 'This is you 🙂',
    'profile.pm': '💬 Private message',
    'profile.unblock': 'Unblock user',
    'profile.block': '🚫 Block user',
    'profile.report': '⚠️ Report user',
    'profile.guestSelf': '🔒 Sign up to send private messages.',
    'profile.guestOther':
      'This user is a guest: private chat is available only between registered users.',

    // private chat
    'pm.title': '💬 Private messages',
    'pm.empty':
      'No private conversations. Open an online user’s profile and tap “Private message”.',
    'pm.newConv': 'New conversation',
    'pm.selectConv': 'Select a conversation.',
    'pm.start': 'Start the conversation with {user}.',
    'pm.placeholder': 'Message to {user}…',
    'pm.noActive': 'No active conversation.',
    'pm.cantSend': 'You can’t send messages to this user.',

    // emoji groups
    'emoji.faces': 'Faces',
    'emoji.gestures': 'Gestures',
    'emoji.hearts': 'Hearts & symbols',
    'emoji.misc': 'Misc',

    // report
    'report.title': 'Report abuse',
    'report.done': 'Thank you. Your report has been sent to the staff.',
    'report.reporting': 'You are reporting:',
    'report.reason': 'Reason',
    'report.details': 'Details (optional)',
    'report.detailsPlaceholder': 'What happened?',
    'report.send': 'Send report',
    'report.sending': 'Sending…',
    'report.reasonHarass': 'Harassment or insults',
    'report.reasonSpam': 'Spam or advertising',
    'report.reasonSexual': 'Unsolicited sexual content',
    'report.reasonThreat': 'Threat or dangerous behaviour',
    'report.reasonOther': 'Other',
    'report.userLabel': 'user {name}',
    'report.msgLabel': 'message from {name}',

    // block
    'block.title': 'Block {name}?',
    'block.body':
      'You will no longer see their public messages and they won’t be able to send you private messages or webcam invites. You can unblock later from settings.',
    'block.confirm': 'Block user',

    // settings
    'settings.title': 'Settings',
    'settings.avatarHint': 'Change your avatar by pasting an image URL.',
    'settings.guestAvatarHint': 'Avatar and reserved nickname available after signing up.',
    'settings.status': 'Status',
    'settings.invisibleHint':
      'While invisible you don’t appear in the user list or counts, but you still receive messages.',
    'settings.sound': 'New message sound',
    'settings.soundHint': 'A short beep for new messages.',
    'settings.blocked': 'Blocked users',
    'settings.noBlocked': 'No blocked users.',
    'settings.unblock': 'Unblock',
    'settings.signout': 'Sign out',
    'settings.language': 'Language',

    // upgrade
    'upgrade.title': '⭐ Become a member',
    'upgrade.body':
      'Sign up keeping this account: unlock a reserved nickname, private messages, webcam and avatar.',
    'upgrade.nickname': 'Nickname (3-24 characters)',
    'upgrade.submit': 'Sign up and save nickname',
    'upgrade.submitting': 'Signing up…',
    'upgrade.done':
      '✅ Account registered! You now have a reserved nickname, private messages and webcam.',
    'upgrade.err.emailInUse': 'An account with this email already exists.',
    'upgrade.err.invalidEmail': 'Invalid email.',
    'upgrade.err.weakPassword': 'Password too weak (at least 6 characters).',
    'upgrade.err.generic': 'Sign-up failed. Try again.',
    'upgrade.nameRetry': ' Account registered: you can pick another nickname above.',

    // header / tabs
    'header.register': '⭐ Sign up',
    'header.pm': 'Private messages',
    'header.settings': 'Settings',
    'tab.rooms': 'Rooms',
    'tab.chat': 'Chat',
    'tab.users': 'Users',
    'tab.private': 'Private',

    // webcam
    'cam.notSupported': 'Webcam not supported by this browser',
    'cam.open': 'Open webcam',
    'cam.alreadyOn': 'Webcam already on',
    'cam.consentTitle': 'Open webcam — read this first',
    'cam.privacy':
      'The platform does not record or store webcam or audio. However, it is not technically possible to prevent another user from screen-recording or using an external device. Use the webcam only with people you trust.',
    'cam.targetIntro': 'You are about to open your webcam to {name}. The webcam is ',
    'cam.notRecorded': 'not recorded by the platform',
    'cam.understood': 'I understand and accept to proceed.',
    'cam.videoOnly': '📷 Video only',
    'cam.videoAudio': '🎙️ Video + audio',
    'cam.inviteText': '{name} wants to open the webcam',
    'cam.inviteWithAudio': ' (with audio)',
    'cam.inviteHint':
      'If you accept you will see their video. You can close or report at any time.',
    'cam.accept': 'Accept',
    'cam.decline': 'Decline',
    'cam.declined': 'Webcam invite declined.',
    'cam.waiting': 'Waiting for {name} to accept the invite…',
    'cam.webcamOf': 'Webcam of {name}',
    'cam.connecting': 'Connecting…',
    'cam.live': '● LIVE',
    'cam.noRecordingNote':
      'Webcam not recorded by the platform. No stream is saved on the servers.',
    'cam.recordingWarning': 'Unauthorized recording and sharing are prohibited',
    'cam.youPreview': 'You (preview)',
    'cam.videoOff': '📷 Video off',
    'cam.duration': 'Session duration',
    'cam.micOn': 'Mute microphone',
    'cam.micOff': 'Unmute microphone',
    'cam.videoToggleOff': 'Turn off video',
    'cam.videoToggleOn': 'Turn on video',
    'cam.closeCam': '⏹ Close',
    'cam.block': '🚫 Block',
    'cam.report': '⚠️ Report',
    'cam.err.notSupported': 'Your browser does not support the webcam (WebRTC/getUserMedia).',
    'cam.err.blocked': 'You blocked this user: unblock to use the webcam.',
    'cam.err.cooldown': 'You just sent a webcam invite, wait a few seconds.',
    'cam.err.already': 'You are already streaming the webcam.',
    'cam.err.denied':
      'Permission denied. Enable camera/microphone in your browser settings.',
    'cam.err.noDevice': 'No camera available on this device.',
    'cam.err.generic': 'Unable to access the webcam.',
    'cam.err.invite': 'Unable to send the invite (the user may have blocked you).',

    // config notice
    'config.title': '⚙️ Configuration required',
    'config.body':
      'Firebase configuration is missing. Create a .env file from .env.example and fill in:',
    'config.after': 'Then restart the dev server. Full instructions are in the README.',
  },
  it: {
    'app.tagline': 'Chatroom tematiche, chat privata e webcam opzionale.',
    'common.or': 'oppure',
    'common.cancel': 'Annulla',
    'common.close': 'Chiudi',
    'common.save': 'Salva',
    'common.send': 'Invia',
    'common.back': 'Indietro',
    'common.you': 'Tu',
    'common.guest': 'ospite',
    'common.loading': 'Caricamento…',
    'common.wait': 'Attendi…',
    'common.error': 'Qualcosa è andato storto.',

    'age.title': 'Solo per adulti — 18+',
    'age.body':
      'Questa piattaforma contiene stanze di dating e flirt (per adulti). Entrando confermi di avere almeno 18 anni. Nota: senza verifica documenti, l’età non è tecnicamente garantibile.',
    'age.confirm': 'Ho almeno 18 anni — entra',
    'age.exit': 'Esci',
    'age.exited': 'Sei uscito. Torna quando avrai 18 anni.',

    'auth.signin': 'Accedi',
    'auth.signup': 'Registrati',
    'auth.email': 'Email',
    'auth.password': 'Password',
    'auth.emailPlaceholder': 'tu@esempio.it',
    'auth.passwordHint': 'almeno 6 caratteri',
    'auth.create': 'Crea account',
    'auth.guest': '👤 Entra come ospite',
    'auth.guestHint':
      'Da ospite puoi leggere e chattare in pubblico. Registrati per nickname riservato, messaggi privati e webcam.',
    'auth.terms':
      'Accedendo accetti di usare la piattaforma nel rispetto degli altri utenti. Niente contenuti illegali, molestie o spam.',
    'auth.err.invalidEmail': 'Email non valida.',
    'auth.err.emailInUse': 'Esiste già un account con questa email. Prova ad accedere.',
    'auth.err.weakPassword': 'Password troppo debole (almeno 6 caratteri).',
    'auth.err.badCredentials': 'Email o password non corretti.',
    'auth.err.tooMany': 'Troppi tentativi. Riprova tra poco.',
    'auth.err.notAllowed': 'Accesso email/password non abilitato nel progetto Firebase.',
    'auth.err.generic': 'Errore di autenticazione. Riprova.',
    'auth.err.guest': 'Accesso ospite non riuscito. Riprova.',
    'auth.err.guestNotAllowed':
      'Accesso ospite non abilitato nel progetto Firebase (Authentication → Sign-in method → Anonimo).',

    'setup.title': 'Scegli il tuo nickname',
    'setup.subtitle': 'Sarà il nome con cui ti vedranno nelle stanze.',
    'setup.nickname': 'Nickname',
    'setup.nicknamePlaceholder': 'es. neon_rider',
    'setup.nicknameHint': '3-24 caratteri: lettere, numeri, . _ -',
    'setup.avatar': 'URL avatar (opzionale)',
    'setup.enter': 'Entra in chat',
    'setup.saving': 'Salvataggio…',
    'setup.exit': 'Esci',

    'username.tooShort': 'Il nickname deve avere almeno 3 caratteri.',
    'username.tooLong': 'Il nickname può avere al massimo 24 caratteri.',
    'username.invalid': 'Usa solo lettere, numeri, punto, trattino o underscore.',
    'username.taken': 'Questo nickname è già in uso. Scegline un altro.',

    'lobby.welcome': 'Benvenuto in RetroCam Chat 👋',
    'lobby.online': 'Online ora',
    'lobby.users': 'utenti',
    'rooms.title': 'Stanze',
    'rooms.enter': 'Entra',
    'rooms.online': 'online',

    'chat.placeholder': 'Scrivi un messaggio…',
    'chat.placeholderRoom': 'Messaggio in {room}…',
    'chat.loadingMsgs': 'Caricamento messaggi…',
    'chat.empty': 'Ancora nessun messaggio. Rompi il ghiaccio! 👋',
    'chat.reportMsg': 'Segnala messaggio',
    'chat.joined': '{user} è entrato nella stanza',
    'chat.left': '{user} ha lasciato la stanza',
    'chat.dupMessage': 'Hai appena inviato lo stesso messaggio.',
    'chat.tooFast': 'Stai scrivendo troppo in fretta, rallenta un attimo.',
    'chat.sendFailed': 'Invio non riuscito.',
    'chat.photo': '📷 Foto',
    'chat.attachImage': 'Invia immagine',
    'chat.uploading': 'Caricamento…',
    'chat.imageType': 'Sono ammesse solo immagini.',
    'chat.imageTooBig': 'Immagine troppo grande (max 5 MB).',
    'chat.uploadFailed': 'Caricamento immagine non riuscito.',

    'users.title': 'Utenti online',
    'users.empty': 'Nessuno qui per ora.',

    'status.online': 'Online',
    'status.busy': 'Occupato',
    'status.invisible': 'Invisibile',

    'profile.title': 'Profilo utente',
    'profile.you': 'Questo sei tu 🙂',
    'profile.pm': '💬 Messaggio privato',
    'profile.unblock': 'Sblocca utente',
    'profile.block': '🚫 Blocca utente',
    'profile.report': '⚠️ Segnala utente',
    'profile.guestSelf': '🔒 Registrati per inviare messaggi privati.',
    'profile.guestOther':
      'Questo utente è un ospite: i privati sono disponibili solo tra utenti registrati.',

    'pm.title': '💬 Messaggi privati',
    'pm.empty':
      'Nessuna conversazione privata. Apri il profilo di un utente online e premi “Messaggio privato”.',
    'pm.newConv': 'Nuova conversazione',
    'pm.selectConv': 'Seleziona una conversazione.',
    'pm.start': 'Inizia la conversazione con {user}.',
    'pm.placeholder': 'Messaggio a {user}…',
    'pm.noActive': 'Nessuna conversazione attiva.',
    'pm.cantSend': 'Non puoi inviare messaggi a questo utente.',

    'emoji.faces': 'Faccine',
    'emoji.gestures': 'Gesti',
    'emoji.hearts': 'Cuori e simboli',
    'emoji.misc': 'Varie',

    'report.title': 'Segnala abuso',
    'report.done': 'Grazie. La segnalazione è stata inviata allo staff.',
    'report.reporting': 'Stai segnalando:',
    'report.reason': 'Motivo',
    'report.details': 'Dettagli (opzionale)',
    'report.detailsPlaceholder': 'Cosa è successo?',
    'report.send': 'Invia segnalazione',
    'report.sending': 'Invio…',
    'report.reasonHarass': 'Molestie o insulti',
    'report.reasonSpam': 'Spam o pubblicità',
    'report.reasonSexual': 'Contenuti sessuali non richiesti',
    'report.reasonThreat': 'Minaccia o comportamento pericoloso',
    'report.reasonOther': 'Altro',
    'report.userLabel': 'utente {name}',
    'report.msgLabel': 'messaggio di {name}',

    'block.title': 'Bloccare {name}?',
    'block.body':
      'Non vedrai più i suoi messaggi pubblici e non potrà inviarti messaggi privati né inviti webcam. Puoi sbloccarlo in seguito dalle impostazioni.',
    'block.confirm': 'Blocca utente',

    'settings.title': 'Impostazioni',
    'settings.avatarHint': "Modifica l'avatar incollando un URL immagine.",
    'settings.guestAvatarHint': 'Avatar e nickname riservato disponibili dopo la registrazione.',
    'settings.status': 'Stato',
    'settings.invisibleHint':
      'Da invisibile non compari nella lista utenti né nei conteggi, ma continui a ricevere i messaggi.',
    'settings.sound': 'Suono nuovi messaggi',
    'settings.soundHint': 'Un breve segnale acustico per i nuovi messaggi.',
    'settings.blocked': 'Utenti bloccati',
    'settings.noBlocked': 'Nessun utente bloccato.',
    'settings.unblock': 'Sblocca',
    'settings.signout': "Esci dall'account",
    'settings.language': 'Lingua',

    'upgrade.title': '⭐ Diventa membro',
    'upgrade.body':
      'Registrati mantenendo questo account: sblocchi nickname riservato, messaggi privati, webcam e avatar.',
    'upgrade.nickname': 'Nickname (3-24 caratteri)',
    'upgrade.submit': 'Registrati e salva il nickname',
    'upgrade.submitting': 'Registrazione…',
    'upgrade.done':
      '✅ Account registrato! Ora hai nickname riservato, messaggi privati e webcam.',
    'upgrade.err.emailInUse': 'Esiste già un account con questa email.',
    'upgrade.err.invalidEmail': 'Email non valida.',
    'upgrade.err.weakPassword': 'Password troppo debole (almeno 6 caratteri).',
    'upgrade.err.generic': 'Registrazione non riuscita. Riprova.',
    'upgrade.nameRetry': ' Account registrato: puoi scegliere un altro nickname qui sopra.',

    'header.register': '⭐ Registrati',
    'header.pm': 'Messaggi privati',
    'header.settings': 'Impostazioni',
    'tab.rooms': 'Stanze',
    'tab.chat': 'Chat',
    'tab.users': 'Utenti',
    'tab.private': 'Privati',

    'cam.notSupported': 'Webcam non supportata da questo browser',
    'cam.open': 'Apri webcam',
    'cam.alreadyOn': 'Webcam già attiva',
    'cam.consentTitle': 'Apri webcam — leggi prima questo',
    'cam.privacy':
      'La piattaforma non registra né salva webcam o audio. Tuttavia, non è tecnicamente possibile impedire a un altro utente di registrare lo schermo o usare un dispositivo esterno. Usa la webcam solo con persone di cui ti fidi.',
    'cam.targetIntro': 'Stai per aprire la tua webcam verso {name}. La webcam è ',
    'cam.notRecorded': 'non registrata dalla piattaforma',
    'cam.understood': 'Ho capito e accetto di procedere.',
    'cam.videoOnly': '📷 Solo video',
    'cam.videoAudio': '🎙️ Video + audio',
    'cam.inviteText': '{name} vuole aprire la webcam',
    'cam.inviteWithAudio': ' (con audio)',
    'cam.inviteHint':
      'Accettando vedrai il suo video. Potrai chiudere o segnalare in qualsiasi momento.',
    'cam.accept': 'Accetta',
    'cam.decline': 'Rifiuta',
    'cam.declined': 'Invito webcam rifiutato.',
    'cam.waiting': 'In attesa che {name} accetti l’invito…',
    'cam.webcamOf': 'Webcam di {name}',
    'cam.connecting': 'Connessione in corso…',
    'cam.live': '● LIVE',
    'cam.noRecordingNote':
      'Webcam non registrata dalla piattaforma. Nessuno stream viene salvato sui server.',
    'cam.recordingWarning': 'Registrazione e diffusione non autorizzata sono vietate',
    'cam.youPreview': 'Tu (anteprima)',
    'cam.videoOff': '📷 Video disattivato',
    'cam.duration': 'Durata sessione',
    'cam.micOn': 'Disattiva microfono',
    'cam.micOff': 'Attiva microfono',
    'cam.videoToggleOff': 'Disattiva video',
    'cam.videoToggleOn': 'Attiva video',
    'cam.closeCam': '⏹ Chiudi',
    'cam.block': '🚫 Blocca',
    'cam.report': '⚠️ Segnala',
    'cam.err.notSupported': 'Il tuo browser non supporta la webcam (WebRTC/getUserMedia).',
    'cam.err.blocked': 'Hai bloccato questo utente: sbloccalo per usare la webcam.',
    'cam.err.cooldown': 'Hai appena inviato un invito webcam, attendi qualche secondo.',
    'cam.err.already': 'Stai già trasmettendo la webcam.',
    'cam.err.denied':
      'Permesso negato. Abilita fotocamera/microfono nelle impostazioni del browser.',
    'cam.err.noDevice': 'Nessuna fotocamera disponibile su questo dispositivo.',
    'cam.err.generic': 'Impossibile accedere alla webcam.',
    'cam.err.invite': "Impossibile inviare l'invito (l'utente potrebbe averti bloccato).",

    'config.title': '⚙️ Configurazione necessaria',
    'config.body':
      'La configurazione Firebase non è impostata. Crea un file .env partendo da .env.example e inserisci:',
    'config.after': 'Poi riavvia il dev server. Le istruzioni complete sono nel README.',
  },
}

interface I18nValue {
  lang: Lang
  setLang: (l: Lang) => void
  t: (key: string, vars?: Record<string, string | number>) => string
}

const I18nContext = createContext<I18nValue | undefined>(undefined)

function detectInitial(): Lang {
  const saved = localStorage.getItem(STORAGE_KEY)
  if (saved === 'en' || saved === 'it') return saved
  return 'en' // inglese di default
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(detectInitial)

  const setLang = useCallback((l: Lang) => {
    localStorage.setItem(STORAGE_KEY, l)
    setLangState(l)
  }, [])

  const t = useCallback(
    (key: string, vars?: Record<string, string | number>) => {
      let str = dict[lang][key] ?? dict.en[key] ?? key
      if (vars) {
        for (const k of Object.keys(vars)) {
          str = str.replace(new RegExp(`\\{${k}\\}`, 'g'), String(vars[k]))
        }
      }
      return str
    },
    [lang],
  )

  const value = useMemo<I18nValue>(() => ({ lang, setLang, t }), [lang, setLang, t])
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useI18n(): I18nValue {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useI18n deve essere usato dentro <I18nProvider>')
  return ctx
}

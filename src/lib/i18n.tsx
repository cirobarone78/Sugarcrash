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
    'seo.h2': 'What is CamRooms?',
    'seo.p1':
      'CamRooms is a real-time chat platform — the spirit of the old webchats, but modern and secure. Join themed public rooms, chat in groups, see who is online, send private 1:1 messages, share your webcam and meet new people at random with cam-roulette.',
    'seo.featTitle': 'What you can do',
    'seo.f1': 'Themed public chatrooms in real time',
    'seo.f2': 'Private 1:1 messages, with images',
    'seo.f3': 'Optional webcam (WebRTC) in rooms and 1:1',
    'seo.f4': 'Cam-roulette: meet a stranger on cam, tap Next',
    'seo.f5': 'Friends list, blocking and reporting for safety',
    'seo.free': 'Free to use. Guest access or sign up to keep your chats across devices. Adults only (18+).',
    'legal.terms': 'Terms',
    'legal.privacy': 'Privacy',
    'legal.guidelines': 'Guidelines',
    'legal.title': 'Terms & Privacy',
    'legal.tab.terms': 'Terms',
    'legal.tab.privacy': 'Privacy',
    'legal.tab.guidelines': 'Guidelines',
    'legal.settings': 'Terms, Privacy & Guidelines',
    'legal.acceptNote': 'By entering you accept the Terms and the Privacy Policy.',
    'age.exited': 'You have left. Come back when you are 18+.',

    // auth
    'auth.signin': 'Sign in',
    'auth.signup': 'Sign up',
    'auth.email': 'Email',
    'auth.password': 'Password',
    'auth.emailPlaceholder': 'you@example.com',
    'auth.passwordHint': 'at least 6 characters',
    'auth.create': 'Create account',
    'auth.guest': 'Enter as guest',
    'auth.guestHint':
      'As a guest you can read and chat in public, but your account stays on this device only.',
    'auth.registerPerk':
      'Sign up to keep your private chats on all your devices, get a reserved nickname and a friends list.',
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
    'setup.guestTitle': 'One quick step',
    'setup.guestSubtitle': 'Tell us your sex to enter the rooms.',
    'setup.sex': 'Your sex',
    'setup.sexHint': 'Required. Shown as a small badge next to your name.',
    'setup.sexRequired': 'Please select your sex to continue.',
    'setup.age': 'Age (optional)',
    'setup.ageInvalid': 'Age must be a whole number between 18 and 120.',
    'setup.country': 'Country (optional)',
    'setup.countryPlaceholder': 'e.g. Italy',

    // sex
    'sex.male': 'Male',
    'sex.female': 'Female',
    'sex.couple': 'Couple',
    'sex.undisclosed': 'Undisclosed',
    'sex.short.male': 'M',
    'sex.short.female': 'F',
    'sex.short.couple': 'C',
    'sex.short.undisclosed': '?',

    // username validation
    'username.tooShort': 'Nickname must be at least 3 characters.',
    'username.tooLong': 'Nickname can be at most 24 characters.',
    'username.invalid': 'Use only letters, numbers, dot, dash or underscore.',
    'username.taken': 'This nickname is already taken. Choose another.',

    // lobby / rooms
    'lobby.welcome': 'Welcome to CamRooms',
    'lobby.online': 'Online now',
    'lobby.users': 'users',
    'rooms.title': 'Rooms',
    'rooms.hide': 'Hide rooms menu',
    'rooms.show': 'Show rooms menu',
    'rooms.enter': 'Enter',
    'rooms.online': 'online',
    'rooms.private': 'Private rooms',
    'rooms.create': 'Create private room',
    'rooms.createTitle': 'Create a private room',
    'rooms.name': 'Room name',
    'rooms.namePlaceholder': 'e.g. My room',
    'rooms.password': 'Password',
    'rooms.passwordHint': 'Share it only with whom you want to let in.',
    'rooms.createBtn': 'Create room',
    'rooms.creating': 'Creating…',
    'rooms.joinTitle': 'Enter «{room}»',
    'rooms.enterPassword': 'Enter the room password',
    'rooms.joinBtn': 'Enter',
    'rooms.joining': 'Entering…',
    'rooms.wrongPassword': 'Wrong password.',
    'rooms.nameTooShort': 'Room name too short.',
    'rooms.pwdTooShort': 'Password too short (min 3 characters).',
    'rooms.createFailed': 'Could not create the room.',
    'rooms.noPrivate': 'No private rooms yet. Create the first one!',
    'rooms.ownerTag': 'yours',
    'rooms.imagesAllowed': 'Images allowed',

    // chat
    'chat.placeholder': 'Type a message…',
    'chat.placeholderRoom': 'Message in {room}…',
    'chat.loadingMsgs': 'Loading messages…',
    'chat.empty': 'No messages yet. Break the ice!',
    'chat.reportMsg': 'Report message',
    'chat.joined': '{user} joined the room',
    'chat.left': '{user} left the room',
    'chat.dupMessage': 'You just sent the same message.',
    'chat.tooFast': 'You are typing too fast, slow down a little.',
    'chat.sendFailed': 'Send failed.',
    'chat.photo': 'Photo',
    'chat.attachImage': 'Send image',
    'chat.uploading': 'Uploading…',
    'chat.imageType': 'Only image files are allowed.',
    'chat.imageTooBig': 'Image too large (max 5 MB).',
    'chat.uploadFailed': 'Image upload failed.',
    'chat.invalidImage': '[invalid image]',
    'chat.viewImage': 'View image',
    'roulette.title': 'Cam Roulette',
    'roulette.launch': 'Cam Roulette',
    'roulette.intro':
      'Get matched with a random person on webcam. Tap Next anytime to move on to the next one.',
    'roulette.rules':
      'Be respectful. Nudity toward non-consenting people, minors or illegal content are forbidden and will get you banned. You can Report or Block anyone at any time.',
    'roulette.start': 'Start',
    'roulette.searching': 'Looking for someone…',
    'roulette.next': 'Next',
    'roulette.stop': 'Stop',
    'roulette.stranger': 'Stranger',
    'roulette.guestOnly': 'Sign up to use Cam Roulette.',
    'roulette.pref': 'I want to meet',
    'roulette.pref.any': 'Anyone',
    'roulette.pref.female': 'Women',
    'roulette.pref.male': 'Men',
    'roulette.pref.couple': 'Couples',
    'roulette.prefHint': 'Matching is mutual: you only meet people whose choice matches yours too.',
    'friend.add': 'Add friend',
    'friend.pending': 'Request sent',
    'friend.cancel': 'Cancel request',
    'friend.accept': 'Accept request',
    'friend.decline': 'Decline',
    'friend.remove': 'Remove friend',
    'friend.friendsChip': 'Friends',
    'friend.friends': 'Friends',
    'friend.requests': 'Friend requests',
    'friend.none': 'No friends yet.',
    'friend.guestOnly': 'Sign up to add friends.',
    'online.count': '{n} online',
    'roulette.live': '{n} in roulette now',
    'roulette.liveFirst': 'Be the first — start and wait for someone!',
    'share.room': 'Share',
    'share.invite': 'Invite a friend',
    'share.copied': 'Link copied to clipboard!',
    'share.failed': 'Could not share the link.',
    'share.roomText': 'Join the {room} room on CamRooms',
    'share.inviteText': 'Come chat with me on CamRooms',

    // online users
    'users.title': 'Online users',
    'users.empty': 'Nobody here yet.',
    'users.filter.all': 'All',
    'users.filter.male': 'Men',
    'users.filter.female': 'Women',
    'users.filter.couple': 'Couples',
    'users.sort.az': 'A-Z',
    'users.sort.cam': 'Webcam first',

    // status
    'status.online': 'Online',
    'status.busy': 'Busy',
    'status.invisible': 'Invisible',

    // user profile
    'profile.title': 'User profile',
    'profile.you': 'This is you',
    'profile.pm': 'Private message',
    'profile.unblock': 'Unblock user',
    'profile.block': 'Block user',
    'profile.report': 'Report user',
    'profile.guestSelf': 'Sign up to send private messages.',
    'profile.guestOther':
      'This user is a guest: private chat is available only between registered users.',

    // private chat
    'pm.title': 'Private messages',
    'pm.empty':
      'No private conversations. Open an online user’s profile and tap “Private message”.',
    'pm.newConv': 'New conversation',
    'pm.delete': 'Delete chat',
    'pm.deleteConfirm': 'Delete this conversation? It will be removed from your list and history.',
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
    'settings.notify': 'System notifications',
    'settings.notifyHint':
      'Show a system alert for private messages and webcam invites when the app is in the background.',
    'settings.notifyDenied': 'Notifications are blocked in your browser settings.',
    'pm.newMessage': 'New message',
    'settings.blocked': 'Blocked users',
    'settings.noBlocked': 'No blocked users.',
    'settings.unblock': 'Unblock',
    'settings.signout': 'Sign out',
    'settings.language': 'Language',
    'settings.sex': 'Sex, age & country',
    'settings.sexSaved': 'Profile updated.',

    // upgrade
    'upgrade.title': 'Become a member',
    'upgrade.body':
      'Sign up keeping this account: unlock a reserved nickname, private messages, webcam and avatar.',
    'upgrade.nickname': 'Nickname (3-24 characters)',
    'upgrade.submit': 'Sign up and save nickname',
    'upgrade.submitting': 'Signing up…',
    'upgrade.done':
      'Account registered! You now have a reserved nickname, private messages and webcam.',
    'upgrade.err.emailInUse': 'An account with this email already exists.',
    'upgrade.err.invalidEmail': 'Invalid email.',
    'upgrade.err.weakPassword': 'Password too weak (at least 6 characters).',
    'upgrade.err.generic': 'Sign-up failed. Try again.',
    'upgrade.nameRetry': ' Account registered: you can pick another nickname above.',

    // header / tabs
    'header.register': 'Sign up',
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
    'cam.videoOnly': 'Video only',
    'cam.videoAudio': 'Video + audio',
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
    'cam.live': 'LIVE',
    'cam.noRecordingNote':
      'Webcam not recorded by the platform. No stream is saved on the servers.',
    'cam.recordingWarning': 'Unauthorized recording and sharing are prohibited',
    'cam.youPreview': 'You (preview)',
    'cam.videoOff': 'Video off',
    'cam.duration': 'Session duration',
    'cam.micOn': 'Mute microphone',
    'cam.micOff': 'Unmute microphone',
    'cam.videoToggleOff': 'Turn off video',
    'cam.videoToggleOn': 'Turn on video',
    'cam.closeCam': 'Close',
    'cam.block': 'Block',
    'cam.report': 'Report',
    'cam.err.notSupported': 'Your browser does not support the webcam (WebRTC/getUserMedia).',
    'cam.err.blocked': 'You blocked this user: unblock to use the webcam.',
    'cam.err.cooldown': 'You just sent a webcam invite, wait a few seconds.',
    'cam.err.already': 'You are already streaming the webcam.',
    'cam.err.denied':
      'Permission denied. Enable camera/microphone in your browser settings.',
    'cam.err.noDevice': 'No camera available on this device.',
    'cam.err.generic': 'Unable to access the webcam.',
    'cam.err.invite': 'Unable to send the invite (the user may have blocked you).',
    'cam.broadcasting': 'Your camera is on',
    'cam.stop': 'Stop',

    // webcam — public broadcast (P5)
    'cam.goLive': 'Go live',
    'cam.goLiveGuest': 'Sign up to broadcast your webcam',
    'cam.goLiveTitle': 'Go live in the room — read this first',
    'cam.goLiveIntro': 'You are about to broadcast to everyone in {room}. The broadcast is ',
    'cam.modeVideo': 'Video + audio',
    'cam.modeAudioOnly': 'Audio only',
    'cam.onAir': 'On air',
    'cam.viewers': 'Viewers',
    'cam.noViewers': 'No viewers yet.',
    'cam.kick': 'Remove viewer',
    'cam.full': 'This broadcast is full.',
    'cam.watch': 'Watch webcam',
    'cam.stopWatching': 'Stop watching',
    'cam.liveGlyph': 'Live now',

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
    'seo.h2': 'Cos’è CamRooms?',
    'seo.p1':
      'CamRooms è una piattaforma di chat in tempo reale — lo spirito delle vecchie webchat, ma moderna e sicura. Entra nelle stanze pubbliche a tema, chatta in gruppo, guarda chi è online, invia messaggi privati 1:1, condividi la tua webcam e conosci gente nuova a caso con la cam-roulette.',
    'seo.featTitle': 'Cosa puoi fare',
    'seo.f1': 'Chatroom pubbliche a tema in tempo reale',
    'seo.f2': 'Messaggi privati 1:1, con immagini',
    'seo.f3': 'Webcam opzionale (WebRTC) nelle stanze e 1:1',
    'seo.f4': 'Cam-roulette: incontra uno sconosciuto in cam, tocca Avanti',
    'seo.f5': 'Lista amici, blocco e segnalazione per la sicurezza',
    'seo.free': 'Gratis. Entra come ospite o registrati per conservare le chat su tutti i dispositivi. Solo per adulti (18+).',
    'legal.terms': 'Termini',
    'legal.privacy': 'Privacy',
    'legal.guidelines': 'Linee guida',
    'legal.title': 'Termini e Privacy',
    'legal.tab.terms': 'Termini',
    'legal.tab.privacy': 'Privacy',
    'legal.tab.guidelines': 'Linee guida',
    'legal.settings': 'Termini, Privacy e Linee guida',
    'legal.acceptNote': 'Entrando accetti i Termini e l’Informativa sulla privacy.',
    'age.exited': 'Sei uscito. Torna quando avrai 18 anni.',

    'auth.signin': 'Accedi',
    'auth.signup': 'Registrati',
    'auth.email': 'Email',
    'auth.password': 'Password',
    'auth.emailPlaceholder': 'tu@esempio.it',
    'auth.passwordHint': 'almeno 6 caratteri',
    'auth.create': 'Crea account',
    'auth.guest': 'Entra come ospite',
    'auth.guestHint':
      'Da ospite puoi leggere e chattare in pubblico, ma l’account resta solo su questo dispositivo.',
    'auth.registerPerk':
      'Registrati per conservare le chat private su tutti i tuoi dispositivi, avere un nickname riservato e la lista amici.',
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
    'setup.guestTitle': 'Un passaggio veloce',
    'setup.guestSubtitle': 'Indica il tuo sesso per entrare nelle stanze.',
    'setup.sex': 'Il tuo sesso',
    'setup.sexHint': 'Obbligatorio. Mostrato come piccolo badge accanto al nome.',
    'setup.sexRequired': 'Seleziona il tuo sesso per continuare.',
    'setup.age': 'Età (opzionale)',
    'setup.ageInvalid': "L'età dev'essere un numero intero tra 18 e 120.",
    'setup.country': 'Paese (opzionale)',
    'setup.countryPlaceholder': 'es. Italia',

    'sex.male': 'Uomo',
    'sex.female': 'Donna',
    'sex.couple': 'Coppia',
    'sex.undisclosed': 'Non dichiarato',
    'sex.short.male': 'U',
    'sex.short.female': 'D',
    'sex.short.couple': 'C',
    'sex.short.undisclosed': '?',

    'username.tooShort': 'Il nickname deve avere almeno 3 caratteri.',
    'username.tooLong': 'Il nickname può avere al massimo 24 caratteri.',
    'username.invalid': 'Usa solo lettere, numeri, punto, trattino o underscore.',
    'username.taken': 'Questo nickname è già in uso. Scegline un altro.',

    'lobby.welcome': 'Benvenuto in CamRooms',
    'lobby.online': 'Online ora',
    'lobby.users': 'utenti',
    'rooms.title': 'Stanze',
    'rooms.hide': 'Nascondi menu stanze',
    'rooms.show': 'Mostra menu stanze',
    'rooms.enter': 'Entra',
    'rooms.online': 'online',
    'rooms.private': 'Stanze private',
    'rooms.create': 'Crea stanza privata',
    'rooms.createTitle': 'Crea una stanza privata',
    'rooms.name': 'Nome stanza',
    'rooms.namePlaceholder': 'es. La mia stanza',
    'rooms.password': 'Password',
    'rooms.passwordHint': 'Condividila solo con chi vuoi far entrare.',
    'rooms.createBtn': 'Crea stanza',
    'rooms.creating': 'Creazione…',
    'rooms.joinTitle': 'Entra in «{room}»',
    'rooms.enterPassword': 'Inserisci la password della stanza',
    'rooms.joinBtn': 'Entra',
    'rooms.joining': 'Ingresso…',
    'rooms.wrongPassword': 'Password errata.',
    'rooms.nameTooShort': 'Nome stanza troppo corto.',
    'rooms.pwdTooShort': 'Password troppo corta (min 3 caratteri).',
    'rooms.createFailed': 'Impossibile creare la stanza.',
    'rooms.noPrivate': 'Ancora nessuna stanza privata. Crea la prima!',
    'rooms.ownerTag': 'tua',
    'rooms.imagesAllowed': 'Immagini consentite',

    'chat.placeholder': 'Scrivi un messaggio…',
    'chat.placeholderRoom': 'Messaggio in {room}…',
    'chat.loadingMsgs': 'Caricamento messaggi…',
    'chat.empty': 'Ancora nessun messaggio. Rompi il ghiaccio!',
    'chat.reportMsg': 'Segnala messaggio',
    'chat.joined': '{user} è entrato nella stanza',
    'chat.left': '{user} ha lasciato la stanza',
    'chat.dupMessage': 'Hai appena inviato lo stesso messaggio.',
    'chat.tooFast': 'Stai scrivendo troppo in fretta, rallenta un attimo.',
    'chat.sendFailed': 'Invio non riuscito.',
    'chat.photo': 'Foto',
    'chat.attachImage': 'Invia immagine',
    'chat.uploading': 'Caricamento…',
    'chat.imageType': 'Sono ammesse solo immagini.',
    'chat.imageTooBig': 'Immagine troppo grande (max 5 MB).',
    'chat.uploadFailed': 'Caricamento immagine non riuscito.',
    'chat.invalidImage': '[immagine non valida]',
    'chat.viewImage': 'Apri immagine',
    'roulette.title': 'Cam Roulette',
    'roulette.launch': 'Cam Roulette',
    'roulette.intro':
      'Vieni abbinato a una persona a caso in webcam. Tocca Avanti quando vuoi per passare alla successiva.',
    'roulette.rules':
      'Rispetta gli altri. Nudità verso persone non consenzienti, minori o contenuti illegali sono vietati e comportano il ban. Puoi Segnalare o Bloccare chiunque in qualsiasi momento.',
    'roulette.start': 'Inizia',
    'roulette.searching': 'Sto cercando qualcuno…',
    'roulette.next': 'Avanti',
    'roulette.stop': 'Stop',
    'roulette.stranger': 'Sconosciuto',
    'roulette.guestOnly': 'Registrati per usare Cam Roulette.',
    'roulette.pref': 'Voglio incontrare',
    'roulette.pref.any': 'Tutti',
    'roulette.pref.female': 'Donne',
    'roulette.pref.male': 'Uomini',
    'roulette.pref.couple': 'Coppie',
    'roulette.prefHint': 'L’abbinamento è reciproco: incontri solo chi ha scelto in modo compatibile con te.',
    'friend.add': 'Aggiungi agli amici',
    'friend.pending': 'Richiesta inviata',
    'friend.cancel': 'Annulla richiesta',
    'friend.accept': 'Accetta richiesta',
    'friend.decline': 'Rifiuta',
    'friend.remove': 'Rimuovi amico',
    'friend.friendsChip': 'Amici',
    'friend.friends': 'Amici',
    'friend.requests': 'Richieste di amicizia',
    'friend.none': 'Ancora nessun amico.',
    'friend.guestOnly': 'Registrati per aggiungere amici.',
    'online.count': '{n} online',
    'roulette.live': '{n} in roulette adesso',
    'roulette.liveFirst': 'Sii il primo — avvia e aspetta qualcuno!',
    'share.room': 'Condividi',
    'share.invite': 'Invita un amico',
    'share.copied': 'Link copiato negli appunti!',
    'share.failed': 'Impossibile condividere il link.',
    'share.roomText': 'Entra nella stanza {room} su CamRooms',
    'share.inviteText': 'Vieni a chattare con me su CamRooms',

    'users.title': 'Utenti online',
    'users.empty': 'Nessuno qui per ora.',
    'users.filter.all': 'Tutti',
    'users.filter.male': 'Uomini',
    'users.filter.female': 'Donne',
    'users.filter.couple': 'Coppie',
    'users.sort.az': 'A-Z',
    'users.sort.cam': 'Prima webcam',

    'status.online': 'Online',
    'status.busy': 'Occupato',
    'status.invisible': 'Invisibile',

    'profile.title': 'Profilo utente',
    'profile.you': 'Questo sei tu',
    'profile.pm': 'Messaggio privato',
    'profile.unblock': 'Sblocca utente',
    'profile.block': 'Blocca utente',
    'profile.report': 'Segnala utente',
    'profile.guestSelf': 'Registrati per inviare messaggi privati.',
    'profile.guestOther':
      'Questo utente è un ospite: i privati sono disponibili solo tra utenti registrati.',

    'pm.title': 'Messaggi privati',
    'pm.empty':
      'Nessuna conversazione privata. Apri il profilo di un utente online e premi “Messaggio privato”.',
    'pm.newConv': 'Nuova conversazione',
    'pm.delete': 'Elimina chat',
    'pm.deleteConfirm': 'Eliminare questa conversazione? Verrà rimossa dal tuo elenco e dalla cronologia.',
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
    'settings.notify': 'Notifiche di sistema',
    'settings.notifyHint':
      'Mostra un avviso di sistema per messaggi privati e inviti webcam quando l’app è in background.',
    'settings.notifyDenied': 'Le notifiche sono bloccate nelle impostazioni del browser.',
    'pm.newMessage': 'Nuovo messaggio',
    'settings.blocked': 'Utenti bloccati',
    'settings.noBlocked': 'Nessun utente bloccato.',
    'settings.unblock': 'Sblocca',
    'settings.signout': "Esci dall'account",
    'settings.language': 'Lingua',
    'settings.sex': 'Sesso, età e paese',
    'settings.sexSaved': 'Profilo aggiornato.',

    'upgrade.title': 'Diventa membro',
    'upgrade.body':
      'Registrati mantenendo questo account: sblocchi nickname riservato, messaggi privati, webcam e avatar.',
    'upgrade.nickname': 'Nickname (3-24 caratteri)',
    'upgrade.submit': 'Registrati e salva il nickname',
    'upgrade.submitting': 'Registrazione…',
    'upgrade.done':
      'Account registrato! Ora hai nickname riservato, messaggi privati e webcam.',
    'upgrade.err.emailInUse': 'Esiste già un account con questa email.',
    'upgrade.err.invalidEmail': 'Email non valida.',
    'upgrade.err.weakPassword': 'Password troppo debole (almeno 6 caratteri).',
    'upgrade.err.generic': 'Registrazione non riuscita. Riprova.',
    'upgrade.nameRetry': ' Account registrato: puoi scegliere un altro nickname qui sopra.',

    'header.register': 'Registrati',
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
    'cam.videoOnly': 'Solo video',
    'cam.videoAudio': 'Video + audio',
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
    'cam.live': 'LIVE',
    'cam.noRecordingNote':
      'Webcam non registrata dalla piattaforma. Nessuno stream viene salvato sui server.',
    'cam.recordingWarning': 'Registrazione e diffusione non autorizzata sono vietate',
    'cam.youPreview': 'Tu (anteprima)',
    'cam.videoOff': 'Video disattivato',
    'cam.duration': 'Durata sessione',
    'cam.micOn': 'Disattiva microfono',
    'cam.micOff': 'Attiva microfono',
    'cam.videoToggleOff': 'Disattiva video',
    'cam.videoToggleOn': 'Attiva video',
    'cam.closeCam': 'Chiudi',
    'cam.block': 'Blocca',
    'cam.report': 'Segnala',
    'cam.err.notSupported': 'Il tuo browser non supporta la webcam (WebRTC/getUserMedia).',
    'cam.err.blocked': 'Hai bloccato questo utente: sbloccalo per usare la webcam.',
    'cam.err.cooldown': 'Hai appena inviato un invito webcam, attendi qualche secondo.',
    'cam.err.already': 'Stai già trasmettendo la webcam.',
    'cam.err.denied':
      'Permesso negato. Abilita fotocamera/microfono nelle impostazioni del browser.',
    'cam.err.noDevice': 'Nessuna fotocamera disponibile su questo dispositivo.',
    'cam.err.generic': 'Impossibile accedere alla webcam.',
    'cam.err.invite': "Impossibile inviare l'invito (l'utente potrebbe averti bloccato).",
    'cam.broadcasting': 'La tua webcam è attiva',
    'cam.stop': 'Ferma',

    // webcam — broadcast pubblico (P5)
    'cam.goLive': 'Vai in onda',
    'cam.goLiveGuest': 'Registrati per trasmettere la webcam',
    'cam.goLiveTitle': 'Vai in onda nella stanza — leggi prima questo',
    'cam.goLiveIntro': 'Stai per trasmettere a tutti in {room}. La trasmissione è ',
    'cam.modeVideo': 'Video + audio',
    'cam.modeAudioOnly': 'Solo audio',
    'cam.onAir': 'Sei in onda',
    'cam.viewers': 'Spettatori',
    'cam.noViewers': 'Ancora nessuno spettatore.',
    'cam.kick': 'Espelli spettatore',
    'cam.full': 'Questa trasmissione è al completo.',
    'cam.watch': 'Guarda la webcam',
    'cam.stopWatching': 'Smetti di guardare',
    'cam.liveGlyph': 'In onda ora',

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

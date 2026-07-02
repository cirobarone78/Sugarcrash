import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import {
  addDoc,
  collection,
  doc,
  getDoc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore'
import { db } from '../lib/firebase'
import { useAuth } from './AuthContext'
import { usePresence } from './PresenceContext'
import { useBlocks } from '../hooks/useBlocks'
import {
  WebcamPeer,
  isWebRTCSupported,
  applyLowBitrate,
  PUBLIC_CAM_CAP,
  LOW_VIDEO_CONSTRAINTS,
} from '../lib/webrtc'
import { playInviteSound } from '../lib/sounds'
import { orderedPair, tsToMillis } from '../lib/utils'
import { privateThreadId } from '../lib/threads'
import { useI18n } from '../lib/i18n'
import type { WebcamKind, WebcamSession, WebcamStatus } from '../lib/types'

const CONSENT_KEY = 'retrocam.webcam.consent'
const INVITE_COOLDOWN_MS = 15000

export interface OutgoingState {
  session: WebcamSession
  localStream: MediaStream
  audioEnabled: boolean
  videoEnabled: boolean
  connState: RTCPeerConnectionState
}

export interface IncomingState {
  session: WebcamSession
  remoteStream: MediaStream | null
  connState: RTCPeerConnectionState
}

export interface PendingInvite {
  session: WebcamSession
  fromUsername: string
}

export type BroadcastMode = 'video' | 'audio'

export interface BroadcastViewer {
  sessionId: string
  viewerId: string
  connState: RTCPeerConnectionState
}

/** Stato del broadcast pubblico (lato broadcaster). */
export interface BroadcastState {
  mode: BroadcastMode
  stream: MediaStream
  videoEnabled: boolean
  audioEnabled: boolean
  viewers: BroadcastViewer[]
}

/** Stato "sto guardando" un broadcast pubblico (lato spettatore). */
export interface WatchState {
  broadcasterId: string
  sessionId: string
  mode: BroadcastMode
  remoteStream: MediaStream | null
  connState: RTCPeerConnectionState
}

interface WebcamContextValue {
  supported: boolean
  hasConsent: boolean
  outgoing: OutgoingState | null
  incoming: IncomingState | null
  pendingInvite: PendingInvite | null
  error: string | null
  clearError: () => void
  giveConsent: () => Promise<void>
  startBroadcast: (viewerId: string, withAudio: boolean) => Promise<void>
  acceptInvite: () => Promise<void>
  declineInvite: () => Promise<void>
  toggleMic: () => void
  toggleVideo: () => void
  endOutgoing: () => Promise<void>
  endIncoming: () => Promise<void>
  // Broadcast pubblico (P5)
  broadcast: BroadcastState | null
  goLive: (mode: BroadcastMode) => Promise<void>
  stopLive: () => Promise<void>
  kickViewer: (sessionId: string) => Promise<void>
  toggleBroadcastMic: () => void
  toggleBroadcastVideo: () => void
  // Guardare un broadcast pubblico (P5)
  watching: WatchState | null
  watchBroadcast: (broadcasterId: string, mode: BroadcastMode) => Promise<void>
  stopWatching: () => Promise<void>
}

const WebcamContext = createContext<WebcamContextValue | undefined>(undefined)

function mapSession(id: string, d: Record<string, unknown>): WebcamSession {
  return {
    id,
    thread_id: (d.thread_id as string) ?? '',
    broadcaster_id: (d.broadcaster_id as string) ?? '',
    viewer_id: (d.viewer_id as string) ?? '',
    participants: (d.participants as string[]) ?? [],
    audio_enabled: Boolean(d.audio_enabled),
    // Back-compat: i documenti senza `kind` sono inviti 1:1.
    kind: (d.kind as WebcamKind) ?? 'invite',
    status: (d.status as WebcamStatus) ?? 'pending',
    created_at: tsToMillis(d.created_at),
    accepted_at: d.accepted_at ? tsToMillis(d.accepted_at) : null,
    ended_at: d.ended_at ? tsToMillis(d.ended_at) : null,
  }
}

export function WebcamProvider({ children }: { children: ReactNode }) {
  const { profile, isGuest } = useAuth()
  const { isBlocked, blockedIds } = useBlocks()
  const { setBroadcast: setPresenceCam } = usePresence()
  const { t } = useI18n()
  const supported = isWebRTCSupported()

  const [hasConsent, setHasConsent] = useState(
    () => localStorage.getItem(CONSENT_KEY) === 'true',
  )
  const [outgoing, setOutgoing] = useState<OutgoingState | null>(null)
  const [incoming, setIncoming] = useState<IncomingState | null>(null)
  const [pendingInvite, setPendingInvite] = useState<PendingInvite | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Broadcast pubblico (lato broadcaster) e visione (lato spettatore).
  const [broadcast, setBroadcastState] = useState<BroadcastState | null>(null)
  const [isLive, setIsLive] = useState(false)
  const [watching, setWatching] = useState<WatchState | null>(null)
  // Stream condiviso e mappa dei peer per-spettatore.
  const broadcastStreamRef = useRef<MediaStream | null>(null)
  const broadcastPeers = useRef<Map<string, WebcamPeer>>(new Map())
  const watchPeer = useRef<WebcamPeer | null>(null)
  const watchingIdRef = useRef<string | null>(null)

  const outPeer = useRef<WebcamPeer | null>(null)
  const inPeer = useRef<WebcamPeer | null>(null)
  const lastInviteAt = useRef<number>(0)
  // Traccia se l'invito uscente è stato accettato: se termino PRIMA
  // dell'accettazione scrivo 'cancelled' (così l'invito non resta "fantasma"
  // dal lato viewer). Vedi B5.
  const outgoingAcceptedRef = useRef(false)
  const outgoingIdRef = useRef<string | null>(null)
  const incomingIdRef = useRef<string | null>(null)
  const pendingRef = useRef<string | null>(null)
  const myId = profile?.id ?? null

  const clearError = useCallback(() => setError(null), [])

  const giveConsent = useCallback(async () => {
    localStorage.setItem(CONSENT_KEY, 'true')
    setHasConsent(true)
    if (myId) {
      await addDoc(collection(db, 'moderation_events'), {
        user_id: myId,
        event_type: 'webcam_consent',
        metadata: { at: new Date().toISOString() },
        created_at: serverTimestamp(),
      })
    }
  }, [myId])

  const teardownOutgoing = useCallback(async () => {
    setOutgoing((prev) => {
      prev?.localStream.getTracks().forEach((t) => t.stop())
      return null
    })
    if (outPeer.current) {
      await outPeer.current.close()
      outPeer.current = null
    }
  }, [])

  const teardownIncoming = useCallback(async () => {
    setIncoming(null)
    if (inPeer.current) {
      await inPeer.current.close()
      inPeer.current = null
    }
  }, [])

  const endOutgoing = useCallback(async () => {
    const sessionId = outgoingIdRef.current
    // B5: se non è mai stato accettato, marca 'cancelled' (invito annullato);
    // altrimenti 'ended' (sessione conclusa).
    const status = outgoingAcceptedRef.current ? 'ended' : 'cancelled'
    outgoingAcceptedRef.current = false
    await teardownOutgoing()
    if (sessionId) {
      await updateDoc(doc(db, 'webcamSessions', sessionId), {
        status,
        ended_at: serverTimestamp(),
      }).catch(() => undefined)
    }
  }, [teardownOutgoing])

  const endIncoming = useCallback(async () => {
    const sessionId = incomingIdRef.current
    await teardownIncoming()
    if (sessionId) {
      await updateDoc(doc(db, 'webcamSessions', sessionId), {
        status: 'ended',
        ended_at: serverTimestamp(),
      }).catch(() => undefined)
    }
  }, [teardownIncoming])

  const startBroadcast = useCallback(
    async (viewerId: string, withAudio: boolean) => {
      setError(null)
      if (!supported) {
        setError(t('cam.err.notSupported'))
        return
      }
      if (!myId || viewerId === myId) return
      if (isBlocked(viewerId)) {
        setError(t('cam.err.blocked'))
        return
      }
      const now = Date.now()
      if (now - lastInviteAt.current < INVITE_COOLDOWN_MS) {
        setError(t('cam.err.cooldown'))
        return
      }
      if (outgoing) {
        setError(t('cam.err.already'))
        return
      }

      let stream: MediaStream
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: withAudio })
      } catch (err) {
        const name = err instanceof DOMException ? err.name : ''
        if (name === 'NotAllowedError' || name === 'SecurityError')
          setError(t('cam.err.denied'))
        else if (name === 'NotFoundError' || name === 'OverconstrainedError')
          setError(t('cam.err.noDevice'))
        else setError(t('cam.err.generic'))
        return
      }

      // Assicura l'esistenza del thread privato SOLO se non esiste già: qui (a
      // differenza di ensurePrivateThread, C2) va creato con created_at/reads,
      // quindi non usa l'helper condiviso per non rischiare di sovrascriverli
      // su un thread già esistente.
      const [a, b] = orderedPair(myId, viewerId)
      const tid = privateThreadId(myId, viewerId)
      const threadRef = doc(db, 'privateThreads', tid)
      const threadSnap = await getDoc(threadRef)
      if (!threadSnap.exists()) {
        await setDoc(threadRef, {
          user_a: a,
          user_b: b,
          participants: [a, b],
          created_at: serverTimestamp(),
          reads: {},
        }).catch(() => undefined)
      }

      let sessionId: string
      try {
        const ref = await addDoc(collection(db, 'webcamSessions'), {
          thread_id: tid,
          broadcaster_id: myId,
          viewer_id: viewerId,
          participants: [myId, viewerId],
          audio_enabled: withAudio,
          kind: 'invite',
          status: 'pending',
          created_at: serverTimestamp(),
          accepted_at: null,
          ended_at: null,
        })
        sessionId = ref.id
      } catch {
        stream.getTracks().forEach((track) => track.stop())
        setError(t('cam.err.invite'))
        return
      }
      lastInviteAt.current = now
      outgoingAcceptedRef.current = false

      const session: WebcamSession = {
        id: sessionId,
        thread_id: tid,
        broadcaster_id: myId,
        viewer_id: viewerId,
        participants: [myId, viewerId],
        audio_enabled: withAudio,
        kind: 'invite',
        status: 'pending',
        created_at: now,
        accepted_at: null,
        ended_at: null,
      }

      const peer = new WebcamPeer(sessionId, myId, 'broadcaster', stream, {
        onConnectionStateChange: (state) =>
          setOutgoing((prev) => (prev ? { ...prev, connState: state } : prev)),
        onBye: () => void endOutgoing(),
      })
      outPeer.current = peer
      setOutgoing({
        session,
        localStream: stream,
        audioEnabled: withAudio,
        videoEnabled: true,
        connState: 'new',
      })
      await peer.connect()
    },
    [supported, myId, isBlocked, outgoing, endOutgoing, t],
  )

  const acceptInvite = useCallback(async () => {
    if (!pendingInvite || !myId) return
    const session = pendingInvite.session
    await updateDoc(doc(db, 'webcamSessions', session.id), {
      status: 'accepted',
      accepted_at: serverTimestamp(),
    }).catch(() => undefined)

    const peer = new WebcamPeer(session.id, myId, 'viewer', null, {
      onRemoteStream: (rs) =>
        setIncoming((prev) => (prev ? { ...prev, remoteStream: rs } : prev)),
      onConnectionStateChange: (state) =>
        setIncoming((prev) => (prev ? { ...prev, connState: state } : prev)),
      onBye: () => void teardownIncoming(),
    })
    inPeer.current = peer
    setIncoming({ session, remoteStream: null, connState: 'new' })
    setPendingInvite(null)
    // La finestra di chat con il broadcaster viene aperta da WindowsLayer
    // reagendo alla comparsa di "incoming".
    await peer.connect()
  }, [pendingInvite, myId, teardownIncoming])

  const declineInvite = useCallback(async () => {
    if (!pendingInvite) return
    await updateDoc(doc(db, 'webcamSessions', pendingInvite.session.id), {
      status: 'declined',
    }).catch(() => undefined)
    setPendingInvite(null)
  }, [pendingInvite])

  const toggleMic = useCallback(() => {
    setOutgoing((prev) => {
      if (!prev) return prev
      const next = !prev.audioEnabled
      prev.localStream.getAudioTracks().forEach((t) => (t.enabled = next))
      return { ...prev, audioEnabled: next }
    })
  }, [])

  const toggleVideo = useCallback(() => {
    setOutgoing((prev) => {
      if (!prev) return prev
      const next = !prev.videoEnabled
      prev.localStream.getVideoTracks().forEach((t) => (t.enabled = next))
      return { ...prev, videoEnabled: next }
    })
  }, [])

  // ── Broadcast pubblico (lato broadcaster) ─────────────────────────────────

  // Chiude un singolo peer-spettatore SENZA fermare lo stream condiviso
  // (stopTracks=false) e lo rimuove dalla lista. Se `markEnded`, marca la
  // sessione come conclusa.
  const removeViewer = useCallback(
    async (sessionId: string, opts?: { markEnded?: boolean }) => {
      const peer = broadcastPeers.current.get(sessionId)
      if (peer) {
        await peer.close(true, false) // NON fermare lo stream condiviso
        broadcastPeers.current.delete(sessionId)
      }
      setBroadcastState((prev) =>
        prev ? { ...prev, viewers: prev.viewers.filter((v) => v.sessionId !== sessionId) } : prev,
      )
      if (opts?.markEnded) {
        await updateDoc(doc(db, 'webcamSessions', sessionId), {
          status: 'ended',
          ended_at: serverTimestamp(),
        }).catch(() => undefined)
      }
    },
    [],
  )

  const kickViewer = useCallback(
    (sessionId: string) => removeViewer(sessionId, { markEnded: true }),
    [removeViewer],
  )

  // Serve una richiesta di visione ('watch' pending verso di me): crea il peer
  // broadcaster alimentato dallo stream condiviso e ne limita il bitrate.
  const serveViewer = useCallback(
    async (s: WebcamSession) => {
      const stream = broadcastStreamRef.current
      if (!stream || !myId) return
      if (broadcastPeers.current.has(s.id)) return // già servito
      if (isBlocked(s.viewer_id)) {
        await updateDoc(doc(db, 'webcamSessions', s.id), {
          status: 'ended',
          ended_at: serverTimestamp(),
        }).catch(() => undefined)
        return
      }
      if (broadcastPeers.current.size >= PUBLIC_CAM_CAP) {
        await updateDoc(doc(db, 'webcamSessions', s.id), { status: 'full' }).catch(() => undefined)
        return
      }
      const peer = new WebcamPeer(s.id, myId, 'broadcaster', stream, {
        onConnectionStateChange: (state) => {
          // Ri-applica il tetto di bitrate a negoziazione conclusa (alcuni
          // browser popolano `encodings` solo dopo il primo scambio SDP).
          if (state === 'connected') applyLowBitrate(peer.getPeerConnection())
          setBroadcastState((prev) =>
            prev
              ? {
                  ...prev,
                  viewers: prev.viewers.map((v) =>
                    v.sessionId === s.id ? { ...v, connState: state } : v,
                  ),
                }
              : prev,
          )
        },
        onBye: () => void removeViewer(s.id, { markEnded: true }),
      })
      broadcastPeers.current.set(s.id, peer)
      setBroadcastState((prev) =>
        prev
          ? {
              ...prev,
              viewers: [
                ...prev.viewers,
                { sessionId: s.id, viewerId: s.viewer_id, connState: 'new' },
              ],
            }
          : prev,
      )
      await updateDoc(doc(db, 'webcamSessions', s.id), {
        status: 'accepted',
        accepted_at: serverTimestamp(),
      }).catch(() => undefined)
      await peer.connect()
      // Bassa qualità: applicata dopo connect(), quando i sender esistono.
      applyLowBitrate(peer.getPeerConnection())
    },
    [myId, isBlocked, removeViewer],
  )

  // Teardown del broadcast SENZA scrivere sui documenti (usato al logout).
  const teardownBroadcast = useCallback(async () => {
    for (const [, peer] of broadcastPeers.current) {
      await peer.close(true, false)
    }
    broadcastPeers.current.clear()
    // Lo stream condiviso si ferma una SOLA volta, qui.
    broadcastStreamRef.current?.getTracks().forEach((tk) => tk.stop())
    broadcastStreamRef.current = null
    setBroadcastState(null)
    setIsLive(false)
  }, [])

  const goLive = useCallback(
    async (mode: BroadcastMode) => {
      setError(null)
      if (!supported) {
        setError(t('cam.err.notSupported'))
        return
      }
      // Solo utenti registrati possono trasmettere.
      if (!myId || isGuest) return
      if (broadcast) {
        setError(t('cam.err.already'))
        return
      }
      let stream: MediaStream
      try {
        stream = await navigator.mediaDevices.getUserMedia(
          mode === 'audio'
            ? { video: false, audio: true }
            : { video: LOW_VIDEO_CONSTRAINTS, audio: true },
        )
      } catch (err) {
        const name = err instanceof DOMException ? err.name : ''
        if (name === 'NotAllowedError' || name === 'SecurityError')
          setError(t('cam.err.denied'))
        else if (name === 'NotFoundError' || name === 'OverconstrainedError')
          setError(t('cam.err.noDevice'))
        else setError(t('cam.err.generic'))
        return
      }
      broadcastStreamRef.current = stream
      setBroadcastState({
        mode,
        stream,
        videoEnabled: mode === 'video',
        audioEnabled: true,
        viewers: [],
      })
      setIsLive(true)
      setPresenceCam(mode)
    },
    [supported, myId, isGuest, broadcast, t, setPresenceCam],
  )

  const stopLive = useCallback(async () => {
    const ids = Array.from(broadcastPeers.current.keys())
    await teardownBroadcast()
    setPresenceCam(null)
    for (const id of ids) {
      await updateDoc(doc(db, 'webcamSessions', id), {
        status: 'ended',
        ended_at: serverTimestamp(),
      }).catch(() => undefined)
    }
  }, [teardownBroadcast, setPresenceCam])

  const toggleBroadcastMic = useCallback(() => {
    setBroadcastState((prev) => {
      if (!prev) return prev
      const next = !prev.audioEnabled
      prev.stream.getAudioTracks().forEach((tk) => (tk.enabled = next))
      return { ...prev, audioEnabled: next }
    })
  }, [])

  const toggleBroadcastVideo = useCallback(() => {
    setBroadcastState((prev) => {
      if (!prev) return prev
      const next = !prev.videoEnabled
      prev.stream.getVideoTracks().forEach((tk) => (tk.enabled = next))
      return { ...prev, videoEnabled: next }
    })
  }, [])

  // ── Guardare un broadcast pubblico (lato spettatore) ──────────────────────

  // Teardown della visione SENZA scrivere sul documento (broadcaster ha già
  // concluso, oppure logout).
  const teardownWatching = useCallback(async () => {
    if (watchPeer.current) {
      await watchPeer.current.close()
      watchPeer.current = null
    }
    setWatching(null)
  }, [])

  const stopWatching = useCallback(async () => {
    const sessionId = watchingIdRef.current
    await teardownWatching()
    if (sessionId) {
      await updateDoc(doc(db, 'webcamSessions', sessionId), {
        status: 'ended',
        ended_at: serverTimestamp(),
      }).catch(() => undefined)
    }
  }, [teardownWatching])

  const watchBroadcast = useCallback(
    async (broadcasterId: string, mode: BroadcastMode) => {
      setError(null)
      if (!supported) {
        setError(t('cam.err.notSupported'))
        return
      }
      if (!myId || broadcasterId === myId) return
      if (isBlocked(broadcasterId)) {
        setError(t('cam.err.blocked'))
        return
      }
      // Per ora si guarda un solo broadcast alla volta: chiudi il precedente.
      if (watching) await stopWatching()

      let sessionId: string
      try {
        const ref = await addDoc(collection(db, 'webcamSessions'), {
          thread_id: '',
          broadcaster_id: broadcasterId,
          viewer_id: myId,
          participants: [myId, broadcasterId],
          audio_enabled: mode === 'audio',
          kind: 'watch',
          status: 'pending',
          created_at: serverTimestamp(),
          accepted_at: null,
          ended_at: null,
        })
        sessionId = ref.id
      } catch {
        setError(t('cam.err.generic'))
        return
      }

      const peer = new WebcamPeer(sessionId, myId, 'viewer', null, {
        onRemoteStream: (rs) =>
          setWatching((prev) => (prev ? { ...prev, remoteStream: rs } : prev)),
        onConnectionStateChange: (state) =>
          setWatching((prev) => (prev ? { ...prev, connState: state } : prev)),
        onBye: () => void teardownWatching(),
      })
      watchPeer.current = peer
      setWatching({ broadcasterId, sessionId, mode, remoteStream: null, connState: 'new' })
      await peer.connect()
    },
    [supported, myId, isBlocked, watching, stopWatching, teardownWatching, t],
  )

  // refs sincronizzate per la subscription
  useEffect(() => {
    outgoingIdRef.current = outgoing?.session.id ?? null
  }, [outgoing?.session.id])
  useEffect(() => {
    incomingIdRef.current = incoming?.session.id ?? null
  }, [incoming?.session.id])
  useEffect(() => {
    pendingRef.current = pendingInvite?.session.id ?? null
  }, [pendingInvite?.session.id])
  useEffect(() => {
    watchingIdRef.current = watching?.sessionId ?? null
  }, [watching?.sessionId])

  // Listener dedicato: mentre sono in onda, servo le richieste di visione
  // ('watch' pending verso di me). Attivo solo durante il broadcast.
  useEffect(() => {
    if (!myId || !isLive) return
    const q = query(
      collection(db, 'webcamSessions'),
      where('broadcaster_id', '==', myId),
      where('kind', '==', 'watch'),
      where('status', '==', 'pending'),
    )
    const unsub = onSnapshot(q, (snap) => {
      for (const change of snap.docChanges()) {
        if (change.type !== 'added') continue
        const s = mapSession(change.doc.id, change.doc.data())
        // Ignora richieste stale (>60s) rimaste pending da sessioni vecchie.
        if (Date.now() - s.created_at > 60000) continue
        void serveViewer(s)
      }
    })
    return () => unsub()
  }, [myId, isLive, serveViewer])

  // Se blocco uno spettatore mentre sono in onda, chiudo la sua sessione.
  useEffect(() => {
    if (!isLive || !broadcast) return
    for (const v of broadcast.viewers) {
      if (blockedIds.has(v.viewerId)) void kickViewer(v.sessionId)
    }
  }, [blockedIds, isLive, broadcast, kickViewer])

  // Listener sulle sessioni webcam che mi coinvolgono
  useEffect(() => {
    if (!myId) return
    const q = query(
      collection(db, 'webcamSessions'),
      where('participants', 'array-contains', myId),
    )
    const unsub = onSnapshot(q, (snap) => {
      for (const change of snap.docChanges()) {
        const s = mapSession(change.doc.id, change.doc.data())

        // Solo gli inviti 1:1 ('invite') fanno comparire il banner. Le sessioni
        // 'watch' (broadcast pubblico) NON sono inviti: gestite altrove.
        if (
          change.type === 'added' &&
          s.kind !== 'watch' &&
          s.viewer_id === myId &&
          s.status === 'pending'
        ) {
          if (pendingRef.current === s.id) continue
          // B5: ignora inviti "stale" (> 60s): al reload lo snapshot iniziale
          // riporta come 'added' anche i pending vecchi, che non vanno ri-mostrati.
          if (Date.now() - s.created_at > 60000) continue
          getDoc(doc(db, 'profiles', s.broadcaster_id)).then((p) => {
            setPendingInvite({
              session: s,
              fromUsername: (p.data()?.username as string) ?? 'Un utente',
            })
            playInviteSound()
          })
        }

        if (outgoingIdRef.current === s.id) {
          if (s.status === 'accepted') {
            outgoingAcceptedRef.current = true
          } else if (s.status === 'declined') {
            setError(t('cam.declined'))
            void teardownOutgoing()
          } else if (s.status === 'ended' || s.status === 'cancelled') {
            void teardownOutgoing()
          }
        }
        if (incomingIdRef.current === s.id) {
          if (s.status === 'ended' || s.status === 'cancelled') void teardownIncoming()
        }
        // Sessione 'watch' che ho aperto come spettatore.
        if (watchingIdRef.current === s.id) {
          if (s.status === 'full') {
            setError(t('cam.full'))
            void teardownWatching()
          } else if (
            s.status === 'ended' ||
            s.status === 'cancelled' ||
            s.status === 'declined'
          ) {
            void teardownWatching()
          }
        }
        if (pendingRef.current === s.id && s.status !== 'pending') {
          setPendingInvite(null)
        }
      }
    })
    return () => unsub()
  }, [myId, teardownOutgoing, teardownIncoming, teardownWatching, t])

  // cleanup al logout
  useEffect(() => {
    if (!myId) {
      void teardownOutgoing()
      void teardownIncoming()
      void teardownBroadcast()
      void teardownWatching()
      setPendingInvite(null)
    }
  }, [myId, teardownOutgoing, teardownIncoming, teardownBroadcast, teardownWatching])

  const value = useMemo<WebcamContextValue>(
    () => ({
      supported,
      hasConsent,
      outgoing,
      incoming,
      pendingInvite,
      error,
      clearError,
      giveConsent,
      startBroadcast,
      acceptInvite,
      declineInvite,
      toggleMic,
      toggleVideo,
      endOutgoing,
      endIncoming,
      broadcast,
      goLive,
      stopLive,
      kickViewer,
      toggleBroadcastMic,
      toggleBroadcastVideo,
      watching,
      watchBroadcast,
      stopWatching,
    }),
    [
      supported, hasConsent, outgoing, incoming, pendingInvite, error, clearError,
      giveConsent, startBroadcast, acceptInvite, declineInvite, toggleMic,
      toggleVideo, endOutgoing, endIncoming, broadcast, goLive, stopLive,
      kickViewer, toggleBroadcastMic, toggleBroadcastVideo, watching,
      watchBroadcast, stopWatching,
    ],
  )

  return <WebcamContext.Provider value={value}>{children}</WebcamContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useWebcam(): WebcamContextValue {
  const ctx = useContext(WebcamContext)
  if (!ctx) throw new Error('useWebcam deve essere usato dentro <WebcamProvider>')
  return ctx
}

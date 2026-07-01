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
import { useBlocks } from '../hooks/useBlocks'
import { WebcamPeer, isWebRTCSupported } from '../lib/webrtc'
import { playInviteSound } from '../lib/sounds'
import { orderedPair, tsToMillis } from '../lib/utils'
import { useI18n } from '../lib/i18n'
import type { WebcamSession, WebcamStatus } from '../lib/types'

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
    status: (d.status as WebcamStatus) ?? 'pending',
    created_at: tsToMillis(d.created_at),
    accepted_at: d.accepted_at ? tsToMillis(d.accepted_at) : null,
    ended_at: d.ended_at ? tsToMillis(d.ended_at) : null,
  }
}

export function WebcamProvider({ children }: { children: ReactNode }) {
  const { profile } = useAuth()
  const { isBlocked } = useBlocks()
  const { t } = useI18n()
  const supported = isWebRTCSupported()

  const [hasConsent, setHasConsent] = useState(
    () => localStorage.getItem(CONSENT_KEY) === 'true',
  )
  const [outgoing, setOutgoing] = useState<OutgoingState | null>(null)
  const [incoming, setIncoming] = useState<IncomingState | null>(null)
  const [pendingInvite, setPendingInvite] = useState<PendingInvite | null>(null)
  const [error, setError] = useState<string | null>(null)

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

      // assicura l'esistenza del thread privato
      const [a, b] = orderedPair(myId, viewerId)
      const tid = `${a}__${b}`
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

        if (change.type === 'added' && s.viewer_id === myId && s.status === 'pending') {
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
        if (pendingRef.current === s.id && s.status !== 'pending') {
          setPendingInvite(null)
        }
      }
    })
    return () => unsub()
  }, [myId, teardownOutgoing, teardownIncoming, t])

  // cleanup al logout
  useEffect(() => {
    if (!myId) {
      void teardownOutgoing()
      void teardownIncoming()
      setPendingInvite(null)
    }
  }, [myId, teardownOutgoing, teardownIncoming])

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
    }),
    [
      supported, hasConsent, outgoing, incoming, pendingInvite, error, clearError,
      giveConsent, startBroadcast, acceptInvite, declineInvite, toggleMic,
      toggleVideo, endOutgoing, endIncoming,
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

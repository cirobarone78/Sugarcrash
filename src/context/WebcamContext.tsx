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
import { supabase } from '../lib/supabase'
import { useAuth } from './AuthContext'
import { usePrivateChat } from './PrivateChatContext'
import { useBlocks } from '../hooks/useBlocks'
import { WebcamPeer, isWebRTCSupported } from '../lib/webrtc'
import { playInviteSound } from '../lib/sounds'
import type { WebcamSession } from '../lib/types'

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

export function WebcamProvider({ children }: { children: ReactNode }) {
  const { profile } = useAuth()
  const { openThread, setDrawerOpen } = usePrivateChat()
  const { isBlocked } = useBlocks()
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
  // refs con gli id correnti, leggibili dentro le subscription realtime
  const outgoingIdRef = useRef<string | null>(null)
  const incomingIdRef = useRef<string | null>(null)
  const pendingRef = useRef<string | null>(null)
  const myId = profile?.id ?? null

  const clearError = useCallback(() => setError(null), [])

  const giveConsent = useCallback(async () => {
    localStorage.setItem(CONSENT_KEY, 'true')
    setHasConsent(true)
    if (myId) {
      await supabase.from('moderation_events').insert({
        user_id: myId,
        event_type: 'webcam_consent',
        metadata: { at: new Date().toISOString() },
      })
    }
  }, [myId])

  // ── Pulizia connessioni ────────────────────────────────────────
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
    const sessionId = outgoing?.session.id
    await teardownOutgoing()
    if (sessionId) {
      await supabase
        .from('webcam_sessions')
        .update({ status: 'ended', ended_at: new Date().toISOString() })
        .eq('id', sessionId)
    }
  }, [outgoing?.session.id, teardownOutgoing])

  const endIncoming = useCallback(async () => {
    const sessionId = incoming?.session.id
    await teardownIncoming()
    if (sessionId) {
      await supabase
        .from('webcam_sessions')
        .update({ status: 'ended', ended_at: new Date().toISOString() })
        .eq('id', sessionId)
    }
  }, [incoming?.session.id, teardownIncoming])

  // ── Avvio trasmissione (io = broadcaster) ──────────────────────
  const startBroadcast = useCallback(
    async (viewerId: string, withAudio: boolean) => {
      setError(null)
      if (!supported) {
        setError('Il tuo browser non supporta la webcam (WebRTC/getUserMedia).')
        return
      }
      if (!myId || viewerId === myId) return
      if (isBlocked(viewerId)) {
        setError('Hai bloccato questo utente: sbloccalo per usare la webcam.')
        return
      }
      const now = Date.now()
      if (now - lastInviteAt.current < INVITE_COOLDOWN_MS) {
        setError('Hai appena inviato un invito webcam, attendi qualche secondo.')
        return
      }
      if (outgoing) {
        setError('Stai già trasmettendo la webcam.')
        return
      }

      // 1. permessi media
      let stream: MediaStream
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: withAudio,
        })
      } catch (err) {
        const name = err instanceof DOMException ? err.name : ''
        if (name === 'NotAllowedError' || name === 'SecurityError')
          setError('Permesso negato. Abilita fotocamera/microfono nelle impostazioni del browser.')
        else if (name === 'NotFoundError' || name === 'OverconstrainedError')
          setError('Nessuna fotocamera disponibile su questo dispositivo.')
        else setError('Impossibile accedere alla webcam.')
        return
      }

      // 2. crea la sessione (RLS blocca se il viewer ti ha bloccato)
      const { data, error: insErr } = await supabase
        .from('webcam_sessions')
        .insert({
          thread_id: await ensureThreadId(myId, viewerId),
          broadcaster_id: myId,
          viewer_id: viewerId,
          audio_enabled: withAudio,
          status: 'pending',
        })
        .select()
        .single()

      if (insErr || !data) {
        stream.getTracks().forEach((t) => t.stop())
        setError("Impossibile inviare l'invito (l'utente potrebbe averti bloccato).")
        return
      }
      const session = data as WebcamSession
      lastInviteAt.current = now

      // 3. peer broadcaster
      const peer = new WebcamPeer(session.id, myId, 'broadcaster', stream, {
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
    [supported, myId, isBlocked, outgoing, endOutgoing],
  )

  // ── Accetta invito (io = viewer) ───────────────────────────────
  const acceptInvite = useCallback(async () => {
    if (!pendingInvite || !myId) return
    const session = pendingInvite.session
    await supabase
      .from('webcam_sessions')
      .update({ status: 'accepted', accepted_at: new Date().toISOString() })
      .eq('id', session.id)

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
    // apri la conversazione corrispondente
    openThread(session.thread_id)
    setDrawerOpen(true)
    await peer.connect()
  }, [pendingInvite, myId, openThread, setDrawerOpen, teardownIncoming])

  const declineInvite = useCallback(async () => {
    if (!pendingInvite) return
    await supabase
      .from('webcam_sessions')
      .update({ status: 'declined' })
      .eq('id', pendingInvite.session.id)
    setPendingInvite(null)
  }, [pendingInvite])

  // ── Controlli ──────────────────────────────────────────────────
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

  // ── Realtime sulle sessioni webcam ─────────────────────────────
  useEffect(() => {
    if (!myId) return
    const channel = supabase
      .channel('webcam-sessions')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'webcam_sessions' },
        async (payload) => {
          const s = payload.new as WebcamSession
          if (s.viewer_id === myId && s.status === 'pending') {
            const { data } = await supabase
              .from('profiles')
              .select('username')
              .eq('id', s.broadcaster_id)
              .maybeSingle()
            setPendingInvite({
              session: s,
              fromUsername: (data as { username: string } | null)?.username ?? 'Un utente',
            })
            playInviteSound()
          }
        },
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'webcam_sessions' },
        (payload) => {
          const s = payload.new as WebcamSession
          if (outPeer.current && outgoingIdRef.current === s.id) {
            if (s.status === 'declined') {
              setError('Invito webcam rifiutato.')
              void teardownOutgoing()
            } else if (s.status === 'ended' || s.status === 'cancelled') {
              void teardownOutgoing()
            }
          }
          if (inPeer.current && incomingIdRef.current === s.id) {
            if (s.status === 'ended' || s.status === 'cancelled') {
              void teardownIncoming()
            }
          }
          if (pendingRef.current && pendingRef.current === s.id && s.status !== 'pending') {
            setPendingInvite(null)
          }
        },
      )
      .subscribe()
    return () => {
      void supabase.removeChannel(channel)
    }
  }, [myId, teardownOutgoing, teardownIncoming])

  useEffect(() => {
    outgoingIdRef.current = outgoing?.session.id ?? null
  }, [outgoing?.session.id])
  useEffect(() => {
    incomingIdRef.current = incoming?.session.id ?? null
  }, [incoming?.session.id])
  useEffect(() => {
    pendingRef.current = pendingInvite?.session.id ?? null
  }, [pendingInvite?.session.id])

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

/** Recupera (o crea) il thread privato tra due utenti, restituendo l'id. */
async function ensureThreadId(myId: string, otherId: string): Promise<string> {
  const [a, b] = myId < otherId ? [myId, otherId] : [otherId, myId]
  const { data: existing } = await supabase
    .from('private_threads')
    .select('id')
    .eq('user_a', a)
    .eq('user_b', b)
    .maybeSingle()
  if (existing) return (existing as { id: string }).id
  const { data: created } = await supabase
    .from('private_threads')
    .insert({ user_a: a, user_b: b })
    .select('id')
    .single()
  return (created as { id: string }).id
}

// eslint-disable-next-line react-refresh/only-export-components
export function useWebcam(): WebcamContextValue {
  const ctx = useContext(WebcamContext)
  if (!ctx) throw new Error('useWebcam deve essere usato dentro <WebcamProvider>')
  return ctx
}

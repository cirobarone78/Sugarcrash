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
  ref,
  child,
  push,
  set,
  remove,
  onValue,
  onDisconnect,
  runTransaction,
  type Unsubscribe,
} from 'firebase/database'
import { rtdb } from '../lib/firebase'
import { useAuth } from './AuthContext'
import { useBlocks } from '../hooks/useBlocks'
import { WebcamPeer, isWebRTCSupported, applyLowBitrate, LOW_VIDEO_CONSTRAINTS } from '../lib/webrtc'
import { useI18n } from '../lib/i18n'
import type { Sex } from '../lib/types'

// ── Cam-roulette (gancio virale): abbina due utenti a caso in una webcam 1:1
// bidirezionale; "Avanti" salta allo sconosciuto successivo.
//
// MATCHMAKING su Realtime Database (transazioni atomiche + onDisconnect):
//   roulette/waiting/{uid} = { username, sex, ts }   → in coda
//   roulette/pairs/{uid}   = { sessionId, peerId, peerName, peerSex, role }
// Una transazione sul nodo `roulette` accoppia due utenti in coda scrivendo
// atomicamente i due record `pairs` (niente doppio-match: la transazione sul
// root serializza i tentativi concorrenti). La sessione WebRTC usa lo stesso
// signaling effimero `signals/<sessionId>` della webcam normale.

type Status = 'idle' | 'searching' | 'connected'

// Preferenza "voglio incontrare": 'any' o un sesso specifico. L'abbinamento è
// RECIPROCO — avviene solo se la scelta è compatibile da entrambi i lati.
export type MatchPref = 'any' | 'male' | 'female' | 'couple'

const PREF_KEY = 'retrocam.roulettePref'

interface Partner {
  id: string
  username: string
  sex?: Sex
}

interface PairRecord {
  sessionId: string
  peerId: string
  peerName?: string
  peerSex?: Sex | null
  role: 'caller' | 'callee'
}

interface WaitingEntry {
  username?: string
  sex?: Sex | null
  /** Chi vuole incontrare chi è in coda (default 'any'). */
  want?: MatchPref
  ts?: number
}

interface RouletteData {
  waiting?: Record<string, WaitingEntry>
  pairs?: Record<string, PairRecord>
}

interface RouletteContextValue {
  supported: boolean
  panelOpen: boolean
  status: Status
  pref: MatchPref
  setPref: (p: MatchPref) => void
  partner: Partner | null
  connState: RTCPeerConnectionState
  localStream: MediaStream | null
  remoteStream: MediaStream | null
  micOn: boolean
  videoOn: boolean
  error: string | null
  open: () => void
  close: () => void
  start: () => Promise<void>
  next: () => Promise<void>
  stop: () => Promise<void>
  toggleMic: () => void
  toggleVideo: () => void
}

const RouletteContext = createContext<RouletteContextValue | undefined>(undefined)

// Per quanto tempo evitare di ri-abbinare lo stesso utente dopo un "Avanti".
const SKIP_MS = 30000

export function RouletteProvider({ children }: { children: ReactNode }) {
  const { profile, isGuest } = useAuth()
  const { isBlocked } = useBlocks()
  const { t } = useI18n()
  const supported = isWebRTCSupported()
  const myId = profile?.id ?? null

  const [panelOpen, setPanelOpen] = useState(false)
  const [status, setStatus] = useState<Status>('idle')
  const [pref, setPrefState] = useState<MatchPref>(
    () => (localStorage.getItem(PREF_KEY) as MatchPref) || 'any',
  )
  const [partner, setPartner] = useState<Partner | null>(null)
  const [connState, setConnState] = useState<RTCPeerConnectionState>('new')
  const [localStream, setLocalStream] = useState<MediaStream | null>(null)
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null)
  const [micOn, setMicOn] = useState(true)
  const [videoOn, setVideoOn] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const localStreamRef = useRef<MediaStream | null>(null)
  const peerRef = useRef<WebcamPeer | null>(null)
  const partnerRef = useRef<Partner | null>(null)
  const statusRef = useRef<Status>('idle')
  const recentRef = useRef<Set<string>>(new Set())
  const pairUnsub = useRef<Unsubscribe | null>(null)
  const waitingUnsub = useRef<Unsubscribe | null>(null)
  const isBlockedRef = useRef(isBlocked)
  const prefRef = useRef(pref)

  useEffect(() => {
    isBlockedRef.current = isBlocked
  }, [isBlocked])
  useEffect(() => {
    prefRef.current = pref
  }, [pref])
  const setStatusBoth = useCallback((s: Status) => {
    statusRef.current = s
    setStatus(s)
  }, [])

  // Scrive la mia voce in coda + cleanup automatico se cade la connessione.
  const enterWaiting = useCallback(async () => {
    if (!myId) return
    const wref = ref(rtdb, `roulette/waiting/${myId}`)
    await onDisconnect(wref).remove()
    await onDisconnect(ref(rtdb, `roulette/pairs/${myId}`)).remove()
    const entry: Record<string, unknown> = {
      username: profile?.username ?? '',
      want: prefRef.current,
      ts: Date.now(),
    }
    if (profile?.sex) entry.sex = profile.sex
    await set(wref, entry).catch(() => undefined)
  }, [myId, profile?.username, profile?.sex])

  // Tenta un abbinamento: transazione atomica sul nodo roulette.
  const tryMatch = useCallback(async () => {
    if (!myId || statusRef.current !== 'searching') return
    const sessionId = push(child(ref(rtdb), 'roulette')).key
    if (!sessionId) return
    await runTransaction(ref(rtdb, 'roulette'), (cur) => {
      const r = (cur as RouletteData | null) || {}
      const waiting: Record<string, WaitingEntry> = r.waiting || {}
      const pairs: Record<string, PairRecord> = r.pairs || {}
      if (pairs[myId]) return // già abbinato
      if (!waiting[myId]) return // non più in coda
      const skip = recentRef.current
      const meSex = waiting[myId].sex ?? null
      const meWant: MatchPref = waiting[myId].want ?? 'any'
      // Compatibilità RECIPROCA: io devo volere il suo sesso E lui il mio.
      const cands = Object.keys(waiting).filter((id) => {
        if (id === myId || pairs[id] || skip.has(id) || isBlockedRef.current(id)) return false
        const o = waiting[id]
        const oSex = o.sex ?? null
        const oWant: MatchPref = o.want ?? 'any'
        const iWantThem = meWant === 'any' || meWant === oSex
        const theyWantMe = oWant === 'any' || oWant === meSex
        return iWantThem && theyWantMe
      })
      if (!cands.length) return // nessun candidato compatibile: resto in coda
      cands.sort((a, b) => (waiting[a].ts || 0) - (waiting[b].ts || 0))
      const other = cands[0]
      pairs[myId] = {
        sessionId,
        peerId: other,
        peerName: waiting[other].username || '',
        peerSex: waiting[other].sex ?? null,
        role: 'caller',
      }
      pairs[other] = {
        sessionId,
        peerId: myId,
        peerName: waiting[myId].username || '',
        peerSex: waiting[myId].sex ?? null,
        role: 'callee',
      }
      delete waiting[myId]
      delete waiting[other]
      r.waiting = waiting
      r.pairs = pairs
      return r
    }).catch(() => undefined)
  }, [myId])

  // Chiude il peer corrente SENZA fermare il mio stream (riusato tra i match).
  const teardownPeer = useCallback(async (sendBye: boolean) => {
    const peer = peerRef.current
    peerRef.current = null
    if (peer) await peer.close(sendBye, false)
    setRemoteStream(null)
    setConnState('new')
  }, [])

  // Torna in coda (dopo Avanti / partner uscito), evitando di ri-pescare subito
  // lo stesso utente.
  const requeue = useCallback(
    async (skipId?: string) => {
      if (skipId) {
        recentRef.current.add(skipId)
        const id = skipId
        setTimeout(() => recentRef.current.delete(id), SKIP_MS)
      }
      partnerRef.current = null
      setPartner(null)
      if (statusRef.current === 'idle') return // nel frattempo ho fatto Stop
      setStatusBoth('searching')
      if (myId) {
        await remove(ref(rtdb, `roulette/pairs/${myId}`)).catch(() => undefined)
        await enterWaiting()
      }
      void tryMatch()
    },
    [myId, enterWaiting, tryMatch, setStatusBoth],
  )

  const handlePartnerLeft = useCallback(async () => {
    const other = partnerRef.current?.id
    await teardownPeer(false)
    await requeue(other)
  }, [teardownPeer, requeue])

  const beginSession = useCallback(
    (pair: PairRecord) => {
      const stream = localStreamRef.current
      if (!stream || !myId || peerRef.current) return
      if (isBlockedRef.current(pair.peerId)) {
        // Non voglio parlare con chi ho bloccato: salto subito.
        void requeue(pair.peerId)
        return
      }
      const p: Partner = {
        id: pair.peerId,
        username: pair.peerName || t('roulette.stranger'),
        sex: pair.peerSex ?? undefined,
      }
      partnerRef.current = p
      setPartner(p)
      setRemoteStream(null)
      setConnState('new')
      setStatusBoth('connected')
      const role = pair.role === 'caller' ? 'broadcaster' : 'viewer'
      const peer = new WebcamPeer(pair.sessionId, myId, role, stream, {
        onRemoteStream: (rs) => setRemoteStream(rs),
        onConnectionStateChange: (s) => {
          setConnState(s)
          if (s === 'connected') applyLowBitrate(peer.getPeerConnection())
          if (s === 'failed') void handlePartnerLeft()
        },
        onBye: () => void handlePartnerLeft(),
      })
      peerRef.current = peer
      void peer.connect()
    },
    [myId, t, requeue, handlePartnerLeft, setStatusBoth],
  )

  const start = useCallback(async () => {
    setError(null)
    if (!supported) {
      setError(t('cam.err.notSupported'))
      return
    }
    // Come per il broadcast: solo utenti registrati mostrano la cam.
    if (!myId || isGuest) return
    if (statusRef.current !== 'idle') return

    let stream: MediaStream
    try {
      stream = await navigator.mediaDevices.getUserMedia({ video: LOW_VIDEO_CONSTRAINTS, audio: true })
    } catch (err) {
      const name = err instanceof DOMException ? err.name : ''
      if (name === 'NotAllowedError' || name === 'SecurityError') setError(t('cam.err.denied'))
      else if (name === 'NotFoundError' || name === 'OverconstrainedError') setError(t('cam.err.noDevice'))
      else setError(t('cam.err.generic'))
      return
    }
    localStreamRef.current = stream
    setLocalStream(stream)
    setMicOn(true)
    setVideoOn(true)
    setStatusBoth('searching')
    // Ripulisci un eventuale abbinamento "fantasma" di una sessione precedente
    // (crash senza onDisconnect): altrimenti il listener sotto scatterebbe su
    // una sessione morta.
    await remove(ref(rtdb, `roulette/pairs/${myId}`)).catch(() => undefined)
    await enterWaiting()

    // Vengo abbinato: qualcuno scrive roulette/pairs/{me}.
    pairUnsub.current = onValue(ref(rtdb, `roulette/pairs/${myId}`), (snap) => {
      const pair = snap.val() as PairRecord | null
      if (pair?.sessionId && !peerRef.current && statusRef.current === 'searching') {
        beginSession(pair)
      }
    })
    // Ogni cambiamento della coda è un'occasione per tentare un match.
    waitingUnsub.current = onValue(ref(rtdb, 'roulette/waiting'), () => {
      if (statusRef.current === 'searching' && !peerRef.current) void tryMatch()
    })
    void tryMatch()
  }, [supported, myId, isGuest, t, enterWaiting, beginSession, tryMatch, setStatusBoth])

  const next = useCallback(async () => {
    if (statusRef.current !== 'connected') return
    const other = partnerRef.current?.id
    await teardownPeer(true)
    if (other) await remove(ref(rtdb, `roulette/pairs/${other}`)).catch(() => undefined)
    await requeue(other)
  }, [teardownPeer, requeue])

  const stop = useCallback(async () => {
    const other = partnerRef.current?.id
    pairUnsub.current?.()
    pairUnsub.current = null
    waitingUnsub.current?.()
    waitingUnsub.current = null
    setStatusBoth('idle')
    await teardownPeer(true)
    if (myId) {
      await remove(ref(rtdb, `roulette/waiting/${myId}`)).catch(() => undefined)
      await remove(ref(rtdb, `roulette/pairs/${myId}`)).catch(() => undefined)
    }
    if (other) await remove(ref(rtdb, `roulette/pairs/${other}`)).catch(() => undefined)
    localStreamRef.current?.getTracks().forEach((tk) => tk.stop())
    localStreamRef.current = null
    setLocalStream(null)
    setRemoteStream(null)
    setPartner(null)
    partnerRef.current = null
  }, [myId, teardownPeer, setStatusBoth])

  const open = useCallback(() => setPanelOpen(true), [])
  const close = useCallback(() => {
    setPanelOpen(false)
    void stop()
  }, [stop])

  const toggleMic = useCallback(() => {
    setMicOn((prev) => {
      const nextOn = !prev
      localStreamRef.current?.getAudioTracks().forEach((tk) => (tk.enabled = nextOn))
      return nextOn
    })
  }, [])
  const toggleVideo = useCallback(() => {
    setVideoOn((prev) => {
      const nextOn = !prev
      localStreamRef.current?.getVideoTracks().forEach((tk) => (tk.enabled = nextOn))
      return nextOn
    })
  }, [])

  const setPref = useCallback(
    (p: MatchPref) => {
      prefRef.current = p
      setPrefState(p)
      localStorage.setItem(PREF_KEY, p)
      // Se sto già cercando, aggiorna la mia voce in coda e ritenta subito.
      if (statusRef.current === 'searching') {
        void enterWaiting()
        void tryMatch()
      }
    },
    [enterWaiting, tryMatch],
  )

  // Se sono connesso e blocco il partner altrove, salto.
  useEffect(() => {
    if (status === 'connected' && partner && isBlocked(partner.id)) {
      void next()
    }
  }, [status, partner, isBlocked, next])

  // Cleanup al logout.
  const stopRef = useRef(stop)
  useEffect(() => {
    stopRef.current = stop
  }, [stop])
  useEffect(() => {
    if (!myId) {
      void stopRef.current()
      setPanelOpen(false)
    }
  }, [myId])
  useEffect(() => () => void stopRef.current(), [])

  const value = useMemo<RouletteContextValue>(
    () => ({
      supported,
      panelOpen,
      status,
      pref,
      setPref,
      partner,
      connState,
      localStream,
      remoteStream,
      micOn,
      videoOn,
      error,
      open,
      close,
      start,
      next,
      stop,
      toggleMic,
      toggleVideo,
    }),
    [
      supported, panelOpen, status, pref, setPref, partner, connState, localStream,
      remoteStream, micOn, videoOn, error, open, close, start, next, stop, toggleMic,
      toggleVideo,
    ],
  )

  return <RouletteContext.Provider value={value}>{children}</RouletteContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useRoulette(): RouletteContextValue {
  const ctx = useContext(RouletteContext)
  if (!ctx) throw new Error('useRoulette deve essere usato dentro <RouletteProvider>')
  return ctx
}

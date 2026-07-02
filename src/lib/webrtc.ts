// Helper WebRTC per la webcam privata 1:1.
//
// SIGNALING: usiamo il Realtime Database di Firebase come canale di
// segnalazione, sotto il nodo effimero `signals/<sessionId>`. I messaggi
// (ready/offer/answer/ice/bye) vengono aggiunti con push() e letti con
// onChildAdded; alla chiusura il nodo viene rimosso. Nessun dato resta salvato.
//
// In alternativa (reti che bloccano il websocket di Firebase, o per chi
// preferisce un signaling server proprio) è incluso un piccolo server Node
// WebSocket in /signaling con la stessa semantica di messaggi: vedi README.

import { getIceServers } from './utils'
import { rtdb } from './firebase'
import {
  ref,
  push,
  set,
  onChildAdded,
  remove,
  onDisconnect,
  type DatabaseReference,
  type Unsubscribe,
} from 'firebase/database'

// Omit distributivo: preserva i membri della union (Omit standard collasserebbe
// la union sulle sole chiavi comuni).
type DistributiveOmit<T, K extends keyof T> = T extends unknown ? Omit<T, K> : never

export type OutgoingSignal = DistributiveOmit<SignalMessage, 'from'>

export type SignalMessage =
  | { kind: 'ready'; from: string }
  | { kind: 'offer'; sdp: RTCSessionDescriptionInit; from: string }
  | { kind: 'answer'; sdp: RTCSessionDescriptionInit; from: string }
  | { kind: 'ice'; candidate: RTCIceCandidateInit; from: string }
  | { kind: 'bye'; from: string }

// ── Webcam nelle stanze pubbliche (P5) ──────────────────────────────────────
// Tetto di spettatori per un broadcast pubblico in mesh: oltre questo numero la
// sessione viene rifiutata con status 'full'. Il mesh (una connessione 1:1 per
// spettatore, tutte alimentate dallo stesso stream locale) non scala oltre pochi
// peer: per numeri più alti serve un SFU (fase futura).
export const PUBLIC_CAM_CAP = 8

// Vincoli getUserMedia a BASSA qualità per le cam pubbliche: alzano il tetto di
// spettatori riducendo banda/CPU. La cam privata 1:1 resta a qualità piena.
export const LOW_VIDEO_CONSTRAINTS: MediaTrackConstraints = {
  width: { ideal: 320 },
  height: { ideal: 240 },
  frameRate: { ideal: 15 },
}

// Bitrate/framerate massimi applicati ai sender video di ogni peer broadcaster.
const LOW_MAX_BITRATE = 150_000
const LOW_MAX_FRAMERATE = 15

/**
 * Imposta un tetto di bitrate/framerate basso sui sender video di una peer
 * connection (cam pubblica). Alcuni browser non popolano `encodings` finché non
 * c'è stata negoziazione: in quel caso lo inizializziamo. Guardia totale: se il
 * browser non supporta setParameters/encodings, semplicemente non fa nulla.
 */
export function applyLowBitrate(pc: RTCPeerConnection): void {
  try {
    for (const sender of pc.getSenders()) {
      if (sender.track?.kind !== 'video') continue
      const params = sender.getParameters()
      if (!params.encodings || params.encodings.length === 0) {
        params.encodings = [{}]
      }
      params.encodings[0] = {
        ...params.encodings[0],
        maxBitrate: LOW_MAX_BITRATE,
        maxFramerate: LOW_MAX_FRAMERATE,
      }
      void sender.setParameters(params).catch(() => undefined)
    }
  } catch {
    /* browser senza supporto encodings: nessun effetto */
  }
}

/** True se il browser supporta WebRTC + getUserMedia. */
export function isWebRTCSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.RTCPeerConnection !== 'undefined' &&
    !!navigator.mediaDevices &&
    typeof navigator.mediaDevices.getUserMedia === 'function'
  )
}

export function createPeerConnection(): RTCPeerConnection {
  return new RTCPeerConnection({ iceServers: getIceServers() })
}

/**
 * Canale di signaling per una specifica sessione webcam, su Realtime Database.
 * Nodo: `signals/<sessionId>` — effimero, rimosso alla chiusura.
 */
export class SignalingChannel {
  private nodeRef: DatabaseReference
  private msgsRef: DatabaseReference
  private selfPartRef: DatabaseReference
  private selfId: string
  private onMessage: (msg: SignalMessage) => void
  private unsub: Unsubscribe | null = null

  constructor(
    sessionId: string,
    selfId: string,
    onMessage: (msg: SignalMessage) => void,
  ) {
    this.selfId = selfId
    this.onMessage = onMessage
    this.nodeRef = ref(rtdb, `signals/${sessionId}`)
    this.msgsRef = ref(rtdb, `signals/${sessionId}/msgs`)
    this.selfPartRef = ref(rtdb, `signals/${sessionId}/participants/${selfId}`)
  }

  async subscribe(): Promise<void> {
    // Registra sé stesso nell'allowlist dei partecipanti: le Security Rules
    // consentono lettura/scrittura del nodo solo a chi è elencato qui.
    await set(this.selfPartRef, true).catch(() => undefined)
    // se la connessione cade, prova comunque a ripulire il nodo
    onDisconnect(this.nodeRef).remove()
    this.unsub = onChildAdded(this.msgsRef, (snap) => {
      const msg = snap.val() as SignalMessage | null
      if (!msg) return
      if (msg.from === this.selfId) return // ignora i propri messaggi
      this.onMessage(msg)
    })
  }

  send(msg: OutgoingSignal): void {
    void push(this.msgsRef, { ...msg, from: this.selfId })
  }

  async close(): Promise<void> {
    if (this.unsub) {
      this.unsub()
      this.unsub = null
    }
    try {
      await remove(this.nodeRef)
    } catch {
      /* noop */
    }
  }
}

export interface WebcamPeerCallbacks {
  onRemoteStream?: (stream: MediaStream) => void
  onConnectionStateChange?: (state: RTCPeerConnectionState) => void
  onBye?: () => void
}

/**
 * Una singola connessione WebRTC monodirezionale broadcaster → viewer.
 * Una webcam "bidirezionale" si ottiene con due WebcamPeer indipendenti.
 *
 * Sequenza di negoziazione (evita race):
 *   - entrambi sottoscrivono il canale di signaling
 *   - il viewer, appena pronto, invia 'ready'
 *   - il broadcaster, alla ricezione di 'ready', crea e invia l'offer
 *   - il viewer risponde con l'answer; ICE in entrambe le direzioni
 */
export class WebcamPeer {
  private pc: RTCPeerConnection
  private signaling: SignalingChannel
  private role: 'broadcaster' | 'viewer'
  private negotiated = false
  // Candidati ICE arrivati PRIMA della descrizione remota: vanno accodati e
  // aggiunti dopo setRemoteDescription, altrimenti si perdono e la connessione
  // può non completarsi (causa di fallimenti intermittenti).
  private pendingIce: RTCIceCandidateInit[] = []
  // Coda: processa i messaggi di signaling UNO ALLA VOLTA e in ordine, così
  // 'offer'/'answer' vengono applicati prima degli 'ice' (niente race).
  private queue: Promise<void> = Promise.resolve()

  constructor(
    sessionId: string,
    selfId: string,
    role: 'broadcaster' | 'viewer',
    localStream: MediaStream | null,
    private cb: WebcamPeerCallbacks,
  ) {
    this.role = role
    this.pc = createPeerConnection()

    this.pc.onicecandidate = (e) => {
      if (e.candidate) this.signaling.send({ kind: 'ice', candidate: e.candidate.toJSON() })
    }
    this.pc.ontrack = (e) => {
      if (e.streams[0]) this.cb.onRemoteStream?.(e.streams[0])
    }
    this.pc.onconnectionstatechange = () => {
      this.cb.onConnectionStateChange?.(this.pc.connectionState)
    }

    if (role === 'broadcaster' && localStream) {
      for (const track of localStream.getTracks()) {
        this.pc.addTrack(track, localStream)
      }
    }

    // Serializza il signaling: ogni messaggio è processato dopo il precedente.
    this.signaling = new SignalingChannel(sessionId, selfId, (m) => {
      this.queue = this.queue.then(() => this.onSignal(m)).catch(() => undefined)
    })
  }

  /** Aggiunge i candidati ICE messi in coda (dopo che la remote description è pronta). */
  private async flushPendingIce(): Promise<void> {
    const cands = this.pendingIce
    this.pendingIce = []
    for (const c of cands) {
      await this.pc.addIceCandidate(new RTCIceCandidate(c)).catch(() => undefined)
    }
  }

  async connect(): Promise<void> {
    await this.signaling.subscribe()
    if (this.role === 'viewer') this.signaling.send({ kind: 'ready' })
  }

  private async onSignal(m: SignalMessage): Promise<void> {
    try {
      if (m.kind === 'ready' && this.role === 'broadcaster' && !this.negotiated) {
        this.negotiated = true
        const offer = await this.pc.createOffer()
        await this.pc.setLocalDescription(offer)
        this.signaling.send({ kind: 'offer', sdp: offer })
      } else if (m.kind === 'offer' && this.role === 'viewer') {
        await this.pc.setRemoteDescription(new RTCSessionDescription(m.sdp))
        await this.flushPendingIce()
        const answer = await this.pc.createAnswer()
        await this.pc.setLocalDescription(answer)
        this.signaling.send({ kind: 'answer', sdp: answer })
      } else if (m.kind === 'answer' && this.role === 'broadcaster') {
        await this.pc.setRemoteDescription(new RTCSessionDescription(m.sdp))
        await this.flushPendingIce()
      } else if (m.kind === 'ice') {
        // Se la remote description non è ancora impostata, accoda il candidato
        // e aggiungilo dopo (flushPendingIce) invece di scartarlo.
        if (this.pc.remoteDescription && this.pc.remoteDescription.type) {
          await this.pc.addIceCandidate(new RTCIceCandidate(m.candidate)).catch(() => undefined)
        } else {
          this.pendingIce.push(m.candidate)
        }
      } else if (m.kind === 'bye') {
        this.cb.onBye?.()
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[CamRooms] errore signaling', err)
    }
  }

  /** Sostituisce/aggiorna le tracce locali (es. dopo toggle). Non rinegozia. */
  getPeerConnection(): RTCPeerConnection {
    return this.pc
  }

  /**
   * Chiude la connessione. `stopTracks` ferma le tracce dei sender: va lasciato
   * a `true` per la webcam 1:1 (stream dedicato), ma DEVE essere `false` quando
   * si chiude un singolo peer-spettatore di un broadcast pubblico, perché in
   * quel caso lo stream è CONDIVISO tra tutti gli spettatori: fermarlo qui lo
   * spegnerebbe per tutti. Lo stream condiviso va fermato una sola volta, in
   * `stopLive()`.
   */
  async close(sendBye = true, stopTracks = true): Promise<void> {
    if (sendBye) this.signaling.send({ kind: 'bye' })
    try {
      if (stopTracks) this.pc.getSenders().forEach((s) => s.track?.stop())
    } catch {
      /* noop */
    }
    this.pc.onicecandidate = null
    this.pc.ontrack = null
    this.pc.onconnectionstatechange = null
    this.pc.close()
    await this.signaling.close()
  }
}

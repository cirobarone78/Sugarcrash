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
  }

  async subscribe(): Promise<void> {
    // se la connessione cade, prova comunque a ripulire il nodo
    onDisconnect(this.nodeRef).remove()
    this.unsub = onChildAdded(this.nodeRef, (snap) => {
      const msg = snap.val() as SignalMessage | null
      if (!msg) return
      if (msg.from === this.selfId) return // ignora i propri messaggi
      this.onMessage(msg)
    })
  }

  send(msg: OutgoingSignal): void {
    void push(this.nodeRef, { ...msg, from: this.selfId })
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

    this.signaling = new SignalingChannel(sessionId, selfId, (m) => void this.onSignal(m))
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
        const answer = await this.pc.createAnswer()
        await this.pc.setLocalDescription(answer)
        this.signaling.send({ kind: 'answer', sdp: answer })
      } else if (m.kind === 'answer' && this.role === 'broadcaster') {
        await this.pc.setRemoteDescription(new RTCSessionDescription(m.sdp))
      } else if (m.kind === 'ice') {
        try {
          await this.pc.addIceCandidate(new RTCIceCandidate(m.candidate))
        } catch {
          // candidato arrivato prima della remote description: ignorabile
        }
      } else if (m.kind === 'bye') {
        this.cb.onBye?.()
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[RetroCam] errore signaling', err)
    }
  }

  /** Sostituisce/aggiorna le tracce locali (es. dopo toggle). Non rinegozia. */
  getPeerConnection(): RTCPeerConnection {
    return this.pc
  }

  async close(sendBye = true): Promise<void> {
    if (sendBye) this.signaling.send({ kind: 'bye' })
    try {
      this.pc.getSenders().forEach((s) => s.track?.stop())
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

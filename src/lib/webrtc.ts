// Helper WebRTC per la webcam privata 1:1.
//
// SIGNALING: usiamo Supabase Realtime (canale "broadcast" dedicato per sessione)
// come canale di segnalazione. È la soluzione più semplice e, soprattutto, la
// più rispettosa della privacy: offerte/risposte/candidati ICE NON vengono mai
// salvati su database, transitano solo in tempo reale e svaniscono.
//
// In alternativa (reti che non permettono il websocket di Supabase, o se si
// preferisce un signaling server proprio) è incluso un piccolo server Node
// WebSocket in /signaling con la stessa semantica di messaggi: vedi README.
//
// La tabella `webrtc_signals` rimane disponibile nello schema come fallback
// persistente documentato, ma di default non viene usata.

import { supabase } from './supabase'
import { getIceServers } from './utils'
import type { RealtimeChannel } from '@supabase/supabase-js'

export type SignalMessage =
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
 * Canale di signaling per una specifica sessione webcam.
 * Wrappa un canale broadcast di Supabase Realtime.
 */
export class SignalingChannel {
  private channel: RealtimeChannel
  private selfId: string
  private onMessage: (msg: SignalMessage) => void

  constructor(
    sessionId: string,
    selfId: string,
    onMessage: (msg: SignalMessage) => void,
  ) {
    this.selfId = selfId
    this.onMessage = onMessage
    this.channel = supabase.channel(`webrtc:${sessionId}`, {
      config: { broadcast: { ack: false, self: false } },
    })
  }

  async subscribe(): Promise<void> {
    this.channel.on('broadcast', { event: 'signal' }, ({ payload }) => {
      const msg = payload as SignalMessage
      // ignora gli echo dei propri messaggi
      if (msg.from === this.selfId) return
      this.onMessage(msg)
    })
    await new Promise<void>((resolve, reject) => {
      this.channel.subscribe((status) => {
        if (status === 'SUBSCRIBED') resolve()
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT')
          reject(new Error('Signaling channel non disponibile'))
      })
    })
  }

  send(msg: Omit<SignalMessage, 'from'>): void {
    void this.channel.send({
      type: 'broadcast',
      event: 'signal',
      payload: { ...msg, from: this.selfId },
    })
  }

  async close(): Promise<void> {
    await supabase.removeChannel(this.channel)
  }
}

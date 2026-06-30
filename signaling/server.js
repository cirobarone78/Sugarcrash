// ─────────────────────────────────────────────────────────────────────────
// Signaling server WebSocket ALTERNATIVO per RetroCam Chat.
//
// NB: di default l'app usa Supabase Realtime (broadcast) come signaling, quindi
// questo server NON è necessario. È fornito come alternativa per reti dove il
// websocket di Supabase non è raggiungibile o per chi preferisce un signaling
// proprio.
//
// Semantica: i client si uniscono a una "room" = id sessione webcam e i
// messaggi (ready/offer/answer/ice/bye) vengono inoltrati agli altri membri
// della stessa room. NESSUN messaggio viene salvato: relay puro in memoria.
//
// Uso:
//   cd signaling && npm install && npm start
//   (porta default 8787, override con PORT)
//
// Per integrarlo nel client al posto di Supabase, sostituire SignalingChannel
// in src/lib/webrtc.ts con un wrapper attorno a questo WebSocket (stesso
// formato di messaggi { kind, ... , from }).
// ─────────────────────────────────────────────────────────────────────────
import { WebSocketServer } from 'ws'
import { randomUUID } from 'node:crypto'

const PORT = process.env.PORT ? Number(process.env.PORT) : 8787
const wss = new WebSocketServer({ port: PORT })

/** Map<roomId, Set<ws>> */
const rooms = new Map()

function join(ws, roomId) {
  ws.roomId = roomId
  ws.peerId = ws.peerId || randomUUID()
  if (!rooms.has(roomId)) rooms.set(roomId, new Set())
  rooms.get(roomId).add(ws)
}

function leave(ws) {
  const room = rooms.get(ws.roomId)
  if (!room) return
  room.delete(ws)
  if (room.size === 0) rooms.delete(ws.roomId)
}

function relay(ws, data) {
  const room = rooms.get(ws.roomId)
  if (!room) return
  for (const client of room) {
    if (client !== ws && client.readyState === client.OPEN) {
      client.send(JSON.stringify(data))
    }
  }
}

wss.on('connection', (ws) => {
  ws.on('message', (raw) => {
    let msg
    try {
      msg = JSON.parse(raw.toString())
    } catch {
      return
    }
    if (msg.type === 'join' && typeof msg.room === 'string') {
      join(ws, msg.room)
      return
    }
    // qualsiasi altro messaggio viene inoltrato agli altri della room
    if (ws.roomId) relay(ws, msg)
  })

  ws.on('close', () => leave(ws))
  ws.on('error', () => leave(ws))
})

// eslint-disable-next-line no-console
console.log(`[RetroCam] signaling server in ascolto su ws://localhost:${PORT}`)

// Genera le icone PNG della PWA (192, 512, apple-touch 180) senza dipendenze
// esterne: scrive PNG validi a partire da pixel grezzi + zlib (incluso in Node).
// Design originale: sfondo viola "retro neon" con un obiettivo/lente camera.
import { writeFileSync, mkdirSync } from 'node:fs'
import { deflateSync } from 'node:zlib'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const outDir = join(__dirname, '..', 'public')
mkdirSync(outDir, { recursive: true })

// ── encoder PNG minimale (RGBA, 8-bit) ─────────────────────────────
function crc32(buf) {
  let c = ~0
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i]
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1))
  }
  return ~c >>> 0
}
function chunk(type, data) {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length, 0)
  const typeBuf = Buffer.from(type, 'ascii')
  const body = Buffer.concat([typeBuf, data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(body), 0)
  return Buffer.concat([len, body, crc])
}
function encodePNG(size, pixels) {
  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0)
  ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 6 // color type RGBA
  // raw: each row prefixed with filter byte 0
  const stride = size * 4
  const raw = Buffer.alloc((stride + 1) * size)
  for (let y = 0; y < size; y++) {
    raw[y * (stride + 1)] = 0
    pixels.copy(raw, y * (stride + 1) + 1, y * stride, y * stride + stride)
  }
  const idat = deflateSync(raw)
  return Buffer.concat([
    sig,
    chunk('IHDR', ihdr),
    chunk('IDAT', idat),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

function lerp(a, b, t) {
  return Math.round(a + (b - a) * t)
}

function drawIcon(size) {
  const px = Buffer.alloc(size * size * 4)
  const cx = size / 2
  const cy = size / 2
  const rOuter = size * 0.30
  const rInner = size * 0.17
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4
      // sfondo: gradiente diagonale viola -> viola scuro
      const t = (x + y) / (2 * size)
      let r = lerp(124, 76, t)
      let g = lerp(58, 29, t)
      let b = lerp(237, 149, t)
      const dx = x - cx
      const dy = y - cy
      const dist = Math.sqrt(dx * dx + dy * dy)
      // anello esterno chiaro (corpo lente)
      if (dist < rOuter) {
        r = 237
        g = 233
        b = 254
      }
      // lente interna scura
      if (dist < rInner) {
        r = 21
        g = 21
        b = 31
      }
      // riflesso lente
      const hlx = cx - rInner * 0.4
      const hly = cy - rInner * 0.4
      if (Math.sqrt((x - hlx) ** 2 + (y - hly) ** 2) < rInner * 0.28) {
        r = 167
        g = 139
        b = 250
      }
      px[i] = r
      px[i + 1] = g
      px[i + 2] = b
      px[i + 3] = 255
    }
  }
  return encodePNG(size, px)
}

const targets = [
  ['pwa-192x192.png', 192],
  ['pwa-512x512.png', 512],
  ['apple-touch-icon.png', 180],
]
for (const [name, size] of targets) {
  writeFileSync(join(outDir, name), drawIcon(size))
  console.log('✓ generato', name)
}

// favicon SVG (vettoriale, leggero)
const favicon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="#7c3aed"/><stop offset="1" stop-color="#4c1d95"/>
  </linearGradient></defs>
  <rect width="64" height="64" rx="14" fill="url(#g)"/>
  <circle cx="32" cy="32" r="19" fill="#ede9fe"/>
  <circle cx="32" cy="32" r="11" fill="#15151f"/>
  <circle cx="27" cy="27" r="3.5" fill="#a78bfa"/>
</svg>`
writeFileSync(join(outDir, 'favicon.svg'), favicon)
console.log('✓ generato favicon.svg')

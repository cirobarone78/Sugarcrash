// Hash SHA-256 (esadecimale) via Web Crypto. Richiede contesto sicuro
// (localhost o HTTPS). Usato per il gate password "soft" delle stanze private.
export async function sha256Hex(text: string): Promise<string> {
  const data = new TextEncoder().encode(text)
  const buf = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

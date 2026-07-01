// Hash SHA-256 (esadecimale) via Web Crypto. Richiede contesto sicuro
// (localhost o HTTPS). Usato per il gate password "soft" delle stanze private.
export async function sha256Hex(text: string): Promise<string> {
  const data = new TextEncoder().encode(text)
  const buf = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

// Salt casuale (esadecimale) per l'hash password delle stanze private. Non è
// segreto: vive nel doc leggibile della stanza e serve solo a rendere l'hash
// non riconoscibile/riusabile (no rainbow table su SHA-256 non salato).
export function randomSalt(): string {
  const bytes = new Uint8Array(16)
  crypto.getRandomValues(bytes)
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

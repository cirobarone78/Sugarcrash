// Invio immagini SENZA storage esterno: l'immagine viene ridimensionata e
// compressa lato browser e incorporata come data URL (JPEG). Così resta dentro
// Firestore (piano gratuito, nessuna carta) e nessun file viene archiviato su
// un servizio a parte.
//
// E2 — miniatura + originale separati: per non trasmettere l'immagine piena in
// ogni snapshot della lista messaggi (una chat privata carica TUTTI i messaggi
// ad ogni apertura), produciamo DUE data-URL:
//   - `thumb`  piccola (~≤420px), incorporata nel messaggio → si vede subito;
//   - `full`   originale ridimensionato (~≤1280px), salvato in un sottodoc
//              `blob/full` caricato solo al click (lightbox).
// Se l'originale è già piccolo, `thumb` e `full` coincidono e si evita il blob.

// Miniatura: lato max e cap di dimensione (deve stare sotto il limite delle
// Security Rules su `image_url`, image_url.size() <= 210000; teniamo largo).
const THUMB_MAX_DIMENSION = 420
const THUMB_MAX_BYTES = 40 * 1024

// Originale: lato max e cap. Il cap sta sotto il limite del sottodoc `blob`
// nelle Security Rules (value.size() <= 400000).
const FULL_MAX_DIMENSION = 1280
const FULL_MAX_BYTES = 380 * 1024

export interface UploadResult {
  url?: string
  errorKey?: string
}

export interface ImagePair {
  /** Miniatura incorporata nel messaggio. */
  thumb?: string
  /** Originale compresso (da salvare a parte). */
  full?: string
  /** True se `full` è di fatto uguale a `thumb` (niente blob da scrivere). */
  sameAsThumb?: boolean
  errorKey?: string
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const objectUrl = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(objectUrl)
      resolve(img)
    }
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error('decode'))
    }
    img.src = objectUrl
  })
}

// Ridisegna l'immagine entro `maxDimension` e comprime in JPEG scendendo di
// qualità finché non sta sotto `maxBytes`. Ritorna null se non ci riesce.
function encode(img: HTMLImageElement, maxDimension: number, maxBytes: number): string | null {
  const scale = Math.min(1, maxDimension / Math.max(img.width, img.height))
  const w = Math.max(1, Math.round(img.width * scale))
  const h = Math.max(1, Math.round(img.height * scale))

  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  if (!ctx) return null
  ctx.drawImage(img, 0, 0, w, h)

  let quality = 0.72
  let dataUrl = canvas.toDataURL('image/jpeg', quality)
  while (dataUrl.length > maxBytes && quality > 0.4) {
    quality -= 0.12
    dataUrl = canvas.toDataURL('image/jpeg', quality)
  }
  return dataUrl.length > maxBytes ? null : dataUrl
}

/**
 * Comprime un'immagine in una coppia { thumb, full }.
 * Ritorna { errorKey } in caso di errore.
 */
export async function compressImagePair(file: File): Promise<ImagePair> {
  if (!file.type.startsWith('image/')) return { errorKey: 'chat.imageType' }

  let img: HTMLImageElement
  try {
    img = await loadImage(file)
  } catch {
    return { errorKey: 'chat.uploadFailed' }
  }

  const thumb = encode(img, THUMB_MAX_DIMENSION, THUMB_MAX_BYTES)
  if (!thumb) return { errorKey: 'chat.imageTooBig' }

  // Se l'originale non supera la dimensione della miniatura, non serve un
  // originale separato: la miniatura È già l'immagine piena.
  const longest = Math.max(img.width, img.height)
  if (longest <= THUMB_MAX_DIMENSION) {
    return { thumb, full: thumb, sameAsThumb: true }
  }

  const full = encode(img, FULL_MAX_DIMENSION, FULL_MAX_BYTES)
  // Se l'originale non sta nel cap, ripieghiamo sulla sola miniatura (meglio
  // un'immagine leggibile che un errore).
  if (!full) return { thumb, full: thumb, sameAsThumb: true }

  return { thumb, full, sameAsThumb: false }
}

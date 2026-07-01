// Invio immagini SENZA storage esterno: l'immagine viene ridimensionata e
// compressa lato browser e incorporata nel messaggio come data URL (JPEG).
// Così resta dentro Firestore (piano gratuito, nessuna carta) e nessun file
// viene archiviato su un servizio a parte.

const MAX_DIMENSION = 1024 // lato massimo in px
// Cap del data-URL: deve stare sotto il limite delle Security Rules
// (image_url.size() <= 210000). Teniamo un margine: 204800 = 200 KB.
const MAX_DATAURL_BYTES = 200 * 1024

export interface UploadResult {
  url?: string
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

/**
 * Comprime un'immagine in un data URL JPEG ridimensionato.
 * Ritorna { url } col data URL, oppure { errorKey } in caso di errore.
 */
export async function compressImageToDataUrl(file: File): Promise<UploadResult> {
  if (!file.type.startsWith('image/')) return { errorKey: 'chat.imageType' }

  let img: HTMLImageElement
  try {
    img = await loadImage(file)
  } catch {
    return { errorKey: 'chat.uploadFailed' }
  }

  const scale = Math.min(1, MAX_DIMENSION / Math.max(img.width, img.height))
  const w = Math.max(1, Math.round(img.width * scale))
  const h = Math.max(1, Math.round(img.height * scale))

  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  if (!ctx) return { errorKey: 'chat.uploadFailed' }
  ctx.drawImage(img, 0, 0, w, h)

  // riduci progressivamente la qualità finché non sta sotto il limite
  let quality = 0.72
  let dataUrl = canvas.toDataURL('image/jpeg', quality)
  while (dataUrl.length > MAX_DATAURL_BYTES && quality > 0.4) {
    quality -= 0.12
    dataUrl = canvas.toDataURL('image/jpeg', quality)
  }
  if (dataUrl.length > MAX_DATAURL_BYTES) return { errorKey: 'chat.imageTooBig' }

  return { url: dataUrl }
}

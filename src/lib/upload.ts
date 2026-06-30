import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { storage } from './firebase'

const MAX_IMAGE_BYTES = 5 * 1024 * 1024 // 5 MB

export interface UploadResult {
  url?: string
  errorKey?: string
}

/**
 * Carica un'immagine di chat su Firebase Storage in chat-images/<uid>/<uuid>.<ext>
 * e restituisce l'URL pubblico (download URL). Valida tipo e dimensione lato client;
 * le Storage Rules ripetono i controlli lato server.
 */
export async function uploadChatImage(file: File, uid: string): Promise<UploadResult> {
  if (!file.type.startsWith('image/')) return { errorKey: 'chat.imageType' }
  if (file.size > MAX_IMAGE_BYTES) return { errorKey: 'chat.imageTooBig' }

  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg'
  const name = `${crypto.randomUUID()}.${ext}`
  const objectRef = ref(storage, `chat-images/${uid}/${name}`)

  try {
    await uploadBytes(objectRef, file, { contentType: file.type })
    const url = await getDownloadURL(objectRef)
    return { url }
  } catch {
    return { errorKey: 'chat.uploadFailed' }
  }
}

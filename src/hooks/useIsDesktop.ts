import { useEffect, useState } from 'react'

// Deve combaciare col breakpoint `lg` di Tailwind (min-width: 1024px).
const QUERY = '(min-width: 1024px)'

/**
 * Restituisce true quando il viewport è >= 1024px (breakpoint `lg`).
 * Serve a montare UN SOLO layout alla volta (desktop flottante vs mobile a pagina):
 * il CSS `hidden`/`lg:block` nasconde, ma i componenti restano montati e questo
 * causa doppie subscription/suoni. Con un breakpoint JS montiamo davvero uno solo.
 * SSR-safe: senza `window` assume desktop.
 */
export function useIsDesktop(): boolean {
  const [isDesktop, setIsDesktop] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia(QUERY).matches : true,
  )

  useEffect(() => {
    if (typeof window === 'undefined') return
    const mql = window.matchMedia(QUERY)
    const onChange = (e: MediaQueryListEvent) => setIsDesktop(e.matches)
    // riallinea nel caso il valore sia cambiato tra il primo render e l'effetto
    setIsDesktop(mql.matches)
    mql.addEventListener('change', onChange)
    return () => mql.removeEventListener('change', onChange)
  }, [])

  return isDesktop
}

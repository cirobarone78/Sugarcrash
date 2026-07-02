import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props {
  children: ReactNode
}
interface State {
  hasError: boolean
}

/**
 * Evita la "pagina navy muta": se un componente lancia un errore in render,
 * mostriamo un messaggio con azioni di recupero (ricarica / svuota cache PWA)
 * invece di lasciare lo schermo vuoto. Testo bilingue essenziale (fuori dal
 * contesto i18n, che potrebbe non essere montato).
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // eslint-disable-next-line no-console
    console.error('[CamRooms] errore di rendering', error, info)
  }

  private reload = () => window.location.reload()

  private hardReset = async () => {
    try {
      if ('serviceWorker' in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations()
        await Promise.all(regs.map((r) => r.unregister()))
      }
      if ('caches' in window) {
        const keys = await caches.keys()
        await Promise.all(keys.map((k) => caches.delete(k)))
      }
    } finally {
      window.location.reload()
    }
  }

  render() {
    if (!this.state.hasError) return this.props.children
    return (
      <div className="flex min-h-full flex-col items-center justify-center gap-4 p-6 text-center">
        <h1 className="text-lg font-bold text-white">
          Something went wrong · Qualcosa è andato storto
        </h1>
        <p className="max-w-sm text-sm text-ink-400">
          Try reloading. If it keeps happening, clear the app cache.
          <br />
          Prova a ricaricare. Se persiste, svuota la cache dell’app.
        </p>
        <div className="flex gap-2">
          <button onClick={this.reload} className="btn-primary">
            Reload · Ricarica
          </button>
          <button onClick={this.hardReset} className="btn-ghost">
            Clear cache · Svuota cache
          </button>
        </div>
      </div>
    )
  }
}

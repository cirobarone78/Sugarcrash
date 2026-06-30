import { type ReactNode } from 'react'
import { usePrivateChat } from '../context/PrivateChatContext'
import { PrivateThreadList } from './PrivateThreadList'
import { PrivateChatWindow } from './PrivateChatWindow'

interface PrivateChatDrawerProps {
  /** Slot webcam opzionali (Fase 2). */
  headerActions?: ReactNode
  webcamArea?: ReactNode
}

/**
 * Pannello chat private: overlay a destra su desktop, schermo intero su mobile.
 */
export function PrivateChatDrawer({ headerActions, webcamArea }: PrivateChatDrawerProps) {
  const { drawerOpen, setDrawerOpen, activeThreadId, closeThread } = usePrivateChat()

  if (!drawerOpen) return null

  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-black/50" onClick={() => setDrawerOpen(false)}>
      <aside
        className="flex h-full w-full max-w-md flex-col bg-ink-900 shadow-2xl sm:border-l sm:border-ink-700"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between border-b border-ink-700 px-3 py-2.5">
          <h2 className="text-sm font-bold text-white">💬 Messaggi privati</h2>
          <button
            onClick={() => setDrawerOpen(false)}
            className="rounded-md p-1 text-ink-400 hover:bg-ink-800 hover:text-white"
            aria-label="Chiudi"
          >
            ✕
          </button>
        </header>

        <div className="flex min-h-0 flex-1 flex-col">
          {activeThreadId ? (
            <PrivateChatWindow
              onBack={closeThread}
              headerActions={headerActions}
              webcamArea={webcamArea}
            />
          ) : (
            <PrivateThreadList />
          )}
        </div>
      </aside>
    </div>
  )
}

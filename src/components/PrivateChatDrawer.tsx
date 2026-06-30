import { usePrivateChat } from '../context/PrivateChatContext'
import { useI18n } from '../lib/i18n'
import { PrivateThreadList } from './PrivateThreadList'
import { PrivateChatWindow } from './PrivateChatWindow'
import { WebcamLaunchButton, WebcamPanel } from './WebcamPanel'

/**
 * Pannello chat private: overlay a destra su desktop, schermo intero su mobile.
 * Integra i controlli webcam (Fase 2) per la conversazione attiva.
 */
export function PrivateChatDrawer() {
  const { drawerOpen, setDrawerOpen, threads, activeThreadId, activeOther, closeThread } = usePrivateChat()
  const { t } = useI18n()

  if (!drawerOpen) return null

  const current = threads.find((t) => t.thread.id === activeThreadId)
  const other = current?.other ?? activeOther

  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-black/50" onClick={() => setDrawerOpen(false)}>
      <aside
        className="flex h-full w-full max-w-md flex-col bg-ink-900 shadow-2xl sm:border-l sm:border-ink-700"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between border-b border-ink-700 px-3 py-2.5">
          <h2 className="text-sm font-bold text-white">{t('pm.title')}</h2>
          <button
            onClick={() => setDrawerOpen(false)}
            className="rounded-md p-1 text-ink-400 hover:bg-ink-800 hover:text-white"
            aria-label={t('common.close')}
          >
            ✕
          </button>
        </header>

        <div className="flex min-h-0 flex-1 flex-col">
          {activeThreadId && other ? (
            <PrivateChatWindow
              onBack={closeThread}
              headerActions={<WebcamLaunchButton otherId={other.id} otherName={other.username} />}
              webcamArea={<WebcamPanel otherId={other.id} otherName={other.username} />}
            />
          ) : (
            <PrivateThreadList />
          )}
        </div>
      </aside>
    </div>
  )
}

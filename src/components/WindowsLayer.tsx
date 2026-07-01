import { useEffect } from 'react'
import { useWindows, type WinOther } from '../context/WindowsContext'
import { useWebcam } from '../context/WebcamContext'
import { usePrivateChat } from '../context/PrivateChatContext'
import { usePresence } from '../context/PresenceContext'
import { useAuth } from '../context/AuthContext'
import { useUI } from '../context/UIContext'
import { useI18n } from '../lib/i18n'
import { FloatingWindow } from './FloatingWindow'
import { MobilePrivateChats } from './MobilePrivateChats'
import { ChatWindowContent } from './ChatWindowContent'
import { Avatar } from './Avatar'
import { Icon } from './Icon'
import { WebcamLaunchButton } from './WebcamPanel'
import { LocalVideoPreview } from './LocalVideoPreview'
import { RemoteVideoViewer } from './RemoteVideoViewer'
import { WebcamControls } from './WebcamControls'
import { formatTime } from '../lib/utils'

/** Livello che disegna tutte le finestre mobili (chat, webcam, messaggi) + dock. */
export function WindowsLayer() {
  const { profile } = useAuth()
  const { onlineUsers } = usePresence()
  const { openUserProfile, openBlock, openReport } = useUI()
  const { t } = useI18n()
  const {
    chats,
    geom,
    messagesOpen,
    openChat,
    closeChat,
    closeMessages,
    focus,
    move,
    resize,
    setMin,
    ensureGeom,
    removeGeom,
  } = useWindows()
  const { threads } = usePrivateChat()
  const {
    outgoing,
    incoming,
    error,
    clearError,
    toggleMic,
    toggleVideo,
    endOutgoing,
    endIncoming,
  } = useWebcam()

  const resolveOther = (id: string, fallbackName?: string): WinOther => {
    const p = onlineUsers.find((u) => u.user_id === id)
    return {
      id,
      username: p?.username ?? fallbackName ?? 'user',
      avatar_url: p?.avatar_url ?? null,
      status: p?.status ?? 'online',
    }
  }

  // Geometria per le finestre webcam: creala all'apparire, rimuovila alla fine.
  useEffect(() => {
    if (outgoing) ensureGeom('cam-out', { x: 24, y: 90, w: 300, h: 300 })
    else removeGeom('cam-out')
  }, [outgoing, ensureGeom, removeGeom])

  useEffect(() => {
    if (incoming) ensureGeom('cam-in', { x: 24, y: 410, w: 320, h: 320 })
    else removeGeom('cam-in')
  }, [incoming, ensureGeom, removeGeom])

  // All'accettazione/avvio webcam apri anche la chat con l'interlocutore.
  useEffect(() => {
    if (incoming) openChat(resolveOther(incoming.session.broadcaster_id))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [incoming?.session.id])
  useEffect(() => {
    if (outgoing) openChat(resolveOther(outgoing.session.viewer_id))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [outgoing?.session.id])

  const camInName = incoming ? resolveOther(incoming.session.broadcaster_id).username : ''

  // Voci minimizzate per la dock.
  const dock: { id: string; label: string; onRestore: () => void; onClose: () => void }[] = []
  for (const c of chats) {
    if (geom[c.id]?.min) {
      dock.push({
        id: c.id,
        label: c.other.username,
        onRestore: () => setMin(c.id, false),
        onClose: () => closeChat(c.id),
      })
    }
  }
  if (messagesOpen && geom['messages']?.min) {
    dock.push({
      id: 'messages',
      label: t('pm.title'),
      onRestore: () => setMin('messages', false),
      onClose: closeMessages,
    })
  }
  if (outgoing && geom['cam-out']?.min) {
    dock.push({
      id: 'cam-out',
      label: t('cam.youPreview'),
      onRestore: () => setMin('cam-out', false),
      onClose: () => void endOutgoing(),
    })
  }
  if (incoming && geom['cam-in']?.min) {
    dock.push({
      id: 'cam-in',
      label: t('cam.webcamOf', { name: camInName }),
      onRestore: () => setMin('cam-in', false),
      onClose: () => void endIncoming(),
    })
  }

  const gMessages = geom['messages']
  const gOut = geom['cam-out']
  const gIn = geom['cam-in']

  return (
    <>
    {/* Mobile: una pagina per chat con schede per switchare */}
    <MobilePrivateChats />

    {/* Desktop/tablet: finestre mobili flottanti sopra la chat di gruppo */}
    <div className="pointer-events-none fixed inset-0 z-30 hidden lg:block">
      {/* Errore webcam globale */}
      {error && (
        <div className="pointer-events-auto fixed left-1/2 top-3 z-[60] flex max-w-[92vw] -translate-x-1/2 items-center gap-2 rounded-full bg-accent-red/90 px-4 py-2 text-sm text-white shadow-pill">
          <Icon name="alert" size={16} />
          <span className="truncate">{error}</span>
          <button onClick={clearError} aria-label={t('common.close')}>
            <Icon name="close" size={16} />
          </button>
        </div>
      )}

      {/* Finestre di chat private */}
      {chats.map((c) => {
        const g = geom[c.id]
        if (!g || g.min) return null
        return (
          <FloatingWindow
            key={c.id}
            x={g.x}
            y={g.y}
            z={g.z}
            w={g.w}
            h={g.h}
            onMove={(x, y) => move(c.id, x, y)}
            onResize={(w, h) => resize(c.id, w, h)}
            onFocus={() => focus(c.id)}
            onMinimize={() => setMin(c.id, true)}
            onClose={() => closeChat(c.id)}
            title={
              <button
                onClick={() => openUserProfile(c.other.id)}
                className="flex min-w-0 items-center gap-2"
              >
                <Avatar username={c.other.username} avatarUrl={c.other.avatar_url} status={c.other.status} size={26} showStatus ring />
                <span className="truncate text-sm font-semibold text-ink-200">{c.other.username}</span>
              </button>
            }
            headerExtra={
              <div className="flex items-center gap-0.5">
                <WebcamLaunchButton otherId={c.other.id} otherName={c.other.username} />
                <button
                  onClick={() => openBlock({ id: c.other.id, username: c.other.username })}
                  className="rounded-md p-1 text-ink-400 hover:bg-ink-800 hover:text-white"
                  title={t('profile.block')}
                >
                  <Icon name="ban" size={15} />
                </button>
                <button
                  onClick={() => openReport({ reportedUserId: c.other.id, label: c.other.username })}
                  className="rounded-md p-1 text-ink-400 hover:bg-ink-800 hover:text-accent-red"
                  title={t('profile.report')}
                >
                  <Icon name="flag" size={15} />
                </button>
              </div>
            }
          >
            <ChatWindowContent threadId={c.id} other={c.other} focused={!g.min} />
          </FloatingWindow>
        )
      })}

      {/* Finestra: la mia webcam in uscita */}
      {outgoing && gOut && !gOut.min && (
        <FloatingWindow
          x={gOut.x}
          y={gOut.y}
          z={gOut.z}
          w={gOut.w}
          h={gOut.h}
          minHeight={220}
          onMove={(x, y) => move('cam-out', x, y)}
          onResize={(w, h) => resize('cam-out', w, h)}
          onFocus={() => focus('cam-out')}
          onMinimize={() => setMin('cam-out', true)}
          onClose={() => void endOutgoing()}
          title={
            <span className="flex items-center gap-2 text-sm font-semibold text-ink-200">
              <Icon name="video" size={16} className="text-accent-orange" />
              {t('cam.youPreview')}
            </span>
          }
        >
          <div className="flex h-full flex-col gap-2 p-2">
            <div className="min-h-0 flex-1">
              <LocalVideoPreview stream={outgoing.localStream} videoEnabled={outgoing.videoEnabled} />
            </div>
            <WebcamControls
              audioEnabled={outgoing.audioEnabled}
              videoEnabled={outgoing.videoEnabled}
              hasAudio={outgoing.session.audio_enabled}
              onToggleMic={toggleMic}
              onToggleVideo={toggleVideo}
              onClose={() => void endOutgoing()}
            />
          </div>
        </FloatingWindow>
      )}

      {/* Finestra: webcam in arrivo dall'altro utente */}
      {incoming && gIn && !gIn.min && (
        <FloatingWindow
          x={gIn.x}
          y={gIn.y}
          z={gIn.z}
          w={gIn.w}
          h={gIn.h}
          minHeight={220}
          onMove={(x, y) => move('cam-in', x, y)}
          onResize={(w, h) => resize('cam-in', w, h)}
          onFocus={() => focus('cam-in')}
          onMinimize={() => setMin('cam-in', true)}
          onClose={() => void endIncoming()}
          title={
            <span className="flex min-w-0 items-center gap-2 text-sm font-semibold text-ink-200">
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-accent-red" />
              <span className="truncate">{t('cam.webcamOf', { name: camInName })}</span>
            </span>
          }
        >
          <div className="flex h-full flex-col gap-2 p-2">
            <div className="min-h-0 flex-1">
              <RemoteVideoViewer
                stream={incoming.remoteStream}
                connState={incoming.connState}
                watermarkName={profile?.username ?? 'user'}
                sessionId={incoming.session.id}
              />
            </div>
            <div className="flex items-center justify-end gap-1.5">
              <button
                onClick={() => openBlock({ id: incoming.session.broadcaster_id, username: camInName })}
                className="btn-ghost text-xs"
              >
                <Icon name="ban" size={14} />
                {t('cam.block')}
              </button>
              <button
                onClick={() => openReport({ reportedUserId: incoming.session.broadcaster_id, label: camInName })}
                className="btn-ghost text-xs text-accent-red"
              >
                <Icon name="flag" size={14} />
                {t('cam.report')}
              </button>
            </div>
          </div>
        </FloatingWindow>
      )}

      {/* Finestra: elenco messaggi (launcher) */}
      {messagesOpen && gMessages && !gMessages.min && (
        <FloatingWindow
          x={gMessages.x}
          y={gMessages.y}
          z={gMessages.z}
          w={gMessages.w}
          h={gMessages.h}
          onMove={(x, y) => move('messages', x, y)}
          onResize={(w, h) => resize('messages', w, h)}
          onFocus={() => focus('messages')}
          onMinimize={() => setMin('messages', true)}
          onClose={closeMessages}
          title={
            <span className="flex items-center gap-2 text-sm font-semibold text-ink-200">
              <Icon name="message" size={16} className="text-brand-300" />
              {t('pm.title')}
            </span>
          }
        >
          <div className="min-h-0 flex-1 overflow-y-auto">
            {threads.length === 0 ? (
              <p className="p-6 text-center text-sm text-ink-400">{t('pm.empty')}</p>
            ) : (
              threads.map((th) => (
                <button
                  key={th.thread.id}
                  onClick={() => openChat(th.other)}
                  className="flex w-full items-center gap-3 border-b border-white/[0.04] px-3 py-2.5 text-left hover:bg-white/[0.04]"
                >
                  <Avatar username={th.other.username} avatarUrl={th.other.avatar_url} status={th.other.status} size={38} showStatus ring />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-semibold text-ink-200">{th.other.username}</span>
                      {th.lastAt && <span className="shrink-0 text-[10px] text-ink-400">{formatTime(th.lastAt)}</span>}
                    </div>
                    <p className="truncate text-xs text-ink-400">{th.lastBody ?? t('pm.newConv')}</p>
                  </div>
                  {th.unread > 0 && (
                    <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-accent-red px-1 text-[10px] font-bold text-white">
                      {th.unread}
                    </span>
                  )}
                </button>
              ))
            )}
          </div>
        </FloatingWindow>
      )}

      {/* Dock delle finestre minimizzate */}
      {dock.length > 0 && (
        <div className="pointer-events-auto fixed bottom-20 left-1/2 z-40 flex max-w-[94vw] -translate-x-1/2 flex-wrap items-center justify-center gap-2 lg:bottom-3">
          {dock.map((d) => (
            <div
              key={d.id}
              className="flex items-center gap-1.5 rounded-full border border-white/10 bg-ink-850 py-1 pl-3 pr-1.5 shadow-pill"
            >
              <button onClick={d.onRestore} className="flex items-center gap-1.5 text-xs font-semibold text-ink-200">
                <Icon name="message" size={13} className="text-brand-300" />
                <span className="max-w-[120px] truncate">{d.label}</span>
              </button>
              <button
                onClick={d.onClose}
                className="rounded-full p-1 text-ink-400 hover:bg-ink-800 hover:text-white"
                aria-label={t('common.close')}
              >
                <Icon name="close" size={13} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
    </>
  )
}

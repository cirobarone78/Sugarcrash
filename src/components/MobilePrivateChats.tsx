import { useEffect, useRef, useState } from 'react'
import { useWindows } from '../context/WindowsContext'
import { usePrivateChat } from '../context/PrivateChatContext'
import { useAuth } from '../context/AuthContext'
import { useUI } from '../context/UIContext'
import { useWebcam } from '../context/WebcamContext'
import { useI18n } from '../lib/i18n'
import { ChatWindowContent } from './ChatWindowContent'
import { LocalVideoPreview } from './LocalVideoPreview'
import { RemoteVideoViewer } from './RemoteVideoViewer'
import { WebcamControls } from './WebcamControls'
import { WebcamLaunchButton } from './WebcamPanel'
import { Avatar } from './Avatar'
import { Icon } from './Icon'
import { formatTime } from '../lib/utils'

/**
 * Su mobile le chat private sono pagine a schermo intero: una per conversazione,
 * con schede in alto per passare dall'una all'altra. Niente finestre trascinabili.
 */
export function MobilePrivateChats() {
  const { chats, closeChat, messagesOpen, closeMessages, openChat } = useWindows()
  const { threads, clearThread } = usePrivateChat()
  const { profile } = useAuth()
  const { openUserProfile, openBlock, openReport } = useUI()
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
  const { t } = useI18n()

  const [activeId, setActiveId] = useState<string | null>(null)
  const [listMode, setListMode] = useState(false)
  const [hidden, setHidden] = useState(false)
  const prevLen = useRef(0)

  useEffect(() => {
    if (chats.length > prevLen.current) {
      setActiveId(chats[chats.length - 1].id)
      setListMode(false)
      setHidden(false)
    }
    if (activeId && !chats.some((c) => c.id === activeId)) {
      setActiveId(chats.length ? chats[chats.length - 1].id : null)
    }
    prevLen.current = chats.length
  }, [chats, activeId])

  useEffect(() => {
    if (messagesOpen) {
      setHidden(false)
      setListMode(true)
    }
  }, [messagesOpen])

  const visible = (chats.length > 0 || messagesOpen) && !hidden
  if (!visible) return null

  const active = !listMode ? chats.find((c) => c.id === activeId) ?? null : null

  const hide = () => {
    setHidden(true)
    if (messagesOpen) closeMessages()
  }

  const deleteChat = (id: string) => {
    if (typeof window !== 'undefined' && !window.confirm(t('pm.deleteConfirm'))) return
    void clearThread(id)
    closeChat(id)
  }

  const showRemote = active && incoming && incoming.session.broadcaster_id === active.other.id
  const showLocal = active && outgoing && outgoing.session.viewer_id === active.other.id

  return (
    <div className="fixed inset-0 z-40 flex flex-col bg-ink-950 lg:hidden">
      {/* Intestazione */}
      <div className="flex items-center gap-2 border-b border-white/[0.06] bg-ink-900 px-2 py-2">
        <button
          onClick={hide}
          className="rounded-lg p-1.5 text-ink-400 hover:bg-ink-800 hover:text-white"
          aria-label={t('common.back')}
        >
          <Icon name="back" size={20} />
        </button>
        {active ? (
          <>
            <button onClick={() => openUserProfile(active.other.id)} className="flex min-w-0 flex-1 items-center gap-2">
              <Avatar username={active.other.username} avatarUrl={active.other.avatar_url} status={active.other.status} size={30} showStatus ring />
              <span className="truncate text-sm font-semibold text-ink-200">{active.other.username}</span>
            </button>
            <WebcamLaunchButton otherId={active.other.id} otherName={active.other.username} />
            <button
              onClick={() => openBlock({ id: active.other.id, username: active.other.username })}
              className="rounded-md p-1.5 text-ink-400 hover:bg-ink-800 hover:text-white"
              title={t('profile.block')}
            >
              <Icon name="ban" size={16} />
            </button>
            <button
              onClick={() => openReport({ reportedUserId: active.other.id, label: active.other.username })}
              className="rounded-md p-1.5 text-ink-400 hover:bg-ink-800 hover:text-accent-red"
              title={t('profile.report')}
            >
              <Icon name="flag" size={16} />
            </button>
            <button
              onClick={() => deleteChat(active.id)}
              className="rounded-md p-1.5 text-ink-400 hover:bg-ink-800 hover:text-accent-red"
              title={t('pm.delete')}
            >
              <Icon name="trash" size={16} />
            </button>
          </>
        ) : (
          <h2 className="flex flex-1 items-center gap-2 text-sm font-bold text-white">
            <Icon name="message" size={16} className="text-brand-300" />
            {t('pm.title')}
          </h2>
        )}
      </div>

      {/* Schede delle chat aperte */}
      {chats.length > 0 && (
        <div className="flex items-center gap-1.5 overflow-x-auto border-b border-white/[0.06] bg-ink-900/60 px-2 py-1.5">
          <button
            onClick={() => setListMode(true)}
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
              listMode ? 'bg-brand-500 text-white' : 'bg-ink-800 text-ink-300'
            }`}
            title={t('pm.title')}
          >
            <Icon name="message" size={16} />
          </button>
          {chats.map((c) => {
            const on = !listMode && c.id === activeId
            return (
              <button
                key={c.id}
                onClick={() => { setActiveId(c.id); setListMode(false) }}
                className={`flex shrink-0 items-center gap-1.5 rounded-full py-1 pl-1 pr-2 ${
                  on ? 'bg-brand-500/20 ring-1 ring-brand-500' : 'bg-ink-800'
                }`}
              >
                <Avatar username={c.other.username} avatarUrl={c.other.avatar_url} status={c.other.status} size={22} />
                <span className={`max-w-[90px] truncate text-xs font-semibold ${on ? 'text-white' : 'text-ink-300'}`}>
                  {c.other.username}
                </span>
                <span
                  onClick={(e) => { e.stopPropagation(); closeChat(c.id) }}
                  className="rounded-full p-0.5 text-ink-400 hover:text-white"
                  aria-label={t('common.close')}
                >
                  <Icon name="close" size={12} />
                </span>
              </button>
            )
          })}
        </div>
      )}

      {error && (
        <div className="flex items-center justify-between gap-2 bg-accent-red/15 px-3 py-2 text-sm text-red-200">
          <span className="truncate">{error}</span>
          <button onClick={clearError} aria-label={t('common.close')}>
            <Icon name="close" size={16} />
          </button>
        </div>
      )}

      {/* Corpo */}
      {active ? (
        <div className="flex min-h-0 flex-1 flex-col">
          {(showRemote || showLocal) && (
            <div className="shrink-0 space-y-2 border-b border-white/[0.06] bg-black/40 p-2">
              {showRemote && (
                <div className="mx-auto max-w-xs">
                  <RemoteVideoViewer
                    stream={incoming!.remoteStream}
                    connState={incoming!.connState}
                    watermarkName={profile?.username ?? 'user'}
                    sessionId={incoming!.session.id}
                  />
                  <div className="mt-1 flex justify-end">
                    <button onClick={() => void endIncoming()} className="btn-danger px-3 py-1 text-xs">
                      {t('cam.closeCam')}
                    </button>
                  </div>
                </div>
              )}
              {showLocal && (
                <div className="mx-auto max-w-xs space-y-2">
                  <LocalVideoPreview stream={outgoing!.localStream} videoEnabled={outgoing!.videoEnabled} />
                  <WebcamControls
                    audioEnabled={outgoing!.audioEnabled}
                    videoEnabled={outgoing!.videoEnabled}
                    hasAudio={outgoing!.session.audio_enabled}
                    onToggleMic={toggleMic}
                    onToggleVideo={toggleVideo}
                    onClose={() => void endOutgoing()}
                  />
                </div>
              )}
            </div>
          )}
          <div className="min-h-0 flex-1">
            <ChatWindowContent threadId={active.id} other={active.other} focused={!hidden} />
          </div>
        </div>
      ) : (
        <div className="min-h-0 flex-1 overflow-y-auto">
          {threads.length === 0 ? (
            <p className="p-8 text-center text-sm text-ink-400">{t('pm.empty')}</p>
          ) : (
            threads.map((th) => (
              <div
                key={th.thread.id}
                className="flex w-full items-center gap-2 border-b border-white/[0.04] pr-2"
              >
                <button
                  onClick={() => openChat(th.other)}
                  className="flex min-w-0 flex-1 items-center gap-3 px-3 py-3 text-left"
                >
                  <Avatar username={th.other.username} avatarUrl={th.other.avatar_url} status={th.other.status} size={44} showStatus ring />
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
                <button
                  onClick={() => deleteChat(th.thread.id)}
                  className="shrink-0 rounded-md p-2 text-ink-400 hover:bg-ink-800 hover:text-accent-red"
                  title={t('pm.delete')}
                >
                  <Icon name="trash" size={18} />
                </button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}

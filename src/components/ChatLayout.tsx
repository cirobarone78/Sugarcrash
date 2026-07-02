import { useState } from 'react'
import { useRooms } from '../hooks/useRooms'
import { usePrivateRooms } from '../hooks/usePrivateRooms'
import { useAuth } from '../context/AuthContext'
import { usePrivateChat } from '../context/PrivateChatContext'
import { useWindows } from '../context/WindowsContext'
import { useRoulette } from '../context/RouletteContext'
import { useFriends } from '../context/FriendsContext'
import { useIsDesktop } from '../hooks/useIsDesktop'
import { RoomList } from './RoomList'
import { LobbyPage } from './LobbyPage'
import { RoomChat } from './RoomChat'
import { OnlineUsersPanel } from './OnlineUsersPanel'
import { SettingsPanel } from './SettingsPanel'
import { CreateRoomModal } from './CreateRoomModal'
import { JoinRoomModal } from './JoinRoomModal'
import { Avatar } from './Avatar'
import { Icon, Logo, type IconName } from './Icon'
import { statusColor } from '../lib/utils'
import { useI18n } from '../lib/i18n'
import type { Room } from '../lib/types'

type MobileTab = 'rooms' | 'chat' | 'users' | 'private'

export function ChatLayout() {
  const { rooms } = useRooms()
  const { rooms: privateRooms, isUnlocked, createRoom, joinRoom } = usePrivateRooms()
  const { profile, isGuest } = useAuth()
  const { totalUnread } = usePrivateChat()
  const { openMessages } = useWindows()
  const roulette = useRoulette()
  const { incoming } = useFriends()
  const isDesktop = useIsDesktop()
  const { t } = useI18n()
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [joinTarget, setJoinTarget] = useState<Room | null>(null)
  const [tab, setTab] = useState<MobileTab>('rooms')
  // Menu stanze (desktop) comprimibile per dare più spazio alla chat; preferenza salvata.
  const [roomsOpen, setRoomsOpen] = useState(
    () => localStorage.getItem('retrocam.roomsOpen') !== 'false',
  )
  function toggleRooms() {
    setRoomsOpen((v) => {
      localStorage.setItem('retrocam.roomsOpen', String(!v))
      return !v
    })
  }

  function enterRoom(room: Room) {
    setSelectedRoom(room)
    setTab('chat')
  }

  function selectRoom(room: Room) {
    // stanza privata bloccata → chiedi la password
    if (room.kind === 'private' && !isUnlocked(room)) {
      setJoinTarget(room)
      return
    }
    enterRoom(room)
  }

  const center = selectedRoom ? (
    <RoomChat room={selectedRoom} onLeave={() => { setSelectedRoom(null); setTab('rooms') }} />
  ) : (
    <LobbyPage
      rooms={rooms}
      privateRooms={privateRooms}
      onEnter={selectRoom}
      onCreatePrivate={() => (isGuest ? setSettingsOpen(true) : setCreateOpen(true))}
      isUnlocked={isUnlocked}
    />
  )

  return (
    <div className="flex h-full flex-col">
      {/* Barra superiore */}
      <header className="flex items-center justify-between border-b border-white/[0.06] bg-ink-900/70 px-3 py-2 backdrop-blur-xl">
        <div className="flex items-center gap-2">
          <button
            onClick={toggleRooms}
            className="icon-btn hidden lg:inline-flex"
            title={roomsOpen ? t('rooms.hide') : t('rooms.show')}
            aria-label={roomsOpen ? t('rooms.hide') : t('rooms.show')}
          >
            <Icon name="sidebar" size={18} />
          </button>
          <Logo size={28} />
          <span className="text-[15px] font-bold tracking-tight text-white">CamRooms</span>
        </div>
        <div className="flex items-center gap-1.5">
          {isGuest && (
            <button
              onClick={() => setSettingsOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-full bg-brand-500 px-3.5 py-1.5 text-xs font-semibold text-white shadow-glow hover:bg-brand-400"
              title={t('header.register')}
            >
              <Icon name="sparkle" size={14} />
              {t('header.register')}
            </button>
          )}
          <button
            onClick={roulette.open}
            className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-teal-500 to-brand-500 px-3 py-1.5 text-xs font-semibold text-white shadow-glow hover:brightness-110"
            title={t('roulette.launch')}
          >
            <Icon name="camera" size={14} />
            <span className="hidden sm:inline">{t('roulette.launch')}</span>
          </button>
          <button
            onClick={openMessages}
            className="relative icon-btn"
            title={t('header.pm')}
          >
            <Icon name="message" size={18} />
            {totalUnread > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent-red px-1 text-[10px] font-bold text-white">
                {totalUnread}
              </span>
            )}
          </button>
          <button
            onClick={() => setSettingsOpen(true)}
            className="relative flex items-center gap-1.5 rounded-xl px-1.5 py-1 hover:bg-ink-800"
            title={t('header.settings')}
          >
            {profile && (
              <Avatar username={profile.username} avatarUrl={profile.avatar_url} status={profile.status} size={28} showStatus ring />
            )}
            {incoming.length > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent-green px-1 text-[10px] font-bold text-white">
                {incoming.length}
              </span>
            )}
            <span className="hidden text-sm text-ink-200 sm:inline">{profile?.username}</span>
            <span className="h-2 w-2 rounded-full sm:hidden" style={{ background: profile ? statusColor[profile.status] : '#666' }} />
          </button>
        </div>
      </header>

      {/* Desktop: colonne (menu stanze comprimibile) */}
      <div
        className="hidden min-h-0 flex-1 lg:grid"
        style={{ gridTemplateColumns: roomsOpen ? '16rem 1fr 16rem' : '1fr 16rem' }}
      >
        {roomsOpen && (
          <div className="overflow-y-auto border-r border-ink-700 bg-ink-900">
            <RoomList rooms={rooms} selectedRoomId={selectedRoom?.id ?? null} onSelect={selectRoom} />
          </div>
        )}
        {/* B1: `center` (RoomChat/useRoomMessages) montato UNA sola volta. */}
        <div className="min-w-0 bg-ink-950">{isDesktop ? center : null}</div>
        <div className="overflow-hidden border-l border-ink-700 bg-ink-900">
          <OnlineUsersPanel roomSlug={selectedRoom?.slug ?? null} />
        </div>
      </div>

      {/* Mobile: tab singole */}
      <div className="min-h-0 flex-1 lg:hidden">
        {tab === 'rooms' && (
          <div className="h-full overflow-y-auto bg-ink-900">
            <RoomList rooms={rooms} selectedRoomId={selectedRoom?.id ?? null} onSelect={selectRoom} />
          </div>
        )}
        {tab === 'chat' && !isDesktop && <div className="h-full bg-ink-950">{center}</div>}
        {tab === 'users' && (
          <div className="h-full bg-ink-900">
            <OnlineUsersPanel roomSlug={selectedRoom?.slug ?? null} />
          </div>
        )}
      </div>

      {/* Tab bar mobile */}
      <nav className="grid grid-cols-4 border-t border-white/[0.06] bg-ink-900/80 backdrop-blur-xl lg:hidden">
        <TabButton label={t('tab.rooms')} icon="home" active={tab === 'rooms'} onClick={() => setTab('rooms')} />
        <TabButton label={t('tab.chat')} icon="chat" active={tab === 'chat'} onClick={() => setTab('chat')} />
        <TabButton label={t('tab.users')} icon="users" active={tab === 'users'} onClick={() => setTab('users')} />
        <TabButton
          label={t('tab.private')}
          icon="message"
          active={false}
          badge={totalUnread}
          onClick={openMessages}
        />
      </nav>

      <SettingsPanel open={settingsOpen} onClose={() => setSettingsOpen(false)} />
      <CreateRoomModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreate={createRoom}
        onCreated={(room) => {
          setCreateOpen(false)
          enterRoom(room)
        }}
      />
      <JoinRoomModal
        room={joinTarget}
        onClose={() => setJoinTarget(null)}
        onJoin={joinRoom}
        onJoined={(room) => {
          setJoinTarget(null)
          enterRoom(room)
        }}
      />
    </div>
  )
}

function TabButton({
  label,
  icon,
  active,
  badge,
  onClick,
}: {
  label: string
  icon: IconName
  active: boolean
  badge?: number
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`relative flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors ${active ? 'text-brand-300' : 'text-ink-400'}`}
    >
      <Icon name={icon} size={20} />
      {label}
      {badge !== undefined && badge > 0 && (
        <span className="absolute right-1/4 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent-red px-1 text-[10px] font-bold text-white">
          {badge}
        </span>
      )}
    </button>
  )
}

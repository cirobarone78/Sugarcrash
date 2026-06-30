import { useState } from 'react'
import { useRooms } from '../hooks/useRooms'
import { useAuth } from '../context/AuthContext'
import { usePrivateChat } from '../context/PrivateChatContext'
import { RoomList } from './RoomList'
import { LobbyPage } from './LobbyPage'
import { RoomChat } from './RoomChat'
import { OnlineUsersPanel } from './OnlineUsersPanel'
import { PrivateChatDrawer } from './PrivateChatDrawer'
import { SettingsPanel } from './SettingsPanel'
import { Avatar } from './Avatar'
import { statusColor } from '../lib/utils'
import { useI18n } from '../lib/i18n'
import type { Room } from '../lib/types'

type MobileTab = 'rooms' | 'chat' | 'users' | 'private'

export function ChatLayout() {
  const { rooms } = useRooms()
  const { profile, isGuest } = useAuth()
  const { totalUnread, drawerOpen, setDrawerOpen } = usePrivateChat()
  const { t } = useI18n()
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [tab, setTab] = useState<MobileTab>('rooms')

  function selectRoom(room: Room) {
    setSelectedRoom(room)
    setTab('chat')
  }

  const center = selectedRoom ? (
    <RoomChat room={selectedRoom} onLeave={() => { setSelectedRoom(null); setTab('rooms') }} />
  ) : (
    <LobbyPage rooms={rooms} onEnter={selectRoom} />
  )

  return (
    <div className="flex h-full flex-col">
      {/* Barra superiore */}
      <header className="flex items-center justify-between border-b border-ink-700 bg-ink-900 px-3 py-2">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-lg">📷</span>
          <span className="font-extrabold text-white">RetroCam Chat</span>
        </div>
        <div className="flex items-center gap-1.5">
          {isGuest && (
            <button
              onClick={() => setSettingsOpen(true)}
              className="rounded-lg bg-brand-600 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-brand-500"
              title={t('header.register')}
            >
              {t('header.register')}
            </button>
          )}
          <button
            onClick={() => setDrawerOpen(true)}
            className="relative rounded-lg px-2.5 py-1.5 text-sm text-ink-200 hover:bg-ink-800"
            title={t('header.pm')}
          >
            💬
            {totalUnread > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent-red px-1 text-[10px] font-bold text-white">
                {totalUnread}
              </span>
            )}
          </button>
          <button
            onClick={() => setSettingsOpen(true)}
            className="flex items-center gap-1.5 rounded-lg px-1.5 py-1 hover:bg-ink-800"
            title={t('header.settings')}
          >
            {profile && (
              <Avatar username={profile.username} avatarUrl={profile.avatar_url} status={profile.status} size={28} showStatus />
            )}
            <span className="hidden text-sm text-ink-200 sm:inline">{profile?.username}</span>
            <span className="h-2 w-2 rounded-full sm:hidden" style={{ background: profile ? statusColor[profile.status] : '#666' }} />
          </button>
        </div>
      </header>

      {/* Desktop: 3 colonne */}
      <div className="hidden min-h-0 flex-1 lg:grid lg:grid-cols-[16rem_1fr_16rem]">
        <div className="overflow-y-auto border-r border-ink-700 bg-ink-900">
          <RoomList rooms={rooms} selectedRoomId={selectedRoom?.id ?? null} onSelect={selectRoom} />
        </div>
        <div className="min-w-0 bg-ink-950">{center}</div>
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
        {tab === 'chat' && <div className="h-full bg-ink-950">{center}</div>}
        {tab === 'users' && (
          <div className="h-full bg-ink-900">
            <OnlineUsersPanel roomSlug={selectedRoom?.slug ?? null} />
          </div>
        )}
      </div>

      {/* Tab bar mobile */}
      <nav className="grid grid-cols-4 border-t border-ink-700 bg-ink-900 lg:hidden">
        <TabButton label={t('tab.rooms')} icon="🏠" active={tab === 'rooms'} onClick={() => setTab('rooms')} />
        <TabButton label={t('tab.chat')} icon="💭" active={tab === 'chat'} onClick={() => setTab('chat')} />
        <TabButton label={t('tab.users')} icon="👥" active={tab === 'users'} onClick={() => setTab('users')} />
        <TabButton
          label={t('tab.private')}
          icon="💬"
          active={drawerOpen}
          badge={totalUnread}
          onClick={() => setDrawerOpen(true)}
        />
      </nav>

      <PrivateChatDrawer />
      <SettingsPanel open={settingsOpen} onClose={() => setSettingsOpen(false)} />
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
  icon: string
  active: boolean
  badge?: number
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`relative flex flex-col items-center gap-0.5 py-2 text-xs ${active ? 'text-brand-300' : 'text-ink-400'}`}
    >
      <span className="text-lg">{icon}</span>
      {label}
      {badge !== undefined && badge > 0 && (
        <span className="absolute right-1/4 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent-red px-1 text-[10px] font-bold text-white">
          {badge}
        </span>
      )}
    </button>
  )
}

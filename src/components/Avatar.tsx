import { colorFromString, initials, statusColor } from '../lib/utils'
import type { UserStatus } from '../lib/types'

interface AvatarProps {
  username: string
  avatarUrl?: string | null
  status?: UserStatus
  size?: number
  showStatus?: boolean
}

export function Avatar({
  username,
  avatarUrl,
  status,
  size = 40,
  showStatus = false,
}: AvatarProps) {
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt={username}
          className="h-full w-full rounded-full object-cover"
        />
      ) : (
        <div
          className="flex h-full w-full items-center justify-center rounded-full font-bold text-white"
          style={{
            background: colorFromString(username),
            fontSize: size * 0.4,
          }}
        >
          {initials(username)}
        </div>
      )}
      {showStatus && status && (
        <span
          className="absolute bottom-0 right-0 block rounded-full border-2 border-ink-850"
          style={{
            width: size * 0.3,
            height: size * 0.3,
            background: statusColor[status],
          }}
          title={status}
        />
      )}
    </div>
  )
}

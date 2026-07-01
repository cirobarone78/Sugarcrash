import { colorFromString, initials, statusColor } from '../lib/utils'
import type { UserStatus } from '../lib/types'

interface AvatarProps {
  username: string
  avatarUrl?: string | null
  status?: UserStatus
  size?: number
  showStatus?: boolean
  /** Anello a gradiente colorato attorno all'avatar (stile messenger). */
  ring?: boolean
}

// Gradiente deterministico per l'anello, dal nome utente.
function ringGradient(name: string): string {
  const h = Math.abs(
    [...name].reduce((a, c) => c.charCodeAt(0) + ((a << 5) - a), 0),
  )
  const a = h % 360
  const b = (a + 60) % 360
  return `linear-gradient(135deg, hsl(${a} 85% 60%), hsl(${b} 85% 55%))`
}

export function Avatar({
  username,
  avatarUrl,
  status,
  size = 40,
  showStatus = false,
  ring = false,
}: AvatarProps) {
  const pad = ring ? Math.max(2, Math.round(size * 0.06)) : 0
  const inner = size - pad * 2

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <div
        className="flex h-full w-full items-center justify-center rounded-full"
        style={ring ? { background: ringGradient(username), padding: pad } : undefined}
      >
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={username}
            className="h-full w-full rounded-full object-cover"
            style={{ width: inner, height: inner }}
          />
        ) : (
          <div
            className="flex items-center justify-center rounded-full font-semibold text-white"
            style={{
              width: inner,
              height: inner,
              background: colorFromString(username),
              fontSize: inner * 0.4,
            }}
          >
            {initials(username)}
          </div>
        )}
      </div>
      {showStatus && status && (
        <span
          className="absolute bottom-0 right-0 block rounded-full border-2 border-ink-900"
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

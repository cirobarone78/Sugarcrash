// Set di icone vettoriali originali (line-icons), coerenti: 24x24, currentColor,
// stroke 1.6, terminazioni arrotondate. Nessuna emoji usata come icona.

import type { ReactElement, SVGProps } from 'react'

export type IconName =
  | 'camera'
  | 'mic'
  | 'micOff'
  | 'video'
  | 'videoOff'
  | 'stop'
  | 'image'
  | 'smile'
  | 'send'
  | 'message'
  | 'sparkle'
  | 'ban'
  | 'flag'
  | 'lock'
  | 'unlock'
  | 'home'
  | 'users'
  | 'chat'
  | 'shield'
  | 'user'
  | 'close'
  | 'back'
  | 'check'
  | 'plus'
  | 'minus'
  | 'trash'
  | 'settings'
  | 'globe'
  | 'alert'

const PATHS: Record<IconName, ReactElement> = {
  camera: (
    <>
      <path d="M3 8.5A2.5 2.5 0 0 1 5.5 6h1.2a1 1 0 0 0 .8-.4l.9-1.2A1.5 1.5 0 0 1 9.6 3.8h4.8a1.5 1.5 0 0 1 1.2.6l.9 1.2a1 1 0 0 0 .8.4h1.2A2.5 2.5 0 0 1 21 8.5v8A2.5 2.5 0 0 1 18.5 19h-13A2.5 2.5 0 0 1 3 16.5z" />
      <circle cx="12" cy="12.5" r="3.2" />
    </>
  ),
  mic: (
    <>
      <rect x="9" y="3" width="6" height="11" rx="3" />
      <path d="M5.5 11.5a6.5 6.5 0 0 0 13 0M12 18v3" />
    </>
  ),
  micOff: (
    <>
      <path d="M9 9V6a3 3 0 0 1 5.7-1.3M15 11.5V11M5.5 11.5a6.5 6.5 0 0 0 9.3 5.9M12 18v3" />
      <path d="M4 4l16 16" />
    </>
  ),
  video: (
    <>
      <rect x="3" y="6" width="13" height="12" rx="2.5" />
      <path d="M16 10.5l5-3v9l-5-3z" />
    </>
  ),
  videoOff: (
    <>
      <path d="M16 10.5l5-3v9l-5-3V9" />
      <path d="M3 8.5A2.5 2.5 0 0 1 5.5 6H13M16 14.5V16a2 2 0 0 1-2 2H5.5A2.5 2.5 0 0 1 3 15.5z" />
      <path d="M4 4l16 16" />
    </>
  ),
  stop: <rect x="6" y="6" width="12" height="12" rx="3" />,
  image: (
    <>
      <rect x="3" y="4.5" width="18" height="15" rx="2.5" />
      <circle cx="8.5" cy="9.5" r="1.6" />
      <path d="M21 16l-5-5-8 8" />
    </>
  ),
  smile: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M8.5 14.5a4.5 4.5 0 0 0 7 0" />
      <path d="M9 9.5h.01M15 9.5h.01" />
    </>
  ),
  send: <path d="M5 12L20 4l-5 16-3.5-6.5L5 12z" />,
  message: (
    <path d="M4.5 6.5A2.5 2.5 0 0 1 7 4h10a2.5 2.5 0 0 1 2.5 2.5v6A2.5 2.5 0 0 1 17 15H9l-4 4v-4a.5.5 0 0 1 0-.1z" />
  ),
  sparkle: (
    <path d="M12 3l1.8 5.2a2 2 0 0 0 1.2 1.2L20 11l-5 1.6a2 2 0 0 0-1.2 1.2L12 19l-1.8-5.2A2 2 0 0 0 9 12.6L4 11l5-1.6a2 2 0 0 0 1.2-1.2z" />
  ),
  ban: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M5.6 5.6l12.8 12.8" />
    </>
  ),
  flag: (
    <>
      <path d="M6 21V4M6 4h11l-2 3.5L17 11H6" />
    </>
  ),
  lock: (
    <>
      <rect x="4.5" y="10.5" width="15" height="10" rx="2.5" />
      <path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" />
      <path d="M12 14.5v2.5" />
    </>
  ),
  unlock: (
    <>
      <rect x="4.5" y="10.5" width="15" height="10" rx="2.5" />
      <path d="M8 10.5V8a4 4 0 0 1 7.7-1.5" />
      <path d="M12 14.5v2.5" />
    </>
  ),
  home: <path d="M4 11.5L12 4l8 7.5M6 10v9h12v-9" />,
  users: (
    <>
      <circle cx="9" cy="8" r="3.2" />
      <path d="M3.5 19a5.5 5.5 0 0 1 11 0" />
      <path d="M16 5.2a3.2 3.2 0 0 1 0 5.6M17.5 13.5a5.5 5.5 0 0 1 3 5" />
    </>
  ),
  chat: (
    <>
      <path d="M4.5 6.5A2.5 2.5 0 0 1 7 4h10a2.5 2.5 0 0 1 2.5 2.5v6A2.5 2.5 0 0 1 17 15H9l-4 4v-4z" />
      <path d="M8.5 9.5h7M8.5 12h4" />
    </>
  ),
  shield: (
    <>
      <path d="M12 3l7 2.5v5.5c0 4.5-3 7.8-7 9-4-1.2-7-4.5-7-9V5.5z" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20a7 7 0 0 1 14 0" />
    </>
  ),
  close: <path d="M6 6l12 12M18 6L6 18" />,
  back: <path d="M14 6l-6 6 6 6" />,
  check: <path d="M5 12.5l4.5 4.5L19 7" />,
  plus: <path d="M12 5v14M5 12h14" />,
  minus: <path d="M5 12h14" />,
  trash: (
    <>
      <path d="M4 7h16M9 7V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V7" />
      <path d="M6 7l1 12.5A1.5 1.5 0 0 0 8.5 21h7a1.5 1.5 0 0 0 1.5-1.5L18 7" />
      <path d="M10 11v6M14 11v6" />
    </>
  ),
  settings: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 3.5l1.2 2.1a2 2 0 0 0 2.3 1l2.3-.6.6 2.3a2 2 0 0 0 1 2.3l2.1 1.2-2.1 1.2a2 2 0 0 0-1 2.3l.6 2.3-2.3-.6a2 2 0 0 0-2.3 1L12 20.5l-1.2-2.1a2 2 0 0 0-2.3-1l-2.3.6-.6-2.3a2 2 0 0 0-1-2.3L2.5 12l2.1-1.2a2 2 0 0 0 1-2.3l-.6-2.3 2.3.6a2 2 0 0 0 2.3-1z" />
    </>
  ),
  globe: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3c2.5 2.5 2.5 15 0 18M12 3c-2.5 2.5-2.5 15 0 18" />
    </>
  ),
  alert: (
    <>
      <path d="M12 4.5L21 19.5H3z" />
      <path d="M12 10v4M12 16.5v.01" />
    </>
  ),
}

interface IconProps extends Omit<SVGProps<SVGSVGElement>, 'name'> {
  name: IconName
  size?: number
}

export function Icon({ name, size = 20, className, ...rest }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      {...rest}
    >
      {PATHS[name]}
    </svg>
  )
}

/** Marchio dell'app CamRooms: bolla di chat (stanza) con obiettivo webcam. */
export function Logo({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id="rc-logo" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#2dd4bf" />
          <stop offset="1" stopColor="#3b82f6" />
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="28" height="28" rx="9" fill="url(#rc-logo)" />
      <path
        d="M7.5 12a4 4 0 0 1 4-4h9a4 4 0 0 1 4 4v3.6a4 4 0 0 1-4 4h-4.4l-4.1 3.1a.6.6 0 0 1-1-.48v-2.7a4 4 0 0 1-3.5-3.97z"
        fill="#ffffff"
      />
      <circle cx="16" cy="13.8" r="3.4" fill="url(#rc-logo)" />
      <circle cx="16" cy="13.8" r="1.35" fill="#ffffff" />
      <circle cx="17.5" cy="12.3" r="0.5" fill="#ffffff" />
    </svg>
  )
}

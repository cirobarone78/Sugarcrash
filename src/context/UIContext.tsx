import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { UserProfilePopover } from '../components/UserProfilePopover'
import { ReportDialog, type ReportTarget } from '../components/ReportDialog'
import { BlockUserDialog } from '../components/BlockUserDialog'

interface UIContextValue {
  openUserProfile: (userId: string) => void
  openReport: (target: ReportTarget) => void
  openBlock: (user: { id: string; username: string }) => void
}

const UIContext = createContext<UIContextValue | undefined>(undefined)

export function UIProvider({ children }: { children: ReactNode }) {
  const [profileUserId, setProfileUserId] = useState<string | null>(null)
  const [reportTarget, setReportTarget] = useState<ReportTarget | null>(null)
  const [blockUser, setBlockUser] = useState<{ id: string; username: string } | null>(null)

  const openUserProfile = useCallback((userId: string) => setProfileUserId(userId), [])
  const openReport = useCallback((target: ReportTarget) => setReportTarget(target), [])
  const openBlock = useCallback(
    (user: { id: string; username: string }) => setBlockUser(user),
    [],
  )

  const value = useMemo<UIContextValue>(
    () => ({ openUserProfile, openReport, openBlock }),
    [openUserProfile, openReport, openBlock],
  )

  return (
    <UIContext.Provider value={value}>
      {children}

      <UserProfilePopover
        open={profileUserId !== null}
        userId={profileUserId}
        onClose={() => setProfileUserId(null)}
        onReport={(t) => {
          setProfileUserId(null)
          setReportTarget(t)
        }}
        onBlock={(u) => {
          setProfileUserId(null)
          setBlockUser(u)
        }}
      />

      <ReportDialog
        open={reportTarget !== null}
        onClose={() => setReportTarget(null)}
        target={reportTarget}
      />

      <BlockUserDialog
        open={blockUser !== null}
        onClose={() => setBlockUser(null)}
        userId={blockUser?.id ?? null}
        username={blockUser?.username ?? ''}
      />
    </UIContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useUI(): UIContextValue {
  const ctx = useContext(UIContext)
  if (!ctx) throw new Error('useUI deve essere usato dentro <UIProvider>')
  return ctx
}

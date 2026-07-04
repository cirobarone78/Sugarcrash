import { useEffect, useRef, useState } from 'react'
import { useRoulette } from '../context/RouletteContext'
import { useWebcam } from '../context/WebcamContext'
import { useAuth } from '../context/AuthContext'
import { useUI } from '../context/UIContext'
import { useBlocks } from '../hooks/useBlocks'
import { useI18n } from '../lib/i18n'
import { Icon } from './Icon'
import { LocalVideoPreview } from './LocalVideoPreview'
import { SexBadge } from './SexBadge'
import type { MatchPref } from '../context/RouletteContext'

const PREF_OPTIONS: MatchPref[] = ['any', 'female', 'male', 'couple']

/** Selettore "voglio incontrare" a pillole. */
function PrefSelector({
  value,
  onChange,
  compact,
}: {
  value: MatchPref
  onChange: (p: MatchPref) => void
  compact?: boolean
}) {
  const { t } = useI18n()
  return (
    <div className={`flex flex-wrap justify-center gap-1.5 ${compact ? '' : 'w-full'}`}>
      {PREF_OPTIONS.map((p) => (
        <button
          key={p}
          onClick={() => onChange(p)}
          className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
            value === p
              ? 'bg-brand-500 text-white'
              : 'bg-ink-800 text-ink-300 hover:bg-ink-700'
          }`}
          aria-pressed={value === p}
        >
          {t(`roulette.pref.${p}`)}
        </button>
      ))}
    </div>
  )
}

/** Video remoto (partner). Non mutato: si sente l'audio dell'altro. */
function RemoteVideo({ stream }: { stream: MediaStream | null }) {
  const ref = useRef<HTMLVideoElement>(null)
  useEffect(() => {
    if (ref.current) ref.current.srcObject = stream
  }, [stream])
  return (
    <video
      ref={ref}
      autoPlay
      playsInline
      className="h-full w-full bg-black object-cover"
    />
  )
}

/**
 * Cam-roulette: overlay a schermo intero. Abbina a uno sconosciuto in webcam
 * 1:1 bidirezionale, con "Avanti" per il prossimo. Solo utenti registrati.
 */
export function CamRoulette() {
  const r = useRoulette()
  const { hasConsent, giveConsent } = useWebcam()
  const { isGuest } = useAuth()
  const { openReport } = useUI()
  const { block } = useBlocks()
  const { t } = useI18n()
  const [checked, setChecked] = useState(false)
  const [busy, setBusy] = useState(false)

  if (!r.panelOpen) return null

  async function acceptConsent() {
    if (!checked) return
    setBusy(true)
    await giveConsent()
    setBusy(false)
  }

  async function blockPartner() {
    if (!r.partner) return
    await block(r.partner.id)
    // il context salta automaticamente al prossimo quando il partner è bloccato
  }

  function reportPartner() {
    if (!r.partner) return
    openReport({
      reportedUserId: r.partner.id,
      label: t('report.userLabel', { name: r.partner.username }),
    })
  }

  return (
    <div className="fixed inset-0 z-[130] flex flex-col bg-ink-950">
      {/* Header — padding-top per la safe area (status bar / Dynamic Island):
          gli overlay `fixed` non ereditano il padding di sicurezza del body. */}
      <header className="flex items-center justify-between border-b border-white/[0.06] px-4 pb-3 pt-[calc(0.75rem_+_env(safe-area-inset-top))]">
        <div className="flex items-center gap-2">
          <span className="fab h-8 w-8 bg-gradient-to-br from-teal-400 to-brand-500">
            <Icon name="camera" size={16} />
          </span>
          <span className="text-[15px] font-bold text-white">{t('roulette.title')}</span>
        </div>
        <button onClick={r.close} className="icon-btn" aria-label={t('common.close')}>
          <Icon name="close" size={20} />
        </button>
      </header>

      {/* Corpo */}
      <div className="relative flex min-h-0 flex-1 flex-col">
        {!r.supported ? (
          <Centered>{t('cam.err.notSupported')}</Centered>
        ) : isGuest ? (
          <Centered>{t('roulette.guestOnly')}</Centered>
        ) : !hasConsent ? (
          // Consenso (una tantum) prima di aprire la cam.
          <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-4 p-6">
            <div className="flex gap-2 rounded-lg border border-accent-amber/40 bg-accent-amber/10 p-3 text-sm text-amber-100">
              <Icon name="alert" size={18} className="mt-0.5 shrink-0 text-accent-amber" />
              <span>{t('cam.privacy')}</span>
            </div>
            <p className="text-sm text-ink-300">{t('roulette.rules')}</p>
            <label className="flex cursor-pointer items-start gap-2 text-sm text-ink-200">
              <input
                type="checkbox"
                checked={checked}
                onChange={(e) => setChecked(e.target.checked)}
                className="mt-0.5 h-4 w-4 accent-brand-600"
              />
              {t('cam.understood')}
            </label>
            <button
              disabled={!checked || busy}
              onClick={acceptConsent}
              className="btn-primary w-full disabled:opacity-40"
            >
              {t('cam.understood')}
            </button>
          </div>
        ) : r.status === 'idle' ? (
          // Introduzione + avvio.
          <div className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-5 p-6 text-center">
            <span className="fab h-16 w-16 bg-gradient-to-br from-teal-400 to-brand-500">
              <Icon name="camera" size={30} />
            </span>
            <p className="text-sm text-ink-300">{t('roulette.intro')}</p>
            <p className="flex items-center gap-1.5 text-xs font-semibold text-accent-green">
              <span className="h-1.5 w-1.5 rounded-full bg-accent-green" />
              {r.liveCount > 0 ? t('roulette.live', { n: r.liveCount }) : t('roulette.liveFirst')}
            </p>
            <div className="w-full space-y-1.5">
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-400">
                {t('roulette.pref')}
              </p>
              <PrefSelector value={r.pref} onChange={r.setPref} />
              <p className="text-[11px] text-ink-500">{t('roulette.prefHint')}</p>
            </div>
            {r.error && <p className="text-sm text-accent-red">{r.error}</p>}
            <button onClick={() => void r.start()} className="btn-primary px-8 py-3 text-base">
              {t('roulette.start')}
            </button>
          </div>
        ) : (
          // Sessione: video + controlli.
          <>
            <div className="relative flex-1 overflow-hidden">
              {r.status === 'connected' && r.remoteStream ? (
                <RemoteVideo stream={r.remoteStream} />
              ) : (
                <div className="flex h-full flex-col items-center justify-center gap-3 bg-black px-4 text-ink-300">
                  <span className="h-10 w-10 animate-spin rounded-full border-2 border-ink-600 border-t-brand-400" />
                  <span className="text-sm">
                    {r.status === 'searching' ? t('roulette.searching') : t('cam.connecting')}
                  </span>
                  {r.status === 'searching' && (
                    <PrefSelector value={r.pref} onChange={r.setPref} compact />
                  )}
                </div>
              )}

              {/* Nome partner */}
              {r.status === 'connected' && r.partner && (
                <div className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-black/60 px-3 py-1 text-sm text-white">
                  {r.partner.username}
                  <SexBadge sex={r.partner.sex} size={15} />
                </div>
              )}

              {/* Anteprima mia (PIP) */}
              {r.localStream && (
                <div className="absolute bottom-3 right-3 w-32 sm:w-40">
                  <LocalVideoPreview stream={r.localStream} videoEnabled={r.videoOn} />
                </div>
              )}
            </div>

            {/* Controlli — padding-bottom per la safe area (home indicator). */}
            <div className="flex items-center justify-center gap-2 border-t border-white/[0.06] bg-ink-900/80 px-4 pt-3 pb-[calc(0.75rem_+_env(safe-area-inset-bottom))]">
              <button
                onClick={r.toggleMic}
                className={`fab h-11 w-11 ${r.micOn ? 'bg-ink-700' : 'bg-accent-red'}`}
                title={r.micOn ? t('cam.micOn') : t('cam.micOff')}
              >
                <Icon name={r.micOn ? 'mic' : 'micOff'} size={18} />
              </button>
              <button
                onClick={r.toggleVideo}
                className={`fab h-11 w-11 ${r.videoOn ? 'bg-ink-700' : 'bg-accent-red'}`}
                title={r.videoOn ? t('cam.videoToggleOff') : t('cam.videoToggleOn')}
              >
                <Icon name={r.videoOn ? 'video' : 'videoOff'} size={18} />
              </button>

              <button
                onClick={() => void r.next()}
                disabled={r.status !== 'connected'}
                className="btn-primary h-11 px-6 disabled:opacity-40"
              >
                <Icon name="back" size={16} className="-scale-x-100" />
                {t('roulette.next')}
              </button>

              {r.status === 'connected' && r.partner && (
                <>
                  <button
                    onClick={reportPartner}
                    className="fab h-11 w-11 bg-ink-700"
                    title={t('cam.report')}
                  >
                    <Icon name="flag" size={18} />
                  </button>
                  <button
                    onClick={() => void blockPartner()}
                    className="fab h-11 w-11 bg-ink-700"
                    title={t('cam.block')}
                  >
                    <Icon name="ban" size={18} />
                  </button>
                </>
              )}

              <button
                onClick={() => void r.stop()}
                className="fab h-11 w-11 bg-accent-red"
                title={t('roulette.stop')}
              >
                <Icon name="stop" size={18} />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-1 items-center justify-center p-6 text-center text-sm text-ink-300">
      {children}
    </div>
  )
}

'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

type Alert = {
  id: string
  ticker: string
  company_name?: string | null
  alert_type: string
  score_old: number | null
  score_new: number
  message: string | null
  read: boolean
  created_at: string
}

const badgeBase = 'px-2 py-0.5 rounded text-[0.6rem] font-bold uppercase tracking-[0.18em] border'

function TypeBadge({ type }: { type: string }) {
  if (type === 'STRONG_BUY')
    return <span className={`${badgeBase} bg-[#7EE5A3]/15 text-[#7EE5A3] border-[#7EE5A3]/30`}>Strong Buy</span>
  if (type === 'SCORE_JUMP')
    return <span className={`${badgeBase} bg-[#5AB983]/15 text-[#5AB983] border-[#5AB983]/30`}>Hausse</span>
  if (type === 'SCORE_DROP')
    return <span className={`${badgeBase} bg-[#D85F66]/15 text-[#D85F66] border-[#D85F66]/30`}>Baisse</span>
  if (type === 'RSI_OVERSOLD')
    return <span className={`${badgeBase} bg-[#E5A04E]/15 text-[#E5A04E] border-[#E5A04E]/30`}>RSI Survente</span>
  return <span className={`${badgeBase} bg-[#1A2520] text-[#6D7A72] border-[#1A2520]`}>{type}</span>
}

function MarkReadButton() {
  const router = useRouter()
  const markRead = async () => {
    await fetch('/api/alerts/mark-read', { method: 'POST' })
    router.refresh()
  }
  return (
    <button
      onClick={markRead}
      className="px-3 py-1.5 rounded-lg border border-[#1A2520] text-[10px] uppercase tracking-[0.16em] text-[#6D7A72] hover:text-[#F0EBDB] hover:border-[#7EE5A3]/40 transition-colors"
      style={{ fontFamily: 'var(--font-jetbrains-mono, monospace)' }}
    >
      Tout marquer lu
    </button>
  )
}

function AlertsClient({ initialAlerts }: { initialAlerts: Alert[] }) {
  const [alerts] = useState(initialAlerts)

  if (alerts.length === 0) return (
    <div className="rounded-xl border border-[#1A2520] bg-[#0E1511] p-12 text-center">
      <p className="text-[#C6C0A9] font-medium mb-1"
        style={{ fontFamily: 'var(--font-fraunces, serif)', fontStyle: 'italic', fontSize: 17 }}>
        Aucune alerte pour le moment.
      </p>
      <p className="text-sm text-[#6D7A72] mt-2">
        Les alertes apparaissent automatiquement lors des changements de score significatifs.
      </p>
    </div>
  )

  return (
    <div className="flex flex-col gap-2">
      {alerts.map(alert => (
        <div key={alert.id} className={`rounded-xl border p-4 flex gap-4 items-start transition-colors ${
          !alert.read
            ? 'border-[#7EE5A3]/25 bg-[#7EE5A3]/[0.03]'
            : 'border-[#1A2520] bg-[#0E1511]'
        }`}>
          <TypeBadge type={alert.alert_type} />
          <div className="flex-1 min-w-0">
            <Link
              href={`/ticker/${alert.ticker}`}
              className="block font-medium text-[#F0EBDB] hover:text-[#7EE5A3] transition-colors truncate"
              style={{ fontFamily: 'var(--font-fraunces, serif)', fontSize: 16, letterSpacing: '-0.01em' }}
              title={alert.ticker}
            >
              {alert.company_name || alert.ticker}
            </Link>
            {alert.company_name && (
              <div
                className="text-[10px] text-[#6D7A72] uppercase tracking-[0.14em] mt-0.5"
                style={{ fontFamily: 'var(--font-jetbrains-mono, monospace)' }}
              >
                {alert.ticker}
              </div>
            )}
            {alert.message && <p className="text-sm text-[#C6C0A9] mt-1">{alert.message}</p>}
            {alert.score_old != null && (
              <p className="text-xs text-[#6D7A72] mt-1"
                style={{ fontFamily: 'var(--font-jetbrains-mono, monospace)' }}>
                {alert.score_old}/100 → <strong className="text-[#F0EBDB]">{alert.score_new}/100</strong>
              </p>
            )}
          </div>
          <div className="text-[10px] uppercase tracking-[0.14em] text-[#6D7A72] shrink-0"
            style={{ fontFamily: 'var(--font-jetbrains-mono, monospace)' }}>
            {alert.created_at.slice(0, 16).replace('T', ' ')}
          </div>
          {!alert.read && <div className="w-1.5 h-1.5 rounded-full bg-[#7EE5A3] shrink-0 mt-1.5" />}
        </div>
      ))}
    </div>
  )
}

AlertsClient.MarkReadButton = MarkReadButton
export default AlertsClient

'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

type Alert = {
  id: string
  ticker: string
  alert_type: string
  score_old: number | null
  score_new: number
  message: string | null
  read: boolean
  created_at: string
}

function TypeBadge({ type }: { type: string }) {
  if (type === 'STRONG_BUY')   return <span className="px-2 py-0.5 rounded text-[0.6rem] font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">Strong Buy</span>
  if (type === 'SCORE_JUMP')   return <span className="px-2 py-0.5 rounded text-[0.6rem] font-bold uppercase tracking-wider bg-sky-500/15 text-sky-400 border border-sky-500/25">Hausse</span>
  if (type === 'SCORE_DROP')   return <span className="px-2 py-0.5 rounded text-[0.6rem] font-bold uppercase tracking-wider bg-rose-500/15 text-rose-400 border border-rose-500/25">Baisse</span>
  if (type === 'RSI_OVERSOLD') return <span className="px-2 py-0.5 rounded text-[0.6rem] font-bold uppercase tracking-wider bg-violet-500/15 text-violet-400 border border-violet-500/25">RSI Survente</span>
  return <span className="px-2 py-0.5 rounded text-[0.6rem] font-bold uppercase tracking-wider bg-zinc-500/15 text-zinc-400 border border-zinc-500/25">{type}</span>
}

function MarkReadButton() {
  const router = useRouter()
  const markRead = async () => {
    await fetch('/api/alerts/mark-read', { method: 'POST' })
    router.refresh()
  }
  return (
    <button onClick={markRead} className="px-3 py-1.5 rounded-lg border border-white/[0.08] text-xs text-zinc-400 hover:text-white hover:border-white/20 transition-colors">
      Tout marquer comme lu
    </button>
  )
}

function AlertsClient({ initialAlerts }: { initialAlerts: Alert[] }) {
  const [alerts] = useState(initialAlerts)

  if (alerts.length === 0) return (
    <div className="rounded-xl border border-white/[0.06] p-12 text-center">
      <p className="text-zinc-400 font-medium mb-1">Aucune alerte</p>
      <p className="text-sm text-zinc-600">Les alertes apparaissent automatiquement lors des changements de score significatifs.</p>
    </div>
  )

  return (
    <div className="flex flex-col gap-2">
      {alerts.map(alert => (
        <div key={alert.id} className={`rounded-xl border p-4 flex gap-4 items-start transition-colors ${
          !alert.read ? 'border-indigo-500/20 bg-indigo-500/[0.03]' : 'border-white/[0.06] bg-white/[0.01]'
        }`}>
          <TypeBadge type={alert.alert_type} />
          <div className="flex-1 min-w-0">
            <Link href={`/ticker/${alert.ticker}`} className="font-bold text-white hover:text-indigo-400 transition-colors">
              {alert.ticker}
            </Link>
            {alert.message && <p className="text-sm text-zinc-400 mt-0.5">{alert.message}</p>}
            {alert.score_old != null && (
              <p className="text-xs text-zinc-600 mt-1">
                {alert.score_old}/100 → <strong className="text-zinc-400">{alert.score_new}/100</strong>
              </p>
            )}
          </div>
          <div className="text-xs text-zinc-600 shrink-0">
            {alert.created_at.slice(0, 16).replace('T', ' ')}
          </div>
          {!alert.read && <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0 mt-1.5" />}
        </div>
      ))}
    </div>
  )
}

AlertsClient.MarkReadButton = MarkReadButton
export default AlertsClient

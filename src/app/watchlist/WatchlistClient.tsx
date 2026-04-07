'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

type ScoreInfo = {
  ticker: string
  company_name: string | null
  score_total: number
  score_label: string | null
  score_date: string
  market_data: { rsi_14?: number | null; momentum_3m?: number | null } | null
}

function scoreTier(s: number) {
  if (s >= 65) return 'high'
  if (s >= 40) return 'mid'
  return 'low'
}
function scoreLabel(s: number) {
  if (s >= 75) return 'Excellent'
  if (s >= 60) return 'Bon'
  if (s >= 45) return 'Neutre'
  if (s >= 30) return 'Attention'
  return 'Risqué'
}
const tierColor = { high: 'text-emerald-400', mid: 'text-amber-400', low: 'text-rose-400' }
const tierBg    = { high: 'bg-emerald-500/10 border-emerald-500/25', mid: 'bg-amber-500/10 border-amber-500/25', low: 'bg-rose-500/10 border-rose-500/25' }

export default function WatchlistClient({
  initialTickers,
  scoreMap,
  watchlistId,
}: {
  initialTickers: string[]
  scoreMap: Record<string, ScoreInfo>
  watchlistId: string | null
}) {
  const [tickers, setTickers] = useState(initialTickers)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState('')
  const router = useRouter()

  const add = async (e: React.FormEvent) => {
    e.preventDefault()
    const ticker = input.trim().toUpperCase()
    if (!ticker || tickers.includes(ticker)) return
    setLoading('add')
    setError('')
    const res = await fetch('/api/watchlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ticker }),
    })
    if (res.ok) {
      setTickers(prev => [...prev, ticker])
      setInput('')
      router.refresh()
    } else {
      setError('Erreur lors de l\'ajout')
    }
    setLoading(null)
  }

  const remove = async (ticker: string) => {
    setLoading(ticker)
    const res = await fetch('/api/watchlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ticker }),
    })
    if (res.ok) {
      setTickers(prev => prev.filter(t => t !== ticker))
      router.refresh()
    }
    setLoading(null)
  }

  return (
    <div>
      {/* Add form */}
      <form onSubmit={add} className="rounded-xl border border-white/[0.06] bg-white/[0.01] p-4 mb-6">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value.toUpperCase())}
            placeholder="Ex: AAPL, MC.PA, 9988.HK"
            className="flex-1 px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder-zinc-600 focus:border-indigo-500/50 outline-none"
          />
          <button
            type="submit"
            disabled={loading === 'add'}
            className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-sm font-semibold text-white transition-colors"
          >
            Ajouter
          </button>
        </div>
        {error && <p className="text-rose-400 text-xs mt-2">{error}</p>}
      </form>

      {tickers.length === 0 ? (
        <div className="rounded-xl border border-white/[0.06] p-10 text-center">
          <p className="text-zinc-400 font-medium mb-2">Votre watchlist est vide</p>
          <p className="text-zinc-600 text-sm mb-4">Ajoutez un ticker pour générer votre premier score.</p>
          <div className="flex gap-2 justify-center">
            {['AAPL', 'MC.PA', 'MSFT'].map(t => (
              <button key={t} onClick={() => setInput(t)}
                className="px-3 py-1 rounded-lg bg-white/[0.05] border border-white/[0.08] text-sm text-zinc-400 hover:text-white transition-colors">
                {t}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-white/[0.06] overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.06] bg-white/[0.02]">
                <th className="text-left px-5 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">Ticker</th>
                <th className="text-center px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">Score</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider hidden md:table-cell">RSI</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider hidden md:table-cell">Mom 3m</th>
                <th className="text-right px-5 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider hidden lg:table-cell">Mis à jour</th>
                <th className="w-20 px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {tickers.map(ticker => {
                const info = scoreMap[ticker]
                const tier = info ? scoreTier(info.score_total) : null
                const rsi = info?.market_data?.rsi_14
                const mom3m = info?.market_data?.momentum_3m
                return (
                  <tr key={ticker} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-5 py-4">
                      <Link href={`/ticker/${ticker}`} className="font-bold text-white hover:text-indigo-400 transition-colors">
                        {info?.company_name || ticker}
                      </Link>
                      {info?.company_name && <div className="text-xs text-zinc-600">{ticker}</div>}
                    </td>
                    <td className="px-4 py-4 text-center">
                      {info && tier ? (
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${tierColor[tier]} ${tierBg[tier]}`}>
                          <span className="text-sm font-extrabold">{info.score_total}</span>
                          <span className="opacity-75">{scoreLabel(info.score_total)}</span>
                        </span>
                      ) : (
                        <span className="text-zinc-600 text-xs">—</span>
                      )}
                    </td>
                    <td className={`px-4 py-4 text-right tabular-nums text-sm hidden md:table-cell ${rsi != null && rsi > 70 ? 'text-rose-400' : rsi != null && rsi < 30 ? 'text-sky-400' : 'text-zinc-500'}`}>
                      {rsi != null ? rsi.toFixed(1) : '—'}
                    </td>
                    <td className={`px-4 py-4 text-right tabular-nums text-sm hidden md:table-cell ${mom3m != null && mom3m > 0 ? 'text-emerald-400' : mom3m != null && mom3m < 0 ? 'text-rose-400' : 'text-zinc-500'}`}>
                      {mom3m != null ? (mom3m >= 0 ? '+' : '') + mom3m.toFixed(1) + '%' : '—'}
                    </td>
                    <td className="px-5 py-4 text-right text-xs text-zinc-600 hidden lg:table-cell">
                      {info?.score_date?.slice(0, 10) || '—'}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2 justify-end">
                        <Link href={`/ticker/${ticker}`}
                          className="p-1.5 rounded-lg bg-white/[0.04] hover:bg-indigo-500/15 hover:text-indigo-400 text-zinc-500 transition-colors" title="Voir le détail">
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>
                          </svg>
                        </Link>
                        <button
                          onClick={() => remove(ticker)}
                          disabled={loading === ticker}
                          className="p-1.5 rounded-lg bg-white/[0.04] hover:bg-rose-500/12 hover:text-rose-400 text-zinc-500 disabled:opacity-40 transition-colors" title="Supprimer">
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                            <path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/>
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

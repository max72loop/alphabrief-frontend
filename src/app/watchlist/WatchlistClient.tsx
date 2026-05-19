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
  if (s >= 75) return 'EXCELLENT'
  if (s >= 60) return 'BON'
  if (s >= 45) return 'NEUTRE'
  if (s >= 30) return 'ATTENTION'
  return 'RISQUÉ'
}
const tierColor = { high: 'text-[#7EE5A3]', mid: 'text-[#E5A04E]', low: 'text-[#D85F66]' }
const tierBg    = {
  high: 'bg-[#7EE5A3]/10 border-[#7EE5A3]/30',
  mid:  'bg-[#E5A04E]/10 border-[#E5A04E]/30',
  low:  'bg-[#D85F66]/10 border-[#D85F66]/30',
}

const mono = 'var(--font-jetbrains-mono, monospace)'

export default function WatchlistClient({
  initialTickers,
  scoreMap,
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
      setError("Erreur lors de l'ajout")
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
      <form onSubmit={add} className="rounded-xl border border-[#1A2520] bg-[#0E1511] p-4 mb-6">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value.toUpperCase())}
            placeholder="Ex: AAPL, MC.PA, 9988.HK"
            className="flex-1 px-3 py-2 rounded-lg bg-[#13201A] border border-[#1A2520] text-sm text-[#F0EBDB] placeholder-[#4A6355] focus:border-[#7EE5A3]/50 outline-none"
            style={{ fontFamily: mono }}
          />
          <button
            type="submit"
            disabled={loading === 'add'}
            className="px-4 py-2 rounded-lg bg-[#7EE5A3] hover:bg-[#9AEDB5] disabled:opacity-50 text-sm font-semibold text-[#0A0F0C] transition-colors"
          >
            Ajouter
          </button>
        </div>
        {error && <p className="text-[#D85F66] text-xs mt-2">{error}</p>}
      </form>

      {tickers.length === 0 ? (
        <div className="rounded-xl border border-[#1A2520] bg-[#0E1511] p-10 text-center">
          <p className="font-medium mb-2 text-[#C6C0A9]"
            style={{ fontFamily: 'var(--font-fraunces, serif)', fontStyle: 'italic', fontSize: 17 }}>
            Votre watchlist est vide.
          </p>
          <p className="text-[#6D7A72] text-sm mb-5">Ajoutez un ticker pour générer votre premier score.</p>
          <div className="flex gap-2 justify-center">
            {['AAPL', 'MC.PA', 'MSFT'].map(t => (
              <button key={t} onClick={() => setInput(t)}
                className="px-3 py-1 rounded-lg bg-[#13201A] border border-[#1A2520] text-xs text-[#6D7A72] hover:text-[#F0EBDB] hover:border-[#7EE5A3]/30 transition-colors"
                style={{ fontFamily: mono, letterSpacing: '0.06em' }}>
                {t}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-[#1A2520] bg-[#0E1511] overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#1A2520]">
                {[
                  { label: 'Ticker', align: 'text-left' },
                  { label: 'Score',  align: 'text-center' },
                  { label: 'RSI',    align: 'text-right hidden md:table-cell' },
                  { label: 'Mom 3M', align: 'text-right hidden md:table-cell' },
                  { label: 'Mis à jour', align: 'text-right hidden lg:table-cell' },
                ].map(c => (
                  <th key={c.label} className={`${c.align} px-5 py-3 text-[10px] uppercase tracking-[0.16em] text-[#6D7A72]`}
                    style={{ fontFamily: mono }}>
                    {c.label}
                  </th>
                ))}
                <th className="w-20 px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1A2520]">
              {tickers.map(ticker => {
                const info = scoreMap[ticker]
                const tier = info ? scoreTier(info.score_total) : null
                const rsi = info?.market_data?.rsi_14
                const mom3m = info?.market_data?.momentum_3m
                return (
                  <tr key={ticker} className="hover:bg-[#13201A] transition-colors">
                    <td className="px-5 py-4">
                      <Link href={`/ticker/${ticker}`} className="font-bold text-[#F0EBDB] hover:text-[#7EE5A3] transition-colors">
                        {info?.company_name || ticker}
                      </Link>
                      {info?.company_name && (
                        <div className="text-[10px] uppercase tracking-[0.14em] text-[#4A6355] mt-0.5"
                          style={{ fontFamily: mono }}>{ticker}</div>
                      )}
                    </td>
                    <td className="px-4 py-4 text-center">
                      {info && tier ? (
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold border ${tierColor[tier]} ${tierBg[tier]}`}
                          style={{ fontFamily: mono, letterSpacing: '0.1em' }}>
                          <span className="text-sm font-extrabold">{info.score_total}</span>
                          <span className="opacity-80">{scoreLabel(info.score_total)}</span>
                        </span>
                      ) : (
                        <span className="text-[#4A6355] text-xs">—</span>
                      )}
                    </td>
                    <td className={`px-4 py-4 text-right tabular-nums text-sm hidden md:table-cell ${rsi != null && rsi > 70 ? 'text-[#D85F66]' : rsi != null && rsi < 30 ? 'text-[#5AB983]' : 'text-[#6D7A72]'}`}
                      style={{ fontFamily: mono }}>
                      {rsi != null ? rsi.toFixed(1) : '—'}
                    </td>
                    <td className={`px-4 py-4 text-right tabular-nums text-sm hidden md:table-cell ${mom3m != null && mom3m > 0 ? 'text-[#7EE5A3]' : mom3m != null && mom3m < 0 ? 'text-[#D85F66]' : 'text-[#6D7A72]'}`}
                      style={{ fontFamily: mono }}>
                      {mom3m != null ? (mom3m >= 0 ? '+' : '') + mom3m.toFixed(1) + '%' : '—'}
                    </td>
                    <td className="px-5 py-4 text-right text-[10px] text-[#4A6355] hidden lg:table-cell"
                      style={{ fontFamily: mono, letterSpacing: '0.1em' }}>
                      {info?.score_date?.slice(0, 10) || '—'}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2 justify-end">
                        <Link href={`/ticker/${ticker}`}
                          className="p-1.5 rounded-lg bg-[#13201A] hover:bg-[#7EE5A3]/15 hover:text-[#7EE5A3] text-[#6D7A72] transition-colors" title="Voir le détail">
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>
                          </svg>
                        </Link>
                        <button
                          onClick={() => remove(ticker)}
                          disabled={loading === ticker}
                          className="p-1.5 rounded-lg bg-[#13201A] hover:bg-[#D85F66]/12 hover:text-[#D85F66] text-[#6D7A72] disabled:opacity-40 transition-colors" title="Supprimer">
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

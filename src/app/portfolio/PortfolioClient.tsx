'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

type Holding = { id: string; ticker: string; quantity: number; buy_price: number; added_at: string }
type ScoreInfo = { ticker: string; company_name: string | null; score_total: number; score_label: string | null }
type PriceInfo = { price: number | null; change_pct: number | null; currency: string }

function fmt(v: number | null, decimals = 2, suffix = '') {
  if (v == null) return '—'
  return v.toFixed(decimals) + suffix
}
function fmtEur(v: number | null) { return v != null ? v.toFixed(2) + ' €' : '—' }
function scoreTier(s: number) { return s >= 70 ? 'high' : s >= 50 ? 'mid' : 'low' }
const tierColor = { high: 'text-emerald-400', mid: 'text-amber-400', low: 'text-rose-400' }
const tierBg    = { high: 'bg-emerald-500/10', mid: 'bg-amber-500/10', low: 'bg-rose-500/10' }

export default function PortfolioClient({
  initialHoldings,
  scoreMap,
  userId,
}: {
  initialHoldings: Holding[]
  scoreMap: Record<string, ScoreInfo>
  userId: string
}) {
  const [holdings, setHoldings] = useState(initialHoldings)
  const [prices, setPrices] = useState<Record<string, PriceInfo>>({})
  const [ticker, setTicker] = useState('')
  const [qty, setQty] = useState('')
  const [pru, setPru] = useState('')
  const [editId, setEditId] = useState<string | null>(null)
  const [editQty, setEditQty] = useState('')
  const [editPru, setEditPru] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  // Fetch live prices
  useEffect(() => {
    if (!holdings.length) return
    const tickers = holdings.map(h => h.ticker).join(',')
    fetch(`/api/prices?tickers=${encodeURIComponent(tickers)}`)
      .then(r => r.json())
      .then(d => setPrices(d.prices ?? {}))
      .catch(() => {})
  }, [holdings])

  const add = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!ticker.trim()) return
    setLoading(true)
    const res = await fetch('/api/portfolio', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ticker: ticker.toUpperCase(), quantity: Number(qty) || 0, buy_price: Number(pru) || 0 }),
    })
    if (res.ok) {
      const { holding } = await res.json()
      setHoldings(prev => [holding, ...prev.filter(h => h.ticker !== holding.ticker)])
      setTicker(''); setQty(''); setPru('')
      router.refresh()
    }
    setLoading(false)
  }

  const remove = async (id: string) => {
    if (!confirm('Retirer cette position ?')) return
    await fetch('/api/portfolio', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
    setHoldings(prev => prev.filter(h => h.id !== id))
    router.refresh()
  }

  const startEdit = (h: Holding) => { setEditId(h.id); setEditQty(String(h.quantity)); setEditPru(String(h.buy_price)) }

  const saveEdit = async (id: string) => {
    await fetch('/api/portfolio', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, quantity: Number(editQty), buy_price: Number(editPru) }),
    })
    setHoldings(prev => prev.map(h => h.id === id ? { ...h, quantity: Number(editQty), buy_price: Number(editPru) } : h))
    setEditId(null)
    router.refresh()
  }

  // Stats
  const stats = holdings.reduce((acc, h) => {
    const p = prices[h.ticker]
    const invested = h.quantity * h.buy_price
    const value = h.quantity * (p?.price ?? h.buy_price)
    const pnl = value - invested
    return { invested: acc.invested + invested, value: acc.value + value, pnl: acc.pnl + pnl }
  }, { invested: 0, value: 0, pnl: 0 })

  return (
    <div>
      {/* Stats */}
      {holdings.length > 0 && (
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { label: 'Investi', val: fmtEur(stats.invested) },
            { label: 'Valeur actuelle', val: fmtEur(stats.value) },
            { label: 'P&L', val: (stats.pnl >= 0 ? '+' : '') + stats.pnl.toFixed(2) + ' €', color: stats.pnl >= 0 ? 'text-emerald-400' : 'text-rose-400' },
          ].map(s => (
            <div key={s.label} className="rounded-xl border border-white/[0.06] bg-white/[0.01] p-4 text-center">
              <div className="text-xs text-zinc-500 uppercase tracking-wider mb-1">{s.label}</div>
              <div className={`text-lg font-bold ${s.color ?? 'text-white'}`}>{s.val}</div>
            </div>
          ))}
        </div>
      )}

      {/* Add form */}
      <form onSubmit={add} className="rounded-xl border border-white/[0.06] bg-white/[0.01] p-4 mb-6">
        <div className="flex flex-wrap gap-2">
          <input value={ticker} onChange={e => setTicker(e.target.value.toUpperCase())} placeholder="Ticker" required
            className="w-28 px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder-zinc-600 focus:border-indigo-500/50 outline-none" />
          <input value={qty} onChange={e => setQty(e.target.value)} type="number" step="any" min="0" placeholder="Quantité"
            className="w-28 px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08] text-sm text-zinc-300 focus:border-indigo-500/50 outline-none" />
          <input value={pru} onChange={e => setPru(e.target.value)} type="number" step="any" min="0" placeholder="PRU (€)"
            className="w-28 px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08] text-sm text-zinc-300 focus:border-indigo-500/50 outline-none" />
          <button type="submit" disabled={loading}
            className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-sm font-semibold text-white transition-colors">
            Ajouter
          </button>
        </div>
      </form>

      {holdings.length === 0 ? (
        <div className="rounded-xl border border-white/[0.06] p-10 text-center text-zinc-500">
          <p className="font-medium mb-1">Portefeuille vide</p>
          <p className="text-sm">Ajoutez vos positions pour suivre votre P&L.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-white/[0.06] overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.06] bg-white/[0.02]">
                {['Ticker','Score','Qté','PRU (€)','Cours (€)','Var. jour','Valeur (€)','P&L','Actions'].map(h => (
                  <th key={h} className={`px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider ${h === 'Ticker' ? 'text-left' : 'text-right'} ${['Score','Actions'].includes(h) ? 'text-center' : ''}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {holdings.map(h => {
                const p = prices[h.ticker]
                const info = scoreMap[h.ticker]
                const invested = h.quantity * h.buy_price
                const currentPrice = p?.price ?? null
                const value = currentPrice != null ? h.quantity * currentPrice : null
                const pnl = value != null ? value - invested : null
                const pnlPct = pnl != null && invested > 0 ? pnl / invested * 100 : null
                const tier = info ? scoreTier(info.score_total) : null

                if (editId === h.id) return (
                  <tr key={h.id} className="bg-indigo-500/[0.03]">
                    <td className="px-4 py-3 font-bold">{h.ticker}</td>
                    <td className="px-4 py-3 text-center text-zinc-500">—</td>
                    <td className="px-4 py-3 text-right"><input type="number" value={editQty} onChange={e => setEditQty(e.target.value)} step="any" className="w-20 px-2 py-1 rounded bg-white/[0.06] border border-white/[0.1] text-sm text-right outline-none focus:border-indigo-500/50" /></td>
                    <td className="px-4 py-3 text-right"><input type="number" value={editPru} onChange={e => setEditPru(e.target.value)} step="any" className="w-20 px-2 py-1 rounded bg-white/[0.06] border border-white/[0.1] text-sm text-right outline-none focus:border-indigo-500/50" /></td>
                    <td colSpan={4} />
                    <td className="px-4 py-3 text-center">
                      <div className="flex gap-1 justify-center">
                        <button onClick={() => saveEdit(h.id)} className="px-2 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold transition-colors">OK</button>
                        <button onClick={() => setEditId(null)} className="px-2 py-1 rounded bg-white/[0.06] text-xs text-zinc-400 hover:text-white transition-colors">Annuler</button>
                      </div>
                    </td>
                  </tr>
                )

                return (
                  <tr key={h.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-3.5">
                      <Link href={`/ticker/${h.ticker}`} className="font-bold text-white hover:text-indigo-400 transition-colors">
                        {info?.company_name || h.ticker}
                      </Link>
                      {info?.company_name && <div className="text-xs text-zinc-600">{h.ticker}</div>}
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      {info && tier ? (
                        <span className={`inline-block w-10 h-7 rounded text-xs font-bold leading-7 ${tierColor[tier]} ${tierBg[tier]}`}>
                          {info.score_total}
                        </span>
                      ) : <span className="text-zinc-600">—</span>}
                    </td>
                    <td className="px-4 py-3.5 text-right text-zinc-400">{fmt(h.quantity)}</td>
                    <td className="px-4 py-3.5 text-right text-zinc-400">{fmt(h.buy_price)}</td>
                    <td className="px-4 py-3.5 text-right text-zinc-300">{fmt(currentPrice)}</td>
                    <td className={`px-4 py-3.5 text-right tabular-nums ${p?.change_pct != null ? (p.change_pct >= 0 ? 'text-emerald-400' : 'text-rose-400') : 'text-zinc-600'}`}>
                      {p?.change_pct != null ? (p.change_pct >= 0 ? '+' : '') + p.change_pct.toFixed(2) + '%' : '—'}
                    </td>
                    <td className="px-4 py-3.5 text-right text-zinc-300">{fmtEur(value)}</td>
                    <td className={`px-4 py-3.5 text-right tabular-nums font-medium ${pnl != null ? (pnl >= 0 ? 'text-emerald-400' : 'text-rose-400') : 'text-zinc-600'}`}>
                      {pnl != null ? (pnl >= 0 ? '+' : '') + pnl.toFixed(2) + ' €' : '—'}
                      {pnlPct != null && <div className="text-xs opacity-70">{pnlPct >= 0 ? '+' : ''}{pnlPct.toFixed(1)}%</div>}
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <div className="flex gap-1 justify-center">
                        <button onClick={() => startEdit(h)} className="px-2.5 py-1 rounded bg-white/[0.05] text-xs text-zinc-400 hover:text-white hover:bg-white/[0.1] transition-colors">Éditer</button>
                        <button onClick={() => remove(h.id)} className="px-2.5 py-1 rounded bg-white/[0.05] text-xs text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors">Retirer</button>
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

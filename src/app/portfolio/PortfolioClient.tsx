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
const tierColor = { high: 'text-[#7EE5A3]', mid: 'text-[#E5A04E]', low: 'text-[#D85F66]' }
const tierBg    = { high: 'bg-[#7EE5A3]/10', mid: 'bg-[#E5A04E]/10', low: 'bg-[#D85F66]/10' }

const mono = 'var(--font-jetbrains-mono, monospace)'
const inputCls = "w-28 px-3 py-2 rounded-lg bg-[#13201A] border border-[#1A2520] text-sm text-[#F0EBDB] placeholder-[#4A6355] focus:border-[#7EE5A3]/50 outline-none"

export default function PortfolioClient({
  initialHoldings,
  scoreMap,
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
            { label: 'INVESTI',         val: fmtEur(stats.invested), color: '#F0EBDB' },
            { label: 'VALEUR ACTUELLE', val: fmtEur(stats.value),    color: '#F0EBDB' },
            { label: 'P&L',             val: (stats.pnl >= 0 ? '+' : '') + stats.pnl.toFixed(2) + ' €', color: stats.pnl >= 0 ? '#7EE5A3' : '#D85F66' },
          ].map(s => (
            <div key={s.label} className="rounded-xl border border-[#1A2520] bg-[#0E1511] p-4 text-center">
              <div className="text-[10px] uppercase tracking-[0.18em] text-[#6D7A72] mb-2" style={{ fontFamily: mono }}>{s.label}</div>
              <div className="text-lg font-bold tabular-nums" style={{ color: s.color, fontFamily: mono }}>{s.val}</div>
            </div>
          ))}
        </div>
      )}

      {/* Add form */}
      <form onSubmit={add} className="rounded-xl border border-[#1A2520] bg-[#0E1511] p-4 mb-6">
        <div className="flex flex-wrap gap-2">
          <input value={ticker} onChange={e => setTicker(e.target.value.toUpperCase())} placeholder="Ticker (ex. AAPL)" required
            className={inputCls} title="Ticker boursier — l'ajout par nom n'est pas encore supporté" />
          <input value={qty} onChange={e => setQty(e.target.value)} type="number" step="any" min="0" placeholder="Quantité"
            className={inputCls} />
          <input value={pru} onChange={e => setPru(e.target.value)} type="number" step="any" min="0" placeholder="PRU (€)"
            className={inputCls} />
          <button type="submit" disabled={loading}
            className="px-4 py-2 rounded-lg bg-[#7EE5A3] hover:bg-[#9AEDB5] disabled:opacity-50 text-sm font-semibold text-[#0A0F0C] transition-colors">
            Ajouter
          </button>
        </div>
      </form>

      {holdings.length === 0 ? (
        <div className="rounded-xl border border-[#1A2520] bg-[#0E1511] p-10 text-center">
          <p className="font-medium mb-1 text-[#C6C0A9]"
            style={{ fontFamily: 'var(--font-fraunces, serif)', fontStyle: 'italic', fontSize: 17 }}>
            Portefeuille vide.
          </p>
          <p className="text-sm text-[#6D7A72] mt-2">Ajoutez vos positions pour suivre votre P&L.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-[#1A2520] bg-[#0E1511] overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#1A2520]">
                {['Titre','Score','Qté','PRU (€)','Cours (€)','Var. jour','Valeur (€)','P&L','Actions'].map(h => (
                  <th key={h} className={`px-4 py-3 text-[10px] uppercase tracking-[0.16em] text-[#6D7A72] ${h === 'Titre' ? 'text-left' : 'text-right'} ${['Score','Actions'].includes(h) ? 'text-center' : ''}`}
                    style={{ fontFamily: mono }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1A2520]">
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
                  <tr key={h.id} className="bg-[#7EE5A3]/[0.04]">
                    <td className="px-4 py-3">
                      <div className="font-medium text-[#F0EBDB]" style={{ fontFamily: 'var(--font-fraunces, serif)' }}>
                        {info?.company_name || h.ticker}
                      </div>
                      {info?.company_name && (
                        <div className="text-[10px] uppercase tracking-[0.12em] text-[#4A6355] mt-0.5" style={{ fontFamily: mono }}>{h.ticker}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center text-[#6D7A72]">—</td>
                    <td className="px-4 py-3 text-right">
                      <input type="number" value={editQty} onChange={e => setEditQty(e.target.value)} step="any"
                        className="w-20 px-2 py-1 rounded bg-[#13201A] border border-[#1A2520] text-sm text-right text-[#F0EBDB] outline-none focus:border-[#7EE5A3]/50" />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <input type="number" value={editPru} onChange={e => setEditPru(e.target.value)} step="any"
                        className="w-20 px-2 py-1 rounded bg-[#13201A] border border-[#1A2520] text-sm text-right text-[#F0EBDB] outline-none focus:border-[#7EE5A3]/50" />
                    </td>
                    <td colSpan={4} />
                    <td className="px-4 py-3 text-center">
                      <div className="flex gap-1 justify-center">
                        <button onClick={() => saveEdit(h.id)} className="px-2 py-1 rounded bg-[#7EE5A3] hover:bg-[#9AEDB5] text-xs font-semibold text-[#0A0F0C] transition-colors">OK</button>
                        <button onClick={() => setEditId(null)} className="px-2 py-1 rounded bg-[#13201A] text-xs text-[#6D7A72] hover:text-[#F0EBDB] transition-colors">Annuler</button>
                      </div>
                    </td>
                  </tr>
                )

                return (
                  <tr key={h.id} className="hover:bg-[#13201A] transition-colors">
                    <td className="px-4 py-3.5">
                      <Link href={`/ticker/${h.ticker}`} className="font-bold text-[#F0EBDB] hover:text-[#7EE5A3] transition-colors">
                        {info?.company_name || h.ticker}
                      </Link>
                      {info?.company_name && <div className="text-[10px] uppercase tracking-[0.12em] text-[#4A6355] mt-0.5" style={{ fontFamily: mono }}>{h.ticker}</div>}
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      {info && tier ? (
                        <span className={`inline-block w-10 h-7 rounded text-xs font-bold leading-7 ${tierColor[tier]} ${tierBg[tier]}`} style={{ fontFamily: mono }}>
                          {info.score_total}
                        </span>
                      ) : <span className="text-[#4A6355]">—</span>}
                    </td>
                    <td className="px-4 py-3.5 text-right text-[#C6C0A9] tabular-nums" style={{ fontFamily: mono }}>{fmt(h.quantity)}</td>
                    <td className="px-4 py-3.5 text-right text-[#C6C0A9] tabular-nums" style={{ fontFamily: mono }}>{fmt(h.buy_price)}</td>
                    <td className="px-4 py-3.5 text-right text-[#F0EBDB] tabular-nums" style={{ fontFamily: mono }}>{fmt(currentPrice)}</td>
                    <td className={`px-4 py-3.5 text-right tabular-nums ${p?.change_pct != null ? (p.change_pct >= 0 ? 'text-[#7EE5A3]' : 'text-[#D85F66]') : 'text-[#4A6355]'}`} style={{ fontFamily: mono }}>
                      {p?.change_pct != null ? (p.change_pct >= 0 ? '+' : '') + p.change_pct.toFixed(2) + '%' : '—'}
                    </td>
                    <td className="px-4 py-3.5 text-right text-[#F0EBDB] tabular-nums" style={{ fontFamily: mono }}>{fmtEur(value)}</td>
                    <td className={`px-4 py-3.5 text-right tabular-nums font-medium ${pnl != null ? (pnl >= 0 ? 'text-[#7EE5A3]' : 'text-[#D85F66]') : 'text-[#4A6355]'}`} style={{ fontFamily: mono }}>
                      {pnl != null ? (pnl >= 0 ? '+' : '') + pnl.toFixed(2) + ' €' : '—'}
                      {pnlPct != null && <div className="text-[10px] opacity-70">{pnlPct >= 0 ? '+' : ''}{pnlPct.toFixed(1)}%</div>}
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <div className="flex gap-1 justify-center">
                        <button onClick={() => startEdit(h)} className="px-2.5 py-1 rounded bg-[#13201A] text-[10px] uppercase tracking-[0.14em] text-[#6D7A72] hover:text-[#F0EBDB] transition-colors" style={{ fontFamily: mono }}>Éditer</button>
                        <button onClick={() => remove(h.id)} className="px-2.5 py-1 rounded bg-[#13201A] text-[10px] uppercase tracking-[0.14em] text-[#6D7A72] hover:text-[#D85F66] transition-colors" style={{ fontFamily: mono }}>Retirer</button>
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

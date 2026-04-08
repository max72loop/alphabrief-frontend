'use client'
import { useState, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import WatchlistButton from './WatchlistButton'

type MarketData = {
  rsi_14?: number | null
  momentum_3m?: number | null
  momentum_12m?: number | null
  beta?: number | null
  analyst_recommendation?: string | null
}

type Financials = {
  pe_ttm?: number | null
  ev_ebitda_ttm?: number | null
  gross_margin?: number | null
  fcf_margin?: number | null
}

export type TickerScore = {
  id: string
  ticker: string
  company_name: string | null
  sector: string | null
  exchange: string | null
  currency: string | null
  market_cap: number | null
  score_total: number
  score_fundamentals: number
  score_technicals: number
  score_momentum: number
  score_label: string | null
  score_date: string
  computed_at: string | null
  market_data: MarketData | null
  financials: Financials | null
}

// ── Score helpers ────────────────────────────────────────────────────────────

function signalTier(score: number): 'high' | 'mid' | 'low' {
  if (score >= 65) return 'high'
  if (score >= 40) return 'mid'
  return 'low'
}

function signalLabel(score: number) {
  if (score >= 75) return 'Excellent'
  if (score >= 60) return 'Bon'
  if (score >= 45) return 'Neutre'
  if (score >= 30) return 'Attention'
  return 'Risqué'
}

const tierColor = {
  high: 'text-emerald-400',
  mid:  'text-amber-400',
  low:  'text-rose-400',
}
const tierBg = {
  high: 'bg-emerald-500/10',
  mid:  'bg-amber-500/10',
  low:  'bg-rose-500/10',
}

function ScorePill({ score, sub }: { score: number; sub?: { f: number; t: number; m: number } }) {
  const tier = signalTier(score)
  return (
    <div className="group relative inline-flex flex-col items-center gap-0.5">
      <span className={`inline-flex items-center justify-center w-10 h-7 rounded text-xs font-bold ${tierColor[tier]} ${tierBg[tier]}`}>
        {score}
      </span>
      <span className={`text-[0.6rem] font-bold uppercase tracking-wider ${tierColor[tier]}`}>
        {signalLabel(score)}
      </span>
      {sub && (
        <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
          <div className="bg-[#0d0d1a] border border-white/15 rounded-lg p-3 shadow-2xl w-48 text-left">
            <div className="text-[0.6rem] uppercase tracking-widest text-zinc-600 mb-2.5">Détail du score</div>
            {([
              { label: 'Fondamentaux', val: sub.f, weight: '50%' },
              { label: 'Techniques',   val: sub.t, weight: '25%' },
              { label: 'Momentum',     val: sub.m, weight: '25%' },
            ] as const).map(({ label, val, weight }) => {
              const t = signalTier(val)
              return (
                <div key={label} className="mb-2 last:mb-0">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs text-zinc-400">{label} <span className="text-zinc-700">{weight}</span></span>
                    <span className={`text-xs font-bold tabular-nums ${tierColor[t]}`}>{val}</span>
                  </div>
                  <div className="h-1 bg-white/[0.06] rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${val >= 65 ? 'bg-emerald-500' : val >= 40 ? 'bg-amber-500' : 'bg-rose-500'}`}
                      style={{ width: `${val}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
          <div className="absolute left-1/2 -translate-x-1/2 top-full w-2 h-2 border-b border-r border-white/15 bg-[#0d0d1a] rotate-45 -mt-1" />
        </div>
      )}
    </div>
  )
}

function fmt(v: number | null | undefined, decimals = 1, suffix = '') {
  if (v == null) return '—'
  return v.toFixed(decimals) + suffix
}

function fmtPct(v: number | null | undefined) {
  if (v == null) return '—'
  const s = (v >= 0 ? '+' : '') + v.toFixed(1) + '%'
  return s
}

function fmtCap(v: number | null | undefined) {
  if (v == null) return '—'
  return (v / 1e9).toFixed(1) + ' Md'
}

function timeAgo(iso: string | null | undefined): { label: string; stale: boolean } {
  if (!iso) return { label: '—', stale: false }
  const diffMs = Date.now() - new Date(iso).getTime()
  const diffH = Math.floor(diffMs / 3_600_000)
  const stale = diffH > 72
  if (diffH < 1)  return { label: '< 1h',          stale }
  if (diffH < 24) return { label: `${diffH}h`,      stale }
  const diffD = Math.floor(diffH / 24)
  return { label: `${diffD}j`,  stale }
}

// ── Sort ─────────────────────────────────────────────────────────────────────

type SortKey = 'score_total' | 'sector' | 'rsi' | 'mom3m' | 'mom12m' | 'pe' | 'ev_ebitda' | 'gross_margin' | 'fcf_margin' | 'market_cap' | 'ticker'

function sortRows(rows: TickerScore[], key: SortKey, asc: boolean) {
  return [...rows].sort((a, b) => {
    let av: number | string | null = null
    let bv: number | string | null = null

    switch (key) {
      case 'score_total':   av = a.score_total;  bv = b.score_total; break
      case 'ticker':        av = a.ticker;        bv = b.ticker; break
      case 'sector':        av = a.sector ?? '';  bv = b.sector ?? ''; break
      case 'market_cap':    av = a.market_cap;    bv = b.market_cap; break
      case 'rsi':           av = a.market_data?.rsi_14 ?? null;      bv = b.market_data?.rsi_14 ?? null; break
      case 'mom3m':         av = a.market_data?.momentum_3m ?? null;  bv = b.market_data?.momentum_3m ?? null; break
      case 'mom12m':        av = a.market_data?.momentum_12m ?? null; bv = b.market_data?.momentum_12m ?? null; break
      case 'pe':            av = a.financials?.pe_ttm ?? null;        bv = b.financials?.pe_ttm ?? null; break
      case 'ev_ebitda':     av = a.financials?.ev_ebitda_ttm ?? null; bv = b.financials?.ev_ebitda_ttm ?? null; break
      case 'gross_margin':  av = a.financials?.gross_margin ?? null;  bv = b.financials?.gross_margin ?? null; break
      case 'fcf_margin':    av = a.financials?.fcf_margin ?? null;    bv = b.financials?.fcf_margin ?? null; break
    }

    if (av === null && bv === null) return 0
    if (av === null) return 1
    if (bv === null) return -1

    const cmp = typeof av === 'string'
      ? av.localeCompare(bv as string)
      : (av as number) - (bv as number)
    return asc ? cmp : -cmp
  })
}

// ── Column toggle ─────────────────────────────────────────────────────────────

const OPTIONAL_COLS = [
  { key: 'sector',       label: 'Secteur',     defaultOn: true  },
  { key: 'rsi',         label: 'RSI',          defaultOn: true  },
  { key: 'mom3m',       label: 'Mom 3m',       defaultOn: true  },
  { key: 'mom12m',      label: 'Mom 12m',      defaultOn: true  },
  { key: 'pe',          label: 'P/E',          defaultOn: false },
  { key: 'ev_ebitda',   label: 'EV/EBITDA',    defaultOn: false },
  { key: 'gross_margin',label: 'Marge brute',  defaultOn: true  },
  { key: 'fcf_margin',  label: 'FCF Marge',    defaultOn: false },
  { key: 'market_cap',  label: 'Mkt Cap',      defaultOn: true  },
  { key: 'score_date',  label: 'Mis à jour',   defaultOn: true  },
]

// ── Main component ────────────────────────────────────────────────────────────

export default function ScreenerTable({
  rows,
  watchlistTickers,
  isAuthenticated = true,
}: {
  rows: TickerScore[]
  watchlistTickers: string[]
  isAuthenticated?: boolean
}) {
  const router = useRouter()

  const [search,    setSearch]    = useState('')
  const [sector,    setSector]    = useState('all')
  const [minScore,  setMinScore]  = useState('')
  const [maxRsi,    setMaxRsi]    = useState('')
  const [minMom,    setMinMom]    = useState('')
  const [signal,    setSignal]    = useState<'all' | 'high' | 'mid' | 'low'>('all')
  const [sortKey,   setSortKey]   = useState<SortKey>('score_total')
  const [sortAsc,   setSortAsc]   = useState(false)
  const [colOpen,   setColOpen]   = useState(false)
  const [visibleCols, setVisibleCols] = useState<Record<string, boolean>>(
    Object.fromEntries(OPTIONAL_COLS.map(c => [c.key, c.defaultOn]))
  )

  const sectors = useMemo(
    () => [...new Set(rows.map(r => r.sector).filter(Boolean) as string[])].sort(),
    [rows]
  )

  const counts = useMemo(() => ({
    high: rows.filter(r => signalTier(r.score_total) === 'high').length,
    mid:  rows.filter(r => signalTier(r.score_total) === 'mid').length,
    low:  rows.filter(r => signalTier(r.score_total) === 'low').length,
  }), [rows])

  const filtered = useMemo(() => {
    let out = rows.filter(r => {
      if (search) {
        const q = search.toLowerCase()
        if (!r.ticker.toLowerCase().includes(q) && !r.company_name?.toLowerCase().includes(q)) return false
      }
      if (sector !== 'all' && r.sector !== sector) return false
      if (minScore && r.score_total < Number(minScore)) return false
      if (maxRsi) {
        const rsi = r.market_data?.rsi_14
        if (rsi == null || rsi > Number(maxRsi)) return false
      }
      if (minMom) {
        const mom = r.market_data?.momentum_3m
        if (mom == null || mom < Number(minMom)) return false
      }
      if (signal !== 'all' && signalTier(r.score_total) !== signal) return false
      return true
    })
    return sortRows(out, sortKey, sortAsc)
  }, [rows, search, sector, minScore, maxRsi, minMom, signal, sortKey, sortAsc])

  const hasFilters = search || sector !== 'all' || minScore || maxRsi || minMom || signal !== 'all'

  const handleSort = useCallback((key: SortKey) => {
    setSortKey(prev => {
      setSortAsc(prev === key ? (a => !a) : () => false)
      return key
    })
  }, [])

  const toggleCol = (key: string) =>
    setVisibleCols(prev => ({ ...prev, [key]: !prev[key] }))

  const col = (key: string) => visibleCols[key]

  function SortTh({ colKey, label, className = '' }: { colKey: SortKey; label: string; className?: string }) {
    const active = sortKey === colKey
    const icon = active ? (sortAsc ? ' ▲' : ' ▼') : ' ⬍'
    return (
      <th
        onClick={() => handleSort(colKey)}
        className={`px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider cursor-pointer hover:text-indigo-400 select-none whitespace-nowrap ${className}`}
      >
        {label}<span className="opacity-50 text-[0.6rem]">{icon}</span>
      </th>
    )
  }

  return (
    <div>
      {/* Signal chips */}
      <div className="flex flex-wrap gap-2 mb-4">
        {([
          { key: 'all',  label: `Tous (${rows.length})`,       cls: signal === 'all'  ? 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30' : '' },
          { key: 'high', label: `Score fort (${counts.high})`, cls: signal === 'high' ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' : '' },
          { key: 'mid',  label: `Score moyen (${counts.mid})`, cls: signal === 'mid'  ? 'bg-amber-500/15 text-amber-400 border-amber-500/30' : '' },
          { key: 'low',  label: `Score faible (${counts.low})`,cls: signal === 'low'  ? 'bg-rose-500/15 text-rose-400 border-rose-500/30' : '' },
        ] as const).map(chip => (
          <button
            key={chip.key}
            onClick={() => setSignal(chip.key)}
            className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all
              ${chip.cls || 'border-white/[0.08] bg-white/[0.04] text-zinc-500 hover:text-white hover:bg-white/[0.08]'}`}
          >
            {chip.label}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="rounded-xl border border-white/[0.06] bg-white/[0.01] px-4 py-3 mb-4">
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex flex-col gap-1">
            <label className="text-[0.65rem] text-zinc-600 uppercase tracking-wider">Recherche</label>
            <input
              type="text"
              placeholder="Ticker ou nom…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder-zinc-600 focus:border-indigo-500/50 outline-none w-40"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[0.65rem] text-zinc-600 uppercase tracking-wider">Secteur</label>
            <select
              value={sector}
              onChange={e => setSector(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-sm text-zinc-300 focus:border-indigo-500/50 outline-none cursor-pointer"
            >
              <option value="all">Tous</option>
              {sectors.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[0.65rem] text-zinc-600 uppercase tracking-wider">Score min</label>
            <input type="number" min="0" max="100" placeholder="0" value={minScore}
              onChange={e => setMinScore(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-sm text-zinc-300 focus:border-indigo-500/50 outline-none w-20"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[0.65rem] text-zinc-600 uppercase tracking-wider">RSI max</label>
            <input type="number" min="0" max="100" placeholder="100" value={maxRsi}
              onChange={e => setMaxRsi(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-sm text-zinc-300 focus:border-indigo-500/50 outline-none w-20"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[0.65rem] text-zinc-600 uppercase tracking-wider">Mom 3m min (%)</label>
            <input type="number" placeholder="ex : -10" value={minMom}
              onChange={e => setMinMom(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-sm text-zinc-300 focus:border-indigo-500/50 outline-none w-24"
            />
          </div>

          <div className="ml-auto flex gap-2 items-end">
            {hasFilters && (
              <button
                onClick={() => { setSearch(''); setSector('all'); setMinScore(''); setMaxRsi(''); setMinMom(''); setSignal('all') }}
                className="px-3 py-1.5 rounded-lg border border-white/[0.08] text-xs text-zinc-600 hover:border-rose-500/40 hover:text-rose-400 transition-colors"
              >
                ✕ Réinitialiser
              </button>
            )}

            {/* Column toggle */}
            <div className="relative">
              <button
                onClick={() => setColOpen(v => !v)}
                className="px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-sm text-zinc-400 hover:text-white hover:border-white/20 transition-colors whitespace-nowrap"
              >
                Colonnes ▾
              </button>
              {colOpen && (
                <div className="absolute right-0 top-full mt-1.5 bg-[#13131f] border border-white/10 rounded-lg p-1.5 z-50 min-w-[180px] shadow-2xl">
                  <div className="text-[0.6rem] uppercase tracking-widest text-zinc-600 px-2 py-1">Afficher / masquer</div>
                  {OPTIONAL_COLS.map(c => (
                    <label key={c.key} className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-white/[0.06] cursor-pointer text-sm text-zinc-400 hover:text-white transition-colors">
                      <input type="checkbox" checked={!!visibleCols[c.key]} onChange={() => toggleCol(c.key)}
                        className="w-3 h-3 accent-indigo-500" />
                      {c.label}
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="rounded-xl border border-white/[0.06] px-6 py-12 text-center">
          <p className="text-zinc-300 font-semibold mb-1">Aucun résultat</p>
          <p className="text-zinc-600 text-sm mb-5">Tes filtres actifs ne correspondent à aucun titre.</p>
          {/* Active filters as removable chips */}
          <div className="flex flex-wrap gap-2 justify-center mb-6">
            {search && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs bg-white/[0.05] border border-white/[0.08] text-zinc-400">
                Recherche : <span className="text-white font-medium">{search}</span>
                <button onClick={() => setSearch('')} className="text-zinc-600 hover:text-rose-400 transition-colors">×</button>
              </span>
            )}
            {sector !== 'all' && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs bg-white/[0.05] border border-white/[0.08] text-zinc-400">
                Secteur : <span className="text-white font-medium">{sector}</span>
                <button onClick={() => setSector('all')} className="text-zinc-600 hover:text-rose-400 transition-colors">×</button>
              </span>
            )}
            {minScore && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs bg-white/[0.05] border border-white/[0.08] text-zinc-400">
                Score ≥ <span className="text-white font-medium">{minScore}</span>
                <button onClick={() => setMinScore('')} className="text-zinc-600 hover:text-rose-400 transition-colors">×</button>
              </span>
            )}
            {maxRsi && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs bg-white/[0.05] border border-white/[0.08] text-zinc-400">
                RSI ≤ <span className="text-white font-medium">{maxRsi}</span>
                <button onClick={() => setMaxRsi('')} className="text-zinc-600 hover:text-rose-400 transition-colors">×</button>
              </span>
            )}
            {minMom && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs bg-white/[0.05] border border-white/[0.08] text-zinc-400">
                Mom 3m ≥ <span className="text-white font-medium">{minMom}%</span>
                <button onClick={() => setMinMom('')} className="text-zinc-600 hover:text-rose-400 transition-colors">×</button>
              </span>
            )}
            {signal !== 'all' && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs bg-white/[0.05] border border-white/[0.08] text-zinc-400">
                Signal : <span className="text-white font-medium">{signal === 'high' ? 'Fort' : signal === 'mid' ? 'Moyen' : 'Faible'}</span>
                <button onClick={() => setSignal('all')} className="text-zinc-600 hover:text-rose-400 transition-colors">×</button>
              </span>
            )}
          </div>
          {/* Quick actions */}
          <div className="flex flex-wrap gap-2 justify-center">
            <button
              onClick={() => { setSignal('high'); setMinScore(''); setMaxRsi(''); setMinMom(''); }}
              className="px-4 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold hover:bg-emerald-500/20 transition-colors"
            >
              Voir les scores forts
            </button>
            <button
              onClick={() => { setSearch(''); setSector('all'); setMinScore(''); setMaxRsi(''); setMinMom(''); setSignal('all') }}
              className="px-4 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08] text-zinc-400 text-xs font-semibold hover:text-white hover:border-white/20 transition-colors"
            >
              Tout réinitialiser
            </button>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-white/[0.06] overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.06] bg-white/[0.02]">
                <SortTh colKey="ticker" label="Titre" className="text-left pl-5" />
                <SortTh colKey="score_total" label="Score" className="text-center" />
                {col('sector')       && <SortTh colKey="sector"       label="Secteur"      className="text-left" />}
                {col('rsi')         && <SortTh colKey="rsi"           label="RSI"          className="text-right" />}
                {col('mom3m')       && <SortTh colKey="mom3m"         label="Mom 3m"       className="text-right" />}
                {col('mom12m')      && <SortTh colKey="mom12m"        label="Mom 12m"      className="text-right" />}
                {col('pe')          && <SortTh colKey="pe"            label="P/E"          className="text-right" />}
                {col('ev_ebitda')   && <SortTh colKey="ev_ebitda"     label="EV/EBITDA"    className="text-right" />}
                {col('gross_margin')&& <SortTh colKey="gross_margin"  label="Marge brute"  className="text-right" />}
                {col('fcf_margin')  && <SortTh colKey="fcf_margin"    label="FCF Marge"    className="text-right" />}
                {col('market_cap')  && <SortTh colKey="market_cap"    label="Mkt Cap"      className="text-right" />}
                {col('score_date')  && <th className="px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider text-center">Mis à jour</th>}
                {isAuthenticated && <th className="w-10 px-3 py-3" />}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {filtered.map(row => {
                const rsi = row.market_data?.rsi_14
                const mom3m = row.market_data?.momentum_3m
                const mom12m = row.market_data?.momentum_12m
                return (
                  <tr
                    key={row.id}
                    onClick={() => router.push(`/ticker/${row.ticker}`)}
                    className="hover:bg-indigo-500/[0.05] transition-colors cursor-pointer"
                  >
                    <td className="pl-5 pr-4 py-3.5">
                      <div className="font-bold text-white">{row.company_name || row.ticker}</div>
                      {row.company_name && (
                        <div className="text-xs text-zinc-600 mb-1.5">{row.ticker}</div>
                      )}
                      <div className="flex items-center gap-1.5">
                        {([
                          { v: row.score_fundamentals, label: 'F' },
                          { v: row.score_technicals,   label: 'T' },
                          { v: row.score_momentum,     label: 'M' },
                        ] as const).map(({ v, label }) => (
                          <div key={label} title={`${label === 'F' ? 'Fondamentaux' : label === 'T' ? 'Techniques' : 'Momentum'}: ${v}`} className="flex items-center gap-0.5">
                            <span className="text-[0.5rem] text-zinc-700 font-medium w-2.5">{label}</span>
                            <div className="w-8 h-1 bg-white/[0.06] rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${v >= 65 ? 'bg-emerald-500/60' : v >= 40 ? 'bg-amber-500/60' : 'bg-rose-500/60'}`}
                                style={{ width: `${v}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <ScorePill
                        score={row.score_total}
                        sub={{ f: row.score_fundamentals, t: row.score_technicals, m: row.score_momentum }}
                      />
                    </td>
                    {col('sector') && (
                      <td className="px-4 py-3.5 text-xs text-zinc-500">{row.sector || '—'}</td>
                    )}
                    {col('rsi') && (
                      <td className={`px-4 py-3.5 text-right tabular-nums text-sm ${rsi != null && rsi > 70 ? 'text-rose-400' : rsi != null && rsi < 30 ? 'text-sky-400' : 'text-zinc-400'}`}>
                        {fmt(rsi)}
                      </td>
                    )}
                    {col('mom3m') && (
                      <td className={`px-4 py-3.5 text-right tabular-nums text-sm ${mom3m != null && mom3m > 0 ? 'text-emerald-400' : mom3m != null && mom3m < 0 ? 'text-rose-400' : 'text-zinc-400'}`}>
                        {mom3m != null ? fmtPct(mom3m) : '—'}
                      </td>
                    )}
                    {col('mom12m') && (
                      <td className={`px-4 py-3.5 text-right tabular-nums text-sm ${mom12m != null && mom12m > 0 ? 'text-emerald-400' : mom12m != null && mom12m < 0 ? 'text-rose-400' : 'text-zinc-400'}`}>
                        {mom12m != null ? fmtPct(mom12m) : '—'}
                      </td>
                    )}
                    {col('pe') && (
                      <td className="px-4 py-3.5 text-right tabular-nums text-sm text-zinc-400">
                        {row.financials?.pe_ttm != null ? fmt(row.financials.pe_ttm) + 'x' : '—'}
                      </td>
                    )}
                    {col('ev_ebitda') && (
                      <td className="px-4 py-3.5 text-right tabular-nums text-sm text-zinc-400">
                        {row.financials?.ev_ebitda_ttm != null ? fmt(row.financials.ev_ebitda_ttm) + 'x' : '—'}
                      </td>
                    )}
                    {col('gross_margin') && (
                      <td className="px-4 py-3.5 text-right tabular-nums text-sm text-zinc-400">
                        {row.financials?.gross_margin != null ? fmt(row.financials.gross_margin) + '%' : '—'}
                      </td>
                    )}
                    {col('fcf_margin') && (
                      <td className="px-4 py-3.5 text-right tabular-nums text-sm text-zinc-400">
                        {row.financials?.fcf_margin != null ? fmt(row.financials.fcf_margin) + '%' : '—'}
                      </td>
                    )}
                    {col('market_cap') && (
                      <td className="px-4 py-3.5 text-right tabular-nums text-sm text-zinc-400">
                        {fmtCap(row.market_cap)}
                      </td>
                    )}
                    {col('score_date') && (() => {
                      const { label, stale } = timeAgo(row.computed_at ?? row.score_date)
                      return (
                        <td className="px-4 py-3.5 text-center">
                          <span className={`text-xs tabular-nums ${stale ? 'text-rose-500' : 'text-zinc-600'}`}
                            title={row.computed_at ?? row.score_date ?? ''}>
                            {stale && <span className="mr-1">⚠</span>}{label}
                          </span>
                        </td>
                      )
                    })()}
                    {isAuthenticated && (
                      <td className="px-3 py-3.5" onClick={e => e.stopPropagation()}>
                        <WatchlistButton
                          ticker={row.ticker}
                          initialInWatchlist={watchlistTickers.includes(row.ticker)}
                        />
                      </td>
                    )}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-xs text-zinc-700 mt-3">
        {filtered.length} résultat{filtered.length !== 1 ? 's' : ''}
        {rows.length !== filtered.length ? ` sur ${rows.length}` : ''}
      </p>
    </div>
  )
}

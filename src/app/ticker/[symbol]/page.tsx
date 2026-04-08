import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import AppNav from '@/components/AppNav'
import WatchlistButton from '@/app/dashboard/WatchlistButton'

// ── Types ────────────────────────────────────────────────────────────────────

type ImportanceItem = {
  label: string
  importance: number | null
  why: string
  direction: 'positive' | 'negative' | 'neutral'
}

type Financials = {
  revenue_cagr_3y: number | null
  ebit_margin: number | null
  gross_margin: number | null
  fcf_margin: number | null
  roe: number | null
  roic: number | null
  net_debt_to_ebitda: number | null
  pe_ttm: number | null
  ev_ebitda_ttm: number | null
  fcf_yield_ttm: number | null
  pb_ratio: number | null
}

type MarketData = {
  current_price: number | null
  change_pct: number | null
  previous_close: number | null
  volume: number | null
  avg_volume_3m: number | null
  momentum_1m: number | null
  momentum_3m: number | null
  momentum_6m: number | null
  momentum_12m: number | null
  rsi_14: number | null
  sma_50: number | null
  sma_200: number | null
  macd_histogram: number | null
  macd_line: number | null
  beta: number | null
  dividend_yield: number | null
  fifty_two_week_low: number | null
  fifty_two_week_high: number | null
  analyst_target_mean: number | null
  analyst_target_low: number | null
  analyst_target_high: number | null
  analyst_count: number | null
  analyst_recommendation: string | null
}

type TickerScore = {
  ticker: string
  company_name: string | null
  sector: string | null
  exchange: string | null
  currency: string | null
  market_cap: number | null
  one_liner: string | null
  moat_tags: string[] | null
  score_total: number
  score_fundamentals: number
  score_technicals: number
  score_momentum: number
  score_label: string | null
  importance_items: ImportanceItem[] | null
  financials: Financials | null
  market_data: MarketData | null
  score_date: string
  computed_at: string
}

type ScoreHistory = { score: number; confidence: number; scored_at: string }

// ── Helpers ──────────────────────────────────────────────────────────────────

function n(v: number | null | undefined): v is number { return v != null && isFinite(v) }

function fmt(v: number | null | undefined, suffix = '', dec = 1): string {
  if (!n(v)) return '—'
  return `${v.toFixed(dec)}${suffix}`
}
function fmtSign(v: number | null | undefined, suffix = '', dec = 1): string {
  if (!n(v)) return '—'
  return `${v >= 0 ? '+' : ''}${v.toFixed(dec)}${suffix}`
}
function timeAgo(iso: string | null | undefined): { label: string; stale: boolean } {
  if (!iso) return { label: '—', stale: false }
  const diffMs = Date.now() - new Date(iso).getTime()
  const diffH = Math.floor(diffMs / 3_600_000)
  const stale = diffH > 72
  if (diffH < 1)  return { label: '< 1h',     stale }
  if (diffH < 24) return { label: `${diffH}h`, stale }
  return { label: `${Math.floor(diffH / 24)}j`, stale }
}

function fmtVol(v: number | null | undefined): string {
  if (!n(v)) return '—'
  if (v >= 1e9) return `${(v / 1e9).toFixed(1)}B`
  if (v >= 1e6) return `${(v / 1e6).toFixed(1)}M`
  if (v >= 1e3) return `${(v / 1e3).toFixed(0)}K`
  return `${v}`
}
function fmtCap(v: number | null | undefined): string {
  if (!n(v)) return '—'
  if (v >= 1e12) return `${(v / 1e12).toFixed(2)}T`
  if (v >= 1e9) return `${(v / 1e9).toFixed(1)}B`
  if (v >= 1e6) return `${(v / 1e6).toFixed(0)}M`
  return `${v}`
}
function clamp(v: number, lo: number, hi: number) { return Math.max(lo, Math.min(hi, v)) }

function scoreColor(s: number) {
  if (s >= 70) return '#10b981'
  if (s >= 50) return '#f59e0b'
  return '#ef4444'
}
function scoreTwColor(s: number) {
  if (s >= 70) return 'text-emerald-400'
  if (s >= 50) return 'text-amber-400'
  return 'text-rose-400'
}
function scoreBgBorder(s: number) {
  if (s >= 70) return 'bg-emerald-500/10 border-emerald-500/20'
  if (s >= 50) return 'bg-amber-500/10 border-amber-500/20'
  return 'bg-rose-500/10 border-rose-500/20'
}

// ── Sub-components ────────────────────────────────────────────────────────────

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.015] p-5">
      <h2 className="text-[0.65rem] font-bold uppercase tracking-widest text-zinc-500 mb-4">{title}</h2>
      {children}
    </div>
  )
}

function KVRow({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-white/[0.04] last:border-0">
      <span className="text-sm text-zinc-400">{label}</span>
      <span className={`text-sm font-semibold tabular-nums ${color ?? 'text-white'}`}>{value}</span>
    </div>
  )
}

function KVBar({ value, max, color }: { value: number; max: number; color: string }) {
  const w = clamp((value / max) * 100, 0, 100)
  return (
    <div className="mt-1.5 h-1 rounded-full bg-white/[0.06] overflow-hidden">
      <div className={`h-full rounded-full ${color}`} style={{ width: `${w}%` }} />
    </div>
  )
}

function PillarBar({ label, score }: { label: string; score: number }) {
  const color = score >= 70 ? 'bg-emerald-500' : score >= 50 ? 'bg-amber-500' : 'bg-rose-500'
  return (
    <div className="grid grid-cols-[110px_1fr_28px] items-center gap-3">
      <span className="text-sm text-zinc-300">{label}</span>
      <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${score}%` }} />
      </div>
      <span className={`text-sm font-bold tabular-nums text-right ${scoreTwColor(score)}`}>{score}</span>
    </div>
  )
}

// ── Gauge SVG ────────────────────────────────────────────────────────────────

function ScoreGauge({ score, label }: { score: number; label: string | null }) {
  const HALF_C = 169.65
  const offset = (HALF_C * (100 - score)) / 100
  const color = scoreColor(score)
  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 120 72" width="180" height="108">
        <circle cx="60" cy="70" r="54" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="10"
          strokeDasharray={`${HALF_C} ${HALF_C}`} strokeLinecap="round"
          transform="rotate(180,60,70)" />
        <circle cx="60" cy="70" r="54" fill="none" stroke={color} strokeWidth="10"
          strokeDasharray={`${HALF_C} ${HALF_C}`} strokeDashoffset={offset}
          strokeLinecap="round" transform="rotate(180,60,70)" />
        <text x="60" y="56" textAnchor="middle" fill={color}
          fontSize="28" fontWeight="700" fontFamily="-apple-system,sans-serif">{score}</text>
        <text x="60" y="68" textAnchor="middle" fill="rgba(248,250,252,0.35)"
          fontSize="9" fontFamily="-apple-system,sans-serif">/ 100</text>
      </svg>
      {label && <span className="text-sm font-semibold mt-1" style={{ color }}>{label}</span>}
    </div>
  )
}

// ── Score History Chart ───────────────────────────────────────────────────────

function HistoryChart({ history }: { history: ScoreHistory[] }) {
  if (history.length < 2) return null
  const W = 400, H = 100, PAD = 8
  const scores = history.map(h => h.score)
  const min = Math.max(0, Math.min(...scores) - 5)
  const max = Math.min(100, Math.max(...scores) + 5)
  const range = max - min || 1
  const px = (i: number) => PAD + (i * (W - PAD * 2)) / (scores.length - 1)
  const py = (v: number) => H - PAD - ((v - min) / range) * (H - PAD * 2)
  const pts = scores.map((v, i) => `${px(i).toFixed(1)},${py(v).toFixed(1)}`).join(' ')
  const areaD = `M${px(0).toFixed(1)},${py(scores[0]).toFixed(1)} L${pts} L${px(scores.length - 1).toFixed(1)},${H} L${px(0).toFixed(1)},${H} Z`
  const first = scores[0], last = scores[scores.length - 1]

  return (
    <div className="mt-3">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" preserveAspectRatio="none">
        <defs>
          <linearGradient id="sg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#6366f1" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={areaD} fill="url(#sg)" />
        <polyline points={pts} fill="none" stroke="#6366f1" strokeWidth="2"
          strokeLinecap="round" strokeLinejoin="round" />
        <circle cx={px(0)} cy={py(first)} r="3" fill="#6366f1" />
        <text x={px(0) + 5} y={py(first) - 4} fill="#a5b4fc" fontSize="8">{first}</text>
        <circle cx={px(scores.length - 1)} cy={py(last)} r="3" fill="#6366f1" />
        <text x={px(scores.length - 1) - 5} y={py(last) - 4} fill="#a5b4fc" fontSize="8"
          textAnchor="end">{last}</text>
      </svg>
    </div>
  )
}

// ── RSI Visual ────────────────────────────────────────────────────────────────

function RSIVisual({ rsi }: { rsi: number }) {
  const color = rsi > 70 ? '#ef4444' : rsi < 30 ? '#10b981' : '#818cf8'
  const label = rsi > 70 ? 'Suracheté' : rsi < 30 ? 'Survendu' : 'Neutre'
  return (
    <div className="mt-2 space-y-1">
      <div className="relative h-2 rounded-full bg-white/[0.06] overflow-visible">
        <div className="absolute inset-0 rounded-full" style={{
          background: 'linear-gradient(to right, #10b981 0%, #10b981 30%, #818cf8 30%, #818cf8 70%, #ef4444 70%)',
          opacity: 0.2,
        }} />
        <div className="absolute w-2.5 h-2.5 rounded-full border-2 border-[#0f0f1a] -top-0.5 -translate-x-1/2"
          style={{ left: `${rsi}%`, background: color }} />
      </div>
      <div className="flex justify-between text-[0.6rem] text-zinc-600">
        <span>Survendu &lt;30</span>
        <span className="font-medium" style={{ color }}>{label} {rsi.toFixed(1)}</span>
        <span>Suracheté &gt;70</span>
      </div>
    </div>
  )
}

// ── 52-week Range Bar ─────────────────────────────────────────────────────────

function RangeBar({ low, high, current, currency }: { low: number; high: number; current: number; currency: string }) {
  const pos = clamp(((current - low) / (high - low)) * 100, 0, 100)
  return (
    <div className="mt-2 space-y-1">
      <div className="relative h-2 rounded-full bg-white/[0.06]">
        <div className="absolute h-full w-full rounded-full" style={{
          background: 'linear-gradient(to right, #10b981, #f59e0b, #ef4444)',
          opacity: 0.25,
        }} />
        <div className="absolute w-3 h-3 rounded-full bg-white border-2 border-indigo-400 -top-0.5 -translate-x-1/2"
          style={{ left: `${pos}%` }} />
      </div>
      <div className="flex justify-between text-[0.6rem] text-zinc-500 tabular-nums">
        <span>{low.toFixed(2)} {currency}</span>
        <span className="text-zinc-300 font-semibold">{current.toFixed(2)}</span>
        <span>{high.toFixed(2)} {currency}</span>
      </div>
    </div>
  )
}

// ── Debt Tag ──────────────────────────────────────────────────────────────────

function DebtTag({ ratio }: { ratio: number }) {
  if (ratio < 0) return <span className="ml-2 px-1.5 py-0.5 rounded text-[0.6rem] font-bold bg-emerald-500/15 text-emerald-400">Trés. nette</span>
  if (ratio <= 1) return <span className="ml-2 px-1.5 py-0.5 rounded text-[0.6rem] font-bold bg-emerald-500/15 text-emerald-400">Faible</span>
  if (ratio <= 2.5) return <span className="ml-2 px-1.5 py-0.5 rounded text-[0.6rem] font-bold bg-amber-500/15 text-amber-400">Modéré</span>
  if (ratio <= 4) return <span className="ml-2 px-1.5 py-0.5 rounded text-[0.6rem] font-bold bg-orange-500/15 text-orange-400">Élevé</span>
  return <span className="ml-2 px-1.5 py-0.5 rounded text-[0.6rem] font-bold bg-rose-500/15 text-rose-400">Critique</span>
}

function BetaTag({ beta }: { beta: number }) {
  if (beta <= 0.8) return <span className="ml-2 px-1.5 py-0.5 rounded text-[0.6rem] font-bold bg-emerald-500/15 text-emerald-400">Défensif</span>
  if (beta >= 1.5) return <span className="ml-2 px-1.5 py-0.5 rounded text-[0.6rem] font-bold bg-orange-500/15 text-orange-400">Volatil</span>
  return null
}

// ── Signal Zone computation ───────────────────────────────────────────────────

type Signal = { label: string; value: string; type: 'buy' | 'sell'; strength: number; desc: string }
type SignalCategory = { title: string; signals: Signal[] }

function computeSignals(fin: Financials | null, mkt: MarketData | null): {
  categories: SignalCategory[]
  buyPts: number
  sellPts: number
  zone: string
  zoneLabel: string
  zoneDesc: string
  buyPct: number
} {
  const techSigs: Signal[] = []
  const valSigs: Signal[] = []
  const qualSigs: Signal[] = []
  const analystSigs: Signal[] = []
  let buy = 0, sell = 0

  // ── Technical ──
  const rsi = mkt?.rsi_14
  if (n(rsi)) {
    if (rsi <= 25) { buy += 3; techSigs.push({ label: 'RSI très survendu', value: `${rsi.toFixed(0)}`, type: 'buy', strength: 3, desc: 'Fort signal de rebond' }) }
    else if (rsi <= 35) { buy += 2; techSigs.push({ label: 'RSI survendu', value: `${rsi.toFixed(0)}`, type: 'buy', strength: 2, desc: 'Potentiel de rebond' }) }
    else if (rsi <= 45) { buy += 1; techSigs.push({ label: 'RSI zone basse', value: `${rsi.toFixed(0)}`, type: 'buy', strength: 1, desc: 'Sous pression vendeuse' }) }
    else if (rsi >= 80) { sell += 3; techSigs.push({ label: 'RSI très suracheté', value: `${rsi.toFixed(0)}`, type: 'sell', strength: 3, desc: 'Correction probable' }) }
    else if (rsi >= 70) { sell += 2; techSigs.push({ label: 'RSI suracheté', value: `${rsi.toFixed(0)}`, type: 'sell', strength: 2, desc: 'Prudence recommandée' }) }
    else if (rsi >= 60) { sell += 1; techSigs.push({ label: 'RSI zone haute', value: `${rsi.toFixed(0)}`, type: 'sell', strength: 1, desc: 'Momentum élevé' }) }
  }

  const low52 = mkt?.fifty_two_week_low, high52 = mkt?.fifty_two_week_high, cur = mkt?.current_price
  if (n(low52) && n(high52) && n(cur)) {
    const span = high52 - low52
    if (span > 0) {
      const pos = ((cur - low52) / span) * 100
      if (pos <= 15) { buy += 3; techSigs.push({ label: 'Proche plus bas 52s', value: `${pos.toFixed(0)}%`, type: 'buy', strength: 3, desc: 'Prix historiquement bas' }) }
      else if (pos <= 30) { buy += 2; techSigs.push({ label: 'Zone basse 52s', value: `${pos.toFixed(0)}%`, type: 'buy', strength: 2, desc: "Point d'entrée possible" }) }
      else if (pos >= 95) { sell += 3; techSigs.push({ label: 'Plus haut 52s', value: `${pos.toFixed(0)}%`, type: 'sell', strength: 3, desc: 'Résistance majeure' }) }
      else if (pos >= 85) { sell += 2; techSigs.push({ label: 'Proche plus haut 52s', value: `${pos.toFixed(0)}%`, type: 'sell', strength: 2, desc: 'Potentiel limité' }) }
    }
  }

  const sma50 = mkt?.sma_50, sma200 = mkt?.sma_200
  if (n(sma50) && n(sma200) && n(cur)) {
    if (cur > sma50 && cur > sma200 && sma50 > sma200) { buy += 2; techSigs.push({ label: 'Tendance haussière', value: 'Golden Cross', type: 'buy', strength: 2, desc: 'Prix > SMA50 > SMA200' }) }
    else if (cur < sma50 && cur < sma200 && sma50 < sma200) { sell += 2; techSigs.push({ label: 'Tendance baissière', value: 'Death Cross', type: 'sell', strength: 2, desc: 'Prix < SMA50 < SMA200' }) }
    else if (cur < sma200 && sma50 > sma200) { sell += 1; techSigs.push({ label: 'Sous SMA200', value: 'Support cassé', type: 'sell', strength: 1, desc: 'Retour sous moyenne long terme' }) }
    else if (cur > sma200 && cur < sma50) { buy += 1; techSigs.push({ label: 'Pullback SMA50', value: 'Rebond?', type: 'buy', strength: 1, desc: 'Correction dans tendance haussière' }) }
  }

  const macdHist = mkt?.macd_histogram
  if (n(macdHist) && n(cur) && cur > 0) {
    const histPct = (macdHist / cur) * 100
    if (histPct >= 0.5) { buy += 2; techSigs.push({ label: 'MACD fort haussier', value: 'Bullish', type: 'buy', strength: 2, desc: 'Momentum haussier confirmé' }) }
    else if (histPct >= 0.05) { buy += 1; techSigs.push({ label: 'MACD haussier', value: 'Bullish', type: 'buy', strength: 1, desc: "Signal d'achat MACD" }) }
    else if (histPct <= -0.5) { sell += 2; techSigs.push({ label: 'MACD fort baissier', value: 'Bearish', type: 'sell', strength: 2, desc: 'Momentum baissier confirmé' }) }
    else if (histPct <= -0.05) { sell += 1; techSigs.push({ label: 'MACD baissier', value: 'Bearish', type: 'sell', strength: 1, desc: 'Signal de vente MACD' }) }
  }

  const mom12 = mkt?.momentum_12m
  if (n(mom12)) {
    if (mom12 <= -40) { buy += 2; techSigs.push({ label: 'Chute massive', value: `${mom12.toFixed(0)}%`, type: 'buy', strength: 2, desc: 'Survente extrême' }) }
    else if (mom12 <= -20) { buy += 1; techSigs.push({ label: 'Forte baisse 12m', value: `${mom12.toFixed(0)}%`, type: 'buy', strength: 1, desc: 'Potentiel rebond' }) }
    else if (mom12 >= 80) { sell += 2; techSigs.push({ label: 'Hausse excessive', value: `+${mom12.toFixed(0)}%`, type: 'sell', strength: 2, desc: 'Surchauffe du titre' }) }
    else if (mom12 >= 50) { sell += 1; techSigs.push({ label: 'Forte hausse 12m', value: `+${mom12.toFixed(0)}%`, type: 'sell', strength: 1, desc: 'Consolidation possible' }) }
  }

  // ── Valuation ──
  const pe = fin?.pe_ttm
  if (n(pe) && pe > 0) {
    if (pe <= 10) { buy += 3; valSigs.push({ label: 'P/E très bas', value: `${pe.toFixed(1)}`, type: 'buy', strength: 3, desc: 'Valorisation attractive' }) }
    else if (pe <= 15) { buy += 2; valSigs.push({ label: 'P/E attractif', value: `${pe.toFixed(1)}`, type: 'buy', strength: 2, desc: 'Sous la moyenne marché' }) }
    else if (pe >= 50) { sell += 3; valSigs.push({ label: 'P/E très élevé', value: `${pe.toFixed(1)}`, type: 'sell', strength: 3, desc: 'Valorisation excessive' }) }
    else if (pe >= 35) { sell += 2; valSigs.push({ label: 'P/E élevé', value: `${pe.toFixed(1)}`, type: 'sell', strength: 2, desc: 'Prime de croissance incluse' }) }
    else if (pe >= 25) { sell += 1; valSigs.push({ label: 'P/E au-dessus moyenne', value: `${pe.toFixed(1)}`, type: 'sell', strength: 1, desc: 'Légèrement cher' }) }
  }

  const ev = fin?.ev_ebitda_ttm
  if (n(ev) && ev > 0) {
    if (ev <= 6) { buy += 2; valSigs.push({ label: 'EV/EBITDA bas', value: `${ev.toFixed(1)}x`, type: 'buy', strength: 2, desc: "Valorisation d'entreprise attractive" }) }
    else if (ev <= 10) { buy += 1; valSigs.push({ label: 'EV/EBITDA correct', value: `${ev.toFixed(1)}x`, type: 'buy', strength: 1, desc: 'Multiple raisonnable' }) }
    else if (ev >= 20) { sell += 2; valSigs.push({ label: 'EV/EBITDA élevé', value: `${ev.toFixed(1)}x`, type: 'sell', strength: 2, desc: 'Prix élevé vs cash-flow' }) }
    else if (ev >= 15) { sell += 1; valSigs.push({ label: 'EV/EBITDA tendu', value: `${ev.toFixed(1)}x`, type: 'sell', strength: 1, desc: 'Multiple au-dessus moyenne' }) }
  }

  const fcfy = fin?.fcf_yield_ttm
  if (n(fcfy)) {
    if (fcfy >= 10) { buy += 3; valSigs.push({ label: 'FCF Yield excellent', value: `${fcfy.toFixed(1)}%`, type: 'buy', strength: 3, desc: 'Forte génération de cash' }) }
    else if (fcfy >= 6) { buy += 2; valSigs.push({ label: 'FCF Yield bon', value: `${fcfy.toFixed(1)}%`, type: 'buy', strength: 2, desc: 'Cash-flow attractif' }) }
    else if (fcfy <= 1) { sell += 2; valSigs.push({ label: 'FCF Yield faible', value: `${fcfy.toFixed(1)}%`, type: 'sell', strength: 2, desc: 'Peu de cash pour le prix' }) }
    else if (fcfy <= 3) { sell += 1; valSigs.push({ label: 'FCF Yield bas', value: `${fcfy.toFixed(1)}%`, type: 'sell', strength: 1, desc: 'Rendement limité' }) }
  }

  const pb = fin?.pb_ratio
  if (n(pb) && pb > 0) {
    if (pb <= 1) { buy += 2; valSigs.push({ label: 'P/B sous 1', value: `${pb.toFixed(2)}x`, type: 'buy', strength: 2, desc: 'Sous valeur comptable' }) }
    else if (pb <= 1.5) { buy += 1; valSigs.push({ label: 'P/B attractif', value: `${pb.toFixed(2)}x`, type: 'buy', strength: 1, desc: 'Proche valeur comptable' }) }
    else if (pb >= 8) { sell += 2; valSigs.push({ label: 'P/B très élevé', value: `${pb.toFixed(1)}x`, type: 'sell', strength: 2, desc: 'Prime importante vs actifs' }) }
  }

  const divYield = mkt?.dividend_yield
  if (n(divYield) && divYield > 0) {
    if (divYield >= 0.05) { buy += 2; valSigs.push({ label: 'Dividende élevé', value: `${(divYield * 100).toFixed(1)}%`, type: 'buy', strength: 2, desc: 'Rendement attractif' }) }
    else if (divYield >= 0.03) { buy += 1; valSigs.push({ label: 'Bon dividende', value: `${(divYield * 100).toFixed(1)}%`, type: 'buy', strength: 1, desc: 'Revenu régulier' }) }
  }

  // ── Quality ──
  const roe = fin?.roe
  if (n(roe)) {
    if (roe >= 25) { buy += 2; qualSigs.push({ label: 'ROE excellent', value: `${roe.toFixed(0)}%`, type: 'buy', strength: 2, desc: 'Très rentable' }) }
    else if (roe >= 15) { buy += 1; qualSigs.push({ label: 'ROE solide', value: `${roe.toFixed(0)}%`, type: 'buy', strength: 1, desc: 'Bonne rentabilité' }) }
    else if (roe <= 5 && roe >= 0) { sell += 1; qualSigs.push({ label: 'ROE faible', value: `${roe.toFixed(0)}%`, type: 'sell', strength: 1, desc: 'Rentabilité limitée' }) }
    else if (roe < 0) { sell += 2; qualSigs.push({ label: 'ROE négatif', value: `${roe.toFixed(0)}%`, type: 'sell', strength: 2, desc: 'Entreprise non rentable' }) }
  }

  const debt = fin?.net_debt_to_ebitda
  if (n(debt)) {
    if (debt < 0) { buy += 2; qualSigs.push({ label: 'Trésorerie nette', value: `${debt.toFixed(1)}x`, type: 'buy', strength: 2, desc: 'Cash > Dette' }) }
    else if (debt <= 1) { buy += 1; qualSigs.push({ label: 'Dette faible', value: `${debt.toFixed(1)}x`, type: 'buy', strength: 1, desc: 'Bilan solide' }) }
    else if (debt >= 5) { sell += 3; qualSigs.push({ label: 'Dette critique', value: `${debt.toFixed(1)}x`, type: 'sell', strength: 3, desc: 'Risque financier élevé' }) }
    else if (debt >= 3.5) { sell += 2; qualSigs.push({ label: 'Dette élevée', value: `${debt.toFixed(1)}x`, type: 'sell', strength: 2, desc: 'Levier important' }) }
  }

  const fcfm = fin?.fcf_margin
  if (n(fcfm)) {
    if (fcfm >= 20) { buy += 2; qualSigs.push({ label: 'FCF Margin excellent', value: `${fcfm.toFixed(0)}%`, type: 'buy', strength: 2, desc: 'Machine à cash' }) }
    else if (fcfm >= 10) { buy += 1; qualSigs.push({ label: 'FCF Margin bon', value: `${fcfm.toFixed(0)}%`, type: 'buy', strength: 1, desc: 'Génération de cash solide' }) }
    else if (fcfm <= 0) { sell += 2; qualSigs.push({ label: 'FCF Margin négatif', value: `${fcfm.toFixed(0)}%`, type: 'sell', strength: 2, desc: 'Brûle du cash' }) }
  }

  const growth = fin?.revenue_cagr_3y
  if (n(growth)) {
    if (growth >= 20) { buy += 2; qualSigs.push({ label: 'Croissance forte', value: `${growth.toFixed(0)}%/an`, type: 'buy', strength: 2, desc: 'Expansion rapide' }) }
    else if (growth >= 10) { buy += 1; qualSigs.push({ label: 'Bonne croissance', value: `${growth.toFixed(0)}%/an`, type: 'buy', strength: 1, desc: 'Dynamique positive' }) }
    else if (growth <= -10) { sell += 2; qualSigs.push({ label: 'Décroissance', value: `${growth.toFixed(0)}%/an`, type: 'sell', strength: 2, desc: "Chiffre d'affaires en baisse" }) }
    else if (growth <= 0) { sell += 1; qualSigs.push({ label: 'Stagnation', value: `${growth.toFixed(0)}%/an`, type: 'sell', strength: 1, desc: 'Pas de croissance' }) }
  }

  // ── Analysts ──
  const target = mkt?.analyst_target_mean
  if (n(target) && n(cur) && cur > 0) {
    const upside = ((target - cur) / cur) * 100
    const count = mkt?.analyst_count ? ` (${mkt.analyst_count} anal.)` : ''
    if (upside >= 25) { buy += 3; analystSigs.push({ label: 'Fort upside analystes', value: `+${upside.toFixed(0)}%`, type: 'buy', strength: 3, desc: `Target ${target.toFixed(0)}${count}` }) }
    else if (upside >= 10) { buy += 2; analystSigs.push({ label: 'Upside analystes', value: `+${upside.toFixed(0)}%`, type: 'buy', strength: 2, desc: `Target ${target.toFixed(0)}` }) }
    else if (upside <= -15) { sell += 3; analystSigs.push({ label: 'Fort downside analystes', value: `${upside.toFixed(0)}%`, type: 'sell', strength: 3, desc: `Target ${target.toFixed(0)}` }) }
    else if (upside <= -5) { sell += 2; analystSigs.push({ label: 'Downside analystes', value: `${upside.toFixed(0)}%`, type: 'sell', strength: 2, desc: `Target ${target.toFixed(0)}` }) }
  }

  const reco = mkt?.analyst_recommendation
  if (reco) {
    if (reco === 'strong_buy') { buy += 2; analystSigs.push({ label: 'Consensus Strong Buy', value: 'Strong Buy', type: 'buy', strength: 2, desc: 'Recommandation très positive' }) }
    else if (reco === 'buy') { buy += 1; analystSigs.push({ label: 'Consensus Buy', value: 'Buy', type: 'buy', strength: 1, desc: 'Recommandation positive' }) }
    else if (reco === 'sell') { sell += 2; analystSigs.push({ label: 'Consensus Sell', value: 'Sell', type: 'sell', strength: 2, desc: 'Recommandation négative' }) }
    else if (reco === 'underperform') { sell += 1; analystSigs.push({ label: 'Consensus Underperform', value: 'Underperform', type: 'sell', strength: 1, desc: 'Sous-performance attendue' }) }
  }

  // ── Zone ──
  let zone = 'neutral', zoneLabel = 'Zone neutre', zoneDesc = 'Pas de signal fort détecté'
  const total = buy + sell
  if (total === 0) { /* neutral */ }
  else if (buy >= sell * 2.5 && buy >= 6) { zone = 'strong-buy'; zoneLabel = "Forte zone d'achat"; zoneDesc = "Multiples signaux d'achat convergents" }
  else if (buy >= sell * 1.5) { zone = 'buy'; zoneLabel = "Zone d'achat"; zoneDesc = 'Signaux majoritairement positifs' }
  else if (sell >= buy * 2.5 && sell >= 6) { zone = 'strong-sell'; zoneLabel = 'Forte zone de vente'; zoneDesc = 'Multiples signaux de vente convergents' }
  else if (sell >= buy * 1.5) { zone = 'sell'; zoneLabel = 'Zone de vente'; zoneDesc = 'Signaux majoritairement négatifs' }
  else if (buy > sell) { zone = 'buy'; zoneLabel = "Zone d'achat modérée"; zoneDesc = 'Léger avantage acheteur' }
  else if (sell > buy) { zone = 'sell'; zoneLabel = 'Zone de vente modérée'; zoneDesc = 'Prudence recommandée' }

  const buyPct = total > 0 ? Math.round((buy / total) * 100) : 50
  const categories: SignalCategory[] = []
  if (techSigs.length) categories.push({ title: '📊 Technique', signals: techSigs })
  if (valSigs.length) categories.push({ title: '💰 Valorisation', signals: valSigs })
  if (qualSigs.length) categories.push({ title: '⭐ Qualité', signals: qualSigs })
  if (analystSigs.length) categories.push({ title: '🎯 Analystes', signals: analystSigs })

  return { categories, buyPts: buy, sellPts: sell, zone, zoneLabel, zoneDesc, buyPct }
}

// ── Price Levels computation ──────────────────────────────────────────────────

type PriceLevel = { label: string; desc: string; price: number; type: string; strength: number }

function computePriceLevels(fin: Financials | null, mkt: MarketData | null): { buy: PriceLevel[]; sell: PriceLevel[] } {
  const cur = mkt?.current_price
  if (!n(cur)) return { buy: [], sell: [] }
  const buy: PriceLevel[] = [], sell: PriceLevel[] = []

  const low52 = mkt?.fifty_two_week_low, high52 = mkt?.fifty_two_week_high
  if (n(low52) && n(high52)) {
    const span = high52 - low52
    const bz1 = low52 * 1.05
    if (bz1 < cur) buy.push({ label: 'Zone basse 52s', desc: '+5% du plus bas', price: bz1, type: 'support', strength: 3 })
    const bz2 = low52 + span * 0.25
    if (bz2 < cur) buy.push({ label: 'Support 25%', desc: '25% du range 52s', price: bz2, type: 'support', strength: 2 })
    const sz1 = high52 * 0.95
    if (sz1 > cur) sell.push({ label: 'Zone haute 52s', desc: '-5% du plus haut', price: sz1, type: 'resistance', strength: 3 })
    const sz2 = low52 + span * 0.75
    if (sz2 > cur) sell.push({ label: 'Résistance 75%', desc: '75% du range 52s', price: sz2, type: 'resistance', strength: 2 })
  }

  const sma200 = mkt?.sma_200
  if (n(sma200)) {
    if (sma200 < cur) buy.push({ label: 'SMA 200', desc: 'Moyenne mobile long terme', price: sma200, type: 'ma', strength: 3 })
    else sell.push({ label: 'SMA 200', desc: 'Résistance moyenne long terme', price: sma200, type: 'ma', strength: 2 })
  }
  const sma50 = mkt?.sma_50
  if (n(sma50) && (!n(sma200) || Math.abs(sma50 - sma200) > 0.01)) {
    if (sma50 < cur) buy.push({ label: 'SMA 50', desc: 'Moyenne mobile court terme', price: sma50, type: 'ma', strength: 2 })
    else sell.push({ label: 'SMA 50', desc: 'Résistance moyenne court terme', price: sma50, type: 'ma', strength: 1 })
  }

  const pe = fin?.pe_ttm
  if (n(pe) && pe > 0 && Math.abs(pe - 15) > 0.5) {
    const fairPe = cur * (15 / pe)
    if (fairPe < cur * 0.95) buy.push({ label: 'Juste valeur P/E', desc: 'P/E cible = 15x', price: fairPe, type: 'valuation', strength: 2 })
    else if (fairPe > cur * 1.05) sell.push({ label: 'Survalor. P/E', desc: 'P/E actuel vs 15x', price: fairPe, type: 'valuation', strength: 1 })
  }

  const fcfy = fin?.fcf_yield_ttm
  if (n(fcfy) && fcfy > 0 && Math.abs(fcfy - 5) > 0.5) {
    const fairFcf = cur * (fcfy / 5)
    if (fairFcf < cur * 0.9) buy.push({ label: 'Juste valeur FCF', desc: 'FCF yield cible = 5%', price: fairFcf, type: 'valuation', strength: 2 })
    else if (fairFcf > cur * 1.1) sell.push({ label: 'Objectif FCF', desc: 'FCF yield actuel vs 5%', price: fairFcf, type: 'valuation', strength: 1 })
  }

  const target = mkt?.analyst_target_mean
  if (n(target)) {
    if (target > cur * 1.03) sell.push({ label: 'Target analystes', desc: 'Objectif moyen consensus', price: target, type: 'analyst', strength: 3 })
    else if (target < cur * 0.97) buy.push({ label: 'Target analystes', desc: 'Objectif moyen (en-dessous)', price: target, type: 'analyst', strength: 2 })
  }
  const tHigh = mkt?.analyst_target_high
  if (n(tHigh) && tHigh > cur * 1.05) sell.push({ label: 'Target haut analystes', desc: 'Objectif optimiste', price: tHigh, type: 'analyst', strength: 1 })
  const tLow = mkt?.analyst_target_low
  if (n(tLow) && tLow < cur * 0.95) buy.push({ label: 'Target bas analystes', desc: 'Objectif pessimiste', price: tLow, type: 'analyst', strength: 1 })

  return {
    buy: [...buy].sort((a, b) => b.price - a.price),
    sell: [...sell].sort((a, b) => a.price - b.price),
  }
}

// ── Signal Zone section ───────────────────────────────────────────────────────

function SignalZoneSection({ fin, mkt }: { fin: Financials | null; mkt: MarketData | null }) {
  const { categories, buyPts, sellPts, zone, zoneLabel, zoneDesc, buyPct } = computeSignals(fin, mkt)
  const zoneColor = zone.includes('buy') ? 'text-emerald-400' : zone.includes('sell') ? 'text-rose-400' : 'text-zinc-400'
  const zoneBorder = zone.includes('buy') ? 'border-emerald-500/20 bg-emerald-500/[0.03]' : zone.includes('sell') ? 'border-rose-500/20 bg-rose-500/[0.03]' : 'border-white/[0.06] bg-white/[0.01]'

  return (
    <SectionCard title="Zone d'Achat / Vente">
      <div className={`rounded-lg border p-4 mb-4 ${zoneBorder}`}>
        <div className={`text-base font-bold mb-1 ${zoneColor}`}>{zoneLabel}</div>
        <p className="text-xs text-zinc-500 mb-3">{zoneDesc}</p>
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs text-zinc-500 w-10 text-right">Vente</span>
          <div className="flex-1 h-2 rounded-full bg-white/[0.06] overflow-hidden relative">
            <div className="absolute inset-y-0 left-0 rounded-full bg-emerald-500/50" style={{ width: `${buyPct}%` }} />
          </div>
          <span className="text-xs text-zinc-500 w-10">Achat</span>
        </div>
        <div className="flex justify-center gap-4 text-xs">
          <span className="text-rose-400 font-semibold">🔴 {sellPts} pts vente</span>
          <span className="text-zinc-600">|</span>
          <span className="text-emerald-400 font-semibold">🟢 {buyPts} pts achat</span>
        </div>
      </div>

      {categories.length > 0 ? (
        <div className="space-y-3">
          {categories.map(cat => (
            <div key={cat.title}>
              <div className="text-[0.6rem] font-bold uppercase tracking-widest text-zinc-600 mb-1.5">{cat.title}</div>
              <div className="space-y-1">
                {cat.signals.map((sig, i) => (
                  <div key={i} className={`flex items-center gap-2 px-2 py-1.5 rounded-lg ${sig.type === 'buy' ? 'bg-emerald-500/[0.05]' : 'bg-rose-500/[0.05]'}`}>
                    <span className={`text-xs font-bold w-3 ${sig.type === 'buy' ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {sig.type === 'buy' ? '▲' : '▼'}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium text-white truncate">{sig.label}</div>
                      <div className="text-[0.6rem] text-zinc-600 truncate">{sig.desc}</div>
                    </div>
                    <span className={`text-xs font-mono font-bold shrink-0 ${sig.type === 'buy' ? 'text-emerald-400' : 'text-rose-400'}`}>{sig.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-zinc-600 text-center py-4">Aucun signal fort détecté.</p>
      )}
      <p className="text-[0.6rem] text-zinc-700 mt-3 text-center">Signaux indicatifs — pas un conseil d&apos;investissement.</p>
    </SectionCard>
  )
}

// ── Price Levels section ──────────────────────────────────────────────────────

function PriceLevelsSection({ fin, mkt, currency }: { fin: Financials | null; mkt: MarketData | null; currency: string }) {
  const cur = mkt?.current_price
  if (!n(cur)) return (
    <SectionCard title="Niveaux de Prix">
      <p className="text-xs text-zinc-600 text-center py-4">Prix actuel non disponible.</p>
    </SectionCard>
  )

  const { buy, sell } = computePriceLevels(fin, mkt)
  const low52 = mkt?.fifty_two_week_low, high52 = mkt?.fifty_two_week_high
  const rangePos = n(low52) && n(high52) && high52 > low52
    ? clamp(((cur - low52) / (high52 - low52)) * 100, 0, 100) : null

  const fixedBuys = [
    { label: '-5% du prix', desc: 'Premier palier', price: cur * 0.95 },
    { label: '-10% du prix', desc: 'Renforcement', price: cur * 0.90 },
    { label: '-15% du prix', desc: 'Achat agressif', price: cur * 0.85 },
  ]
  const fixedSells = [
    { label: '+10% du prix', desc: 'Prise de profit', price: cur * 1.10 },
    { label: '+20% du prix', desc: 'Objectif moyen terme', price: cur * 1.20 },
    { label: '+30% du prix', desc: 'Objectif ambitieux', price: cur * 1.30 },
  ]

  return (
    <SectionCard title="Niveaux de Prix">
      <div className="text-center mb-4">
        <span className="text-xs text-zinc-500">Prix actuel</span>
        <div className="text-xl font-bold tabular-nums text-white">{cur.toFixed(2)} <span className="text-zinc-500 text-sm font-normal">{currency}</span></div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div>
          <div className="text-[0.6rem] font-bold uppercase tracking-widest text-emerald-600 mb-2">Zone d&apos;Achat</div>
          {fixedBuys.map((l, i) => (
            <div key={i} className="flex items-center justify-between py-1 border-b border-white/[0.03]">
              <div>
                <div className="text-[0.7rem] text-zinc-400">{l.label}</div>
                <div className="text-[0.6rem] text-zinc-600">{l.desc}</div>
              </div>
              <span className="text-xs font-mono font-bold text-emerald-400 tabular-nums">{l.price.toFixed(2)}</span>
            </div>
          ))}
          {buy.map((l, i) => (
            <div key={i} className={`flex items-center justify-between py-1 border-b border-white/[0.03] ${l.strength >= 3 ? 'opacity-100' : 'opacity-70'}`}>
              <div>
                <div className="text-[0.7rem] text-zinc-400">{l.label}</div>
                <div className="text-[0.6rem] text-zinc-600">{l.desc}</div>
              </div>
              <span className="text-xs font-mono font-bold text-emerald-400 tabular-nums">{l.price.toFixed(2)}</span>
            </div>
          ))}
        </div>
        <div>
          <div className="text-[0.6rem] font-bold uppercase tracking-widest text-rose-600 mb-2">Zone de Vente</div>
          {fixedSells.map((l, i) => (
            <div key={i} className="flex items-center justify-between py-1 border-b border-white/[0.03]">
              <div>
                <div className="text-[0.7rem] text-zinc-400">{l.label}</div>
                <div className="text-[0.6rem] text-zinc-600">{l.desc}</div>
              </div>
              <span className="text-xs font-mono font-bold text-rose-400 tabular-nums">{l.price.toFixed(2)}</span>
            </div>
          ))}
          {sell.map((l, i) => (
            <div key={i} className={`flex items-center justify-between py-1 border-b border-white/[0.03] ${l.strength >= 3 ? 'opacity-100' : 'opacity-70'}`}>
              <div>
                <div className="text-[0.7rem] text-zinc-400">{l.label}</div>
                <div className="text-[0.6rem] text-zinc-600">{l.desc}</div>
              </div>
              <span className="text-xs font-mono font-bold text-rose-400 tabular-nums">{l.price.toFixed(2)}</span>
            </div>
          ))}
        </div>
      </div>

      {rangePos !== null && n(low52) && n(high52) && (
        <div>
          <div className="relative h-4 rounded-full overflow-hidden">
            <div className="absolute inset-0" style={{ background: 'linear-gradient(to right, rgba(16,185,129,0.3) 30%, rgba(245,158,11,0.2) 30% 70%, rgba(239,68,68,0.3) 70%)' }} />
            <div className="absolute top-1/2 w-2.5 h-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white border-2 border-indigo-400"
              style={{ left: `${rangePos}%` }} />
          </div>
          <div className="flex justify-between text-[0.6rem] text-zinc-600 mt-1">
            <span className="text-emerald-700">Achat</span><span className="text-amber-700">Neutre</span><span className="text-rose-700">Vente</span>
          </div>
        </div>
      )}
      <p className="text-[0.6rem] text-zinc-700 mt-3 text-center">Niveaux indicatifs — adaptez à votre stratégie.</p>
    </SectionCard>
  )
}

// ── Guest Teaser ──────────────────────────────────────────────────────────────

function TeaserBlock({ ticker, row }: { ticker: string; row: TickerScore }) {
  const currency = row.currency || ''
  return (
    <div className="min-h-screen bg-[#0f0f1a] text-white">
      <AppNav activePath="" />
      <main className="max-w-5xl mx-auto px-6 py-8 space-y-6">
        <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-white transition-colors">
          <span>←</span> Screener
        </Link>

        {/* Header — fully visible */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-1 flex-wrap">
              <h1 className="text-2xl font-bold truncate">{row.company_name || ticker}</h1>
              <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-white/[0.06] text-zinc-300 shrink-0">{ticker}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-zinc-500 flex-wrap">
              {row.sector && <span>{row.sector}</span>}
              {row.sector && row.exchange && <span>·</span>}
              {row.exchange && <span>{row.exchange}</span>}
              {row.market_cap && <><span>·</span><span>{fmtCap(row.market_cap)} {currency}</span></>}
            </div>
            {row.one_liner && (
              <p className="mt-2 text-sm text-zinc-400 max-w-lg italic">&ldquo;{row.one_liner}&rdquo;</p>
            )}
            {row.moat_tags && row.moat_tags.length > 0 && (
              <div className="flex gap-1.5 mt-2 flex-wrap">
                {row.moat_tags.map(tag => (
                  <span key={tag} className="px-2 py-0.5 rounded-full text-xs bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">{tag}</span>
                ))}
              </div>
            )}
          </div>
          {/* Score badge — visible */}
          <div className={`flex flex-col items-center justify-center w-24 h-24 rounded-2xl border ${scoreBgBorder(row.score_total)} shrink-0`}>
            <span className={`text-4xl font-black tabular-nums ${scoreTwColor(row.score_total)}`}>{row.score_total}</span>
            <span className="text-[10px] uppercase tracking-wider text-zinc-500 mt-0.5">{row.score_label || 'Score'}</span>
          </div>
        </div>

        {/* Locked section with signup CTA */}
        <div className="relative rounded-2xl border border-indigo-500/25 bg-indigo-500/5 overflow-hidden">
          {/* Blurred fake content */}
          <div className="absolute inset-0 pointer-events-none select-none p-6 space-y-4 blur-sm opacity-20">
            <div className="grid grid-cols-3 gap-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-20 rounded-xl bg-white/10" />
              ))}
            </div>
            <div className="h-2 bg-white/20 rounded w-3/4" />
            <div className="h-2 bg-white/20 rounded w-1/2" />
            <div className="grid grid-cols-2 gap-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-12 rounded-lg bg-white/10" />
              ))}
            </div>
            <div className="h-2 bg-white/20 rounded w-2/3" />
          </div>

          {/* CTA overlay */}
          <div className="relative z-10 py-14 px-6 flex flex-col items-center text-center gap-5">
            <div className="w-14 h-14 rounded-2xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center">
              <svg className="w-6 h-6 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <div>
              <p className="text-lg font-bold text-white">Débloquez l&apos;analyse complète</p>
              <p className="text-sm text-zinc-400 mt-1.5 max-w-sm leading-relaxed">
                Breakdown des 3 piliers, signaux d&apos;achat/vente, métriques fondamentales, indicateurs techniques.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs">
              <Link
                href="/login?mode=signup"
                className="flex-1 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 transition-colors text-sm font-bold text-white text-center shadow-lg shadow-indigo-500/20"
              >
                Créer un compte gratuit
              </Link>
              <Link
                href="/login"
                className="flex-1 py-3 rounded-xl border border-white/[0.1] text-sm text-zinc-400 hover:text-white hover:bg-white/[0.04] transition-colors text-center"
              >
                Se connecter
              </Link>
            </div>
            <p className="text-xs text-zinc-600">Gratuit · 5 analyses/jour · Sans carte bancaire</p>
          </div>
        </div>
      </main>
    </div>
  )
}

// ── Freemium ──────────────────────────────────────────────────────────────────

const DAILY_LIMIT = 5
const LEMON_URL = process.env.NEXT_PUBLIC_LEMON_CHECKOUT_URL || '/pricing'

function PaywallBlock({
  ticker, companyName, score, scoreLabel, email, userId,
}: {
  ticker: string; companyName: string | null; score: number; scoreLabel: string | null
  email: string; userId: string
}) {
  const checkoutUrl = LEMON_URL !== '/pricing'
    ? `${LEMON_URL}?checkout[email]=${encodeURIComponent(email)}&checkout[custom][user_id]=${userId}`
    : '/pricing'

  return (
    <div className="min-h-screen bg-[#0f0f1a] text-white flex flex-col">
      <AppNav activePath="" />
      <main className="flex-1 flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-md text-center space-y-6">
          {/* Ticker preview */}
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.015] p-6">
            <div className="flex items-center justify-center gap-3 mb-4">
              <h2 className="text-xl font-bold">{companyName || ticker}</h2>
              <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-white/[0.06] text-zinc-400">{ticker}</span>
            </div>
            {/* Blurred score */}
            <div className="relative inline-flex flex-col items-center justify-center w-24 h-24 rounded-2xl border border-white/[0.06] bg-white/[0.02] mb-4">
              <span className="text-4xl font-black tabular-nums text-zinc-300 blur-sm select-none">{score}</span>
              <span className="text-[10px] uppercase tracking-wider text-zinc-600 mt-0.5">{scoreLabel || 'Score'}</span>
              <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-[#0f0f1a]/60">
                <span className="text-2xl">🔒</span>
              </div>
            </div>
            <p className="text-sm text-zinc-500">Analyse complète verrouillée</p>
          </div>

          {/* Limit message */}
          <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-5">
            <p className="text-amber-300 font-semibold mb-1">Limite journalière atteinte</p>
            <p className="text-sm text-zinc-400">
              Tu as utilisé tes <strong className="text-white">{DAILY_LIMIT} analyses gratuites</strong> aujourd&apos;hui.
              Le compteur se remet à zéro à minuit UTC.
            </p>
          </div>

          {/* CTA */}
          <div className="space-y-3">
            <a
              href={checkoutUrl}
              className="block w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 transition-colors text-sm font-bold text-white shadow-lg shadow-indigo-500/20"
            >
              Passer à Premium — 9 €/mois
            </a>
            <Link
              href="/dashboard"
              className="block w-full py-3 rounded-xl border border-white/[0.08] text-sm text-zinc-400 hover:text-white hover:bg-white/[0.04] transition-colors"
            >
              Retour au screener
            </Link>
          </div>

          <p className="text-xs text-zinc-700">
            Premium = analyses illimitées · sans engagement
          </p>
        </div>
      </main>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default async function TickerPage({ params }: { params: Promise<{ symbol: string }> }) {
  const { symbol } = await params
  const ticker = symbol.toUpperCase()

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const today = new Date().toISOString().slice(0, 10)

  // Fetch ticker data (needed for both auth and guest)
  const { data: tickerData, error: tickerError } = await supabase
    .from('ticker_scores').select('*').eq('ticker', ticker).single()

  if (tickerError || !tickerData) notFound()

  // Non-authenticated: show teaser
  if (!user) {
    return <TeaserBlock ticker={ticker} row={tickerData as TickerScore} />
  }

  const [{ data, error }, inWatchlistResult, historyResult, profileResult] = await Promise.all([
    Promise.resolve({ data: tickerData, error: null }),
    (async () => {
      try {
        const { data: wl } = await supabase.from('watchlists').select('id').eq('user_id', user.id).maybeSingle()
        if (!wl) return false
        const { data: item } = await supabase.from('watchlist_tickers').select('id')
          .eq('watchlist_id', wl.id).eq('ticker', ticker).maybeSingle()
        return !!item
      } catch { return false }
    })(),
    supabase.from('score_history').select('score, confidence, scored_at')
      .eq('ticker', ticker).order('scored_at', { ascending: true }).limit(30),
    supabase.from('profiles')
      .select('is_premium, analyses_today, last_analysis_date')
      .eq('id', user.id)
      .maybeSingle(),
  ])

  if (error || !data) notFound()

  // ── Freemium gate ──
  const profile = profileResult.data
  const isPremium = profile?.is_premium ?? false
  const isToday = profile?.last_analysis_date === today
  const usedToday = isToday ? (profile?.analyses_today ?? 0) : 0

  if (!isPremium && usedToday >= DAILY_LIMIT) {
    const row = data as TickerScore
    return (
      <PaywallBlock
        ticker={ticker}
        companyName={row.company_name}
        score={row.score_total}
        scoreLabel={row.score_label}
        email={user.email ?? ''}
        userId={user.id}
      />
    )
  }

  // Incrémenter le compteur (utilisateur free seulement)
  if (!isPremium) {
    await supabase.from('profiles').upsert({
      id: user.id,
      analyses_today: usedToday + 1,
      last_analysis_date: today,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'id' })
  }

  const remaining = isPremium ? null : DAILY_LIMIT - usedToday - 1

  const row = data as TickerScore
  const fin = row.financials
  const mkt = row.market_data
  const imp = row.importance_items || []
  const history = (historyResult.data || []) as ScoreHistory[]
  const cur = mkt?.current_price
  const cur52 = n(mkt?.fifty_two_week_low) && n(mkt?.fifty_two_week_high) && n(cur)

  const posFactors = imp.filter(i => i.direction === 'positive').slice(0, 3)
  const negFactors = imp.filter(i => i.direction === 'negative').slice(0, 3)
  const currency = row.currency || ''

  // Snapshot pills
  const snapPills = [
    n(fin?.ebit_margin) && { label: 'Marge EBIT', value: `${fin!.ebit_margin!.toFixed(1)}%`, color: fin!.ebit_margin! >= 15 ? 'text-emerald-400' : fin!.ebit_margin! < 5 ? 'text-rose-400' : 'text-zinc-200' },
    n(fin?.roe) && { label: 'ROE', value: `${fin!.roe!.toFixed(1)}%`, color: fin!.roe! >= 15 ? 'text-emerald-400' : fin!.roe! < 5 ? 'text-rose-400' : 'text-zinc-200' },
    n(fin?.fcf_yield_ttm) && { label: 'FCF Yield', value: `${fin!.fcf_yield_ttm!.toFixed(1)}%`, color: fin!.fcf_yield_ttm! >= 6 ? 'text-emerald-400' : fin!.fcf_yield_ttm! < 1 ? 'text-rose-400' : 'text-zinc-200' },
    n(fin?.pe_ttm) && fin!.pe_ttm! > 0 && { label: 'P/E', value: `${fin!.pe_ttm!.toFixed(1)}`, color: fin!.pe_ttm! <= 15 ? 'text-emerald-400' : fin!.pe_ttm! >= 50 ? 'text-rose-400' : 'text-zinc-200' },
    n(fin?.net_debt_to_ebitda) && { label: 'Dette/EBITDA', value: `${fin!.net_debt_to_ebitda!.toFixed(1)}x`, color: fin!.net_debt_to_ebitda! < 1 ? 'text-emerald-400' : fin!.net_debt_to_ebitda! > 3 ? 'text-rose-400' : 'text-zinc-200' },
  ].filter(Boolean) as { label: string; value: string; color: string }[]

  return (
    <div className="min-h-screen bg-[#0f0f1a] text-white">
      <AppNav activePath="" />

      <main className="max-w-5xl mx-auto px-6 py-8 space-y-6">
        {/* Back */}
        <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-white transition-colors">
          <span>←</span> Screener
        </Link>

        {/* ── Header ── */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-1 flex-wrap">
              <h1 className="text-2xl font-bold truncate">{row.company_name || ticker}</h1>
              <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-white/[0.06] text-zinc-300 shrink-0">{ticker}</span>
              <WatchlistButton ticker={ticker} initialInWatchlist={inWatchlistResult} size="lg" />
            </div>
            <div className="flex items-center gap-2 text-sm text-zinc-500 flex-wrap">
              {row.sector && <span>{row.sector}</span>}
              {row.sector && row.exchange && <span>·</span>}
              {row.exchange && <span>{row.exchange}</span>}
              {row.market_cap && <><span>·</span><span>{fmtCap(row.market_cap)} {currency}</span></>}
            </div>
            {row.one_liner && (
              <p className="mt-2 text-sm text-zinc-400 max-w-lg italic">&ldquo;{row.one_liner}&rdquo;</p>
            )}
            {row.moat_tags && row.moat_tags.length > 0 && (
              <div className="flex gap-1.5 mt-2 flex-wrap">
                {row.moat_tags.map(tag => (
                  <span key={tag} className="px-2 py-0.5 rounded-full text-xs bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">{tag}</span>
                ))}
              </div>
            )}
          </div>
          {/* Score badge */}
          <div className={`flex flex-col items-center justify-center w-24 h-24 rounded-2xl border ${scoreBgBorder(row.score_total)} shrink-0`}>
            <span className={`text-4xl font-black tabular-nums ${scoreTwColor(row.score_total)}`}>{row.score_total}</span>
            <span className="text-[10px] uppercase tracking-wider text-zinc-500 mt-0.5">{row.score_label || 'Score'}</span>
          </div>
        </div>

        {/* ── Snapshot bar ── */}
        <div className={`rounded-xl border p-4 flex flex-wrap gap-x-6 gap-y-3 items-center ${scoreBgBorder(row.score_total)}`}>
          {/* Price */}
          {n(cur) && (
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold tabular-nums">{cur.toFixed(2)}</span>
              <span className="text-zinc-500 text-sm">{currency}</span>
              {n(mkt?.change_pct) && (
                <span className={`text-sm font-semibold tabular-nums ${mkt!.change_pct! >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {fmtSign(mkt!.change_pct!, '%')}
                </span>
              )}
            </div>
          )}
          {snapPills.length > 0 && <div className="w-px h-6 bg-white/[0.08] shrink-0 hidden sm:block" />}
          {snapPills.map(p => (
            <div key={p.label} className="flex flex-col items-center">
              <span className="text-[0.6rem] uppercase tracking-wider text-zinc-600">{p.label}</span>
              <span className={`text-sm font-bold tabular-nums ${p.color}`}>{p.value}</span>
            </div>
          ))}
          <div className="ml-auto flex flex-col items-end gap-1">
            {(() => {
              const { label, stale } = timeAgo(row.computed_at)
              return (
                <span className={`text-[0.65rem] font-medium ${stale ? 'text-rose-500' : 'text-zinc-600'}`}
                  title={row.computed_at ?? ''}>
                  {stale ? '⚠ ' : ''}Mis à jour il y a {label}
                </span>
              )
            })()}
            {remaining !== null && (
              <span className={`text-[0.65rem] font-semibold tabular-nums ${remaining === 0 ? 'text-amber-400' : 'text-zinc-500'}`}>
                {remaining === 0 ? 'Dernière analyse gratuite utilisée' : `${remaining} analyse${remaining > 1 ? 's' : ''} gratuite${remaining > 1 ? 's' : ''} restante${remaining > 1 ? 's' : ''}`}
              </span>
            )}
          </div>
        </div>

        {/* ── Positive / Negative factor breakdown ── */}
        {(posFactors.length > 0 || negFactors.length > 0) && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.015] p-4">
              <div className="text-[0.6rem] font-bold uppercase tracking-widest text-zinc-500 mb-3">Ce qui tire le score ▲</div>
              {posFactors.length > 0 ? posFactors.map((f, i) => (
                <div key={i} className="flex items-start gap-2 py-2 border-b border-white/[0.04] last:border-0">
                  <span className="text-emerald-400 font-black text-xs mt-0.5 shrink-0">+</span>
                  <div>
                    <div className="text-sm font-semibold text-white leading-tight">{f.label}</div>
                    {f.why && <div className="text-xs text-zinc-500 mt-0.5">{f.why}</div>}
                  </div>
                </div>
              )) : <p className="text-xs text-zinc-600">Aucun facteur positif identifié.</p>}
            </div>
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.015] p-4">
              <div className="text-[0.6rem] font-bold uppercase tracking-widest text-zinc-500 mb-3">Ce qui pèse sur le score ▼</div>
              {negFactors.length > 0 ? negFactors.map((f, i) => (
                <div key={i} className="flex items-start gap-2 py-2 border-b border-white/[0.04] last:border-0">
                  <span className="text-rose-400 font-black text-xs mt-0.5 shrink-0">−</span>
                  <div>
                    <div className="text-sm font-semibold text-white leading-tight">{f.label}</div>
                    {f.why && <div className="text-xs text-zinc-500 mt-0.5">{f.why}</div>}
                  </div>
                </div>
              )) : <p className="text-xs text-zinc-600">Aucun facteur négatif identifié.</p>}
            </div>
          </div>
        )}

        {/* ── Main grid ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

          {/* Score + gauge + history */}
          <SectionCard title="⚡ Score AlphaBrief">
            <div className="flex flex-col items-center mb-4">
              <ScoreGauge score={row.score_total} label={row.score_label} />
            </div>
            <div className="space-y-3 mb-4">
              <PillarBar label="Fondamentaux" score={row.score_fundamentals} />
              <PillarBar label="Techniques" score={row.score_technicals} />
              <PillarBar label="Momentum" score={row.score_momentum} />
            </div>
            {imp.length > 0 && (
              <div>
                <div className="text-[0.6rem] font-bold uppercase tracking-widest text-zinc-600 mb-2">Facteurs clés</div>
                <div className="space-y-2">
                  {imp.slice(0, 5).map((item, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <span className={`text-sm shrink-0 mt-0.5 ${item.direction === 'positive' ? 'text-emerald-400' : item.direction === 'negative' ? 'text-rose-400' : 'text-zinc-500'}`}>
                        {item.direction === 'positive' ? '↑' : item.direction === 'negative' ? '↓' : '→'}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-medium text-white truncate">{item.label}</span>
                          <div className="w-12 h-1 rounded-full bg-white/[0.06] shrink-0 overflow-hidden">
                            <div className={`h-full rounded-full ${item.direction === 'positive' ? 'bg-emerald-500' : item.direction === 'negative' ? 'bg-rose-500' : 'bg-zinc-500'}`}
                              style={{ width: `${Math.min(100, ((item.importance ?? 5) / 10) * 100)}%` }} />
                          </div>
                        </div>
                        {item.why && <p className="text-[0.6rem] text-zinc-600 mt-0.5 truncate">{item.why}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {history.length >= 2 && (
              <div className="mt-4">
                <div className="text-[0.6rem] font-bold uppercase tracking-widest text-zinc-600 mb-1">Évolution du score</div>
                <HistoryChart history={history} />
              </div>
            )}
          </SectionCard>

          {/* Signal Zone */}
          <SignalZoneSection fin={fin} mkt={mkt} />

          {/* Fondamentaux */}
          <SectionCard title="💼 Fondamentaux & Valorisation">
            {fin ? (
              <>
                <div>
                  <KVRow label="Marge EBIT" value={fmt(fin.ebit_margin, '%')}
                    color={n(fin.ebit_margin) ? (fin.ebit_margin! >= 15 ? 'text-emerald-400' : fin.ebit_margin! < 5 ? 'text-rose-400' : 'text-white') : 'text-zinc-500'} />
                  {n(fin.ebit_margin) && <KVBar value={fin.ebit_margin!} max={40} color={fin.ebit_margin! >= 15 ? 'bg-emerald-500' : fin.ebit_margin! >= 5 ? 'bg-amber-500' : 'bg-rose-500'} />}
                  <KVRow label="CAGR Revenus 3a" value={fmt(fin.revenue_cagr_3y, '%')}
                    color={n(fin.revenue_cagr_3y) ? (fin.revenue_cagr_3y! >= 10 ? 'text-emerald-400' : fin.revenue_cagr_3y! < 0 ? 'text-rose-400' : 'text-white') : 'text-zinc-500'} />
                  {n(fin.revenue_cagr_3y) && <KVBar value={Math.max(0, fin.revenue_cagr_3y! + 10)} max={50} color={fin.revenue_cagr_3y! >= 10 ? 'bg-emerald-500' : fin.revenue_cagr_3y! >= 0 ? 'bg-amber-500' : 'bg-rose-500'} />}
                  <KVRow label="ROE" value={fmt(fin.roe, '%')}
                    color={n(fin.roe) ? (fin.roe! >= 15 ? 'text-emerald-400' : fin.roe! < 5 ? 'text-rose-400' : 'text-white') : 'text-zinc-500'} />
                  {n(fin.roe) && <KVBar value={fin.roe!} max={50} color={fin.roe! >= 25 ? 'bg-emerald-500' : fin.roe! >= 15 ? 'bg-indigo-500' : fin.roe! >= 5 ? 'bg-amber-500' : 'bg-rose-500'} />}
                  <KVRow label="FCF Yield" value={fmt(fin.fcf_yield_ttm, '%')}
                    color={n(fin.fcf_yield_ttm) ? (fin.fcf_yield_ttm! >= 6 ? 'text-emerald-400' : fin.fcf_yield_ttm! < 1 ? 'text-rose-400' : 'text-white') : 'text-zinc-500'} />
                  {n(fin.fcf_yield_ttm) && <KVBar value={fin.fcf_yield_ttm!} max={15} color={fin.fcf_yield_ttm! >= 6 ? 'bg-emerald-500' : fin.fcf_yield_ttm! >= 1 ? 'bg-amber-500' : 'bg-rose-500'} />}
                  <KVRow label="FCF Margin" value={fmt(fin.fcf_margin, '%')}
                    color={n(fin.fcf_margin) ? (fin.fcf_margin! >= 10 ? 'text-emerald-400' : fin.fcf_margin! < 3 ? 'text-rose-400' : 'text-white') : 'text-zinc-500'} />
                  <KVRow label="Marge brute" value={fmt(fin.gross_margin, '%')} />
                  <KVRow label="ROIC" value={fmt(fin.roic, '%')} />
                </div>
                <div className="pt-2 mt-2 border-t border-white/[0.04]">
                  <KVRow label="P/E (TTM)" value={fmt(fin.pe_ttm)}
                    color={n(fin.pe_ttm) && fin.pe_ttm! > 0 ? (fin.pe_ttm! <= 15 ? 'text-emerald-400' : fin.pe_ttm! >= 50 ? 'text-rose-400' : 'text-white') : 'text-zinc-500'} />
                  <KVRow label="EV/EBITDA" value={fmt(fin.ev_ebitda_ttm, 'x')}
                    color={n(fin.ev_ebitda_ttm) && fin.ev_ebitda_ttm! > 0 ? (fin.ev_ebitda_ttm! <= 8 ? 'text-emerald-400' : fin.ev_ebitda_ttm! >= 20 ? 'text-rose-400' : 'text-white') : 'text-zinc-500'} />
                  <KVRow label="P/B" value={fmt(fin.pb_ratio, 'x')}
                    color={n(fin.pb_ratio) && fin.pb_ratio! > 0 ? (fin.pb_ratio! <= 1.5 ? 'text-emerald-400' : fin.pb_ratio! >= 8 ? 'text-rose-400' : 'text-white') : 'text-zinc-500'} />
                </div>
              </>
            ) : <p className="text-sm text-zinc-600">Données non disponibles.</p>}
          </SectionCard>

          {/* Risque */}
          <SectionCard title="⚠️ Risque & Solidité">
            {(fin || mkt) ? (
              <>
                {n(fin?.net_debt_to_ebitda) && (
                  <div className="flex items-center justify-between py-2 border-b border-white/[0.04]">
                    <span className="text-sm text-zinc-400">Net Debt / EBITDA</span>
                    <div className="flex items-center">
                      <span className={`text-sm font-semibold tabular-nums ${fin!.net_debt_to_ebitda! < 1 ? 'text-emerald-400' : fin!.net_debt_to_ebitda! > 3 ? 'text-rose-400' : 'text-white'}`}>
                        {fin!.net_debt_to_ebitda!.toFixed(1)}x
                      </span>
                      <DebtTag ratio={fin!.net_debt_to_ebitda!} />
                    </div>
                  </div>
                )}
                <KVRow label="FCF Margin" value={fmt(fin?.fcf_margin, '%')}
                  color={n(fin?.fcf_margin) ? (fin!.fcf_margin! >= 10 ? 'text-emerald-400' : fin!.fcf_margin! < 3 ? 'text-rose-400' : 'text-white') : 'text-zinc-500'} />
                {n(mkt?.beta) && (
                  <div className="flex items-center justify-between py-2 border-b border-white/[0.04]">
                    <span className="text-sm text-zinc-400">Beta</span>
                    <div className="flex items-center">
                      <span className="text-sm font-semibold tabular-nums text-white">{mkt!.beta!.toFixed(2)}</span>
                      <BetaTag beta={mkt!.beta!} />
                    </div>
                  </div>
                )}
                {n(mkt?.dividend_yield) && mkt!.dividend_yield! > 0 && (
                  <KVRow label="Rendement dividende" value={`${(mkt!.dividend_yield! * 100).toFixed(2)}%`} />
                )}
                <KVRow label="ROE" value={fmt(fin?.roe, '%')}
                  color={n(fin?.roe) ? (fin!.roe! >= 15 ? 'text-emerald-400' : fin!.roe! < 5 ? 'text-rose-400' : 'text-white') : 'text-zinc-500'} />
                <KVRow label="Marge EBIT" value={fmt(fin?.ebit_margin, '%')}
                  color={n(fin?.ebit_margin) ? (fin!.ebit_margin! >= 15 ? 'text-emerald-400' : fin!.ebit_margin! < 5 ? 'text-rose-400' : 'text-white') : 'text-zinc-500'} />
              </>
            ) : <p className="text-sm text-zinc-600">Données non disponibles.</p>}
          </SectionCard>

          {/* Techniques */}
          <SectionCard title="📊 Indicateurs Techniques">
            {mkt ? (
              <>
                {n(mkt.rsi_14) && (
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-zinc-400">RSI (14)</span>
                      <span className={`text-sm font-bold tabular-nums ${mkt.rsi_14! > 70 ? 'text-rose-400' : mkt.rsi_14! < 30 ? 'text-emerald-400' : 'text-white'}`}>
                        {mkt.rsi_14!.toFixed(1)}
                      </span>
                    </div>
                    <RSIVisual rsi={mkt.rsi_14!} />
                  </div>
                )}
                <KVRow label="SMA 50" value={fmt(mkt.sma_50, '', 2)} />
                <KVRow label="SMA 200" value={fmt(mkt.sma_200, '', 2)} />
                <KVRow label="Beta" value={fmt(mkt.beta, '', 2)} />
                <div className="mt-3 pt-3 border-t border-white/[0.04]">
                  <div className="text-[0.6rem] font-bold uppercase tracking-widest text-zinc-600 mb-2">Momentum</div>
                  <div className="grid grid-cols-2 gap-2">
                    {([['1m', mkt.momentum_1m], ['3m', mkt.momentum_3m], ['6m', mkt.momentum_6m], ['12m', mkt.momentum_12m]] as [string, number | null][]).map(([period, val]) => (
                      <div key={period} className="flex items-center justify-between px-2 py-1.5 rounded-lg bg-white/[0.02]">
                        <span className="text-xs text-zinc-500">{period}</span>
                        <span className={`text-xs font-bold tabular-nums ${n(val) ? (val > 0 ? 'text-emerald-400' : 'text-rose-400') : 'text-zinc-600'}`}>
                          {n(val) ? fmtSign(val, '%') : '—'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : <p className="text-sm text-zinc-600">Données non disponibles.</p>}
          </SectionCard>

          {/* Marché */}
          <SectionCard title="📈 Marché">
            {mkt ? (
              <>
                {n(cur) && (
                  <div className="flex items-baseline gap-2 mb-4">
                    <span className="text-2xl font-bold tabular-nums">{cur.toFixed(2)}</span>
                    <span className="text-zinc-500">{currency}</span>
                    {n(mkt.change_pct) && (
                      <span className={`text-sm font-semibold ${mkt.change_pct! >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {fmtSign(mkt.change_pct!, '%')}
                      </span>
                    )}
                  </div>
                )}
                <KVRow label="Clôture précédente" value={fmt(mkt.previous_close, '', 2)} />
                <KVRow label="Volume" value={fmtVol(mkt.volume)} />
                <KVRow label="Volume moy. 3m" value={fmtVol(mkt.avg_volume_3m)} />
                <KVRow label="Beta" value={fmt(mkt.beta, '', 2)} />
                {n(mkt.analyst_target_mean) && (
                  <KVRow label="Target analystes" value={`${mkt.analyst_target_mean!.toFixed(2)} ${currency}`} />
                )}
                {mkt.analyst_recommendation && (
                  <KVRow label="Recommandation" value={mkt.analyst_recommendation} />
                )}
                {cur52 && (
                  <div className="mt-4">
                    <div className="text-xs text-zinc-500 mb-1">Range 52 semaines</div>
                    <RangeBar low={mkt.fifty_two_week_low!} high={mkt.fifty_two_week_high!} current={cur!} currency={currency} />
                  </div>
                )}
              </>
            ) : <p className="text-sm text-zinc-600">Données non disponibles.</p>}
          </SectionCard>

          {/* Price Levels */}
          <PriceLevelsSection fin={fin} mkt={mkt} currency={currency} />

          {/* Identité */}
          <SectionCard title="Identité">
            <KVRow label="Secteur" value={row.sector || '—'} />
            <KVRow label="Bourse" value={row.exchange || '—'} />
            <KVRow label="Devise" value={currency || '—'} />
            <KVRow label="Capitalisation" value={row.market_cap ? `${fmtCap(row.market_cap)} ${currency}` : '—'} />
            <KVRow label="Score date" value={row.score_date} />
            <KVRow label="Calculé le" value={row.computed_at ? row.computed_at.slice(0, 16).replace('T', ' ') : '—'} />
          </SectionCard>

        </div>

        <p className="text-xs text-zinc-700 text-center pb-4">
          Données au {row.score_date} · AlphaBrief est un outil d&apos;aide à la décision — pas du conseil financier.
        </p>
      </main>
    </div>
  )
}

import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import AppNav from '@/components/AppNav'
import CompareSelects from './CompareSelects'

type Financials = {
  revenue_cagr_3y?: number | null
  ebit_margin?: number | null
  gross_margin?: number | null
  fcf_margin?: number | null
  roe?: number | null
  roic?: number | null
  net_debt_to_ebitda?: number | null
  pe_ttm?: number | null
  ev_ebitda_ttm?: number | null
  fcf_yield_ttm?: number | null
  pb_ratio?: number | null
}

type MarketData = {
  momentum_12m?: number | null
  momentum_3m?: number | null
  dividend_yield?: number | null
  beta?: number | null
  analyst_target_mean?: number | null
  rsi_14?: number | null
}

type Row = {
  ticker: string
  company_name: string | null
  sector: string | null
  score_total: number
  score_label: string | null
  financials: Financials | null
  market_data: MarketData | null
}

type MetricDef = {
  label: string
  section?: string
  get: (r: Row) => number | null | undefined
  higherBetter: boolean | null
  decimals: number
  suffix: string
}

const METRICS: MetricDef[] = [
  // Score
  { label: 'Score potentiel', section: 'Score', get: r => r.score_total, higherBetter: true, decimals: 0, suffix: '' },
  // Qualité
  { label: 'Marge brute', section: 'Qualité', get: r => r.financials?.gross_margin, higherBetter: true, decimals: 1, suffix: '%' },
  { label: 'Marge EBIT', get: r => r.financials?.ebit_margin, higherBetter: true, decimals: 1, suffix: '%' },
  { label: 'Marge FCF', get: r => r.financials?.fcf_margin, higherBetter: true, decimals: 1, suffix: '%' },
  { label: 'ROE', get: r => r.financials?.roe, higherBetter: true, decimals: 1, suffix: '%' },
  { label: 'ROIC', get: r => r.financials?.roic, higherBetter: true, decimals: 1, suffix: '%' },
  { label: 'Dette nette / EBITDA', get: r => r.financials?.net_debt_to_ebitda, higherBetter: false, decimals: 2, suffix: 'x' },
  // Croissance
  { label: 'Rev CAGR 3Y', section: 'Croissance', get: r => r.financials?.revenue_cagr_3y, higherBetter: true, decimals: 1, suffix: '%' },
  // Valorisation
  { label: 'P/E TTM', section: 'Valorisation', get: r => r.financials?.pe_ttm, higherBetter: false, decimals: 1, suffix: 'x' },
  { label: 'EV/EBITDA', get: r => r.financials?.ev_ebitda_ttm, higherBetter: false, decimals: 1, suffix: 'x' },
  { label: 'FCF Yield TTM', get: r => r.financials?.fcf_yield_ttm, higherBetter: true, decimals: 1, suffix: '%' },
  { label: 'P/B Ratio', get: r => r.financials?.pb_ratio, higherBetter: false, decimals: 2, suffix: 'x' },
  // Marché
  { label: 'Momentum 12M', section: 'Marché', get: r => r.market_data?.momentum_12m, higherBetter: true, decimals: 1, suffix: '%' },
  { label: 'Momentum 3M', get: r => r.market_data?.momentum_3m, higherBetter: true, decimals: 1, suffix: '%' },
  { label: 'Dividend Yield', get: r => r.market_data?.dividend_yield, higherBetter: true, decimals: 2, suffix: '%' },
  { label: 'Beta', get: r => r.market_data?.beta, higherBetter: false, decimals: 2, suffix: '' },
  { label: 'Cible analystes', get: r => r.market_data?.analyst_target_mean, higherBetter: true, decimals: 2, suffix: '' },
  // Technique
  { label: 'RSI 14', section: 'Technique', get: r => r.market_data?.rsi_14, higherBetter: null, decimals: 1, suffix: '' },
]

function fmt(v: number | null | undefined, decimals: number, suffix: string): string {
  if (v == null) return '—'
  return `${v.toFixed(decimals)}${suffix}`
}

function winner(a: number | null | undefined, b: number | null | undefined, higherBetter: boolean | null): [boolean, boolean] {
  if (higherBetter === null || a == null || b == null || a === b) return [false, false]
  return higherBetter ? [a > b, a < b] : [a < b, a > b]
}

function scoreColor(s: number) {
  if (s >= 75) return 'text-emerald-400'
  if (s >= 60) return 'text-indigo-400'
  if (s >= 45) return 'text-amber-400'
  return 'text-rose-400'
}

export default async function ComparePage({
  searchParams,
}: {
  searchParams: Promise<{ a?: string; b?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const params = await searchParams
  const tickerA = (params.a ?? '').toUpperCase().trim()
  const tickerB = (params.b ?? '').toUpperCase().trim()

  // All available tickers
  const { data: allRows } = await supabase
    .from('ticker_scores')
    .select('ticker,company_name,sector,score_total,score_label,financials,market_data')
    .order('score_total', { ascending: false })

  const tickers = (allRows ?? []).map(r => r.ticker as string)
  const rowMap = Object.fromEntries((allRows ?? []).map(r => [r.ticker, r as Row]))

  const rowA = tickerA ? rowMap[tickerA] ?? null : null
  const rowB = tickerB ? rowMap[tickerB] ?? null : null

  // Build comparison rows
  const compRows = METRICS.map(m => {
    const vA = rowA ? m.get(rowA) : undefined
    const vB = rowB ? m.get(rowB) : undefined
    const [winA, winB] = winner(vA, vB, m.higherBetter)
    return {
      label: m.label,
      section: m.section,
      valA: fmt(vA, m.decimals, m.suffix),
      valB: fmt(vB, m.decimals, m.suffix),
      winA,
      winB,
      missingA: vA == null,
      missingB: vB == null,
      rawA: vA,
      rawB: vB,
    }
  })

  const winsA = compRows.filter(r => r.winA).length
  const winsB = compRows.filter(r => r.winB).length

  return (
    <div className="min-h-screen bg-[#0f0f1a] text-white">
      <AppNav activePath="/compare" />
      <main className="max-w-4xl mx-auto px-6 py-10">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-xl font-bold mb-1">Comparaison côte à côte</h1>
          <p className="text-sm text-zinc-500">Sélectionnez deux actions pour les comparer sur tous les critères.</p>
        </div>

        {/* Selects */}
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-5 mb-8">
          <CompareSelects tickers={tickers} a={tickerA} b={tickerB} />
        </div>

        {/* No selection */}
        {(!tickerA || !tickerB) && (
          <div className="text-center py-20 text-zinc-500">
            <p className="text-lg font-medium mb-2">Choisissez deux tickers pour lancer la comparaison</p>
            <p className="text-sm">Les données viennent directement des scores calculés.</p>
          </div>
        )}

        {/* Missing data */}
        {tickerA && tickerB && (!rowA || !rowB) && (
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-5 text-amber-400 text-sm">
            {!rowA && <p>Aucune donnée pour <strong>{tickerA}</strong>.</p>}
            {!rowB && <p>Aucune donnée pour <strong>{tickerB}</strong>.</p>}
            <p className="mt-2 text-zinc-400">Lancez <code className="text-indigo-400">python -m core.cli analyze {tickerA || tickerB}</code> pour scorer ce ticker.</p>
          </div>
        )}

        {/* Comparison table */}
        {rowA && rowB && (
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <colgroup>
                <col className="w-[45%]" />
                <col className="w-[27.5%]" />
                <col className="w-[27.5%]" />
              </colgroup>
              <thead>
                <tr className="border-b border-white/[0.06]">
                  <th className="px-5 py-3 text-left"></th>
                  {/* Ticker A */}
                  <th className="px-5 py-4 text-center border-l border-white/[0.06]">
                    <Link href={`/ticker/${tickerA}`} className="text-base font-bold text-white hover:text-indigo-400 transition-colors">
                      {tickerA}
                    </Link>
                    <p className="text-xs text-zinc-500 font-normal mt-0.5 truncate">{rowA.company_name}</p>
                    <p className="text-[0.65rem] text-zinc-600 font-normal">{rowA.sector || '—'}</p>
                  </th>
                  {/* Ticker B */}
                  <th className="px-5 py-4 text-center border-l border-white/[0.06]">
                    <Link href={`/ticker/${tickerB}`} className="text-base font-bold text-white hover:text-indigo-400 transition-colors">
                      {tickerB}
                    </Link>
                    <p className="text-xs text-zinc-500 font-normal mt-0.5 truncate">{rowB.company_name}</p>
                    <p className="text-[0.65rem] text-zinc-600 font-normal">{rowB.sector || '—'}</p>
                  </th>
                </tr>
                {/* Wins row */}
                <tr className="bg-white/[0.02] border-b border-white/[0.06]">
                  <td className="px-5 py-2 text-[0.65rem] font-bold uppercase tracking-wide text-zinc-500">Avantages</td>
                  <td className={`px-5 py-2 text-center font-bold border-l border-white/[0.06] ${winsA > winsB ? 'text-emerald-400' : 'text-zinc-400'}`}>
                    {winsA} / {compRows.filter(r => r.winA || r.winB).length}
                  </td>
                  <td className={`px-5 py-2 text-center font-bold border-l border-white/[0.06] ${winsB > winsA ? 'text-emerald-400' : 'text-zinc-400'}`}>
                    {winsB} / {compRows.filter(r => r.winA || r.winB).length}
                  </td>
                </tr>
              </thead>
              <tbody>
                {compRows.map((row, i) => (
                  <>
                    {row.section && (
                      <tr key={`sec-${i}`} className="bg-white/[0.03] border-t border-white/[0.06]">
                        <td colSpan={3} className="px-5 py-2 text-[0.65rem] font-bold uppercase tracking-wider text-zinc-500">
                          {row.section}
                        </td>
                      </tr>
                    )}
                    <tr
                      key={row.label}
                      className={`border-t border-white/[0.04] transition-colors ${
                        row.winA ? 'bg-emerald-500/[0.04]' : row.winB ? 'bg-indigo-500/[0.03]' : ''
                      }`}
                    >
                      <td className="px-5 py-2.5 text-zinc-400">{row.label}</td>
                      <td className={`px-5 py-2.5 text-center border-l border-white/[0.06] font-mono tabular-nums ${
                        row.winA ? 'text-emerald-400 font-semibold' : row.missingA ? 'text-zinc-600' : 'text-zinc-300'
                      }`}>
                        {row.valA}
                        {row.winA && <span className="ml-1.5 text-emerald-500 text-xs">+</span>}
                      </td>
                      <td className={`px-5 py-2.5 text-center border-l border-white/[0.06] font-mono tabular-nums ${
                        row.winB ? 'text-emerald-400 font-semibold' : row.missingB ? 'text-zinc-600' : 'text-zinc-300'
                      }`}>
                        {row.valB}
                        {row.winB && <span className="ml-1.5 text-emerald-500 text-xs">+</span>}
                      </td>
                    </tr>
                  </>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Score summary bar */}
        {rowA && rowB && (
          <div className="mt-4 flex items-center gap-4 text-sm text-zinc-500">
            <span>Score : <span className={`font-bold ${scoreColor(rowA.score_total)}`}>{rowA.score_total}/100</span> ({rowA.score_label})</span>
            <span className="text-zinc-700">vs</span>
            <span>Score : <span className={`font-bold ${scoreColor(rowB.score_total)}`}>{rowB.score_total}/100</span> ({rowB.score_label})</span>
          </div>
        )}
      </main>
    </div>
  )
}

import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import AppNav from '@/components/AppNav'
import CompareSelects from './CompareSelects'
import RadarChart from '@/components/RadarChart'

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
  { label: 'Score potentiel', section: 'Score', get: r => r.score_total, higherBetter: true, decimals: 0, suffix: '' },
  { label: 'Marge brute', section: 'Qualité', get: r => r.financials?.gross_margin, higherBetter: true, decimals: 1, suffix: '%' },
  { label: 'Marge EBIT', get: r => r.financials?.ebit_margin, higherBetter: true, decimals: 1, suffix: '%' },
  { label: 'Marge FCF', get: r => r.financials?.fcf_margin, higherBetter: true, decimals: 1, suffix: '%' },
  { label: 'ROE', get: r => r.financials?.roe, higherBetter: true, decimals: 1, suffix: '%' },
  { label: 'ROIC', get: r => r.financials?.roic, higherBetter: true, decimals: 1, suffix: '%' },
  { label: 'Dette nette / EBITDA', get: r => r.financials?.net_debt_to_ebitda, higherBetter: false, decimals: 2, suffix: 'x' },
  { label: 'Rev CAGR 3Y', section: 'Croissance', get: r => r.financials?.revenue_cagr_3y, higherBetter: true, decimals: 1, suffix: '%' },
  { label: 'P/E TTM', section: 'Valorisation', get: r => r.financials?.pe_ttm, higherBetter: false, decimals: 1, suffix: 'x' },
  { label: 'EV/EBITDA', get: r => r.financials?.ev_ebitda_ttm, higherBetter: false, decimals: 1, suffix: 'x' },
  { label: 'FCF Yield TTM', get: r => r.financials?.fcf_yield_ttm, higherBetter: true, decimals: 1, suffix: '%' },
  { label: 'P/B Ratio', get: r => r.financials?.pb_ratio, higherBetter: false, decimals: 2, suffix: 'x' },
  { label: 'Momentum 12M', section: 'Marché', get: r => r.market_data?.momentum_12m, higherBetter: true, decimals: 1, suffix: '%' },
  { label: 'Momentum 3M', get: r => r.market_data?.momentum_3m, higherBetter: true, decimals: 1, suffix: '%' },
  { label: 'Dividend Yield', get: r => r.market_data?.dividend_yield, higherBetter: true, decimals: 2, suffix: '%' },
  { label: 'Beta', get: r => r.market_data?.beta, higherBetter: false, decimals: 2, suffix: '' },
  { label: 'Cible analystes', get: r => r.market_data?.analyst_target_mean, higherBetter: true, decimals: 2, suffix: '' },
  { label: 'RSI 14', section: 'Technique', get: r => r.market_data?.rsi_14, higherBetter: null, decimals: 1, suffix: '' },
]

const mono = 'var(--font-jetbrains-mono, monospace)'

function fmt(v: number | null | undefined, decimals: number, suffix: string): string {
  if (v == null) return '—'
  return `${v.toFixed(decimals)}${suffix}`
}

function winner(a: number | null | undefined, b: number | null | undefined, higherBetter: boolean | null): [boolean, boolean] {
  if (higherBetter === null || a == null || b == null || a === b) return [false, false]
  return higherBetter ? [a > b, a < b] : [a < b, a > b]
}

function scoreColor(s: number) {
  if (s >= 75) return 'text-[#7EE5A3]'
  if (s >= 60) return 'text-[#5AB983]'
  if (s >= 45) return 'text-[#E5A04E]'
  return 'text-[#D85F66]'
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

  const { data: allRows } = await supabase
    .from('ticker_scores')
    .select('ticker,company_name,sector,score_total,score_label,financials,market_data')
    .order('score_total', { ascending: false })

  const tickers = (allRows ?? []).map(r => r.ticker as string)
  const rowMap = Object.fromEntries((allRows ?? []).map(r => [r.ticker, r as Row]))

  const rowA = tickerA ? rowMap[tickerA] ?? null : null
  const rowB = tickerB ? rowMap[tickerB] ?? null : null

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
    }
  })

  const winsA = compRows.filter(r => r.winA).length
  const winsB = compRows.filter(r => r.winB).length

  return (
    <div className="min-h-screen bg-[#0A0F0C] text-[#F0EBDB]">
      <AppNav activePath="/compare" />
      <main className="max-w-4xl mx-auto px-6 py-12">

        <div className="mb-10">
          <p className="text-[10px] uppercase tracking-[0.22em] text-[#7EE5A3] mb-3" style={{ fontFamily: mono }}>
            § COMPARAISON
          </p>
          <h1 className="text-3xl"
            style={{ fontFamily: 'var(--font-fraunces, serif)', fontWeight: 500, letterSpacing: '-0.02em' }}>
            Deux titres, <span style={{ fontStyle: 'italic', color: '#7EE5A3' }}>côte à côte</span>.
          </h1>
          <p className="text-sm text-[#6D7A72] mt-2">Sélectionnez deux actions pour les comparer sur tous les critères.</p>
        </div>

        <div className="bg-[#0E1511] border border-[#1A2520] rounded-xl p-5 mb-8">
          <CompareSelects tickers={tickers} a={tickerA} b={tickerB} />
        </div>

        {(!tickerA || !tickerB) && (
          <div className="text-center py-20">
            <p className="font-medium mb-2 text-[#C6C0A9]"
              style={{ fontFamily: 'var(--font-fraunces, serif)', fontStyle: 'italic', fontSize: 17 }}>
              Choisissez deux tickers pour lancer la comparaison.
            </p>
            <p className="text-sm text-[#6D7A72]">Les données viennent directement des scores calculés.</p>
          </div>
        )}

        {tickerA && tickerB && (!rowA || !rowB) && (
          <div className="bg-[#E5A04E]/10 border border-[#E5A04E]/30 rounded-xl p-5 text-[#E5A04E] text-sm">
            {!rowA && <p>Aucune donnée pour <strong>{tickerA}</strong>.</p>}
            {!rowB && <p>Aucune donnée pour <strong>{tickerB}</strong>.</p>}
            <p className="mt-2 text-[#C6C0A9]">
              Lancez <code className="text-[#7EE5A3]" style={{ fontFamily: mono }}>python -m core.cli analyze {tickerA || tickerB}</code> pour scorer ce ticker.
            </p>
          </div>
        )}

        {rowA && rowB && (
          <div className="bg-[#0E1511] border border-[#1A2520] rounded-xl p-6 mb-6">
            <div className="flex items-baseline justify-between mb-4 flex-wrap gap-3">
              <p className="text-[10px] uppercase tracking-[0.22em] text-[#7EE5A3]"
                style={{ fontFamily: mono }}>
                § PROFIL COMPARÉ
              </p>
              <p className="text-[10px] uppercase tracking-[0.16em] text-[#4A6355]"
                style={{ fontFamily: mono }}>
                6 axes · plus haut = meilleur
              </p>
            </div>
            <RadarChart
              tickerA={tickerA}
              tickerB={tickerB}
              dataA={rowA}
              dataB={rowB}
            />
          </div>
        )}

        {rowA && rowB && (
          <div className="bg-[#0E1511] border border-[#1A2520] rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <colgroup>
                <col className="w-[45%]" />
                <col className="w-[27.5%]" />
                <col className="w-[27.5%]" />
              </colgroup>
              <thead>
                <tr className="border-b border-[#1A2520]">
                  <th className="px-5 py-3 text-left"></th>
                  <th className="px-5 py-4 text-center border-l border-[#1A2520]">
                    <Link href={`/ticker/${tickerA}`} className="text-base font-bold text-[#F0EBDB] hover:text-[#7EE5A3] transition-colors"
                      style={{ fontFamily: mono }}>
                      {tickerA}
                    </Link>
                    <p className="text-xs text-[#6D7A72] font-normal mt-0.5 truncate">{rowA.company_name}</p>
                    <p className="text-[10px] text-[#4A6355] font-normal uppercase tracking-[0.12em]" style={{ fontFamily: mono }}>{rowA.sector || '—'}</p>
                  </th>
                  <th className="px-5 py-4 text-center border-l border-[#1A2520]">
                    <Link href={`/ticker/${tickerB}`} className="text-base font-bold text-[#F0EBDB] hover:text-[#7EE5A3] transition-colors"
                      style={{ fontFamily: mono }}>
                      {tickerB}
                    </Link>
                    <p className="text-xs text-[#6D7A72] font-normal mt-0.5 truncate">{rowB.company_name}</p>
                    <p className="text-[10px] text-[#4A6355] font-normal uppercase tracking-[0.12em]" style={{ fontFamily: mono }}>{rowB.sector || '—'}</p>
                  </th>
                </tr>
                <tr className="bg-[#13201A]/50 border-b border-[#1A2520]">
                  <td className="px-5 py-2 text-[10px] uppercase tracking-[0.18em] text-[#6D7A72]" style={{ fontFamily: mono }}>Avantages</td>
                  <td className={`px-5 py-2 text-center font-bold border-l border-[#1A2520] tabular-nums ${winsA > winsB ? 'text-[#7EE5A3]' : 'text-[#C6C0A9]'}`} style={{ fontFamily: mono }}>
                    {winsA} / {compRows.filter(r => r.winA || r.winB).length}
                  </td>
                  <td className={`px-5 py-2 text-center font-bold border-l border-[#1A2520] tabular-nums ${winsB > winsA ? 'text-[#7EE5A3]' : 'text-[#C6C0A9]'}`} style={{ fontFamily: mono }}>
                    {winsB} / {compRows.filter(r => r.winA || r.winB).length}
                  </td>
                </tr>
              </thead>
              <tbody>
                {compRows.map((row, i) => (
                  <>
                    {row.section && (
                      <tr key={`sec-${i}`} className="bg-[#13201A]/50 border-t border-[#1A2520]">
                        <td colSpan={3} className="px-5 py-2 text-[10px] uppercase tracking-[0.2em] text-[#7EE5A3]"
                          style={{ fontFamily: mono }}>
                          § {row.section}
                        </td>
                      </tr>
                    )}
                    <tr
                      key={row.label}
                      className={`border-t border-[#1A2520]/60 transition-colors ${
                        row.winA ? 'bg-[#7EE5A3]/[0.04]' : row.winB ? 'bg-[#7EE5A3]/[0.04]' : ''
                      }`}
                    >
                      <td className="px-5 py-2.5 text-[#C6C0A9]">{row.label}</td>
                      <td className={`px-5 py-2.5 text-center border-l border-[#1A2520] tabular-nums ${
                        row.winA ? 'text-[#7EE5A3] font-semibold' : row.missingA ? 'text-[#4A6355]' : 'text-[#F0EBDB]'
                      }`} style={{ fontFamily: mono }}>
                        {row.valA}
                        {row.winA && <span className="ml-1.5 text-[#7EE5A3] text-xs">+</span>}
                      </td>
                      <td className={`px-5 py-2.5 text-center border-l border-[#1A2520] tabular-nums ${
                        row.winB ? 'text-[#7EE5A3] font-semibold' : row.missingB ? 'text-[#4A6355]' : 'text-[#F0EBDB]'
                      }`} style={{ fontFamily: mono }}>
                        {row.valB}
                        {row.winB && <span className="ml-1.5 text-[#7EE5A3] text-xs">+</span>}
                      </td>
                    </tr>
                  </>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {rowA && rowB && (
          <div className="mt-4 flex items-center gap-4 text-sm text-[#6D7A72] flex-wrap">
            <span>Score : <span className={`font-bold ${scoreColor(rowA.score_total)}`} style={{ fontFamily: mono }}>{rowA.score_total}/100</span> ({rowA.score_label})</span>
            <span className="text-[#4A6355]">vs</span>
            <span>Score : <span className={`font-bold ${scoreColor(rowB.score_total)}`} style={{ fontFamily: mono }}>{rowB.score_total}/100</span> ({rowB.score_label})</span>
          </div>
        )}
      </main>
    </div>
  )
}

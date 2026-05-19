import { C, mono } from './landing/Gauge'

export type RadarStockData = {
  score_fundamentals: number
  score_technicals: number
  score_momentum: number
  financials: {
    revenue_cagr_3y?: number | null
    pe_ttm?: number | null
    ev_ebitda_ttm?: number | null
    net_debt_to_ebitda?: number | null
  } | null
  market_data: {
    beta?: number | null
  } | null
}

const AXES = [
  { key: 'quality',    label: 'Qualité' },
  { key: 'growth',     label: 'Croissance' },
  { key: 'valuation',  label: 'Valorisation' },
  { key: 'momentum',   label: 'Momentum' },
  { key: 'technique',  label: 'Technique' },
  { key: 'risk',       label: 'Risque' },
] as const

function n(v: number | null | undefined): v is number {
  return v != null && Number.isFinite(v)
}

function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v))
}

/**
 * Normalise les 6 axes du radar à [0, 1].
 * Tous les axes sont orientés "plus haut = meilleur".
 *
 * - Qualité     : score_fundamentals / 100
 * - Croissance  : revenue_cagr_3y borné à 30%/an
 * - Valorisation: inverse de la moyenne (P/E TTM / 50) et (EV/EBITDA / 30)
 * - Momentum    : score_momentum / 100
 * - Technique   : score_technicals / 100
 * - Risque      : inverse de la moyenne (beta / 3) et (net_debt_to_ebitda / 6)
 *                 (un risque BAS donne une valeur HAUTE sur le radar)
 *
 * Si une donnée manque, l'axe retombe à 0.3 (zone neutre) pour ne pas
 * vider le polygone — la donnée manquante ne signifie pas "score nul".
 */
function normalize(d: RadarStockData): number[] {
  const fin = d.financials
  const mkt = d.market_data

  const quality = clamp01(d.score_fundamentals / 100)

  const growth = n(fin?.revenue_cagr_3y)
    ? clamp01(fin!.revenue_cagr_3y! / 30)
    : 0.3

  const pe = fin?.pe_ttm
  const ev = fin?.ev_ebitda_ttm
  const peScore = n(pe) && pe! > 0 ? clamp01(1 - pe! / 50) : null
  const evScore = n(ev) && ev! > 0 ? clamp01(1 - ev! / 30) : null
  const valScores = [peScore, evScore].filter((s): s is number => s !== null)
  const valuation = valScores.length > 0
    ? valScores.reduce((a, b) => a + b, 0) / valScores.length
    : 0.3

  const momentum = clamp01(d.score_momentum / 100)
  const technique = clamp01(d.score_technicals / 100)

  const beta = mkt?.beta
  const debt = fin?.net_debt_to_ebitda
  const betaScore = n(beta) ? clamp01(1 - beta! / 3) : null
  const debtScore = n(debt) ? clamp01(1 - debt! / 6) : null
  const riskScores = [betaScore, debtScore].filter((s): s is number => s !== null)
  const risk = riskScores.length > 0
    ? riskScores.reduce((a, b) => a + b, 0) / riskScores.length
    : 0.5

  return [quality, growth, valuation, momentum, technique, risk]
}

export default function RadarChart({
  tickerA,
  tickerB,
  dataA,
  dataB,
}: {
  tickerA: string
  tickerB: string
  dataA: RadarStockData
  dataB: RadarStockData
}) {
  const W = 460, H = 420
  const cx = W / 2, cy = H / 2 - 4
  const r = 150
  const N = AXES.length

  const angleAt = (i: number) => -Math.PI / 2 + (i * 2 * Math.PI / N)
  const point = (i: number, v: number) => ({
    x: cx + v * r * Math.cos(angleAt(i)),
    y: cy + v * r * Math.sin(angleAt(i)),
  })

  const valuesA = normalize(dataA)
  const valuesB = normalize(dataB)

  const polygonStr = (values: number[]) =>
    values.map((v, i) => {
      const p = point(i, v)
      return `${p.x.toFixed(1)},${p.y.toFixed(1)}`
    }).join(' ')

  const gridLevels = [0.25, 0.5, 0.75, 1.0]
  const gridPolygon = (g: number) =>
    Array.from({ length: N }, (_, i) => {
      const p = point(i, g)
      return `${p.x.toFixed(1)},${p.y.toFixed(1)}`
    }).join(' ')

  const labelPoint = (i: number) => {
    const a = angleAt(i)
    const lr = r + 26
    const x = cx + lr * Math.cos(a)
    const y = cy + lr * Math.sin(a)
    const cos = Math.cos(a)
    const anchor: 'start' | 'middle' | 'end' =
      Math.abs(cos) < 0.15 ? 'middle' : cos > 0 ? 'start' : 'end'
    return { x, y, anchor }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18 }}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        style={{ width: '100%', maxWidth: 520, height: 'auto', display: 'block' }}
        role="img"
        aria-label={`Radar comparatif ${tickerA} vs ${tickerB}`}
      >
        {/* Grid concentrique */}
        {gridLevels.map(g => (
          <polygon
            key={g}
            points={gridPolygon(g)}
            fill="none"
            stroke={C.rule}
            strokeWidth={1}
            strokeDasharray={g === 1 ? '0' : '2 4'}
            opacity={g === 1 ? 0.85 : 0.45}
          />
        ))}

        {/* Axes radiaux */}
        {Array.from({ length: N }, (_, i) => {
          const p = point(i, 1)
          return (
            <line
              key={i}
              x1={cx} y1={cy}
              x2={p.x} y2={p.y}
              stroke={C.rule}
              strokeWidth={1}
              opacity={0.55}
            />
          )
        })}

        {/* Polygone A (phosphor) */}
        <polygon
          points={polygonStr(valuesA)}
          fill={C.phosphor}
          fillOpacity={0.18}
          stroke={C.phosphor}
          strokeWidth={2}
          strokeLinejoin="round"
        />

        {/* Polygone B (ember) */}
        <polygon
          points={polygonStr(valuesB)}
          fill={C.ember}
          fillOpacity={0.18}
          stroke={C.ember}
          strokeWidth={2}
          strokeLinejoin="round"
        />

        {/* Points A */}
        {valuesA.map((v, i) => {
          const p = point(i, v)
          return (
            <circle
              key={`a-${i}`}
              cx={p.x} cy={p.y} r={3.5}
              fill={C.bg}
              stroke={C.phosphor}
              strokeWidth={2}
            />
          )
        })}

        {/* Points B */}
        {valuesB.map((v, i) => {
          const p = point(i, v)
          return (
            <circle
              key={`b-${i}`}
              cx={p.x} cy={p.y} r={3.5}
              fill={C.bg}
              stroke={C.ember}
              strokeWidth={2}
            />
          )
        })}

        {/* Labels d'axes */}
        {AXES.map((ax, i) => {
          const lp = labelPoint(i)
          return (
            <text
              key={ax.key}
              x={lp.x}
              y={lp.y + 4}
              textAnchor={lp.anchor}
              style={{
                fontFamily: mono,
                fontSize: 10,
                fill: C.muted,
                letterSpacing: '0.18em',
                fontWeight: 600,
              }}
            >
              {ax.label.toUpperCase()}
            </text>
          )
        })}
      </svg>

      {/* Légende */}
      <div style={{ display: 'flex', gap: 28, alignItems: 'center' }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            width: 12, height: 12, background: C.phosphor, borderRadius: 2,
            display: 'inline-block',
          }} />
          <span style={{
            fontFamily: mono, fontSize: 11, color: C.ink,
            fontWeight: 600, letterSpacing: '0.08em',
          }}>
            {tickerA}
          </span>
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            width: 12, height: 12, background: C.ember, borderRadius: 2,
            display: 'inline-block',
          }} />
          <span style={{
            fontFamily: mono, fontSize: 11, color: C.ink,
            fontWeight: 600, letterSpacing: '0.08em',
          }}>
            {tickerB}
          </span>
        </span>
      </div>
    </div>
  )
}

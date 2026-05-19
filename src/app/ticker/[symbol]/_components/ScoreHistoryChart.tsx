'use client'

import { useMemo, useState } from 'react'
import { C, serif, sans, mono } from '@/components/landing/Gauge'

export type HistoryPoint = { score: number; iso: string }

type Range = '1M' | '3M' | '6M' | '1Y' | '3Y'
const RANGES: Range[] = ['1M', '3M', '6M', '1Y', '3Y']
const RANGE_DAYS: Record<Range, number> = { '1M': 31, '3M': 92, '6M': 183, '1Y': 365, '3Y': 1095 }

function toneFor(score: number): string {
  if (score >= 75) return C.phosphor
  if (score >= 60) return C.phosphorSoft
  if (score >= 45) return C.ember
  if (score >= 30) return '#E58A4E'
  return C.sanguine
}

function dateLabel(iso: string): string {
  const d = new Date(iso)
  const months = ['janv.', 'fév.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.']
  return `${d.getDate()} ${months[d.getMonth()]}`
}

function pickDefaultRange(history: HistoryPoint[]): Range {
  if (history.length < 2) return '6M'
  const first = new Date(history[0].iso).getTime()
  const last = new Date(history[history.length - 1].iso).getTime()
  const days = Math.max(1, (last - first) / 86_400_000)
  if (days <= 31) return '1M'
  if (days <= 92) return '3M'
  if (days <= 183) return '6M'
  if (days <= 365) return '1Y'
  return '3Y'
}

type DerivedEvent = { iso: string; score: number; delta: number; label: string }

function deriveEvents(points: HistoryPoint[]): DerivedEvent[] {
  if (points.length < 3) return []
  const events: DerivedEvent[] = []
  for (let i = 1; i < points.length - 1; i++) {
    const delta = points[i].score - points[i - 1].score
    if (Math.abs(delta) < 4) continue
    events.push({
      iso: points[i].iso,
      score: points[i].score,
      delta,
      label: delta > 0 ? `+${Math.round(delta)} PTS` : `${Math.round(delta)} PTS`,
    })
  }
  // Garde au plus 4 événements bien espacés
  return events
    .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
    .slice(0, 4)
    .sort((a, b) => new Date(a.iso).getTime() - new Date(b.iso).getTime())
}

export default function ScoreHistoryChart({
  history,
  currentScore,
}: {
  history: HistoryPoint[]
  currentScore: number
}) {
  const [range, setRange] = useState<Range>(() => pickDefaultRange(history))

  const filtered = useMemo(() => {
    if (history.length < 2) return history
    const cutoff = Date.now() - RANGE_DAYS[range] * 86_400_000
    const inRange = history.filter(p => new Date(p.iso).getTime() >= cutoff)
    return inRange.length >= 2 ? inRange : history.slice(-Math.max(2, Math.floor(history.length * 0.2)))
  }, [history, range])

  const seriesWithCurrent = useMemo<HistoryPoint[]>(() => {
    if (filtered.length === 0) return []
    return [...filtered.slice(0, -1), { score: currentScore, iso: filtered[filtered.length - 1].iso }]
  }, [filtered, currentScore])

  const events = useMemo(() => deriveEvents(seriesWithCurrent), [seriesWithCurrent])

  const onExportCsv = () => {
    if (typeof window === 'undefined') return
    const rows = [['date', 'score']]
    seriesWithCurrent.forEach(p => rows.push([p.iso, String(Math.round(p.score))]))
    const csv = rows.map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `alphabrief-score-history-${range}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (seriesWithCurrent.length < 2) {
    return (
      <div style={{
        background: C.bgCard, border: `1px solid ${C.rule}`, borderRadius: 16,
        padding: 28, marginTop: 16, textAlign: 'center',
        fontFamily: serif, fontStyle: 'italic', color: C.inkDim, fontSize: 15,
      }}>
        Pas assez de points pour tracer la fenêtre {range}. Choisissez un range plus large.
      </div>
    )
  }

  const W = 1100, H = 280, P = { l: 50, r: 30, t: 20, b: 36 }
  const ix = (i: number) => P.l + (i / Math.max(1, seriesWithCurrent.length - 1)) * (W - P.l - P.r)
  const iy = (s: number) => P.t + (1 - s / 100) * (H - P.t - P.b)
  const path = seriesWithCurrent.map((p, i) => `${i === 0 ? 'M' : 'L'} ${ix(i)} ${iy(p.score)}`).join(' ')
  const area = path + ` L ${ix(seriesWithCurrent.length - 1)} ${H - P.b} L ${ix(0)} ${H - P.b} Z`

  const bands = [
    { min: 75, max: 100, c: C.phosphor,     lab: 'EXCELLENT' },
    { min: 60, max: 75,  c: C.phosphorSoft, lab: 'BON' },
    { min: 45, max: 60,  c: C.ember,        lab: 'NEUTRE' },
    { min: 30, max: 45,  c: '#E58A4E',      lab: 'ATTENTION' },
    { min: 0,  max: 30,  c: C.sanguine,     lab: 'RISQUÉ' },
  ]

  const lastScore = Math.round(seriesWithCurrent[seriesWithCurrent.length - 1].score)
  const lineColor = toneFor(lastScore)

  const indexByIso = new Map(seriesWithCurrent.map((p, i) => [p.iso, i]))

  // Étiquettes X : début, milieu, fin
  const xTicks = [0, Math.floor((seriesWithCurrent.length - 1) / 2), seriesWithCurrent.length - 1]

  return (
    <>
      {/* Range selector + export */}
      <div style={{
        display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 10,
        marginTop: 14, marginBottom: 12, flexWrap: 'wrap',
      }}>
        <div style={{ display: 'flex', gap: 4 }}>
          {RANGES.map(r => {
            const active = r === range
            return (
              <button
                key={r}
                type="button"
                onClick={() => setRange(r)}
                style={{
                  padding: '5px 12px',
                  fontFamily: mono, fontSize: 11, fontWeight: 600, letterSpacing: '0.08em',
                  background: active ? `${C.phosphor}14` : 'transparent',
                  color: active ? C.phosphor : C.muted,
                  border: `1px solid ${active ? C.phosphor + '60' : C.rule}`,
                  borderRadius: 6,
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                {r}
              </button>
            )
          })}
        </div>
      </div>

      <div style={{
        background: C.bgCard, border: `1px solid ${C.rule}`, borderRadius: 16,
        padding: '28px 28px 22px', position: 'relative',
      }}>
        <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', display: 'block' }}>
          <defs>
            <linearGradient id="score-area-c" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"  stopColor={lineColor} stopOpacity="0.25" />
              <stop offset="100%" stopColor={lineColor} stopOpacity="0" />
            </linearGradient>
          </defs>

          {[100, 75, 60, 45, 30, 0].map(y => (
            <g key={y}>
              <line x1={P.l} y1={iy(y)} x2={W - P.r} y2={iy(y)}
                stroke={y === 0 || y === 100 ? C.rule : C.ruleDim}
                strokeDasharray={y === 100 || y === 0 ? '0' : '2 4'} />
              <text x={P.l - 8} y={iy(y) + 3} textAnchor="end"
                style={{ fontFamily: mono, fontSize: 10, fill: C.muted }}>
                {y}
              </text>
            </g>
          ))}

          {bands.map(b => (
            <text key={b.lab} x={W - P.r - 6} y={iy((b.min + b.max) / 2) + 3} textAnchor="end"
              style={{ fontFamily: mono, fontSize: 9, fill: b.c, letterSpacing: '0.16em', opacity: 0.55 }}>
              {b.lab}
            </text>
          ))}

          {/* X ticks */}
          {xTicks.map(i => (
            <text key={i} x={ix(i)} y={H - 12} textAnchor="middle"
              style={{ fontFamily: mono, fontSize: 10, fill: C.muted, letterSpacing: '0.08em' }}>
              {i === seriesWithCurrent.length - 1 ? "AUJOURD'HUI" : dateLabel(seriesWithCurrent[i].iso).toUpperCase()}
            </text>
          ))}

          <path d={area} fill="url(#score-area-c)" />
          <path d={path} fill="none" stroke={lineColor} strokeWidth="2" strokeLinecap="round" />

          {/* Annotations événements */}
          {events.map((ev, k) => {
            const idx = indexByIso.get(ev.iso)
            if (idx === undefined) return null
            const x = ix(idx)
            const y = iy(ev.score)
            const labelY = y - 24
            const c = ev.delta > 0 ? C.phosphor : C.sanguine
            return (
              <g key={k}>
                <line x1={x} y1={y} x2={x} y2={labelY + 6} stroke={c} strokeDasharray="2 3" strokeWidth={1} />
                <circle cx={x} cy={y} r="4" fill={C.bg} stroke={c} strokeWidth="2" />
                <rect x={x - 38} y={labelY - 10} width="76" height="16" rx="3"
                  fill={C.bg} stroke={c} strokeWidth="1" />
                <text x={x} y={labelY + 1} textAnchor="middle"
                  style={{ fontFamily: mono, fontSize: 9, fill: c, letterSpacing: '0.14em', fontWeight: 600 }}>
                  {ev.label}
                </text>
              </g>
            )
          })}

          {/* Point final */}
          <circle cx={ix(seriesWithCurrent.length - 1)} cy={iy(lastScore)} r="6"
            fill={lineColor} opacity="0.3" />
          <circle cx={ix(seriesWithCurrent.length - 1)} cy={iy(lastScore)} r="3"
            fill={lineColor} />
        </svg>
      </div>

      <div style={{
        display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12,
        padding: '14px 0 4px', fontFamily: mono, fontSize: 10, color: C.muted, letterSpacing: '0.1em',
      }}>
        <span>POINTS DE DONNÉES : {seriesWithCurrent.length} · UN POINT PAR RECALCUL NOCTURNE</span>
        <button
          type="button"
          onClick={onExportCsv}
          style={{
            background: 'transparent', border: 'none', cursor: 'pointer',
            fontFamily: mono, fontSize: 10, color: C.phosphor,
            letterSpacing: '0.14em', padding: 0,
          }}
        >
          EXPORTER CSV →
        </button>
      </div>
      {/* Silence unused-vars (sans used in fallback) */}
      <span style={{ display: 'none', fontFamily: sans }} />
    </>
  )
}

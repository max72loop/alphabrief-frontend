"use client"

import { useState } from "react"
import { C, serif, mono } from "@/components/landing/Gauge"
import { tone, type WatchlistItem } from "./types"

export function Constellation({ items }: { items: WatchlistItem[] }) {
  const [hover, setHover] = useState<string | null>(null)

  if (items.length === 0) return null

  const PAD = { l: 70, r: 30, t: 36, b: 50 }
  const W = 1240, H = 460
  const innerW = W - PAD.l - PAD.r
  const innerH = H - PAD.t - PAD.b

  const xScale = (s: number) => PAD.l + (s / 100) * innerW

  const maxAbs = Math.max(12, ...items.map(t => Math.abs(t.score - t.prev)))
  const yScale = (d: number) => PAD.t + innerH - ((d + maxAbs) / (maxAbs * 2)) * innerH

  return (
    <section style={{ maxWidth: 1320, margin: "0 auto", padding: "56px 40px 0" }}>
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "flex-end",
        paddingBottom: 14, marginBottom: 0, borderBottom: `1px solid ${C.rule}`,
        flexWrap: "wrap", gap: 10,
      }}>
        <div>
          <div style={{ fontFamily: mono, fontSize: 10, letterSpacing: "0.3em", color: C.phosphor, marginBottom: 6 }}>
            § 02 · CONSTELLATION
          </div>
          <h2 style={{ fontFamily: serif, fontSize: 36, fontWeight: 500, letterSpacing: "-0.025em", color: C.ink, margin: 0, lineHeight: 1 }}>
            Le portefeuille <span style={{ fontStyle: "italic", color: C.phosphor }}>d&apos;un coup d&apos;œil</span>.
          </h2>
        </div>
        <div style={{ display: "flex", gap: 18, fontFamily: mono, fontSize: 10, color: C.muted, letterSpacing: "0.12em", alignItems: "center" }}>
          <span>X · <span style={{ color: C.ink }}>SCORE 0-100</span></span>
          <span>Y · <span style={{ color: C.ink }}>VARIATION 7 JOURS</span></span>
          <span>TAILLE · <span style={{ color: C.ink }}>SCORE</span></span>
        </div>
      </div>

      <div style={{
        background: C.bgCard, border: `1px solid ${C.rule}`, borderRadius: 16,
        padding: 0, marginTop: 20, overflow: "hidden", position: "relative",
      }}>
        <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto", display: "block" }}>
          <defs>
            <pattern id="ab-wl-grid" width={innerW / 10} height={innerH / 8} patternUnits="userSpaceOnUse" x={PAD.l} y={PAD.t}>
              <path d={`M ${innerW/10} 0 L 0 0 0 ${innerH/8}`} fill="none" stroke={C.rule} strokeWidth="0.5" />
            </pattern>
          </defs>

          <rect x={xScale(60)} y={yScale(maxAbs)}  width={xScale(100) - xScale(60)} height={yScale(0) - yScale(maxAbs)} fill={C.phosphor}     opacity="0.04" />
          <rect x={xScale(60)} y={yScale(0)}       width={xScale(100) - xScale(60)} height={yScale(-maxAbs) - yScale(0)} fill={C.ember}       opacity="0.03" />
          <rect x={xScale(0)}  y={yScale(maxAbs)}  width={xScale(60)  - xScale(0)}  height={yScale(0) - yScale(maxAbs)} fill={C.phosphorSoft} opacity="0.02" />
          <rect x={xScale(0)}  y={yScale(0)}       width={xScale(60)  - xScale(0)}  height={yScale(-maxAbs) - yScale(0)} fill={C.sanguine}    opacity="0.04" />

          <rect x={PAD.l} y={PAD.t} width={innerW} height={innerH} fill="url(#ab-wl-grid)" />

          <line x1={PAD.l} x2={PAD.l + innerW} y1={yScale(0)} y2={yScale(0)} stroke={C.rule} strokeWidth="1" />
          <line y1={PAD.t} y2={PAD.t + innerH} x1={xScale(60)} x2={xScale(60)} stroke={C.rule} strokeWidth="1" strokeDasharray="3 4" />
          <line y1={PAD.t} y2={PAD.t + innerH} x1={xScale(75)} x2={xScale(75)} stroke={C.phosphor + "40"} strokeWidth="1" strokeDasharray="3 4" />

          {[0, 25, 50, 60, 75, 100].map(v => (
            <g key={v}>
              <line x1={xScale(v)} x2={xScale(v)} y1={PAD.t + innerH} y2={PAD.t + innerH + 5} stroke={C.muted} strokeWidth="0.7" />
              <text x={xScale(v)} y={PAD.t + innerH + 20} fontSize="10" fill={C.muted} fontFamily={mono} textAnchor="middle" letterSpacing="0.1em">
                {v}
              </text>
            </g>
          ))}
          <text x={PAD.l + innerW/2} y={H - 16} fontSize="9" fill={C.muted} fontFamily={mono} textAnchor="middle" letterSpacing="0.22em">
            SCORE COMPOSITE
          </text>

          {[-Math.round(maxAbs), -Math.round(maxAbs / 2), 0, Math.round(maxAbs / 2), Math.round(maxAbs)].map(v => (
            <g key={v}>
              <text x={PAD.l - 12} y={yScale(v) + 4} fontSize="10" fill={v === 0 ? C.inkDim : C.muted} fontFamily={mono} textAnchor="end">
                {v > 0 ? `+${v}` : v}
              </text>
            </g>
          ))}
          <text
            transform={`rotate(-90 ${PAD.l - 50} ${PAD.t + innerH/2})`}
            x={PAD.l - 50} y={PAD.t + innerH/2}
            fontSize="9" fill={C.muted} fontFamily={mono} textAnchor="middle" letterSpacing="0.22em"
          >
            VARIATION 7 JOURS (PTS)
          </text>

          <text x={xScale(99)} y={yScale(maxAbs - 1)} fontSize="9" fill={C.phosphor}     fontFamily={mono} textAnchor="end"   letterSpacing="0.16em" fontWeight="600">FORTS · EN HAUSSE</text>
          <text x={xScale(99)} y={yScale(-maxAbs) - 8} fontSize="9" fill={C.ember}        fontFamily={mono} textAnchor="end"   letterSpacing="0.16em" fontWeight="600">FORTS · EN REPLI</text>
          <text x={xScale(1)}  y={yScale(maxAbs - 1)} fontSize="9" fill={C.phosphorSoft} fontFamily={mono} textAnchor="start" letterSpacing="0.16em" fontWeight="600">FAIBLES · EN REBOND</text>
          <text x={xScale(1)}  y={yScale(-maxAbs) - 8} fontSize="9" fill={C.sanguine}    fontFamily={mono} textAnchor="start" letterSpacing="0.16em" fontWeight="600">FAIBLES · EN CHUTE</text>

          {items.map((t) => {
            const d = t.score - t.prev
            const col = tone(t.score)
            const cx = xScale(t.score)
            const cy = yScale(d)
            const r = 5 + (t.score / 100) * 7
            const isHover = hover === t.ticker
            const labelOnLeft = t.score > 80
            const ox = labelOnLeft ? -10 : 10
            const anchor = labelOnLeft ? "end" : "start"
            return (
              <g key={t.ticker} onMouseEnter={() => setHover(t.ticker)} onMouseLeave={() => setHover(null)} style={{ cursor: "pointer" }}>
                <title>{t.name ? `${t.name} (${t.ticker})` : t.ticker}</title>
                <circle cx={cx} cy={cy} r={r + 8} fill={col} opacity={isHover ? 0.25 : 0.12} />
                <circle cx={cx} cy={cy} r={r} fill={col} stroke={C.bgCard} strokeWidth="1.5" />
                {t.alert && (
                  <circle cx={cx + r * 0.7} cy={cy - r * 0.7} r={3} fill={C.ember} stroke={C.bgCard} strokeWidth="1" />
                )}
                <text
                  x={cx + ox} y={cy + 4}
                  fontFamily={serif} fontWeight="600" fontSize="15"
                  fill={isHover ? C.ink : C.inkDim}
                  textAnchor={anchor}
                  letterSpacing="-0.01em"
                >
                  {isHover && t.name ? (t.name.length > 18 ? t.name.slice(0, 18) + "…" : t.name) : t.ticker}
                </text>
                <text
                  x={cx + ox} y={cy + 17}
                  fontFamily={mono} fontSize="9"
                  fill={d >= 0 ? C.phosphor : C.sanguine}
                  textAnchor={anchor}
                  letterSpacing="0.06em"
                >
                  {d >= 0 ? "+" : ""}{d} PTS
                </text>
              </g>
            )
          })}
        </svg>

        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          padding: "14px 24px", borderTop: `1px solid ${C.rule}`,
          fontFamily: mono, fontSize: 10, color: C.muted, letterSpacing: "0.14em",
          flexWrap: "wrap", gap: 10,
        }}>
          <div style={{ display: "flex", gap: 22, flexWrap: "wrap" }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 7 }}>
              <span style={{ width: 9, height: 9, borderRadius: "50%", background: C.phosphor }} /> EXCELLENT
            </span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 7 }}>
              <span style={{ width: 9, height: 9, borderRadius: "50%", background: C.phosphorSoft }} /> BON
            </span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 7 }}>
              <span style={{ width: 9, height: 9, borderRadius: "50%", background: C.ember }} /> NEUTRE
            </span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 7 }}>
              <span style={{ width: 9, height: 9, borderRadius: "50%", background: C.sanguine }} /> RISQUÉ
            </span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 7 }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: C.ember, boxShadow: `0 0 4px ${C.ember}` }} /> ALERTE ACTIVE
            </span>
          </div>
          <span>SEUIL FORT · 75 · — · SEUIL ACHAT · 60</span>
        </div>
      </div>
    </section>
  )
}

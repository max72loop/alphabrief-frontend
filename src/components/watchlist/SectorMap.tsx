"use client"

import { useMemo } from "react"
import { C, serif, mono } from "@/components/landing/Gauge"
import { tone, type WatchlistItem } from "./types"

export function SectorMap({ items }: { items: WatchlistItem[] }) {
  const sectorMap = useMemo(() => {
    const m: Record<string, { sector: string; titres: WatchlistItem[]; total: number }> = {}
    items.forEach(t => {
      const k = t.sector || "Non classé"
      if (!m[k]) m[k] = { sector: k, titres: [], total: 0 }
      m[k].titres.push(t)
      m[k].total += t.score
    })
    return Object.values(m).map(s => ({
      ...s,
      avg: Math.round(s.total / s.titres.length),
      count: s.titres.length,
      bestDelta:  Math.max(...s.titres.map(t => t.score - t.prev)),
      worstDelta: Math.min(...s.titres.map(t => t.score - t.prev)),
    })).sort((a, b) => b.avg - a.avg)
  }, [items])

  if (sectorMap.length === 0) return null

  const maxCount = Math.max(...sectorMap.map(s => s.count))

  return (
    <section style={{ maxWidth: 1320, margin: "0 auto", padding: "60px 40px 0" }}>
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "flex-end",
        paddingBottom: 14, marginBottom: 20, borderBottom: `1px solid ${C.rule}`,
        flexWrap: "wrap", gap: 10,
      }}>
        <div>
          <div style={{ fontFamily: mono, fontSize: 10, letterSpacing: "0.3em", color: C.phosphor, marginBottom: 6 }}>
            § 04 · CARTOGRAPHIE SECTORIELLE
          </div>
          <h2 style={{ fontFamily: serif, fontSize: 36, fontWeight: 500, letterSpacing: "-0.025em", color: C.ink, margin: 0, lineHeight: 1 }}>
            Comment vos titres <span style={{ fontStyle: "italic", color: C.phosphor }}>se rangent</span>.
          </h2>
        </div>
        <span style={{ fontFamily: mono, fontSize: 10, color: C.muted, letterSpacing: "0.16em" }}>
          {sectorMap.length} {sectorMap.length === 1 ? "SECTEUR" : "SECTEURS"} · PONDÉRATION ÉQUI-PONDÉRÉE
        </span>
      </div>

      <div className="ab-wl-sector-grid" style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16 }}>
        {sectorMap.map(s => {
          const t = tone(s.avg)
          const widthShare = (s.count / maxCount) * 100
          return (
            <div key={s.sector} style={{
              background: C.bgCard, border: `1px solid ${C.rule}`, borderRadius: 14,
              padding: "22px 24px",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 14 }}>
                <div>
                  <div style={{ fontFamily: mono, fontSize: 10, color: C.muted, letterSpacing: "0.18em" }}>
                    SECTEUR · {s.count} {s.count > 1 ? "TITRES" : "TITRE"}
                  </div>
                  <div style={{ fontFamily: serif, fontSize: 26, fontWeight: 600, color: C.ink, letterSpacing: "-0.02em", marginTop: 4, lineHeight: 1.1 }}>
                    {s.sector}
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontFamily: mono, fontSize: 9, color: C.muted, letterSpacing: "0.18em" }}>SCORE MOYEN</div>
                  <div style={{ fontFamily: mono, fontSize: 32, fontWeight: 600, color: t, letterSpacing: "-0.04em", lineHeight: 1, marginTop: 4 }}>
                    {s.avg}
                  </div>
                </div>
              </div>

              <div style={{ marginTop: 18 }}>
                <div style={{ height: 6, background: C.rule, borderRadius: 3, overflow: "hidden", position: "relative" }}>
                  <div style={{
                    position: "absolute", inset: 0, width: `${widthShare}%`,
                    background: t, opacity: 0.75, borderRadius: 3,
                    boxShadow: `0 0 8px ${t}40`,
                  }} />
                </div>
                <div style={{
                  display: "flex", justifyContent: "space-between", marginTop: 6,
                  fontFamily: mono, fontSize: 9, color: C.muted, letterSpacing: "0.12em",
                }}>
                  <span>EXPOSITION · {Math.round((s.count / items.length) * 100)} %</span>
                  <span>
                    <span style={{ color: s.bestDelta >= 0 ? C.phosphor : C.sanguine }}>
                      {s.bestDelta >= 0 ? "+" : ""}{s.bestDelta}
                    </span>
                    {" / "}
                    <span style={{ color: s.worstDelta >= 0 ? C.phosphor : C.sanguine }}>
                      {s.worstDelta >= 0 ? "+" : ""}{s.worstDelta}
                    </span>
                    {" PTS"}
                  </span>
                </div>
              </div>

              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 14 }}>
                {s.titres.map(tit => {
                  const tc = tone(tit.score)
                  const d = tit.score - tit.prev
                  return (
                    <span key={tit.ticker} style={{
                      display: "inline-flex", alignItems: "center", gap: 6,
                      padding: "5px 9px", borderRadius: 6,
                      background: `${tc}10`, border: `1px solid ${tc}40`,
                      fontFamily: mono, fontSize: 11, color: C.ink,
                    }}>
                      <span style={{ fontFamily: serif, fontWeight: 600, fontSize: 13 }}>{tit.ticker}</span>
                      <span style={{ color: tc, fontWeight: 600 }}>{tit.score}</span>
                      <span style={{ color: d >= 0 ? C.phosphor : C.sanguine, fontSize: 9, letterSpacing: "0.04em" }}>
                        {d > 0 ? "+" : ""}{d}
                      </span>
                    </span>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}

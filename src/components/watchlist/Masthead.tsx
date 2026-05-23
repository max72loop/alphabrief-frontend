"use client"

import { C, serif, sans, mono } from "@/components/landing/Gauge"
import type { WatchlistItem } from "./types"

export function WatchlistMasthead({ items }: { items: WatchlistItem[] }) {
  if (items.length === 0) {
    return (
      <section style={{ maxWidth: 1320, margin: "0 auto", padding: "36px 40px 0" }}>
        <div style={{ borderTop: `2px solid ${C.ink}`, padding: "26px 0 28px", borderBottom: `1px solid ${C.rule}` }}>
          <div style={{ fontFamily: mono, fontSize: 11, color: C.phosphor, letterSpacing: "0.22em", marginBottom: 18 }}>
            § L&apos;ALMANACH DES SUIVIS
          </div>
          <h1 style={{ fontFamily: serif, fontSize: 76, fontWeight: 500, lineHeight: 0.95, letterSpacing: "-0.035em", color: C.ink, margin: 0 }}>
            Ma <span style={{ fontStyle: "italic", color: C.phosphor }}>watchlist</span>.
          </h1>
          <p style={{ fontFamily: serif, fontStyle: "italic", fontSize: 21, lineHeight: 1.4, color: C.inkDim, marginTop: 22, marginBottom: 0, maxWidth: 580, fontWeight: 500 }}>
            Aucun titre suivi pour le moment. Ajoutez votre première action pour voir apparaître l&apos;almanach.
          </p>
        </div>
      </section>
    )
  }

  const avg = Math.round(items.reduce((a, t) => a + t.score, 0) / items.length)
  const moversUp = items.filter(t => t.score - t.prev >= 3).length
  const moversDown = items.filter(t => t.prev - t.score >= 3).length
  const alerts = items.filter(t => t.alert).length

  const buckets = [
    { lab: "EXCELLENT", range: "≥ 75",   count: items.filter(t => t.score >= 75).length,                    col: C.phosphor },
    { lab: "BON",       range: "60-74",  count: items.filter(t => t.score >= 60 && t.score < 75).length,    col: C.phosphorSoft },
    { lab: "NEUTRE",    range: "45-59",  count: items.filter(t => t.score >= 45 && t.score < 60).length,    col: C.ember },
    { lab: "ATTENTION", range: "30-44",  count: items.filter(t => t.score >= 30 && t.score < 45).length,    col: "#E58A4E" },
    { lab: "RISQUÉ",    range: "< 30",   count: items.filter(t => t.score < 30).length,                     col: C.sanguine },
  ]
  const maxB = Math.max(1, ...buckets.map(b => b.count))

  const stats: { lab: string; val: string | number; sub: string; color?: string }[] = [
    { lab: "TITRES", val: items.length, sub: "sur la watchlist" },
    { lab: "SCORE MOYEN", val: avg, sub: "pondéré", color: C.phosphor },
    { lab: "ALERTES", val: alerts, sub: "à arbitrer", color: C.ember },
  ]

  return (
    <section style={{ maxWidth: 1320, margin: "0 auto", padding: "36px 40px 0" }}>
      <div className="ab-wl-masthead-grid" style={{
        display: "grid", gridTemplateColumns: "1.45fr 1fr", gap: 60,
        borderTop: `2px solid ${C.ink}`, padding: "26px 0 28px",
        borderBottom: `1px solid ${C.rule}`,
        alignItems: "end",
      }}>
        <div>
          <div style={{ fontFamily: mono, fontSize: 11, color: C.phosphor, letterSpacing: "0.22em", marginBottom: 18 }}>
            § L&apos;ALMANACH DES SUIVIS
          </div>
          <h1 style={{ fontFamily: serif, fontSize: 76, fontWeight: 500, lineHeight: 0.95, letterSpacing: "-0.035em", color: C.ink, margin: 0 }}>
            Ma <span style={{ fontStyle: "italic", color: C.phosphor }}>watchlist</span>.
          </h1>
          <p style={{ fontFamily: serif, fontStyle: "italic", fontSize: 21, lineHeight: 1.4, color: C.inkDim, marginTop: 22, marginBottom: 0, maxWidth: 580, fontWeight: 500 }}>
            {items.length === 1 ? "Un titre, vu en une page." : `${items.length} titres, vus en une page.`}{" "}
            <span style={{ color: C.phosphor, fontStyle: "normal", fontFamily: mono, fontSize: 17, padding: "0 4px" }}>{moversUp}</span> en progression,
            <span style={{ color: C.sanguine, fontStyle: "normal", fontFamily: mono, fontSize: 17, padding: "0 4px" }}>{moversDown}</span> en repli,
            et <span style={{ color: C.ember, fontStyle: "normal", fontFamily: mono, fontSize: 17, padding: "0 4px" }}>{alerts}</span>{" "}
            {alerts <= 1 ? "alerte à valider" : "alertes à valider"} avant l&apos;ouverture.
          </p>
        </div>

        <div style={{ border: `1px solid ${C.rule}`, borderRadius: 12, overflow: "hidden", background: C.bgCard }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", borderBottom: `1px solid ${C.rule}` }}>
            {stats.map((s, i) => (
              <div key={s.lab} style={{ padding: "16px 14px", borderRight: i < 2 ? `1px solid ${C.rule}` : "none" }}>
                <div style={{ fontFamily: mono, fontSize: 9, color: C.muted, letterSpacing: "0.18em" }}>{s.lab}</div>
                <div style={{ fontFamily: mono, fontSize: 30, fontWeight: 600, color: s.color || C.ink, letterSpacing: "-0.04em", lineHeight: 1, marginTop: 8 }}>
                  {s.val}
                </div>
                <div style={{ fontFamily: sans, fontSize: 11, color: C.muted, marginTop: 4 }}>{s.sub}</div>
              </div>
            ))}
          </div>
          <div style={{ padding: "14px 18px 16px" }}>
            <div style={{ fontFamily: mono, fontSize: 9, color: C.muted, letterSpacing: "0.18em", marginBottom: 10 }}>
              DISTRIBUTION DES SCORES
            </div>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 56 }}>
              {buckets.map(b => (
                <div key={b.lab} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 5 }}>
                  <div style={{
                    width: "100%", height: `${(b.count / maxB) * 38 + 2}px`,
                    background: b.count ? b.col : C.rule,
                    boxShadow: b.count ? `0 0 8px ${b.col}40` : "none",
                    borderRadius: 2,
                  }} />
                  <span style={{ fontFamily: mono, fontSize: 9, fontWeight: 600, color: b.count ? b.col : C.muted }}>{b.count}</span>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: 6, marginTop: 4, fontFamily: mono, fontSize: 8, color: C.muted, letterSpacing: "0.1em" }}>
              {buckets.map(b => <span key={b.lab} style={{ flex: 1, textAlign: "center" }}>{b.range}</span>)}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

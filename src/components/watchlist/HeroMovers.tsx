"use client"

import Link from "next/link"
import { C, serif, sans, mono, Gauge } from "@/components/landing/Gauge"
import { Sparkline } from "./Sparkline"
import { tone, type WatchlistItem } from "./types"

function HeroCard({ it, kind }: { it: WatchlistItem; kind: string }) {
  const delta = it.score - it.prev
  const up = delta > 0
  const t = tone(it.score)
  const accent = up ? C.phosphor : C.sanguine

  return (
    <article style={{
      position: "relative", overflow: "hidden",
      background: C.bgCard, border: `1px solid ${C.rule}`, borderRadius: 16,
      padding: "28px 30px 26px",
      display: "flex", flexDirection: "column", gap: 18,
    }}>
      <div aria-hidden style={{
        position: "absolute", top: -40, right: -40, width: 220, height: 220,
        background: `${accent}10`, filter: "blur(80px)", pointerEvents: "none",
      }} />

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", position: "relative" }}>
        <div>
          <div style={{ fontFamily: mono, fontSize: 9, letterSpacing: "0.22em", fontWeight: 600, color: accent, marginBottom: 8 }}>
            {kind}
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 12, flexWrap: "wrap" }}>
            <span
              style={{
                fontFamily: serif, fontSize: 38, fontWeight: 600, color: C.ink,
                letterSpacing: "-0.03em", lineHeight: 1.05,
                maxWidth: 360, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              }}
              title={it.ticker}
            >
              {it.name || it.ticker}
            </span>
            {it.alert && (
              <span style={{
                fontFamily: mono, fontSize: 9, color: C.ember, letterSpacing: "0.15em",
                border: `1px solid ${C.ember}50`, padding: "2px 7px", borderRadius: 3,
              }}>
                ALERTE
              </span>
            )}
          </div>
          <div style={{ fontFamily: mono, fontSize: 11, color: C.muted, letterSpacing: "0.14em", marginTop: 6 }}>
            {it.ticker}
            {it.sector && <> · {it.sector.toUpperCase()}</>}
          </div>
        </div>
        <Gauge value={it.score} size={88} stroke={7} showNumeral={false} />
      </div>

      <div style={{
        display: "grid", gridTemplateColumns: "1fr auto", gap: 24, alignItems: "center",
        borderTop: `1px dashed ${C.rule}`, borderBottom: `1px dashed ${C.rule}`, padding: "16px 0",
      }}>
        <div>
          <Sparkline data={it.hist} width={260} height={56} color={accent} />
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4, fontFamily: mono, fontSize: 9, color: C.muted, letterSpacing: "0.12em" }}>
            <span>IL Y A 7J</span>
            <span>AUJ.</span>
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontFamily: mono, fontSize: 9, color: C.muted, letterSpacing: "0.18em" }}>SCORE</div>
          <div style={{ fontFamily: mono, fontSize: 44, fontWeight: 600, color: t, letterSpacing: "-0.04em", lineHeight: 1, marginTop: 4 }}>
            {it.score}
          </div>
          <div style={{ fontFamily: mono, fontSize: 13, fontWeight: 600, color: accent, marginTop: 6 }}>
            {delta === 0 ? "— 0 pt · 7j" : `${up ? "▲" : "▼"} ${Math.abs(delta)} pts · 7j`}
          </div>
        </div>
      </div>

      <p style={{ fontFamily: serif, fontStyle: "italic", fontSize: 16, lineHeight: 1.45, color: C.inkDim, margin: 0 }}>
        <span style={{ color: accent, fontStyle: "normal", marginRight: 6 }}>›</span>
        {it.note}
      </p>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", gap: 14, fontFamily: mono, fontSize: 10, color: C.muted, letterSpacing: "0.12em" }}>
          {it.price && <span>COURS · <span style={{ color: C.ink }}>{it.price}</span></span>}
          {it.chg && <span>SÉANCE · <span style={{ color: it.chg.startsWith("-") ? C.sanguine : C.phosphor }}>{it.chg}</span></span>}
        </div>
        <Link href={`/ticker/${it.ticker}`} style={{
          fontFamily: mono, fontSize: 11, color: C.phosphor, letterSpacing: "0.16em",
          textDecoration: "none", fontWeight: 600,
        }}>
          ANALYSE COMPLÈTE →
        </Link>
      </div>
    </article>
  )
}

export function WatchlistHero({ items }: { items: WatchlistItem[] }) {
  if (items.length < 2) return null

  const sorted = [...items].sort((a, b) => (b.score - b.prev) - (a.score - a.prev))
  const top = sorted[0]
  const bottom = sorted[sorted.length - 1]

  return (
    <section style={{ maxWidth: 1320, margin: "0 auto", padding: "36px 40px 0" }}>
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "flex-end",
        paddingBottom: 14, marginBottom: 20, borderBottom: `1px solid ${C.rule}`,
        flexWrap: "wrap", gap: 10,
      }}>
        <div>
          <div style={{ fontFamily: mono, fontSize: 10, letterSpacing: "0.3em", color: C.phosphor, marginBottom: 6 }}>
            § 01 · MOUVEMENTS DE LA SEMAINE
          </div>
          <h2 style={{ fontFamily: serif, fontSize: 36, fontWeight: 500, letterSpacing: "-0.025em", color: C.ink, margin: 0, lineHeight: 1 }}>
            Deux histoires <span style={{ fontStyle: "italic", color: C.phosphor }}>opposées</span>.
          </h2>
        </div>
        <span style={{ fontFamily: mono, fontSize: 10, color: C.muted, letterSpacing: "0.16em" }}>
          RECALCUL NOCTURNE · DERNIÈRE ÉDITION
        </span>
      </div>

      <div className="ab-wl-hero-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
        <HeroCard it={top} kind="TOP DE LA SEMAINE · MEILLEURE PROGRESSION" />
        <HeroCard it={bottom} kind="PIRE PERFORMANCE · À ARBITRER" />
      </div>
    </section>
  )
}

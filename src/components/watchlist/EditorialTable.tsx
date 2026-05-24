"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { C, serif, sans, mono, Gauge } from "@/components/landing/Gauge"
import { Sparkline } from "./Sparkline"
import { tone, band, type WatchlistItem } from "./types"

type SortKey = "delta" | "score" | "sym" | "sector"
type Density = "cozy" | "dense"

export function EditorialTable({
  items,
  onRemove,
  removing,
}: {
  items: WatchlistItem[]
  onRemove: (ticker: string) => void
  removing: string | null
}) {
  const [sortBy, setSortBy] = useState<SortKey>("delta")
  const [density, setDensity] = useState<Density>("cozy")

  const sorted = useMemo(() => {
    const list = [...items]
    if (sortBy === "score")  list.sort((a, b) => b.score - a.score)
    if (sortBy === "delta")  list.sort((a, b) => (b.score - b.prev) - (a.score - a.prev))
    if (sortBy === "sym")    list.sort((a, b) => a.ticker.localeCompare(b.ticker))
    if (sortBy === "sector") list.sort((a, b) => (a.sector || "").localeCompare(b.sector || ""))
    return list
  }, [items, sortBy])

  if (items.length === 0) return null

  const sorts: { id: SortKey; label: string }[] = [
    { id: "delta",  label: "VARIATION" },
    { id: "score",  label: "SCORE" },
    { id: "sym",    label: "A → Z" },
    { id: "sector", label: "SECTEUR" },
  ]

  const rowPad = density === "dense" ? "12px 0" : "20px 0"

  return (
    <section style={{ maxWidth: 1320, margin: "0 auto", padding: "60px 40px 0" }}>
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "flex-end",
        paddingBottom: 14, marginBottom: 0, borderBottom: `1px solid ${C.rule}`,
        flexWrap: "wrap", gap: 14,
      }}>
        <div>
          <div style={{ fontFamily: mono, fontSize: 10, letterSpacing: "0.3em", color: C.phosphor, marginBottom: 6 }}>
            § 03 · LE TABLEAU
          </div>
          <h2 style={{ fontFamily: serif, fontSize: 36, fontWeight: 500, letterSpacing: "-0.025em", color: C.ink, margin: 0, lineHeight: 1 }}>
            {items.length === 1 ? "Un titre" : `${items.length} titres`}, <span style={{ fontStyle: "italic", color: C.phosphor }}>en détail</span>.
          </h2>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontFamily: mono, fontSize: 10, color: C.muted, letterSpacing: "0.15em" }}>TRI ·</span>
            {sorts.map(s => (
              <button key={s.id} onClick={() => setSortBy(s.id)} style={{
                padding: "4px 8px", background: "transparent", border: "none",
                color: sortBy === s.id ? C.ink : C.muted, cursor: "pointer",
                fontFamily: mono, fontSize: 10, letterSpacing: "0.14em", fontWeight: 600,
                textDecoration: sortBy === s.id ? `underline ${C.phosphor}` : "none",
                textUnderlineOffset: 4,
              }}>
                {s.label}
              </button>
            ))}
          </div>

          <span style={{ width: 1, height: 16, background: C.rule }} />

          <div style={{ display: "inline-flex", border: `1px solid ${C.rule}`, borderRadius: 6, overflow: "hidden" }}>
            {(["cozy", "dense"] as Density[]).map(d => (
              <button key={d} onClick={() => setDensity(d)} style={{
                padding: "5px 10px", background: density === d ? `${C.phosphor}12` : "transparent",
                border: "none", color: density === d ? C.phosphor : C.muted,
                fontFamily: mono, fontSize: 10, letterSpacing: "0.14em", fontWeight: 600,
                cursor: "pointer",
              }}>
                {d === "cozy" ? "AÉRÉ" : "DENSE"}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="ab-wl-table">
        <div className="ab-wl-row ab-wl-head" style={{
          padding: "12px 0", gap: 18,
          fontFamily: mono, fontSize: 9, letterSpacing: "0.2em", color: C.muted,
          borderBottom: `1px solid ${C.rule}`,
        }}>
          <span></span>
          <span>TITRE / SECTEUR</span>
          <span style={{ textAlign: "right" }}>SCORE</span>
          <span style={{ textAlign: "right" }}>VAR. 7J</span>
          <span>TENDANCE</span>
          <span>DÉCOMPOSITION</span>
          <span style={{ textAlign: "right" }}>ACTION</span>
        </div>

        {sorted.map((r, i) => {
          const delta = r.score - r.prev
          const up = delta > 0
          const flat = delta === 0
          const t = tone(r.score)
          return (
            <div key={r.ticker} className="ab-wl-row" style={{
              padding: rowPad, gap: 18, alignItems: "center",
              borderBottom: i === sorted.length - 1 ? "none" : `1px solid ${C.rule}`,
            }}>
              <Link href={`/ticker/${r.ticker}`} style={{ display: "block" }}>
                <Gauge value={r.score} size={44} stroke={4.5} showNumeral={false} />
              </Link>

              <div style={{ minWidth: 0 }}>
                <Link href={`/ticker/${r.ticker}`} style={{ textDecoration: "none", color: "inherit", display: "block" }}>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
                    <span style={{ fontFamily: serif, fontSize: 20, fontWeight: 600, color: C.ink, letterSpacing: "-0.02em" }}>
                      {r.name || r.ticker}
                    </span>
                    {r.alert && (
                      <span style={{
                        fontFamily: mono, fontSize: 9, color: C.ember, letterSpacing: "0.15em",
                        border: `1px solid ${C.ember}50`, padding: "1px 6px", borderRadius: 3,
                      }}>
                        ALERTE
                      </span>
                    )}
                    <span style={{ fontFamily: mono, fontSize: 9, color: t, letterSpacing: "0.18em", fontWeight: 600 }}>
                      {band(r.score)}
                    </span>
                  </div>
                  <div style={{ fontFamily: mono, fontSize: 10, color: C.muted, letterSpacing: "0.14em", marginTop: 4 }}>
                    {r.ticker}{r.sector ? ` · ${r.sector.toUpperCase()}` : ""}
                  </div>
                  {density === "cozy" && (r.price || r.added) && (
                    <div style={{ fontFamily: sans, fontSize: 11, color: C.muted, marginTop: 3 }}>
                      {r.price ? `${r.price}` : ""}{r.price && r.added ? " · " : ""}{r.added ? `suivi depuis ${r.added}` : ""}
                    </div>
                  )}
                </Link>
              </div>

              <div style={{ textAlign: "right" }}>
                <div style={{ fontFamily: mono, fontSize: 28, fontWeight: 600, color: t, letterSpacing: "-0.04em", lineHeight: 1 }}>
                  {r.score}
                </div>
                {density === "cozy" && (
                  <div style={{ fontFamily: mono, fontSize: 9, color: C.muted, letterSpacing: "0.08em", marginTop: 4 }}>/100</div>
                )}
              </div>

              <div style={{ textAlign: "right" }}>
                <div style={{ fontFamily: mono, fontSize: 16, fontWeight: 600, color: flat ? C.muted : up ? C.phosphor : C.sanguine }}>
                  {flat ? "—" : (up ? "▲" : "▼")} {flat ? "0" : Math.abs(delta)} <span style={{ fontSize: 10, fontWeight: 500 }}>pts</span>
                </div>
                {r.chg && (
                  <div style={{
                    fontFamily: mono, fontSize: 9, marginTop: 3,
                    color: r.chg.startsWith("-") ? C.sanguine : C.phosphor,
                    letterSpacing: "0.04em",
                  }}>
                    cours {r.chg}
                  </div>
                )}
              </div>

              <div>
                <Sparkline data={r.hist} width={108} height={32} />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                {([
                  ["F", r.fund, 50, C.phosphor],
                  ["T", r.tech, 25, C.phosphorSoft],
                  ["M", r.mom,  25, C.ember],
                ] as const).map(([k, v, max, col]) => (
                  <div key={k} style={{ display: "flex", alignItems: "center", gap: 7 }}>
                    <span style={{ fontFamily: mono, fontSize: 9, color: C.muted, width: 8 }}>{k}</span>
                    <span style={{ flex: 1, height: 3, background: C.rule, borderRadius: 2, overflow: "hidden" }}>
                      <span style={{
                        display: "block", height: "100%",
                        width: `${(v / max) * 100}%`, background: col, borderRadius: 2,
                      }} />
                    </span>
                    <span style={{ fontFamily: mono, fontSize: 9, color: C.inkDim, width: 32, textAlign: "right" }}>
                      {v}/{max}
                    </span>
                  </div>
                ))}
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-end" }}>
                <Link href={`/ticker/${r.ticker}`} style={{
                  fontFamily: mono, fontSize: 10, color: C.phosphor, letterSpacing: "0.14em",
                  textDecoration: "none", fontWeight: 600,
                }}>
                  ANALYSE →
                </Link>
                <button
                  onClick={() => onRemove(r.ticker)}
                  disabled={removing === r.ticker}
                  style={{
                    background: "transparent", border: "none", padding: 0, cursor: "pointer",
                    fontFamily: mono, fontSize: 10, color: removing === r.ticker ? C.muted : C.sanguine,
                    letterSpacing: "0.14em",
                  }}
                >
                  {removing === r.ticker ? "…" : "RETIRER"}
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {density === "cozy" && (
        <div style={{
          marginTop: 12, padding: "20px 24px",
          background: C.bgCard, border: `1px solid ${C.rule}`, borderRadius: 12,
        }}>
          <div style={{ fontFamily: mono, fontSize: 10, color: C.muted, letterSpacing: "0.2em", marginBottom: 14 }}>
            VERDICTS · UNE LIGNE PAR TITRE
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 36px" }}>
            {sorted.map(r => {
              const t = tone(r.score)
              return (
                <div key={r.ticker} style={{
                  display: "flex", gap: 12, alignItems: "baseline",
                  fontFamily: serif, fontStyle: "italic", fontSize: 14, lineHeight: 1.5, color: C.inkDim,
                }}>
                  <span
                    style={{
                      fontStyle: "normal", fontFamily: sans, fontSize: 13, color: C.ink,
                      fontWeight: 600, width: 140, flexShrink: 0,
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                    }}
                    title={r.ticker}
                  >
                    {r.name || r.ticker}
                    <span style={{ color: t, fontFamily: mono, fontWeight: 600, marginLeft: 6 }}>· {r.score}</span>
                  </span>
                  <span><span style={{ color: t, fontStyle: "normal", marginRight: 4 }}>›</span>{r.note}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </section>
  )
}

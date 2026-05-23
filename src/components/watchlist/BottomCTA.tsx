"use client"

import { useState, FormEvent } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { C, serif, sans, mono } from "@/components/landing/Gauge"

const WATCHLIST_FREE_LIMIT = 10

export function WatchlistBottomCTA({
  count,
  isPremium,
  suggestionA,
  suggestionB,
}: {
  count: number
  isPremium: boolean
  suggestionA?: string
  suggestionB?: string
}) {
  const router = useRouter()
  const [a, setA] = useState(suggestionA || "NVDA")
  const [b, setB] = useState(suggestionB || "TSLA")

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const ta = a.trim().toUpperCase()
    const tb = b.trim().toUpperCase()
    if (!ta || !tb) return
    router.push(`/compare?a=${encodeURIComponent(ta)}&b=${encodeURIComponent(tb)}`)
  }

  return (
    <section style={{ maxWidth: 1320, margin: "0 auto", padding: "60px 40px 60px" }}>
      <div className="ab-wl-cta-grid" style={{
        display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 24,
      }}>
        <div style={{
          background: C.bgCard, border: `1px solid ${C.rule}`, borderRadius: 16,
          padding: "36px 36px 32px", position: "relative", overflow: "hidden",
        }}>
          <div aria-hidden style={{
            position: "absolute", top: -30, right: -30, width: 280, height: 280,
            background: `${C.phosphor}0E`, filter: "blur(100px)", pointerEvents: "none",
          }} />
          <div style={{ fontFamily: mono, fontSize: 10, color: C.phosphor, letterSpacing: "0.3em", marginBottom: 12 }}>
            § 05 · COMPARER
          </div>
          <h3 style={{ fontFamily: serif, fontSize: 30, fontWeight: 500, letterSpacing: "-0.02em", color: C.ink, margin: 0, lineHeight: 1.1 }}>
            Mettez deux titres <span style={{ fontStyle: "italic", color: C.phosphor }}>face à face</span>.
          </h3>
          <p style={{ fontFamily: serif, fontStyle: "italic", fontSize: 16, color: C.inkDim, lineHeight: 1.5, marginTop: 12, marginBottom: 0, maxWidth: 500 }}>
            Trois piliers, sept jours d&apos;historique, secteur et liquidité — sur un même tableau. Sortez la décision du brouillard.
          </p>

          <form onSubmit={submit} style={{
            marginTop: 22, display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap",
          }}>
            <div style={{
              flex: 1, minWidth: 140, display: "flex", gap: 8,
              padding: "12px 14px", background: C.bg, border: `1px solid ${C.rule}`, borderRadius: 8,
              alignItems: "center",
            }}>
              <span style={{ fontFamily: mono, fontSize: 11, color: C.muted, letterSpacing: "0.12em" }}>A ›</span>
              <input
                value={a}
                onChange={e => setA(e.target.value.toUpperCase())}
                placeholder="NVDA"
                style={{
                  background: "transparent", border: "none", outline: "none",
                  color: C.ink, fontFamily: mono, fontSize: 13, flex: 1, width: 0,
                }}
              />
            </div>
            <span style={{ fontFamily: mono, color: C.muted, fontSize: 13 }}>×</span>
            <div style={{
              flex: 1, minWidth: 140, display: "flex", gap: 8,
              padding: "12px 14px", background: C.bg, border: `1px solid ${C.rule}`, borderRadius: 8,
              alignItems: "center",
            }}>
              <span style={{ fontFamily: mono, fontSize: 11, color: C.muted, letterSpacing: "0.12em" }}>B ›</span>
              <input
                value={b}
                onChange={e => setB(e.target.value.toUpperCase())}
                placeholder="TSLA"
                style={{
                  background: "transparent", border: "none", outline: "none",
                  color: C.ink, fontFamily: mono, fontSize: 13, flex: 1, width: 0,
                }}
              />
            </div>
            <button type="submit" style={{
              padding: "12px 20px", background: C.phosphor, color: C.bg,
              fontFamily: sans, fontWeight: 600, fontSize: 13, borderRadius: 8,
              border: "none", cursor: "pointer",
            }}>
              Comparer →
            </button>
          </form>
        </div>

        <div style={{
          background: `${C.phosphor}08`, border: `1px solid ${C.phosphor}40`,
          borderRadius: 16, padding: 32, position: "relative", overflow: "hidden",
        }}>
          <div style={{
            fontFamily: mono, fontSize: 10, letterSpacing: "0.2em", color: C.phosphor,
            display: "inline-flex", alignItems: "center", gap: 6, marginBottom: 14,
            padding: "3px 8px", border: `1px solid ${C.phosphor}40`, borderRadius: 20,
          }}>
            ✦ WATCHLIST PRO
          </div>
          <div style={{
            fontFamily: serif, fontSize: 24, fontWeight: 500,
            letterSpacing: "-0.02em", color: C.ink, lineHeight: 1.15,
          }}>
            Jusqu&apos;à <span style={{ fontStyle: "italic", color: C.phosphor }}>50 titres</span>,
            alertes en temps réel, export hebdomadaire.
          </div>
          <div style={{ fontFamily: serif, fontStyle: "italic", fontSize: 15, color: C.inkDim, marginTop: 14 }}>
            {isPremium
              ? `Vous suivez actuellement ${count} titre${count > 1 ? "s" : ""} — plan Pro actif.`
              : `Vous suivez actuellement ${count} / ${WATCHLIST_FREE_LIMIT} titres${count >= WATCHLIST_FREE_LIMIT ? " — limite du plan Gratuit atteinte." : "."}`}
          </div>
          {!isPremium && (
            <Link href="/pricing" style={{
              display: "inline-block", marginTop: 20,
              padding: "11px 22px", background: C.phosphor, color: C.bg,
              fontFamily: sans, fontSize: 14, fontWeight: 600,
              borderRadius: 10, textDecoration: "none",
            }}>
              Passer Pro →
            </Link>
          )}
        </div>
      </div>
    </section>
  )
}

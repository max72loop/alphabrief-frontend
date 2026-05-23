"use client"

import { useState } from "react"
import Link from "next/link"
import { C, sans, mono } from "@/components/landing/Gauge"
import type { WatchlistItem } from "./types"

export type TabKey = "all" | "movers" | "alerts" | "strong" | "weak"

type Props = {
  items: WatchlistItem[]
  active: TabKey
  onChange: (k: TabKey) => void
  onAdd: (ticker: string) => Promise<boolean>
  adding: boolean
  errorMessage: string
  todayLabel: string
}

export function WatchlistSubnav({ items, active, onChange, onAdd, adding, errorMessage, todayLabel }: Props) {
  const [value, setValue] = useState("")

  const counts = {
    all: items.length,
    movers: items.filter(t => Math.abs(t.score - t.prev) >= 3).length,
    alerts: items.filter(t => t.alert).length,
    strong: items.filter(t => t.score >= 70).length,
    weak: items.filter(t => t.score < 50).length,
  }

  const tabs: { id: TabKey; label: string }[] = [
    { id: "all",    label: "Vue complète" },
    { id: "movers", label: "En mouvement" },
    { id: "alerts", label: "Alertes actives" },
    { id: "strong", label: "Score ≥ 70" },
    { id: "weak",   label: "Score < 50" },
  ]

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    const t = value.trim().toUpperCase()
    if (!t) return
    const ok = await onAdd(t)
    if (ok) setValue("")
  }

  return (
    <section style={{ maxWidth: 1320, margin: "0 auto", padding: "24px 40px 0" }}>
      <div style={{
        display: "flex", alignItems: "center", gap: 18,
        fontFamily: mono, fontSize: 10, color: C.muted, letterSpacing: "0.18em",
        paddingBottom: 14, borderBottom: `1px dashed ${C.rule}`,
      }}>
        <Link href="/dashboard" style={{ color: "inherit", textDecoration: "none" }}>ÉDITION</Link>
        <span style={{ color: C.muteDeep }}>/</span>
        <span style={{ color: C.ink }}>WATCHLIST</span>
        <span style={{ flex: 1 }} />
        <span>{todayLabel}</span>
      </div>

      <form
        onSubmit={submit}
        style={{
          marginTop: 14, padding: "12px 14px",
          background: C.bgCard, border: `1px solid ${C.rule}`, borderRadius: 10,
          display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap",
        }}
      >
        <span style={{ fontFamily: mono, fontSize: 11, color: C.phosphor, letterSpacing: "0.14em" }}>+</span>
        <input
          type="text"
          value={value}
          onChange={e => setValue(e.target.value.toUpperCase())}
          placeholder="Ajouter un ticker · ex AAPL, MC.PA, 9988.HK"
          autoComplete="off"
          spellCheck={false}
          style={{
            flex: 1, minWidth: 220,
            background: C.bg, border: `1px solid ${C.rule}`, borderRadius: 8,
            padding: "10px 12px", outline: "none", color: C.ink,
            fontFamily: mono, fontSize: 13, letterSpacing: "0.04em",
          }}
        />
        <button
          type="submit"
          disabled={adding || !value.trim()}
          style={{
            padding: "10px 18px",
            background: adding || !value.trim() ? C.bgElev : C.phosphor,
            color: adding || !value.trim() ? C.muted : C.bg,
            fontFamily: sans, fontSize: 13, fontWeight: 600,
            border: "none", borderRadius: 8,
            cursor: adding ? "wait" : !value.trim() ? "not-allowed" : "pointer",
          }}
        >
          {adding ? "Ajout…" : "Ajouter →"}
        </button>
      </form>

      {errorMessage && (
        <div style={{
          marginTop: 10, padding: "10px 14px",
          background: `${C.sanguine}10`, border: `1px solid ${C.sanguine}40`,
          borderRadius: 8, fontFamily: mono, fontSize: 11, color: C.sanguine,
        }}>
          {errorMessage}
        </div>
      )}

      <div style={{ display: "flex", alignItems: "center", gap: 4, padding: "14px 0 0", flexWrap: "wrap" }}>
        {tabs.map(t => {
          const on = active === t.id
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => onChange(t.id)}
              style={{
                padding: "8px 14px",
                background: on ? `${C.phosphor}10` : "transparent",
                border: `1px solid ${on ? C.phosphor + "50" : "transparent"}`,
                color: on ? C.phosphor : C.inkDim,
                fontFamily: sans, fontSize: 13, fontWeight: 500, letterSpacing: "-0.005em",
                borderRadius: 8, cursor: "pointer",
                display: "inline-flex", alignItems: "center", gap: 8,
              }}
            >
              {t.label}
              <span style={{
                fontFamily: mono, fontSize: 10, color: on ? C.phosphor : C.muted,
                padding: "1px 6px", borderRadius: 10,
                border: `1px solid ${on ? C.phosphor + "40" : C.rule}`,
              }}>
                {counts[t.id]}
              </span>
            </button>
          )
        })}
      </div>
    </section>
  )
}

"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { C, serif, sans, mono, Gauge, SCORE_THRESHOLDS, scoreColor, scoreLabel } from "@/components/landing/Gauge";

export type WatchRow = {
  ticker: string;
  name: string | null;
  sector: string | null;
  score: number;
  fund: number;
  tech: number;
  mom: number;
  alert: boolean;
  momentum3m?: number | null;
  rsi14?: number | null;
};

const toneFor = scoreColor;
const bandFor = scoreLabel;
function verdictFor(score: number) {
  if (score >= SCORE_THRESHOLDS.excellent) return "Signal fort — fondamentaux et momentum alignés.";
  if (score >= SCORE_THRESHOLDS.good)      return "Profil solide. Un pilier à surveiller.";
  if (score >= SCORE_THRESHOLDS.neutral)   return "Mixte. Pas de signal franc, mieux vaut passer son tour.";
  return "Vent contraire. Plusieurs piliers en faiblesse.";
}

const FILTERS = [
  { id: "all", label: "TOUS" },
  { id: "alerts", label: "ALERTES" },
  { id: "strong", label: `SCORE ≥ ${SCORE_THRESHOLDS.good}` },
  { id: "weak", label: `SCORE < ${SCORE_THRESHOLDS.neutral}` },
] as const;

const SORTS = [
  { id: "score", label: "SCORE" },
  { id: "sym", label: "A → Z" },
  { id: "alert", label: "ALERTES" },
] as const;

type FilterId = (typeof FILTERS)[number]["id"];
type SortId = (typeof SORTS)[number]["id"];

export default function DashboardWatchlist({ rows }: { rows: WatchRow[] }) {
  const [sortBy, setSortBy] = useState<SortId>("score");
  const [filter, setFilter] = useState<FilterId>("all");

  const filtered = useMemo(() => {
    let list = [...rows];
    if (filter === "alerts") list = list.filter((r) => r.alert);
    if (filter === "strong") list = list.filter((r) => r.score >= SCORE_THRESHOLDS.good);
    if (filter === "weak")   list = list.filter((r) => r.score < SCORE_THRESHOLDS.neutral);
    if (sortBy === "score") list.sort((a, b) => b.score - a.score);
    if (sortBy === "sym") list.sort((a, b) => a.ticker.localeCompare(b.ticker));
    if (sortBy === "alert") list.sort((a, b) => Number(b.alert) - Number(a.alert) || b.score - a.score);
    return list;
  }, [rows, sortBy, filter]);

  const movers = rows.filter((r) => r.alert).length;

  return (
    <section style={{ padding: "40px 40px 60px", maxWidth: 1320, margin: "0 auto" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          paddingBottom: 18,
          borderBottom: `1px solid ${C.rule}`,
          gap: 16,
          flexWrap: "wrap",
        }}
      >
        <div>
          <div style={{ fontFamily: mono, fontSize: 10, letterSpacing: "0.3em", color: C.phosphor, marginBottom: 6 }}>
            § 02 · MA WATCHLIST
          </div>
          <h2
            style={{
              fontFamily: serif,
              fontSize: "clamp(28px, 3.5vw, 38px)",
              fontWeight: 500,
              letterSpacing: "-0.025em",
              color: C.ink,
              margin: 0,
              lineHeight: 1,
            }}
          >
            {rows.length === 0 ? (
              <>Aucun titre suivi pour le moment.</>
            ) : (
              <>
                {rows.length} titre{rows.length > 1 ? "s" : ""} suivi{rows.length > 1 ? "s" : ""}.{" "}
                <span style={{ fontStyle: "italic", color: C.phosphor }}>
                  {movers === 0 ? "Aucune alerte." : `${movers} en alerte.`}
                </span>
              </>
            )}
          </h2>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Link
            href="/marche"
            style={{
              padding: "8px 14px",
              background: "transparent",
              border: `1px dashed ${C.rule}`,
              color: C.muted,
              fontFamily: mono,
              fontSize: 11,
              letterSpacing: "0.1em",
              borderRadius: 8,
              textDecoration: "none",
            }}
          >
            + AJOUTER UN TITRE
          </Link>
        </div>
      </div>

      {rows.length === 0 ? (
        <div
          style={{
            padding: "60px 20px",
            textAlign: "center",
            fontFamily: serif,
            fontStyle: "italic",
            fontSize: 18,
            color: C.muted,
          }}
        >
          Ajoutez votre premier titre depuis le <Link href="/marche" style={{ color: C.phosphor }}>screener</Link>.
        </div>
      ) : (
        <>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "16px 0",
              borderBottom: `1px dashed ${C.rule}`,
              gap: 12,
              flexWrap: "wrap",
            }}
          >
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {FILTERS.map((f) => (
                <button
                  key={f.id}
                  onClick={() => setFilter(f.id)}
                  style={{
                    padding: "6px 12px",
                    background: filter === f.id ? `${C.phosphor}10` : "transparent",
                    border: `1px solid ${filter === f.id ? C.phosphor + "60" : C.rule}`,
                    color: filter === f.id ? C.phosphor : C.muted,
                    fontFamily: mono,
                    fontSize: 10,
                    letterSpacing: "0.14em",
                    fontWeight: 600,
                    borderRadius: 4,
                    cursor: "pointer",
                  }}
                >
                  {f.label}
                </button>
              ))}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontFamily: mono, fontSize: 10, color: C.muted, letterSpacing: "0.15em" }}>TRI ·</span>
              {SORTS.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setSortBy(s.id)}
                  style={{
                    padding: "4px 8px",
                    background: "transparent",
                    border: "none",
                    color: sortBy === s.id ? C.ink : C.muted,
                    cursor: "pointer",
                    fontFamily: mono,
                    fontSize: 10,
                    letterSpacing: "0.14em",
                    fontWeight: 600,
                    textDecoration: sortBy === s.id ? `underline ${C.phosphor}` : "none",
                    textUnderlineOffset: 4,
                  }}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          <div
            className="ab-watch-headers"
            style={{
              display: "grid",
              gridTemplateColumns: "60px 1.4fr 90px 110px 1.2fr 1.4fr 90px",
              padding: "14px 0",
              gap: 18,
              fontFamily: mono,
              fontSize: 9,
              letterSpacing: "0.2em",
              color: C.muted,
              borderBottom: `1px solid ${C.rule}`,
            }}
          >
            <span>GAUGE</span>
            <span>TITRE / SECTEUR</span>
            <span style={{ textAlign: "right" }}>SCORE</span>
            <span style={{ textAlign: "right" }}>MOMENTUM 3M</span>
            <span>DÉCOMPOSITION</span>
            <span>VERDICT</span>
            <span style={{ textAlign: "right" }}>ACTION</span>
          </div>

          {filtered.map((r, i) => {
            const tone = toneFor(r.score);
            return (
              <Link
                key={r.ticker}
                href={`/ticker/${r.ticker}`}
                className="ab-watch-row"
                style={{
                  display: "grid",
                  gridTemplateColumns: "60px 1.4fr 90px 110px 1.2fr 1.4fr 90px",
                  padding: "20px 0",
                  gap: 18,
                  alignItems: "center",
                  borderBottom: i === filtered.length - 1 ? "none" : `1px solid ${C.rule}`,
                  textDecoration: "none",
                  color: "inherit",
                  position: "relative",
                }}
              >
                <Gauge value={r.score} size={52} stroke={5} showNumeral={false} />

                <div style={{ minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
                    <span
                      style={{
                        fontFamily: serif,
                        fontSize: 20,
                        fontWeight: 600,
                        color: C.ink,
                        letterSpacing: "-0.02em",
                      }}
                    >
                      {r.name || r.ticker}
                    </span>
                    {r.alert && (
                      <span
                        style={{
                          fontFamily: mono,
                          fontSize: 9,
                          color: C.ember,
                          letterSpacing: "0.15em",
                          border: `1px solid ${C.ember}50`,
                          padding: "1px 6px",
                          borderRadius: 3,
                        }}
                      >
                        ALERTE
                      </span>
                    )}
                  </div>
                  <div style={{ fontFamily: mono, fontSize: 10, color: C.muted, letterSpacing: "0.14em", marginTop: 4 }}>
                    {r.ticker}{r.sector ? ` · ${r.sector.toUpperCase()}` : ""}
                  </div>
                </div>

                <div style={{ textAlign: "right" }}>
                  <div
                    style={{
                      fontFamily: mono,
                      fontSize: 32,
                      fontWeight: 600,
                      color: tone,
                      letterSpacing: "-0.04em",
                      lineHeight: 1,
                    }}
                  >
                    {r.score}
                  </div>
                  <div style={{ fontFamily: mono, fontSize: 9, color: tone, letterSpacing: "0.16em", marginTop: 4 }}>
                    {bandFor(r.score)}
                  </div>
                </div>

                {/* Momentum 3M */}
                <div style={{ textAlign: "right" }}>
                  {r.momentum3m == null ? (
                    <span style={{ fontFamily: mono, fontSize: 13, color: C.muted }}>—</span>
                  ) : (
                    <>
                      <div
                        style={{
                          fontFamily: mono,
                          fontSize: 18,
                          fontWeight: 600,
                          color: r.momentum3m > 0 ? C.phosphor : r.momentum3m < 0 ? C.sanguine : C.muted,
                        }}
                      >
                        {r.momentum3m > 0 ? "▲" : r.momentum3m < 0 ? "▼" : "—"}{" "}
                        {Math.abs(r.momentum3m).toFixed(1)}
                        <span style={{ fontSize: 11, fontWeight: 500 }}>%</span>
                      </div>
                      <div style={{ fontFamily: mono, fontSize: 9, color: C.muted, letterSpacing: "0.14em", marginTop: 4 }}>
                        SUR 3 MOIS
                      </div>
                    </>
                  )}
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {([
                    ["F", r.fund, 50, C.phosphor],
                    ["T", r.tech, 25, C.phosphorSoft],
                    ["M", r.mom, 25, C.ember],
                  ] as const).map(([k, v, max, col]) => (
                    <div key={k} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontFamily: mono, fontSize: 9, color: C.muted, width: 10 }}>{k}</span>
                      <span
                        style={{
                          flex: 1,
                          height: 4,
                          background: C.rule,
                          borderRadius: 2,
                          overflow: "hidden",
                        }}
                      >
                        <span
                          style={{
                            display: "block",
                            height: "100%",
                            width: `${Math.min(100, (v / max) * 100)}%`,
                            background: col,
                            borderRadius: 2,
                          }}
                        />
                      </span>
                      <span
                        style={{
                          fontFamily: mono,
                          fontSize: 9,
                          color: C.inkDim,
                          width: 38,
                          textAlign: "right",
                        }}
                      >
                        {v}/{max}
                      </span>
                    </div>
                  ))}
                </div>

                <div
                  style={{
                    fontFamily: serif,
                    fontStyle: "italic",
                    fontSize: 13.5,
                    lineHeight: 1.4,
                    color: C.inkDim,
                    paddingRight: 8,
                  }}
                >
                  <span style={{ color: tone, fontStyle: "normal", marginRight: 4 }}>›</span>
                  {verdictFor(r.score)}
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-end" }}>
                  <span
                    style={{
                      fontFamily: mono,
                      fontSize: 10,
                      color: C.phosphor,
                      letterSpacing: "0.14em",
                    }}
                  >
                    ANALYSE →
                  </span>
                </div>
              </Link>
            );
          })}
        </>
      )}
    </section>
  );
}

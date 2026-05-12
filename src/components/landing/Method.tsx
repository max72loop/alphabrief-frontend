"use client";

import { useState } from "react";
import { C, serif, sans, mono, Gauge } from "./Gauge";

type PillarKey = "fund" | "tech" | "mom";

export function Method() {
  const [hover, setHover] = useState<PillarKey | null>(null);

  const pillars = [
    {
      key: "fund" as const, label: "FONDAMENTAUX", weight: 50, color: C.phosphor,
      value: 46, total: 50,
      title: "Ce que l'entreprise vaut.",
      desc: "Marges, croissance du chiffre d'affaires, dette, ROIC. Méthode inspirée de Brian Feroldi.",
      metrics: [
        ["Marge opé.", "38.2%", C.phosphor],
        ["Croiss. CA 3Y", "+62%", C.phosphor],
        ["ROIC", "28.4%", C.phosphor],
        ["Dette / Equity", "0.41", C.phosphorSoft],
      ] as [string, string, string][],
    },
    {
      key: "tech" as const, label: "TECHNIQUE", weight: 25, color: C.phosphorSoft,
      value: 18, total: 25,
      title: "Ce que le marché en pense.",
      desc: "RSI 14 jours, volatilité annuelle, drawdown maximum. Pour repérer la zone d'achat.",
      metrics: [
        ["RSI 14", "64", C.ember],
        ["Volatilité", "34%", C.phosphorSoft],
        ["Drawdown max", "-18%", C.phosphor],
        ["MA 50 / 200", "Haussier", C.phosphor],
      ] as [string, string, string][],
    },
    {
      key: "mom" as const, label: "MOMENTUM", weight: 25, color: C.ember,
      value: 20, total: 25,
      title: "Où va le vent.",
      desc: "Performance relative sur 1, 3, 6, 12 mois vs marché et secteur.",
      metrics: [
        ["Perf 1M", "+8%", C.phosphor],
        ["Perf 3M", "+21%", C.phosphor],
        ["Perf 6M", "+47%", C.phosphor],
        ["vs S&P 500", "+35%", C.phosphor],
      ] as [string, string, string][],
    },
  ];

  const active = pillars.find((p) => p.key === hover);
  const decomp = hover
    ? {
        fund: hover === "fund" ? 0.46 : 0,
        tech: hover === "tech" ? 0.18 : 0,
        mom:  hover === "mom"  ? 0.20 : 0,
      }
    : { fund: 0.46, tech: 0.18, mom: 0.20 };
  const showValue = hover && active ? active.value : 84;

  return (
    <section id="methode" style={{ padding: "120px 40px", maxWidth: 1280, margin: "0 auto" }}>
      <div className="text-center" style={{ marginBottom: 64 }}>
        <div style={{ fontFamily: mono, fontSize: 10, letterSpacing: "0.3em", color: C.phosphor, marginBottom: 14 }}>
          § 01 · MÉTHODE
        </div>
        <h2 style={{ fontFamily: serif, fontSize: 56, fontWeight: 500, letterSpacing: "-0.025em", color: C.ink, margin: 0, lineHeight: 1 }}>
          Un score. <span style={{ fontStyle: "italic", color: C.phosphor }}>Trois piliers.</span>
        </h2>
        <p style={{ fontFamily: serif, fontStyle: "italic", fontSize: 18, color: C.muted, marginTop: 20, maxWidth: 580, marginLeft: "auto", marginRight: "auto" }}>
          Survolez un pilier pour voir sa contribution au score final.
        </p>
      </div>

      <div className="grid items-center" style={{ gridTemplateColumns: "1fr 1.05fr", gap: 64 }}>
        <div
          className="relative flex flex-col items-center"
          style={{ padding: 40, background: C.bgCard, border: `1px solid ${C.rule}`, borderRadius: 16, gap: 20 }}
        >
          <div style={{ fontFamily: mono, fontSize: 10, letterSpacing: "0.2em", color: C.muted }}>
            {hover && active ? `CONTRIBUTION · ${active.label}` : "SCORE COMPOSITE · NVDA"}
          </div>

          <Gauge
            value={showValue}
            size={300}
            stroke={18}
            decomposition={hover ? null : decomp}
            showNumeral
            label={hover && active ? `${active.value} / ${active.total}` : "EXCELLENT"}
          />

          {!hover && (
            <div className="flex flex-wrap justify-center" style={{ gap: 20 }}>
              {pillars.map((p) => (
                <div key={p.key} className="flex items-center gap-2">
                  <span style={{ width: 10, height: 10, background: p.color, borderRadius: 2 }} />
                  <span style={{ fontFamily: mono, fontSize: 10, color: C.muted, letterSpacing: "0.1em" }}>
                    {p.label} {p.value}
                  </span>
                </div>
              ))}
            </div>
          )}

          {hover && active && (
            <div style={{ padding: "16px 20px", background: C.bg, borderRadius: 8, border: `1px solid ${C.rule}`, minHeight: 100, maxWidth: 340 }}>
              <div className="grid" style={{ gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {active.metrics.map(([lab, val, col]) => (
                  <div key={lab} className="flex justify-between" style={{ fontFamily: mono, fontSize: 11 }}>
                    <span style={{ color: C.muted }}>{lab}</span>
                    <span style={{ color: col, fontWeight: 600 }}>{val}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col" style={{ gap: 12 }}>
          {pillars.map((p) => (
            <div
              key={p.key}
              onMouseEnter={() => setHover(p.key)}
              onMouseLeave={() => setHover(null)}
              className="relative overflow-hidden cursor-pointer"
              style={{
                padding: "22px 26px",
                background: hover === p.key ? C.bgElev : C.bgCard,
                border: `1px solid ${hover === p.key ? p.color + "80" : C.rule}`,
                borderRadius: 12,
                transition: "all 0.25s",
              }}
            >
              {hover === p.key && (
                <div className="absolute left-0 top-0 bottom-0" style={{ width: 4, background: p.color }} />
              )}
              <div className="flex justify-between items-baseline" style={{ marginBottom: 10 }}>
                <div className="flex items-baseline gap-3">
                  <span style={{ fontFamily: mono, fontSize: 10, color: p.color, letterSpacing: "0.2em" }}>{p.label}</span>
                  <span style={{ fontFamily: mono, fontSize: 11, color: C.muted }}>pondération {p.weight}%</span>
                </div>
                <span style={{ fontFamily: mono, fontSize: 16, fontWeight: 600, color: p.color }}>
                  {p.value}/{p.total}
                </span>
              </div>
              <div style={{ fontFamily: serif, fontSize: 22, fontWeight: 500, color: C.ink, letterSpacing: "-0.02em", marginBottom: 6 }}>
                {p.title}
              </div>
              <div style={{ fontFamily: sans, fontSize: 14, color: C.inkDim, lineHeight: 1.5 }}>{p.desc}</div>
              <div className="overflow-hidden" style={{ marginTop: 14, height: 3, background: C.rule, borderRadius: 2 }}>
                <div style={{ width: `${(p.value / p.total) * 100}%`, height: "100%", background: p.color, transition: "width 0.4s" }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

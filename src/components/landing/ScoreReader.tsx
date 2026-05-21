"use client";

import { useState } from "react";
import { C, serif, mono, Gauge, SCORE_THRESHOLDS, scoreColor } from "./Gauge";

const BANDS = [
  { min: SCORE_THRESHOLDS.excellent, label: "EXCELLENT", verdict: "Signal fort",   color: C.phosphor,     desc: "Fondamentaux solides, momentum positif, technique en zone d'achat. On surveille, on n'attend pas." },
  { min: SCORE_THRESHOLDS.good,      label: "BON",       verdict: "À surveiller",   color: C.phosphorSoft, desc: "Bonne qualité globale mais un pilier en retrait. Point d'entrée possible sur correction." },
  { min: SCORE_THRESHOLDS.neutral,   label: "NEUTRE",    verdict: "Pas de signal",  color: C.ember,        desc: "Profil mixte — métriques contrastées. Mieux vaut passer son tour ou approfondir l'analyse." },
  { min: SCORE_THRESHOLDS.weak,      label: "ATTENTION", verdict: "Vent contraire", color: "#E58A4E",      desc: "Faiblesses identifiées sur plusieurs piliers. Rester à l'écart sauf thèse forte." },
  { min: 0,                          label: "ÉVITER",    verdict: "À éviter",       color: C.sanguine,     desc: "Score faible sur l'ensemble. Revoir en profondeur ou passer à autre chose." },
];

const EXAMPLES = [
  { sym: "NVDA", score: 84 },
  { sym: "MSFT", score: 78 },
  { sym: "AAPL", score: 62 },
  { sym: "LVMH", score: 58 },
  { sym: "PLTR", score: 48 },
  { sym: "TSLA", score: 41 },
  { sym: "BB",   score: 22 },
];

export function ScoreReader() {
  const [v, setV] = useState(72);
  const band = BANDS.find((b) => v >= b.min)!;

  return (
    <section id="score" style={{ padding: "40px 40px 120px", maxWidth: 1100, margin: "0 auto" }}>
      <div className="text-center" style={{ marginBottom: 56 }}>
        <div style={{ fontFamily: mono, fontSize: 10, letterSpacing: "0.3em", color: C.phosphor, marginBottom: 14 }}>
          § 03 · LIRE UN SCORE
        </div>
        <h2 style={{ fontFamily: serif, fontSize: 56, fontWeight: 500, letterSpacing: "-0.025em", color: C.ink, margin: 0, lineHeight: 1 }}>
          De <span style={{ fontFamily: mono, fontSize: 40, verticalAlign: "0.04em" }}>0</span> à{" "}
          <span style={{ fontFamily: mono, fontSize: 40, verticalAlign: "0.04em" }}>100</span>.{" "}
          <span style={{ fontStyle: "italic", color: C.phosphor }}>Glissez pour lire.</span>
        </h2>
      </div>

      <div
        className="grid items-center"
        style={{ background: C.bgCard, border: `1px solid ${C.rule}`, borderRadius: 16, padding: 48, gridTemplateColumns: "1fr 1.1fr", gap: 48 }}
      >
        <div className="flex flex-col items-center" style={{ gap: 24 }}>
          <Gauge value={v} size={280} stroke={18} label={band.label} />
          <input
            type="range"
            min={0}
            max={100}
            value={v}
            step={1}
            onChange={(e) => setV(parseInt(e.target.value))}
            className="ab-score-slider"
            style={{
              width: "100%",
              maxWidth: 300,
              height: 4,
              WebkitAppearance: "none",
              appearance: "none",
              background: `linear-gradient(90deg, ${C.sanguine}, ${C.ember} 45%, ${C.phosphorSoft} 60%, ${C.phosphor} 75%)`,
              borderRadius: 2,
              outline: "none",
              cursor: "pointer",
            }}
          />
          <div style={{ fontFamily: mono, fontSize: 10, color: C.muted, letterSpacing: "0.2em" }}>
            ← GLISSEZ POUR EXPLORER →
          </div>
        </div>

        <div>
          <div style={{ fontFamily: mono, fontSize: 10, letterSpacing: "0.2em", color: C.muted, marginBottom: 14 }}>
            VERDICT
          </div>
          <div style={{ fontFamily: serif, fontSize: 56, fontWeight: 500, lineHeight: 1, color: band.color, letterSpacing: "-0.03em", marginBottom: 10 }}>
            {band.verdict}.
          </div>
          <div style={{ fontFamily: serif, fontStyle: "italic", fontSize: 18, lineHeight: 1.5, color: C.inkDim, marginBottom: 32 }}>
            {band.desc}
          </div>

          <div style={{ fontFamily: mono, fontSize: 10, letterSpacing: "0.2em", color: C.muted, marginBottom: 12 }}>
            EXEMPLES · CLIQUEZ POUR SAUTER
          </div>
          <div className="flex flex-wrap gap-1.5">
            {EXAMPLES.map((e) => (
              <button
                key={e.sym}
                onClick={() => setV(e.score)}
                className="inline-flex items-center gap-2 cursor-pointer"
                style={{
                  padding: "6px 12px",
                  border: `1px solid ${C.rule}`,
                  background: e.score >= SCORE_THRESHOLDS.excellent ? `${C.phosphor}10`
                    : e.score >= SCORE_THRESHOLDS.neutral ? `${C.ember}08`
                    : `${C.sanguine}10`,
                  color: scoreColor(e.score),
                  fontFamily: mono,
                  fontSize: 11,
                  fontWeight: 600,
                  borderRadius: 4,
                }}
              >
                <span style={{ color: C.ink }}>{e.sym}</span>
                <span>{e.score}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

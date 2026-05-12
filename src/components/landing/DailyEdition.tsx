"use client";

import { C, serif, mono, Gauge } from "./Gauge";

type Item = {
  sym: string;
  name: string;
  score: number;
  prev: number;
  chg: string;
  note: string;
  tag: string;
};

const ITEMS: Item[] = [
  { sym: "NVDA", name: "NVIDIA Corp.",        score: 84, prev: 82, chg: "+2.1%", note: "Marges d'exploitation record, croissance CA trois chiffres, momentum intact. Zone d'achat confirmée.", tag: "HIGHLIGHT" },
  { sym: "ASML", name: "ASML Holding",        score: 71, prev: 68, chg: "+1.3%", note: "Reprise des commandes mémoire après un trimestre terne. Technique vire haussier.", tag: "ROTATION" },
  { sym: "LVMH", name: "LVMH Moët Hennessy",  score: 58, prev: 64, chg: "-0.9%", note: "Ralentissement Chine confirmé. Fondamentaux solides mais momentum s'essouffle.", tag: "DOWNGRADE" },
  { sym: "TSLA", name: "Tesla Inc.",          score: 41, prev: 47, chg: "-3.4%", note: "Marges auto compressées, concurrence BYD frontale. À revoir.", tag: "AVOID" },
];

export function DailyEdition() {
  return (
    <section id="edition" style={{ padding: "80px 40px 120px", maxWidth: 1280, margin: "0 auto" }}>
      <div
        className="flex justify-between items-baseline"
        style={{ borderTop: `2px solid ${C.ink}`, borderBottom: `1px solid ${C.rule}`, padding: "20px 0 16px" }}
      >
        <div>
          <div style={{ fontFamily: mono, fontSize: 10, letterSpacing: "0.3em", color: C.phosphor, marginBottom: 6 }}>
            § 02 · ÉDITION DU JOUR
          </div>
          <h2 style={{ fontFamily: serif, fontSize: 48, fontWeight: 500, letterSpacing: "-0.025em", color: C.ink, margin: 0, lineHeight: 1 }}>
            Les mouvements <span style={{ fontStyle: "italic", color: C.phosphor }}>qui comptent</span>, ce matin.
          </h2>
        </div>
        <div className="text-right" style={{ fontFamily: mono, fontSize: 11, color: C.muted, letterSpacing: "0.1em" }}>
          VOL.&nbsp;I · №&nbsp;112<br />
          LUNDI 20 AVRIL 2026<br />
          04:32 UTC · RECALCUL NOCTURNE
        </div>
      </div>

      <div className="grid" style={{ gridTemplateColumns: "repeat(4, 1fr)", borderBottom: `1px solid ${C.rule}` }}>
        {ITEMS.map((it, i) => {
          const delta = it.score - it.prev;
          const up = delta > 0;
          const tagColor = up ? C.phosphor : it.tag === "DOWNGRADE" ? C.ember : C.sanguine;
          const scoreColor =
            it.score >= 75 ? C.phosphor
            : it.score >= 60 ? C.phosphorSoft
            : it.score >= 45 ? C.ember
            : C.sanguine;
          return (
            <div
              key={it.sym}
              className="flex flex-col"
              style={{
                padding: "28px 24px",
                borderRight: i < ITEMS.length - 1 ? `1px solid ${C.rule}` : "none",
                gap: 14,
                background: i === 0 ? `${C.phosphor}05` : "transparent",
              }}
            >
              <div className="flex justify-between items-center">
                <span style={{ fontFamily: mono, fontSize: 9, letterSpacing: "0.2em", color: tagColor, fontWeight: 600 }}>
                  {it.tag}
                </span>
                <span style={{ fontFamily: mono, fontSize: 10, color: up ? C.phosphor : C.sanguine }}>
                  {up ? "▲" : "▼"} {Math.abs(delta)} PTS
                </span>
              </div>

              <div>
                <div style={{ fontFamily: serif, fontSize: 28, fontWeight: 600, color: C.ink, letterSpacing: "-0.02em" }}>
                  {it.sym}
                </div>
                <div style={{ fontFamily: mono, fontSize: 10, color: C.muted, letterSpacing: "0.08em" }}>
                  {it.name.toUpperCase()}
                </div>
              </div>

              <div
                className="flex items-center justify-between"
                style={{ padding: "14px 0", borderTop: `1px dashed ${C.rule}`, borderBottom: `1px dashed ${C.rule}` }}
              >
                <div className="flex flex-col">
                  <span style={{ fontFamily: mono, fontSize: 9, color: C.muted, letterSpacing: "0.16em" }}>SCORE</span>
                  <span style={{ fontFamily: mono, fontSize: 42, fontWeight: 600, color: scoreColor, letterSpacing: "-0.04em", lineHeight: 1 }}>
                    {it.score}
                  </span>
                </div>
                <Gauge value={it.score} size={70} stroke={7} showNumeral={false} />
              </div>

              <div style={{ fontFamily: serif, fontStyle: "italic", fontSize: 14, lineHeight: 1.45, color: C.inkDim }}>
                <span style={{ color: C.phosphor, fontStyle: "normal", marginRight: 6 }}>›</span>
                {it.note}
              </div>

              <a href="#" style={{ marginTop: "auto", fontFamily: mono, fontSize: 10, letterSpacing: "0.16em", color: C.phosphor, textDecoration: "none" }}>
                LIRE L&apos;ANALYSE →
              </a>
            </div>
          );
        })}
      </div>

      <div
        className="flex justify-between items-center"
        style={{ padding: "16px 0", fontFamily: mono, fontSize: 10, color: C.muted, letterSpacing: "0.1em" }}
      >
        <span>QUALITY 50% · TECHNICAL 25% · MOMENTUM 25%</span>
        <a href="#" style={{ color: C.phosphor, textDecoration: "none" }}>
          VOIR L&apos;ÉDITION COMPLÈTE (32 MOUVEMENTS) →
        </a>
      </div>
    </section>
  );
}

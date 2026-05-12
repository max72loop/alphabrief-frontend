"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { C, serif, sans, mono, Gauge } from "./Gauge";

export function Hero() {
  const [score, setScore] = useState(0);
  const [cycle, setCycle] = useState(0);

  useEffect(() => {
    const tgt = 84;
    let v = 0;
    const id = setInterval(() => {
      v += (tgt - v) * 0.12 + Math.random() * 0.4;
      if (Math.abs(v - tgt) < 0.6) {
        setTimeout(() => {
          v = 0;
          setCycle((c) => c + 1);
        }, 2400);
      }
      setScore(Math.min(100, v));
    }, 60);
    return () => clearInterval(id);
  }, [cycle]);

  const metrics = [
    { label: "ROIC",       val: "28.4%", color: C.phosphor },
    { label: "CROISS. CA", val: "+94%",  color: C.phosphor },
    { label: "RSI 14",     val: "64",    color: C.ember },
    { label: "PERF 3M",    val: "+21%",  color: C.phosphor },
  ];

  return (
    <section
      className="relative grid items-center"
      style={{ padding: "120px 40px 80px", gridTemplateColumns: "1.15fr 1fr", gap: 80, maxWidth: 1280, margin: "0 auto" }}
    >
      <div aria-hidden className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div
          className="absolute"
          style={{
            top: "20%", right: "10%", width: 500, height: 400,
            borderRadius: "50%", background: `${C.phosphor}14`, filter: "blur(120px)",
          }}
        />
      </div>

      <div className="relative z-[1]">
        <div
          className="inline-flex items-center gap-2.5"
          style={{
            padding: "5px 12px", border: `1px solid ${C.rule}`, borderRadius: 20,
            fontFamily: mono, fontSize: 10, color: C.muted, letterSpacing: "0.14em",
            marginBottom: 28,
          }}
        >
          <span
            className="w-1.5 h-1.5 rounded-full"
            style={{ background: C.phosphor, boxShadow: `0 0 6px ${C.phosphor}` }}
          />
          ÉDITION DU 20 AVRIL · 4&nbsp;218 TITRES SCORÉS
        </div>

        <h1 style={{ fontFamily: serif, fontSize: 72, fontWeight: 500, lineHeight: 0.98, letterSpacing: "-0.035em", color: C.ink, margin: 0 }}>
          Lisez l&apos;action<br />
          <span style={{ fontStyle: "italic", color: C.phosphor }}>avant</span> de la trader.
        </h1>

        <p style={{ fontFamily: serif, fontStyle: "italic", fontSize: 21, lineHeight: 1.45, color: C.inkDim, marginTop: 28, marginBottom: 0, maxWidth: 520, fontWeight: 500 }}>
          Un score unique de 0 à 100, composé chaque nuit à partir des fondamentaux, du technique et du momentum. Plus de vingt métriques — un seul verdict.
        </p>

        <div className="flex gap-3" style={{ marginTop: 40 }}>
          <Link href="/login" className="inline-flex items-center gap-2.5" style={{
            padding: "14px 26px", background: C.phosphor, color: C.bg,
            fontFamily: sans, fontWeight: 600, fontSize: 15, borderRadius: 10, textDecoration: "none",
          }}>
            Scorer ma première action <span style={{ fontSize: 16 }}>→</span>
          </Link>
          <a href="#methode" style={{
            padding: "14px 24px", border: `1px solid ${C.rule}`,
            color: C.inkDim, fontFamily: sans, fontSize: 15, borderRadius: 10, textDecoration: "none",
          }}>
            Voir la méthode
          </a>
        </div>

        <div className="flex gap-6" style={{ marginTop: 32, fontFamily: mono, fontSize: 11, color: C.muted, letterSpacing: "0.08em" }}>
          <span>✦ 5 ANALYSES GRATUITES / JOUR</span>
          <span>✦ SANS CB</span>
        </div>
      </div>

      <div className="relative z-[1]">
        <div className="relative overflow-hidden" style={{ background: C.bgCard, border: `1px solid ${C.rule}`, borderRadius: 16, padding: 28 }}>
          <div className="flex items-center justify-between" style={{ marginBottom: 20 }}>
            <div>
              <div style={{ fontFamily: mono, fontSize: 10, letterSpacing: "0.2em", color: C.muted }}>SCORING EN DIRECT</div>
              <div style={{ fontFamily: serif, fontSize: 28, fontWeight: 500, color: C.ink, marginTop: 4, letterSpacing: "-0.02em" }}>NVIDIA Corp.</div>
              <div style={{ fontFamily: mono, fontSize: 11, color: C.muteDeep, marginTop: 2 }}>NVDA · NASDAQ</div>
            </div>
            <div className="inline-flex items-center gap-1.5" style={{
              fontFamily: mono, fontSize: 10, color: C.phosphor,
              padding: "4px 8px", border: `1px solid ${C.phosphor}40`, borderRadius: 4,
            }}>
              <span className="w-[5px] h-[5px] rounded-full" style={{ background: C.phosphor, animation: "ab-pulse 1.2s ease-in-out infinite" }} />
              CALCUL…
            </div>
          </div>

          <div className="flex justify-center" style={{ margin: "8px 0 20px" }}>
            <Gauge
              value={score}
              size={260}
              stroke={16}
              label={
                score >= 75 ? "EXCELLENT"
                : score >= 60 ? "BON"
                : score >= 45 ? "NEUTRE"
                : score >= 30 ? "ATTENTION"
                : "RISQUÉ"
              }
            />
          </div>

          <div className="grid" style={{ gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
            {metrics.map((m) => (
              <div key={m.label} style={{ padding: "10px 8px", background: C.bgElev, border: `1px solid ${C.rule}`, borderRadius: 6 }}>
                <div style={{ fontFamily: mono, fontSize: 9, letterSpacing: "0.1em", color: C.muted }}>{m.label}</div>
                <div style={{ fontFamily: mono, fontSize: 15, fontWeight: 600, color: m.color, marginTop: 4 }}>{m.val}</div>
              </div>
            ))}
          </div>

          <div style={{
            marginTop: 20, padding: "12px 14px", background: C.bg, borderRadius: 6, border: `1px solid ${C.rule}`,
            fontFamily: serif, fontStyle: "italic", fontSize: 14, lineHeight: 1.5, color: C.inkDim,
          }}>
            <span style={{ color: C.phosphor }}>›</span> Marges d&apos;exploitation record, croissance CA trois chiffres, momentum intact. Zone d&apos;achat confirmée.
          </div>
        </div>
      </div>
    </section>
  );
}

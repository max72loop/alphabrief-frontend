"use client";

import React from "react";

export const C = {
  bg: "#0A0F0C",
  bgAlt: "#111814",
  bgCard: "#0E1511",
  bgElev: "#13201A",
  rule: "#1A2520",
  ruleDim: "#14201B",
  ink: "#F0EBDB",
  inkDim: "#C6C0A9",
  muted: "#6D7A72",
  muteDeep: "#4A6355",
  phosphor: "#7EE5A3",
  phosphorSoft: "#5AB983",
  ember: "#E5A04E",
  sanguine: "#D85F66",
};

export const serif = "var(--font-fraunces), 'Times New Roman', serif";
export const sans = "var(--font-inter-tight), -apple-system, system-ui, sans-serif";
export const mono = "var(--font-jetbrains-mono), ui-monospace, Menlo, monospace";

type GaugeProps = {
  value: number;
  size?: number;
  stroke?: number;
  showNumeral?: boolean;
  label?: string;
  sub?: string;
  decomposition?: { fund: number; tech: number; mom: number } | null;
};

export function Gauge({
  value,
  size = 220,
  stroke = 14,
  showNumeral = true,
  label,
  sub,
  decomposition = null,
}: GaugeProps) {
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - stroke;
  const startA = -Math.PI * 0.75;
  const endA = Math.PI * 0.75;
  const sweep = endA - startA;
  const v = Math.max(0, Math.min(100, value));
  const pct = v / 100;

  const color =
    v >= 75 ? C.phosphor
    : v >= 60 ? C.phosphorSoft
    : v >= 45 ? C.ember
    : v >= 30 ? "#E58A4E"
    : C.sanguine;

  const arc = (a0: number, a1: number) => {
    const x0 = cx + r * Math.cos(a0);
    const y0 = cy + r * Math.sin(a0);
    const x1 = cx + r * Math.cos(a1);
    const y1 = cy + r * Math.sin(a1);
    const large = a1 - a0 > Math.PI ? 1 : 0;
    return `M ${x0} ${y0} A ${r} ${r} 0 ${large} 1 ${x1} ${y1}`;
  };

  const valA = startA + sweep * pct;
  const tipX = cx + r * Math.cos(valA);
  const tipY = cy + r * Math.sin(valA);

  let segs: { a0: number; a1: number; color: string; key: string }[] | null = null;
  if (decomposition) {
    const a1 = startA + sweep * decomposition.fund;
    const a2 = a1 + sweep * decomposition.tech;
    const a3 = a2 + sweep * decomposition.mom;
    segs = [
      { a0: startA, a1, color: C.phosphor, key: "fund" },
      { a0: a1, a1: a2, color: C.phosphorSoft, key: "tech" },
      { a0: a2, a1: a3, color: C.ember, key: "mom" },
    ];
  }

  const ticks: React.ReactElement[] = [];
  for (let i = 0; i <= 10; i++) {
    const a = startA + sweep * (i / 10);
    const r1 = r - stroke / 2 - 4;
    const r2 = r - stroke / 2 - (i % 5 === 0 ? 10 : 6);
    ticks.push(
      <line
        key={i}
        x1={cx + r1 * Math.cos(a)}
        y1={cy + r1 * Math.sin(a)}
        x2={cx + r2 * Math.cos(a)}
        y2={cy + r2 * Math.sin(a)}
        stroke={C.rule}
        strokeWidth={1}
      />
    );
  }

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ display: "block" }}>
      <defs>
        <filter id={`glow-${size}`} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="3" />
        </filter>
      </defs>
      <path d={arc(startA, endA)} stroke={C.ruleDim} strokeWidth={stroke} fill="none" strokeLinecap="round" />
      {ticks}
      {segs
        ? segs.map((s) => (
            <path
              key={s.key}
              d={arc(s.a0, s.a1)}
              stroke={s.color}
              strokeWidth={stroke}
              fill="none"
              strokeLinecap="butt"
            />
          ))
        : (
          <path
            d={arc(startA, valA)}
            stroke={color}
            strokeWidth={stroke}
            fill="none"
            strokeLinecap="round"
            style={{ transition: "stroke 0.4s" }}
          />
        )}
      {!segs && (
        <>
          <circle cx={tipX} cy={tipY} r={stroke * 0.9} fill={color} opacity="0.25" filter={`url(#glow-${size})`} />
          <circle cx={tipX} cy={tipY} r={stroke * 0.35} fill={color} />
        </>
      )}
      {showNumeral && (
        <>
          <text
            x={cx}
            y={cy + size * 0.02}
            textAnchor="middle"
            style={{
              fontFamily: mono,
              fontSize: size * 0.30,
              fontWeight: 600,
              fill: C.ink,
              letterSpacing: "-0.04em",
            }}
          >
            {Math.round(v)}
          </text>
          {label && (
            <text
              x={cx}
              y={cy + size * 0.20}
              textAnchor="middle"
              style={{
                fontFamily: mono,
                fontSize: size * 0.055,
                fontWeight: 600,
                fill: color,
                letterSpacing: "0.2em",
                textTransform: "uppercase",
              }}
            >
              {label}
            </text>
          )}
          {sub && (
            <text
              x={cx}
              y={cy - size * 0.20}
              textAnchor="middle"
              style={{
                fontFamily: mono,
                fontSize: size * 0.05,
                fontWeight: 500,
                fill: C.muted,
                letterSpacing: "0.2em",
                textTransform: "uppercase",
              }}
            >
              {sub}
            </text>
          )}
        </>
      )}
    </svg>
  );
}

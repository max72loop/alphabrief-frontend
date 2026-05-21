"use client";

import { useEffect, useState } from "react";
import { C, mono, scoreColor } from "./Gauge";

export function TickerTape({ inline = false }: { inline?: boolean } = {}) {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 2200);
    return () => clearInterval(id);
  }, []);

  const base = [
    { sym: "NVDA", score: 84, chg: "+2.1%" },
    { sym: "MSFT", score: 78, chg: "+0.6%" },
    { sym: "ASML", score: 71, chg: "+1.3%" },
    { sym: "GOOGL", score: 76, chg: "-0.2%" },
    { sym: "AAPL", score: 62, chg: "+0.4%" },
    { sym: "META", score: 73, chg: "+1.8%" },
    { sym: "LVMH", score: 58, chg: "-0.9%" },
    { sym: "TSLA", score: 41, chg: "-3.4%" },
    { sym: "CRWD", score: 81, chg: "+2.9%" },
    { sym: "AMZN", score: 69, chg: "+0.7%" },
    { sym: "NFLX", score: 74, chg: "+1.1%" },
    { sym: "PLTR", score: 48, chg: "-1.6%" },
    { sym: "SHOP", score: 67, chg: "+0.3%" },
    { sym: "V",    score: 80, chg: "+0.5%" },
    { sym: "JPM",  score: 72, chg: "+0.8%" },
  ];

  const items = base.map((b, i) => ({
    ...b,
    score: Math.max(0, Math.min(100, b.score + (((tick + i) % 3) - 1))),
  }));

  const color = scoreColor;

  const doubled = [...items, ...items];

  return (
    <div
      className={
        inline
          ? "relative z-30 flex items-center overflow-hidden w-full"
          : "fixed left-0 right-0 z-40 flex items-center overflow-hidden"
      }
      style={
        inline
          ? { height: 34, background: C.bg, borderBottom: `1px solid ${C.rule}` }
          : { top: 56, height: 34, background: C.bg, borderBottom: `1px solid ${C.rule}` }
      }
    >
      <div
        className="absolute left-0 top-0 bottom-0 flex items-center gap-2 z-[2]"
        style={{ padding: "0 16px", background: C.bgAlt, borderRight: `1px solid ${C.rule}` }}
      >
        <span
          className="w-[7px] h-[7px] rounded-full"
          style={{
            background: C.phosphor,
            boxShadow: `0 0 8px ${C.phosphor}`,
            animation: "ab-pulse 1.4s ease-in-out infinite",
          }}
        />
        <span style={{ fontFamily: mono, fontSize: 10, fontWeight: 600, letterSpacing: "0.16em", color: C.phosphor }}>
          LIVE
        </span>
      </div>
      <div
        className="flex gap-7 whitespace-nowrap will-change-transform"
        style={{ paddingLeft: 80, animation: "ab-ticker 60s linear infinite" }}
      >
        {doubled.map((it, i) => (
          <span key={i} className="inline-flex items-center gap-2" style={{ fontFamily: mono, fontSize: 12 }}>
            <span style={{ color: C.ink, fontWeight: 600, letterSpacing: "0.04em" }}>{it.sym}</span>
            <span
              style={{
                color: color(it.score),
                fontWeight: 600,
                padding: "1px 6px",
                border: `1px solid ${color(it.score)}40`,
                borderRadius: 3,
                fontSize: 10,
              }}
            >
              {Math.round(it.score)}
            </span>
            <span style={{ color: it.chg.startsWith("-") ? C.sanguine : C.phosphorSoft, fontSize: 11 }}>{it.chg}</span>
            <span style={{ color: C.rule }}>│</span>
          </span>
        ))}
      </div>
    </div>
  );
}

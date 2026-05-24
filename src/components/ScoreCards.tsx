"use client";

import { useEffect, useRef, useState } from "react";

const SCORES = [
  {
    ticker: "AAPL",
    name: "Apple Inc.",
    score: 74,
    label: "Bon",
    change: "+1.42%",
    changePos: true,
    scoreColor: "text-[#7EE5A3]",
    barColor: "bg-[#7EE5A3]",
    badgeStyle: { background: "rgba(126,229,163,0.1)", border: "1px solid rgba(126,229,163,0.25)", color: "#7EE5A3" },
  },
  {
    ticker: "META",
    name: "Meta Platforms",
    score: 81,
    label: "Excellent",
    change: "+2.07%",
    changePos: true,
    scoreColor: "text-[#7EE5A3]",
    barColor: "bg-[#7EE5A3]",
    badgeStyle: { background: "rgba(126,229,163,0.1)", border: "1px solid rgba(126,229,163,0.25)", color: "#7EE5A3" },
  },
  {
    ticker: "NKE",
    name: "Nike Inc.",
    score: 38,
    label: "Attention",
    change: "-0.83%",
    changePos: false,
    scoreColor: "text-orange-400",
    barColor: "bg-orange-500",
    badgeStyle: { background: "rgba(249,115,22,0.1)", border: "1px solid rgba(249,115,22,0.25)", color: "#f97316" },
  },
];

function useCountUp(target: number, duration = 900, trigger: boolean) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!trigger) return;
    let start: number | null = null;
    const step = (timestamp: number) => {
      if (!start) start = timestamp;
      const progress = Math.min((timestamp - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(eased * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [trigger, target, duration]);

  return value;
}

function ScoreCard({ s, trigger }: { s: (typeof SCORES)[0]; trigger: boolean }) {
  const count = useCountUp(s.score, 900, trigger);

  return (
    <div className="bg-[#0F1A13] border border-[#1A2520] rounded-2xl p-5 flex flex-col gap-3 hover:border-[#7EE5A3]/30 transition-colors">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <span
            className="block text-sm font-medium text-[#F0EBDB] truncate"
            style={{ fontFamily: "var(--font-fraunces, serif)" }}
            title={s.ticker}
          >
            {s.name}
          </span>
          <p
            className="text-[0.65rem] text-[#4A6355] mt-0.5 uppercase tracking-[0.14em]"
            style={{ fontFamily: "var(--font-jetbrains-mono, monospace)" }}
          >
            {s.ticker}
          </p>
        </div>
        <span className={`text-[0.7rem] font-semibold ${s.changePos ? "text-[#7EE5A3]" : "text-red-400"}`}>
          {s.change}
        </span>
      </div>

      <div className="flex items-end gap-2">
        <span
          className={`text-4xl font-semibold leading-none tabular-nums ${s.scoreColor}`}
          style={{ fontFamily: "var(--font-jetbrains-mono)" }}
        >
          {count}
        </span>
        <span className="text-[#2A3D30] text-sm mb-0.5">/ 100</span>
      </div>

      <div className="w-full h-1.5 bg-[#1A2520] rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${s.barColor}`}
          style={{ width: `${(count / 100) * 100}%` }}
        />
      </div>

      <span
        className="self-start text-[0.65rem] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full"
        style={s.badgeStyle}
      >
        {s.label}
      </span>
    </div>
  );
}

export default function ScoreCards() {
  const ref = useRef<HTMLDivElement>(null);
  const [triggered, setTriggered] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTriggered(true);
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl w-full">
      {SCORES.map((s) => (
        <ScoreCard key={s.ticker} s={s} trigger={triggered} />
      ))}
    </div>
  );
}

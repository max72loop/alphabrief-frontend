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
    scoreColor: "text-emerald-400",
    barColor: "bg-emerald-500",
    badgeBg: "bg-emerald-500/10 border-emerald-500/20",
    badgeText: "text-emerald-400",
  },
  {
    ticker: "META",
    name: "Meta Platforms",
    score: 81,
    label: "Excellent",
    change: "+2.07%",
    changePos: true,
    scoreColor: "text-emerald-400",
    barColor: "bg-emerald-500",
    badgeBg: "bg-emerald-500/10 border-emerald-500/20",
    badgeText: "text-emerald-400",
  },
  {
    ticker: "NKE",
    name: "Nike Inc.",
    score: 38,
    label: "Attention",
    change: "-0.83%",
    changePos: false,
    scoreColor: "text-red-400",
    barColor: "bg-red-500",
    badgeBg: "bg-red-500/10 border-red-500/20",
    badgeText: "text-red-400",
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
      // ease-out cubic
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
    <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-5 flex flex-col gap-3 hover:border-white/[0.14] transition-colors">
      <div className="flex items-start justify-between">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-zinc-300">
            {s.ticker}
          </span>
          <p className="text-[0.7rem] text-zinc-500 mt-0.5">{s.name}</p>
        </div>
        <span className={`text-[0.7rem] font-semibold ${s.changePos ? "text-emerald-400" : "text-red-400"}`}>
          {s.change}
        </span>
      </div>

      <div className="flex items-end gap-2">
        <span className={`text-4xl font-extrabold leading-none tabular-nums ${s.scoreColor}`}>
          {count}
        </span>
        <span className="text-zinc-600 text-sm mb-0.5">/ 100</span>
      </div>

      <div className="w-full h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${s.barColor}`}
          style={{ width: `${(count / 100) * 100}%` }}
        />
      </div>

      <span className={`self-start text-[0.65rem] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full border ${s.badgeBg} ${s.badgeText}`}>
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

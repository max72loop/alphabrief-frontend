"use client";

import { useEffect, useRef, useState } from "react";

const STATS = [
  { value: 1500, suffix: "+", label: "actions couvertes" },
  { value: 3, suffix: "", label: "piliers d'analyse" },
  { value: 100, suffix: "%", label: "mise à jour chaque nuit" },
  { value: 0, suffix: "€", label: "pour commencer" },
];

function useCountUp(target: number, duration = 800, trigger: boolean) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!trigger) return;
    if (target === 0) { setValue(0); return; }
    let start: number | null = null;
    const step = (ts: number) => {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(eased * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [trigger, target, duration]);
  return value;
}

function StatItem({ stat, trigger }: { stat: (typeof STATS)[0]; trigger: boolean }) {
  const count = useCountUp(stat.value, 800, trigger);
  return (
    <div className="flex flex-col items-center gap-1">
      <span
        className="text-2xl sm:text-3xl font-semibold text-[#7EE5A3] tabular-nums"
        style={{ fontFamily: "var(--font-jetbrains-mono)" }}
      >
        {count.toLocaleString("fr-FR")}
        {stat.suffix}
      </span>
      <span className="text-xs text-[#4A6355] text-center">{stat.label}</span>
    </div>
  );
}

export default function StatsBar() {
  const ref = useRef<HTMLDivElement>(null);
  const [triggered, setTriggered] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) { setTriggered(true); observer.disconnect(); }
      },
      { threshold: 0.4 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className="w-full max-w-3xl mx-auto px-6 pb-20">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 bg-[#0F1A13] border border-[#1A2520] rounded-2xl px-8 py-6">
        {STATS.map((s) => (
          <StatItem key={s.label} stat={s} trigger={triggered} />
        ))}
      </div>
    </div>
  );
}

"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function StickyBanner() {
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setVisible(window.scrollY > 400);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (dismissed) return null;

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-50 transition-transform duration-300 ${
        visible ? "translate-y-0" : "translate-y-full"
      }`}
    >
      <div className="bg-[#0A0F0C]/95 border-t border-[#1A2520] backdrop-blur-xl px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
          <p className="text-sm text-[#4A6355] hidden sm:block">
            <span className="text-[#F0EBDB] font-semibold">AlphaBrief</span> — scorez vos actions en
            quelques secondes.{" "}
            <span className="text-[#2A3D30]">5 analyses gratuites par jour.</span>
          </p>
          <p className="text-sm text-[#4A6355] sm:hidden">
            5 analyses gratuites par jour
          </p>
          <div className="flex items-center gap-3 flex-shrink-0">
            <Link
              href="/login"
              className="px-5 py-2 bg-[#7EE5A3] hover:bg-[#9AEDB5] text-[#0A0F0C] rounded-lg text-sm font-semibold transition-colors whitespace-nowrap"
            >
              Commencer gratuitement →
            </Link>
            <button
              onClick={() => setDismissed(true)}
              className="text-[#2A3D30] hover:text-[#4A6355] transition-colors text-lg leading-none"
              aria-label="Fermer"
            >
              ✕
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

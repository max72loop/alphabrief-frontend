"use client";

import Link from "next/link";
import { C, serif, sans, mono } from "./Gauge";

function PlanCard({
  name, price, features, cta, ctaHref, featured,
}: {
  name: string;
  price: string;
  features: [boolean, string][];
  cta: string;
  ctaHref: string;
  featured: boolean;
}) {
  return (
    <div
      className="relative flex flex-col"
      style={{
        background: featured ? `${C.phosphor}06` : C.bgCard,
        border: `1px solid ${featured ? `${C.phosphor}40` : C.rule}`,
        borderRadius: 16,
        padding: 32,
        gap: 20,
      }}
    >
      {featured && (
        <span
          className="absolute"
          style={{
            top: 20, right: 20,
            fontFamily: mono, fontSize: 9, letterSpacing: "0.2em", color: C.phosphor,
            border: `1px solid ${C.phosphor}60`, padding: "3px 8px", borderRadius: 20,
          }}
        >
          RECOMMANDÉ
        </span>
      )}
      <div>
        <div style={{ fontFamily: mono, fontSize: 10, letterSpacing: "0.2em", color: featured ? C.phosphor : C.muted }}>
          {name.toUpperCase()}
        </div>
        <div style={{ fontFamily: serif, fontSize: 44, fontWeight: 500, color: C.ink, marginTop: 6, letterSpacing: "-0.03em" }}>
          {price}
          <span style={{ fontSize: 16, color: C.muted, fontWeight: 400 }}> / mois</span>
        </div>
      </div>
      <div className="flex flex-col" style={{ gap: 10 }}>
        {features.map(([ok, f]) => (
          <div key={f} className="flex items-center gap-2.5">
            <span style={{ fontFamily: mono, fontSize: 12, color: ok ? C.phosphor : C.rule }}>{ok ? "✓" : "✕"}</span>
            <span style={{ fontFamily: sans, fontSize: 14, color: ok ? C.ink : C.muted }}>{f}</span>
          </div>
        ))}
      </div>
      <Link
        href={ctaHref}
        className="text-center"
        style={{
          padding: "12px 20px",
          background: featured ? C.phosphor : "transparent",
          border: featured ? "none" : `1px solid ${C.rule}`,
          color: featured ? C.bg : C.inkDim,
          fontFamily: sans,
          fontSize: 14,
          fontWeight: 600,
          borderRadius: 10,
          textDecoration: "none",
        }}
      >
        {cta}
      </Link>
    </div>
  );
}

export function Pricing() {
  return (
    <section id="tarifs" style={{ padding: "40px 40px 120px", maxWidth: 1100, margin: "0 auto" }}>
      <div className="text-center" style={{ marginBottom: 48 }}>
        <div style={{ fontFamily: mono, fontSize: 10, letterSpacing: "0.3em", color: C.phosphor, marginBottom: 14 }}>
          § 04 · TARIFS
        </div>
        <h2 style={{ fontFamily: serif, fontSize: 48, fontWeight: 500, letterSpacing: "-0.025em", color: C.ink, margin: 0, lineHeight: 1 }}>
          Commencez gratuit.{" "}
          <span style={{ fontStyle: "italic", color: C.phosphor }}>Montez Pro quand ça compte.</span>
        </h2>
      </div>

      <div className="grid mx-auto" style={{ gridTemplateColumns: "1fr 1fr", gap: 16, maxWidth: 800 }}>
        <PlanCard
          name="Gratuit"
          price="0 €"
          features={[
            [true, "5 analyses complètes / jour"],
            [true, "Score sur 3 piliers"],
            [true, "Watchlist (5 titres)"],
            [false, "Édition quotidienne"],
            [false, "Analyses illimitées"],
            [false, "Alertes & historique"],
          ]}
          cta="Commencer gratuitement"
          ctaHref="/login?mode=signup"
          featured={false}
        />
        <PlanCard
          name="Pro"
          price="4,99 €"
          features={[
            [true, "Analyses illimitées"],
            [true, "Édition quotidienne par mail"],
            [true, "Watchlist illimitée"],
            [true, "Alertes de score"],
            [true, "Historique complet"],
            [true, "Export CSV"],
          ]}
          cta="Passer Pro →"
          ctaHref="/pricing"
          featured
        />
      </div>
    </section>
  );
}

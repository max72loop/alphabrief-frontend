"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { C, serif, sans, mono, Gauge, scoreColor } from "@/components/landing/Gauge";

export type RecentItem = {
  ticker: string;
  name: string | null;
  score: number;
  when: string;
};

export type Suggestion = {
  ticker: string;
  name: string | null;
  sector: string | null;
  score: number;
};

const toneFor = scoreColor;

export default function QuickScorer({
  suggestions,
  recent,
}: {
  suggestions: Suggestion[];
  recent: RecentItem[];
}) {
  const [query, setQuery] = useState("");
  const router = useRouter();

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const t = query.trim();
    if (!t) return;
    // Délègue à /search qui résout ticker exact OU nom flou (cf. app/search/page.tsx).
    router.push(`/search?q=${encodeURIComponent(t)}`);
  };

  return (
    <section style={{ padding: "20px 40px 60px", maxWidth: 1320, margin: "0 auto" }}>
      <div
        className="ab-scorer-grid"
        style={{
          background: C.bgCard,
          border: `1px solid ${C.rule}`,
          borderRadius: 16,
          padding: 36,
          display: "grid",
          gridTemplateColumns: "minmax(0, 1.3fr) minmax(0, 1fr)",
          gap: 48,
          alignItems: "center",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          aria-hidden
          style={{
            position: "absolute",
            top: "-20%",
            right: "-10%",
            width: 360,
            height: 360,
            borderRadius: "50%",
            background: `${C.phosphor}10`,
            filter: "blur(100px)",
            pointerEvents: "none",
          }}
        />

        <div style={{ position: "relative" }}>
          <div style={{ fontFamily: mono, fontSize: 10, letterSpacing: "0.3em", color: C.phosphor, marginBottom: 12 }}>
            § 03 · SCORER MAINTENANT
          </div>
          <h2
            style={{
              fontFamily: serif,
              fontSize: "clamp(26px, 3.5vw, 38px)",
              fontWeight: 500,
              letterSpacing: "-0.025em",
              color: C.ink,
              margin: 0,
              lineHeight: 1.05,
            }}
          >
            Une action en tête ?<br />
            <span style={{ fontStyle: "italic", color: C.phosphor }}>Scorez-la en six secondes.</span>
          </h2>
          <p
            style={{
              fontFamily: serif,
              fontStyle: "italic",
              fontSize: 17,
              lineHeight: 1.5,
              color: C.inkDim,
              marginTop: 18,
              maxWidth: 460,
            }}
          >
            Tapez un ticker ou un nom. On compose les trois piliers depuis nos données et on vous renvoie le verdict.
          </p>

          <form onSubmit={submit} style={{ marginTop: 28, display: "flex", gap: 10 }}>
            <div
              style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "14px 18px",
                background: C.bg,
                border: `1px solid ${query ? C.phosphor + "60" : C.rule}`,
                borderRadius: 10,
              }}
            >
              <span style={{ color: C.phosphor, fontFamily: mono, fontSize: 14 }}>›</span>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="ex. NVDA, Apple, AAPL…"
                style={{
                  flex: 1,
                  background: "transparent",
                  border: "none",
                  outline: "none",
                  color: C.ink,
                  fontFamily: mono,
                  fontSize: 15,
                  letterSpacing: "0.04em",
                }}
              />
              <span style={{ fontFamily: mono, fontSize: 10, color: C.muted, letterSpacing: "0.12em" }}>ENTRÉE ↵</span>
            </div>
            <button
              type="submit"
              style={{
                padding: "14px 22px",
                background: C.phosphor,
                color: C.bg,
                fontFamily: sans,
                fontWeight: 600,
                fontSize: 14,
                borderRadius: 10,
                border: "none",
                cursor: "pointer",
                letterSpacing: "-0.005em",
              }}
            >
              Scorer →
            </button>
          </form>

          {suggestions.length > 0 && (
            <>
              <div style={{ marginTop: 14, fontFamily: mono, fontSize: 10, color: C.muted, letterSpacing: "0.14em" }}>
                SUGGESTIONS · TOP DU JOUR
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10 }}>
                {suggestions.slice(0, 4).map((s) => (
                  <button
                    type="button"
                    key={s.ticker}
                    onClick={() => setQuery(s.name || s.ticker)}
                    style={{
                      padding: "7px 12px",
                      background: "transparent",
                      border: `1px solid ${C.rule}`,
                      borderRadius: 4,
                      color: C.inkDim,
                      fontFamily: sans,
                      fontSize: 12,
                      cursor: "pointer",
                      display: "inline-flex",
                      gap: 8,
                      alignItems: "baseline",
                    }}
                  >
                    <span style={{ color: C.ink, fontWeight: 600 }}>{s.name || s.ticker}</span>
                    <span style={{ color: C.muted, fontFamily: mono, fontSize: 10, letterSpacing: "0.1em" }}>
                      {s.ticker} · {s.score}
                    </span>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        <div
          style={{
            background: C.bg,
            border: `1px solid ${C.rule}`,
            borderRadius: 12,
            padding: "20px 22px",
            position: "relative",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "baseline",
              marginBottom: 14,
              paddingBottom: 12,
              borderBottom: `1px dashed ${C.rule}`,
            }}
          >
            <span style={{ fontFamily: mono, fontSize: 10, color: C.muted, letterSpacing: "0.2em" }}>
              {recent.length > 0 ? "VOS DERNIÈRES ANALYSES" : "DERNIERS SCORES PUBLIÉS"}
            </span>
            <Link
              href="/marche"
              style={{ fontFamily: mono, fontSize: 10, color: C.phosphor, textDecoration: "none", letterSpacing: "0.14em" }}
            >
              TOUT VOIR →
            </Link>
          </div>
          {recent.length === 0 ? (
            <div
              style={{
                padding: "20px 0",
                fontFamily: serif,
                fontStyle: "italic",
                fontSize: 14,
                color: C.muted,
                textAlign: "center",
              }}
            >
              Vos analyses récentes apparaîtront ici.
            </div>
          ) : (
            recent.slice(0, 5).map((r, i, arr) => (
              <Link
                key={r.ticker + i}
                href={`/ticker/${r.ticker}`}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  padding: "10px 0",
                  borderBottom: i === arr.length - 1 ? "none" : `1px dashed ${C.rule}`,
                  textDecoration: "none",
                  color: "inherit",
                }}
              >
                <Gauge value={r.score} size={32} stroke={4} showNumeral={false} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontFamily: serif,
                      fontSize: 15,
                      fontWeight: 600,
                      color: C.ink,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {r.name || r.ticker}
                  </div>
                  <div style={{ fontFamily: mono, fontSize: 10, color: C.muted, letterSpacing: "0.12em", marginTop: 2 }}>
                    {r.ticker} · {r.when.toUpperCase()}
                  </div>
                </div>
                <div
                  style={{
                    fontFamily: mono,
                    fontSize: 18,
                    fontWeight: 600,
                    color: toneFor(r.score),
                    letterSpacing: "-0.03em",
                  }}
                >
                  {r.score}
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </section>
  );
}

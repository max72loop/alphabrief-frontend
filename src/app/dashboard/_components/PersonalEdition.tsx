import Link from "next/link";
import { Gauge } from "@/components/landing/Gauge";
import { C, serif, mono, scoreColor } from "@/lib/design";

export type EditionItem = {
  ticker: string;
  name: string | null;
  sector: string | null;
  score: number;
  note: string;
  tag: string;
  watching: boolean;
  momentum3m?: number | null;
};

const toneFor = scoreColor;

function tagColor(tag: string) {
  if (tag === "PROMOTION" || tag === "ROTATION" || tag === "TOP DU JOUR" || tag === "TOP DE LA SEMAINE") return C.phosphor;
  if (tag === "DOWNGRADE" || tag === "SORTIE DE ZONE" || tag === "BAISSE NOTABLE") return C.sanguine;
  return C.muted;
}

export default function PersonalEdition({
  items,
  isWeeklyDigest = false,
  watchlistSize,
}: {
  items: EditionItem[];
  isWeeklyDigest?: boolean;
  watchlistSize: number;
}) {
  if (items.length === 0) return null;

  return (
    <section style={{ padding: "40px 40px 60px", maxWidth: 1320, margin: "0 auto" }}>
      <div
        style={{
          borderTop: `2px solid ${C.ink}`,
          borderBottom: `1px solid ${C.rule}`,
          padding: "18px 0 14px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          gap: 16,
          flexWrap: "wrap",
        }}
      >
        <div>
          <div style={{ fontFamily: mono, fontSize: 10, letterSpacing: "0.3em", color: C.phosphor, marginBottom: 6 }}>
            § 01 · {isWeeklyDigest ? "LE BILAN DE LA SEMAINE" : "L'ÉDITION DU JOUR"}
          </div>
          <h2
            style={{
              fontFamily: serif,
              fontSize: "clamp(28px, 3.5vw, 38px)",
              fontWeight: 500,
              letterSpacing: "-0.025em",
              color: C.ink,
              margin: 0,
              lineHeight: 1,
            }}
          >
            {watchlistSize === 0 ? (
              <>
                Suggestions du jour <span style={{ fontStyle: "italic", color: C.phosphor }}>pour démarrer</span>.
              </>
            ) : isWeeklyDigest ? (
              <>
                Cinq séances, <span style={{ fontStyle: "italic", color: C.phosphor }}>quatre histoires</span> à relire.
              </>
            ) : (
              <>
                Les <span style={{ fontStyle: "italic", color: C.phosphor }}>quatre mouvements</span> à lire ce matin.
              </>
            )}
          </h2>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Link
            href="/marche"
            style={{
              padding: "8px 14px",
              background: "transparent",
              border: `1px solid ${C.rule}`,
              color: C.inkDim,
              fontFamily: mono,
              fontSize: 11,
              letterSpacing: "0.1em",
              borderRadius: 8,
              cursor: "pointer",
              textDecoration: "none",
            }}
          >
            ÉDITION COMPLÈTE →
          </Link>
        </div>
      </div>

      <div
        className="ab-edition-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
          borderBottom: `1px solid ${C.rule}`,
        }}
      >
        {items.map((it, i) => {
          const tone = toneFor(it.score);
          return (
            <Link
              key={it.ticker + i}
              href={`/ticker/${it.ticker}`}
              style={{
                padding: "24px 22px",
                borderRight: i < items.length - 1 ? `1px solid ${C.rule}` : "none",
                display: "flex",
                flexDirection: "column",
                gap: 12,
                background: i === 0 ? `${C.phosphor}06` : "transparent",
                textDecoration: "none",
                color: "inherit",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span
                  style={{
                    fontFamily: mono,
                    fontSize: 9,
                    letterSpacing: "0.2em",
                    fontWeight: 600,
                    color: tagColor(it.tag),
                  }}
                >
                  {it.tag}
                </span>
                {it.watching && (
                  <span
                    title="Dans votre watchlist"
                    style={{
                      fontFamily: mono,
                      fontSize: 9,
                      color: C.phosphor,
                      letterSpacing: "0.1em",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                    }}
                  >
                    ★ SUIVI
                  </span>
                )}
              </div>

              <div>
                <div
                  style={{
                    fontFamily: serif,
                    fontSize: 26,
                    fontWeight: 600,
                    color: C.ink,
                    letterSpacing: "-0.02em",
                    lineHeight: 1.1,
                  }}
                >
                  {it.name ?? it.ticker}
                </div>
                <div style={{ fontFamily: mono, fontSize: 10, color: C.muted, letterSpacing: "0.14em", marginTop: 4 }}>
                  {it.ticker}
                </div>
              </div>

              <div
                style={{
                  padding: "12px 0",
                  borderTop: `1px dashed ${C.rule}`,
                  borderBottom: `1px dashed ${C.rule}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <div>
                  <div style={{ fontFamily: mono, fontSize: 9, color: C.muted, letterSpacing: "0.16em" }}>SCORE</div>
                  <div
                    style={{
                      fontFamily: mono,
                      fontSize: 40,
                      fontWeight: 600,
                      color: tone,
                      letterSpacing: "-0.04em",
                      lineHeight: 1,
                    }}
                  >
                    {it.score}
                  </div>
                  {it.momentum3m != null && (
                    <div
                      style={{
                        fontFamily: mono,
                        fontSize: 11,
                        color: it.momentum3m > 0 ? C.phosphor : it.momentum3m < 0 ? C.sanguine : C.muted,
                        marginTop: 4,
                      }}
                    >
                      {it.momentum3m > 0 ? "▲" : it.momentum3m < 0 ? "▼" : "—"}{" "}
                      {Math.abs(it.momentum3m).toFixed(1)}% <span style={{ color: C.muted }}>3M</span>
                    </div>
                  )}
                  {it.sector && (
                    <div style={{ fontFamily: mono, fontSize: 9, color: C.muted, marginTop: 4, letterSpacing: "0.12em" }}>
                      {it.sector.toUpperCase()}
                    </div>
                  )}
                </div>
                <Gauge value={it.score} size={64} stroke={6} showNumeral={false} />
              </div>

              <div
                style={{
                  fontFamily: serif,
                  fontStyle: "italic",
                  fontSize: 14,
                  lineHeight: 1.45,
                  color: C.inkDim,
                }}
              >
                <span style={{ color: C.phosphor, fontStyle: "normal", marginRight: 6 }}>›</span>
                {it.note}
              </div>

              <span
                style={{
                  marginTop: "auto",
                  fontFamily: mono,
                  fontSize: 10,
                  letterSpacing: "0.16em",
                  color: C.phosphor,
                }}
              >
                LIRE L&apos;ANALYSE →
              </span>
            </Link>
          );
        })}
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          padding: "12px 0",
          fontFamily: mono,
          fontSize: 10,
          color: C.muted,
          letterSpacing: "0.1em",
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <span>QUALITÉ 50% · TECHNIQUE 25% · MOMENTUM 25%</span>
        <span>RECALCUL TOUTES LES 4H</span>
      </div>
    </section>
  );
}

import Link from "next/link";
import { C, serif, sans, mono } from "@/lib/design";

export type AlertItem = {
  ticker: string;
  alert_type: string;
  message: string | null;
  created_at: string;
};

export type Quota = {
  used: number;
  total: number;
  isPremium: boolean;
};

function alertMeta(type: string) {
  switch (type) {
    case "STRONG_BUY":
      return { kind: "PROMOTION", tone: C.phosphor };
    case "SCORE_JUMP":
      return { kind: "HAUSSE", tone: C.phosphor };
    case "SCORE_DROP":
      return { kind: "DOWNGRADE", tone: C.sanguine };
    case "RSI_OVERSOLD":
      return { kind: "RSI SURVENTE", tone: C.ember };
    default:
      return { kind: type, tone: C.muted };
  }
}

function formatWhen(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  if (sameDay) {
    return d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  }
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

export default function AlertsAndQuota({ alerts, quota }: { alerts: AlertItem[]; quota: Quota }) {
  return (
    <section style={{ padding: "20px 40px 80px", maxWidth: 1320, margin: "0 auto" }}>
      <div
        className="ab-alerts-grid"
        style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.6fr) minmax(0, 1fr)", gap: 24 }}
      >
        <div
          style={{
            background: C.bgCard,
            border: `1px solid ${C.rule}`,
            borderRadius: 16,
            padding: 28,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "baseline",
              paddingBottom: 16,
              borderBottom: `1px solid ${C.rule}`,
            }}
          >
            <div>
              <div style={{ fontFamily: mono, fontSize: 10, letterSpacing: "0.3em", color: C.phosphor, marginBottom: 6 }}>
                § 04 · ALERTES
              </div>
              <h3
                style={{
                  fontFamily: serif,
                  fontSize: "clamp(22px, 2.6vw, 28px)",
                  fontWeight: 500,
                  letterSpacing: "-0.02em",
                  color: C.ink,
                  margin: 0,
                }}
              >
                {alerts.length === 0 ? (
                  <>Pas d&apos;alerte récente.</>
                ) : (
                  <>
                    {alerts.length}{" "}
                    <span style={{ fontStyle: "italic", color: C.phosphor }}>
                      {alerts.length === 1 ? "franchissement" : "franchissements"}
                    </span>{" "}
                    à valider.
                  </>
                )}
              </h3>
            </div>
            <Link
              href="/alerts"
              style={{
                fontFamily: mono,
                fontSize: 10,
                color: C.muted,
                letterSpacing: "0.14em",
                textDecoration: "none",
              }}
            >
              {alerts.length === 0 ? "CONFIGURER →" : "VOIR TOUT →"}
            </Link>
          </div>

          {alerts.length === 0 ? (
            <div
              style={{
                padding: "40px 0",
                fontFamily: serif,
                fontStyle: "italic",
                fontSize: 16,
                color: C.muted,
                textAlign: "center",
              }}
            >
              Les alertes apparaissent dès qu&apos;un de vos tickers franchit un seuil.
            </div>
          ) : (
            <div>
              {alerts.slice(0, 5).map((a, i, arr) => {
                const meta = alertMeta(a.alert_type);
                return (
                  <Link
                    key={i}
                    href={`/ticker/${a.ticker}`}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 16,
                      padding: "16px 0",
                      borderBottom: i === arr.length - 1 ? "none" : `1px dashed ${C.rule}`,
                      textDecoration: "none",
                      color: "inherit",
                    }}
                  >
                    <span
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        background: meta.tone,
                        boxShadow: `0 0 8px ${meta.tone}80`,
                        flexShrink: 0,
                      }}
                    />
                    <span
                      style={{
                        fontFamily: mono,
                        fontSize: 9,
                        letterSpacing: "0.2em",
                        fontWeight: 600,
                        color: meta.tone,
                        width: 110,
                        flexShrink: 0,
                      }}
                    >
                      {meta.kind}
                    </span>
                    <span
                      style={{
                        fontFamily: serif,
                        fontSize: 19,
                        fontWeight: 600,
                        color: C.ink,
                        width: 64,
                        flexShrink: 0,
                      }}
                    >
                      {a.ticker}
                    </span>
                    <span
                      style={{
                        flex: 1,
                        fontFamily: serif,
                        fontStyle: "italic",
                        fontSize: 15,
                        color: C.inkDim,
                      }}
                    >
                      {a.message ?? "Changement de score significatif."}
                    </span>
                    <span
                      style={{
                        fontFamily: mono,
                        fontSize: 10,
                        color: C.muted,
                        letterSpacing: "0.14em",
                        flexShrink: 0,
                      }}
                    >
                      {formatWhen(a.created_at).toUpperCase()}
                    </span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div
            style={{
              background: C.bgCard,
              border: `1px solid ${C.rule}`,
              borderRadius: 16,
              padding: 28,
            }}
          >
            <div style={{ fontFamily: mono, fontSize: 10, letterSpacing: "0.3em", color: C.phosphor }}>
              § 05 · {quota.isPremium ? "ACCÈS PREMIUM" : "QUOTA DU JOUR"}
            </div>
            {quota.isPremium ? (
              <>
                <div
                  style={{
                    fontFamily: serif,
                    fontSize: 36,
                    fontWeight: 500,
                    color: C.ink,
                    letterSpacing: "-0.025em",
                    lineHeight: 1.1,
                    marginTop: 16,
                  }}
                >
                  Analyses <span style={{ fontStyle: "italic", color: C.phosphor }}>illimitées</span>.
                </div>
                <div style={{ fontFamily: sans, fontSize: 13, color: C.inkDim, marginTop: 8 }}>
                  Merci de soutenir AlphaBrief.
                </div>
              </>
            ) : (
              <>
                <div
                  style={{
                    fontFamily: mono,
                    fontSize: 56,
                    fontWeight: 600,
                    color: C.ink,
                    letterSpacing: "-0.05em",
                    lineHeight: 1,
                    marginTop: 16,
                  }}
                >
                  {quota.used}
                  <span style={{ color: C.muted }}>/{quota.total}</span>
                </div>
                <div style={{ fontFamily: sans, fontSize: 13, color: C.inkDim, marginTop: 6 }}>
                  analyses complètes utilisées
                </div>

                <div style={{ display: "flex", gap: 4, marginTop: 18 }}>
                  {Array.from({ length: quota.total }).map((_, i) => (
                    <span
                      key={i}
                      style={{
                        flex: 1,
                        height: 6,
                        background: i < quota.used ? C.phosphor : C.rule,
                        boxShadow: i < quota.used ? `0 0 6px ${C.phosphor}60` : "none",
                        borderRadius: 2,
                      }}
                    />
                  ))}
                </div>

                <div
                  style={{
                    marginTop: 18,
                    fontFamily: mono,
                    fontSize: 10,
                    color: C.muted,
                    letterSpacing: "0.12em",
                  }}
                >
                  REMISE À ZÉRO · MINUIT
                </div>
              </>
            )}
          </div>

          {!quota.isPremium && (
            <div
              style={{
                background: `${C.phosphor}08`,
                border: `1px solid ${C.phosphor}40`,
                borderRadius: 16,
                padding: 28,
                position: "relative",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  fontFamily: mono,
                  fontSize: 10,
                  letterSpacing: "0.2em",
                  color: C.phosphor,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  marginBottom: 14,
                  padding: "3px 8px",
                  border: `1px solid ${C.phosphor}40`,
                  borderRadius: 20,
                }}
              >
                ✦ PASSER PRO
              </div>
              <div
                style={{
                  fontFamily: serif,
                  fontSize: 26,
                  fontWeight: 500,
                  letterSpacing: "-0.02em",
                  color: C.ink,
                  lineHeight: 1.15,
                }}
              >
                Analyses <span style={{ fontStyle: "italic", color: C.phosphor }}>illimitées</span>, édition par mail, alertes en temps réel.
              </div>
              <div style={{ fontFamily: serif, fontStyle: "italic", fontSize: 16, color: C.inkDim, marginTop: 14 }}>
                4,99 €/mois. Annulable à tout moment.
              </div>
              <Link
                href="/pricing"
                style={{
                  display: "inline-block",
                  marginTop: 20,
                  padding: "11px 22px",
                  background: C.phosphor,
                  color: C.bg,
                  fontFamily: sans,
                  fontSize: 14,
                  fontWeight: 600,
                  borderRadius: 10,
                  textDecoration: "none",
                }}
              >
                Passer Pro →
              </Link>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

import { C, serif, sans, mono } from "@/lib/design";

type Summary = {
  watchlist: number;
  avg: number | null;
  changes: number;
  alerts: number;
};

function frenchDateLine(d: Date) {
  return d
    .toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })
    .toUpperCase();
}

function greetingFor(date: Date) {
  const h = date.getHours();
  if (h < 5) return "Bonne nuit";
  if (h < 12) return "Bonjour";
  if (h < 18) return "Bon après-midi";
  return "Bonsoir";
}

function isMarketOpen(d: Date) {
  const day = d.getUTCDay();
  if (day === 0 || day === 6) return false;
  const utcH = d.getUTCHours();
  return utcH >= 13 && utcH < 21;
}

export default function Greeting({
  firstName,
  summary,
  now = new Date(),
}: {
  firstName: string;
  summary: Summary;
  now?: Date;
}) {
  const marketOpen = isMarketOpen(now);
  const salut = marketOpen ? greetingFor(now) : "Bon week-end";

  const dateStr = frenchDateLine(now);
  const editionStr = marketOpen
    ? `VOL. I · ÉDITION DU ${now.getDate()}/${(now.getMonth() + 1).toString().padStart(2, "0")}`
    : "VOL. I · BILAN HEBDOMADAIRE";

  const stats = marketOpen
    ? [
        { lab: "WATCHLIST", val: summary.watchlist, sub: "titres suivis" },
        { lab: "SCORE MOYEN", val: summary.avg ?? "—", sub: "sur la watchlist", color: C.phosphor },
        { lab: "ALERTES", val: summary.alerts, sub: "non lues", color: summary.alerts > 0 ? C.ember : undefined },
      ]
    : [
        { lab: "WATCHLIST", val: summary.watchlist, sub: "titres suivis" },
        { lab: "SCORE MOYEN", val: summary.avg ?? "—", sub: "sur la watchlist", color: C.phosphor },
        { lab: "À LIRE", val: summary.alerts, sub: "alertes en attente", color: summary.alerts > 0 ? C.ember : undefined },
      ];

  return (
    <section style={{ padding: "32px 40px 8px", maxWidth: 1320, margin: "0 auto" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          fontFamily: mono,
          fontSize: 10,
          color: C.muted,
          letterSpacing: "0.18em",
          paddingBottom: 14,
          borderBottom: `1px solid ${C.rule}`,
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <span>{dateStr}</span>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: marketOpen ? C.phosphor : C.ember,
              boxShadow: marketOpen ? `0 0 6px ${C.phosphor}` : "none",
              animation: marketOpen ? "ab-pulse 1.4s ease-in-out infinite" : "none",
            }}
          />
          {marketOpen ? "MARCHÉS OUVERTS" : "MARCHÉS FERMÉS"}
        </span>
        <span>{editionStr}</span>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1.4fr) minmax(0, 1fr)",
          gap: 60,
          padding: "36px 0 20px",
          alignItems: "end",
        }}
        className="ab-greeting-grid"
      >
        <div>
          <div
            style={{
              fontFamily: mono,
              fontSize: 11,
              color: C.phosphor,
              letterSpacing: "0.22em",
              marginBottom: 18,
            }}
          >
            § ÉDITION PERSONNELLE
          </div>
          <h1
            style={{
              fontFamily: serif,
              fontSize: "clamp(40px, 6vw, 72px)",
              fontWeight: 500,
              lineHeight: 0.98,
              letterSpacing: "-0.035em",
              color: C.ink,
              margin: 0,
            }}
          >
            {salut},{" "}
            <span style={{ fontStyle: "italic", color: C.phosphor }}>{firstName}</span>.
          </h1>
          <p
            style={{
              fontFamily: serif,
              fontStyle: "italic",
              fontSize: 22,
              lineHeight: 1.4,
              color: C.inkDim,
              marginTop: 22,
              marginBottom: 0,
              maxWidth: 560,
              fontWeight: 500,
            }}
          >
            {summary.watchlist === 0 ? (
              <>
                Votre <span style={{ color: C.phosphor, fontStyle: "normal", fontFamily: mono, fontSize: 18, padding: "0 4px" }}>watchlist</span> est vide.
                Ajoutez un premier titre depuis le screener pour recevoir votre édition personnelle.
              </>
            ) : summary.changes > 0 ? (
              <>
                <span style={{ color: C.phosphor, fontStyle: "normal", fontFamily: mono, fontSize: 18, padding: "0 4px" }}>
                  {summary.changes}
                </span>{" "}
                mouvement{summary.changes > 1 ? "s" : ""} de score sur votre watchlist, dont{" "}
                <span style={{ color: C.phosphor, fontStyle: "normal", fontFamily: mono, fontSize: 18, padding: "0 4px" }}>
                  {summary.alerts}
                </span>{" "}
                alerte{summary.alerts > 1 ? "s" : ""} déclenchée{summary.alerts > 1 ? "s" : ""}.
              </>
            ) : (
              <>Pas de bruit. Votre watchlist est stable — moment idéal pour explorer un nouveau ticker.</>
            )}
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 0,
            border: `1px solid ${C.rule}`,
            borderRadius: 12,
            overflow: "hidden",
          }}
        >
          {stats.map((s, i) => (
            <div
              key={s.lab}
              style={{
                padding: "18px 16px",
                background: C.bgCard,
                borderRight: i < 2 ? `1px solid ${C.rule}` : "none",
              }}
            >
              <div style={{ fontFamily: mono, fontSize: 9, color: C.muted, letterSpacing: "0.18em" }}>{s.lab}</div>
              <div
                style={{
                  fontFamily: mono,
                  fontSize: 34,
                  fontWeight: 600,
                  color: s.color || C.ink,
                  letterSpacing: "-0.04em",
                  lineHeight: 1,
                  marginTop: 8,
                }}
              >
                {s.val}
              </div>
              <div style={{ fontFamily: sans, fontSize: 11, color: C.muted, marginTop: 6 }}>{s.sub}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

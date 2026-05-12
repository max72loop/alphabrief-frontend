"use client";

import { useState, FormEvent } from "react";
import { C, serif, sans, mono, Gauge } from "./Gauge";
import { Logo } from "./Logo";

export function EditorialCTA() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (email.includes("@")) setSent(true);
  };

  return (
    <section style={{ padding: "80px 40px 40px", maxWidth: 1280, margin: "0 auto" }}>
      <div
        className="grid overflow-hidden"
        style={{ background: C.bgCard, border: `1px solid ${C.rule}`, borderRadius: 16, gridTemplateColumns: "1.05fr 1fr" }}
      >
        <div style={{ padding: "56px 52px", borderRight: `1px solid ${C.rule}` }}>
          <div style={{ fontFamily: mono, fontSize: 10, letterSpacing: "0.3em", color: C.phosphor, marginBottom: 20 }}>
            § 05 · L&apos;ÉDITION QUOTIDIENNE
          </div>
          <h2 style={{ fontFamily: serif, fontSize: 44, fontWeight: 500, lineHeight: 1.02, letterSpacing: "-0.025em", color: C.ink, margin: 0 }}>
            Chaque matin, 6h30.<br />
            <span style={{ fontStyle: "italic", color: C.phosphor }}>Les trois scores qui bougent.</span>
          </h2>
          <p style={{ fontFamily: serif, fontStyle: "italic", fontSize: 18, lineHeight: 1.5, color: C.inkDim, marginTop: 24 }}>
            Les mouvements de score les plus significatifs de la nuit, accompagnés d&apos;une analyse courte. Trois titres. Lecture en deux minutes.
          </p>

          {sent ? (
            <div
              className="flex items-center gap-3"
              style={{ marginTop: 36, padding: "18px 22px", background: `${C.phosphor}10`, border: `1px solid ${C.phosphor}60`, borderRadius: 10 }}
            >
              <span className="w-2 h-2 rounded-full" style={{ background: C.phosphor, boxShadow: `0 0 8px ${C.phosphor}` }} />
              <div>
                <div style={{ fontFamily: mono, fontSize: 10, color: C.phosphor, letterSpacing: "0.2em" }}>
                  ABONNÉ · CONFIRMATION ENVOYÉE
                </div>
                <div style={{ fontFamily: serif, fontSize: 15, color: C.ink, marginTop: 2 }}>
                  Premier numéro demain à 6h30 CET.
                </div>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex" style={{ marginTop: 36, maxWidth: 460 }}>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="vous@exemple.com"
                required
                style={{
                  flex: 1,
                  padding: "14px 18px",
                  background: C.bg,
                  border: `1px solid ${C.rule}`,
                  borderRight: "none",
                  color: C.ink,
                  fontFamily: mono,
                  fontSize: 14,
                  borderRadius: "10px 0 0 10px",
                  outline: "none",
                }}
              />
              <button
                type="submit"
                style={{
                  padding: "14px 22px",
                  background: C.phosphor,
                  color: C.bg,
                  border: "none",
                  fontFamily: sans,
                  fontSize: 14,
                  fontWeight: 600,
                  borderRadius: "0 10px 10px 0",
                  cursor: "pointer",
                }}
              >
                S&apos;abonner →
              </button>
            </form>
          )}

          <div className="flex" style={{ marginTop: 24, gap: 24, fontFamily: mono, fontSize: 10, color: C.muted, letterSpacing: "0.12em" }}>
            <span>✦ GRATUIT</span>
            <span>✦ DÉSABONNEMENT 1-CLIC</span>
            <span>✦ 2 MIN DE LECTURE</span>
          </div>

          <div
            className="flex items-baseline"
            style={{ marginTop: 40, paddingTop: 24, borderTop: `1px solid ${C.rule}`, gap: 32 }}
          >
            <div>
              <div style={{ fontFamily: mono, fontSize: 28, fontWeight: 600, color: C.phosphor }}>2 140</div>
              <div style={{ fontFamily: mono, fontSize: 10, color: C.muted, letterSpacing: "0.16em" }}>ABONNÉS</div>
            </div>
            <div>
              <div style={{ fontFamily: mono, fontSize: 28, fontWeight: 600, color: C.ink }}>68%</div>
              <div style={{ fontFamily: mono, fontSize: 10, color: C.muted, letterSpacing: "0.16em" }}>OPEN RATE</div>
            </div>
            <div>
              <div style={{ fontFamily: mono, fontSize: 28, fontWeight: 600, color: C.ink }}>4,8/5</div>
              <div style={{ fontFamily: mono, fontSize: 10, color: C.muted, letterSpacing: "0.16em" }}>NOTE LECTEURS</div>
            </div>
          </div>
        </div>

        <div
          className="flex flex-col justify-center"
          style={{ padding: "56px 48px", background: `radial-gradient(circle at 80% 20%, ${C.bgElev}, ${C.bgCard})` }}
        >
          <div
            className="overflow-hidden"
            style={{ background: C.bg, border: `1px solid ${C.rule}`, borderRadius: 10, boxShadow: `0 20px 60px ${C.bg}80` }}
          >
            <div
              className="flex justify-between items-center"
              style={{ padding: "14px 20px", borderBottom: `1px solid ${C.rule}`, fontFamily: mono, fontSize: 10, color: C.muted, letterSpacing: "0.12em" }}
            >
              <span>DE · brief@maxloop.ovh</span>
              <span>06:30 CET</span>
            </div>

            <div style={{ padding: "28px 28px 24px" }}>
              <div style={{ marginBottom: 20 }}>
                <Logo />
              </div>
              <div style={{ fontFamily: mono, fontSize: 9, letterSpacing: "0.3em", color: C.phosphor, marginBottom: 8 }}>
                N°&nbsp;112 · LUNDI 20 AVRIL
              </div>
              <div style={{ fontFamily: serif, fontSize: 24, fontWeight: 500, lineHeight: 1.15, letterSpacing: "-0.02em", color: C.ink, marginBottom: 4 }}>
                <span style={{ fontStyle: "italic", color: C.phosphor }}>Nvidia</span> passe 84.<br />
                <span style={{ fontStyle: "italic", color: C.phosphor }}>LVMH</span> perd 6 points.
              </div>

              <div
                className="flex flex-col"
                style={{ marginTop: 24, paddingTop: 16, borderTop: `1px solid ${C.rule}`, gap: 16 }}
              >
                {[
                  { sym: "NVDA", score: 84, delta: "+2", kind: "HIGHLIGHT",  color: C.phosphor,     line: "Marges record. Momentum intact. Zone d'achat confirmée." },
                  { sym: "ASML", score: 71, delta: "+3", kind: "ROTATION",   color: C.phosphorSoft, line: "Commandes mémoire repartent. Technique vire haussier." },
                  { sym: "LVMH", score: 58, delta: "-6", kind: "DOWNGRADE",  color: C.ember,        line: "Ralentissement Chine. Momentum s'essouffle." },
                ].map((it) => (
                  <div key={it.sym} className="grid items-center" style={{ gridTemplateColumns: "44px 1fr auto", gap: 14 }}>
                    <Gauge value={it.score} size={44} stroke={5} showNumeral={false} />
                    <div>
                      <div className="flex items-baseline gap-2">
                        <span style={{ fontFamily: serif, fontSize: 18, fontWeight: 600, color: C.ink, letterSpacing: "-0.02em" }}>{it.sym}</span>
                        <span style={{ fontFamily: mono, fontSize: 9, color: it.color, letterSpacing: "0.16em" }}>· {it.kind}</span>
                      </div>
                      <div style={{ fontFamily: serif, fontStyle: "italic", fontSize: 13, color: C.inkDim, lineHeight: 1.4, marginTop: 2 }}>
                        {it.line}
                      </div>
                    </div>
                    <div className="text-right">
                      <div style={{ fontFamily: mono, fontSize: 20, fontWeight: 600, color: it.color, letterSpacing: "-0.03em" }}>
                        {it.score}
                      </div>
                      <div style={{ fontFamily: mono, fontSize: 10, color: it.delta.startsWith("-") ? C.sanguine : C.phosphor }}>
                        {it.delta}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div
                className="flex justify-between"
                style={{ marginTop: 20, paddingTop: 14, borderTop: `1px dashed ${C.rule}`, fontFamily: mono, fontSize: 9, color: C.muted, letterSpacing: "0.14em" }}
              >
                <span>→ LIRE L&apos;ÉDITION COMPLÈTE</span>
                <span>2 MIN</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

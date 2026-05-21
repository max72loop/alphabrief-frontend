// Tokens de design et helpers de score — module neutre (pas de "use client")
// pour être consommable indistinctement par Server Components et Client Components.
// Gauge.tsx ré-exporte ces symboles pour compat des imports existants.

export const C = {
  bg: "#0A0F0C",
  bgAlt: "#111814",
  bgCard: "#0E1511",
  bgElev: "#13201A",
  rule: "#1A2520",
  ruleDim: "#14201B",
  ink: "#F0EBDB",
  inkDim: "#C6C0A9",
  muted: "#6D7A72",
  muteDeep: "#4A6355",
  phosphor: "#7EE5A3",
  phosphorSoft: "#5AB983",
  ember: "#E5A04E",
  sanguine: "#D85F66",
};

export const serif = "var(--font-fraunces), 'Times New Roman', serif";
export const sans = "var(--font-inter-tight), -apple-system, system-ui, sans-serif";
export const mono = "var(--font-jetbrains-mono), ui-monospace, Menlo, monospace";

// Seuils de score — source de vérité unique pour le code couleur, labels et tags.
// Calibrés sur la distribution réelle (mai 2026) : top observé 57, médiane ~48.
// Les anciens seuils 75/60/45/30 produisaient un visuel "tout orange" puisque
// quasi aucun ticker n'atteignait 60. Quand la qualité des fondamentaux FMP
// remontera, ces seuils pourront être révisés.
export const SCORE_THRESHOLDS = {
  excellent: 55,
  good: 48,
  neutral: 42,
  weak: 35,
} as const;

export function scoreColor(v: number): string {
  if (v >= SCORE_THRESHOLDS.excellent) return C.phosphor;
  if (v >= SCORE_THRESHOLDS.good)      return C.phosphorSoft;
  if (v >= SCORE_THRESHOLDS.neutral)   return C.ember;
  if (v >= SCORE_THRESHOLDS.weak)      return "#E58A4E";
  return C.sanguine;
}

export function scoreLabel(v: number): string {
  if (v >= SCORE_THRESHOLDS.excellent) return "EXCELLENT";
  if (v >= SCORE_THRESHOLDS.good)      return "BON";
  if (v >= SCORE_THRESHOLDS.neutral)   return "NEUTRE";
  if (v >= SCORE_THRESHOLDS.weak)      return "ATTENTION";
  return "ÉVITER";
}

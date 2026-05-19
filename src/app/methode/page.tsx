import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import AppNav from '@/components/AppNav'

const PILLARS = [
  { num: '01', title: 'Qualité',      weight: '18%', desc: "Marge EBIT, ROE, FCF Margin, Cash Conversion. Mesure la qualité opérationnelle de l'entreprise." },
  { num: '02', title: 'Croissance',   weight: '13%', desc: "CAGR revenus 3 ans + tendance d'accélération/décélération. Qualifie la dynamique de croissance." },
  { num: '03', title: 'Valorisation', weight: '25%', desc: 'FCF Yield, P/E, EV/EBITDA, P/B, PEG, Dividend Yield. Le pilier le plus pondéré.' },
  { num: '04', title: 'Momentum',     weight: '12%', desc: 'Performance 1m/3m/6m/12m absolue + momentum relatif vs secteur. Filtre la direction du marché.' },
  { num: '05', title: 'Technique',    weight: '10%', desc: 'RSI 14j, SMA 50/200, MACD, position 52 semaines. Confirme ou invalide le signal fondamental.' },
  { num: '06', title: 'Risque',       weight: '10%', desc: 'Beta, Dette/EBITDA, couverture intérêts, volatilité, drawdown, Altman Z-Score.' },
  { num: '07', title: 'Analystes',    weight: '12%', desc: 'Consensus analystes, target moyen, recommandation. Absent pour les small caps.' },
]

const SCORE_BANDS = [
  { range: '75 – 100', label: 'EXCELLENT', color: '#7EE5A3' },
  { range: '60 – 74',  label: 'BON',       color: '#5AB983' },
  { range: '45 – 59',  label: 'NEUTRE',    color: '#E5A04E' },
  { range: '30 – 44',  label: 'ATTENTION', color: '#E58A4E' },
  { range: '0  – 29',  label: 'RISQUÉ',    color: '#D85F66' },
]

export default async function MethodePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <div className="min-h-screen bg-[#0A0F0C] text-[#F0EBDB]">
      <AppNav activePath="/methode" />
      <main className="max-w-3xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-10">
          <p className="text-[10px] uppercase tracking-[0.22em] text-[#7EE5A3] mb-3"
            style={{ fontFamily: 'var(--font-jetbrains-mono, monospace)' }}>
            § MÉTHODOLOGIE
          </p>
          <h1 className="text-4xl mb-4"
            style={{ fontFamily: 'var(--font-fraunces, serif)', fontWeight: 500, letterSpacing: '-0.025em', lineHeight: 1 }}>
            Sept piliers, <span style={{ fontStyle: 'italic', color: '#7EE5A3' }}>un seul verdict</span>.
          </h1>
          <p className="text-[#C6C0A9] text-base leading-relaxed max-w-xl">
            Le score AlphaBrief (0–100) combine sept piliers pondérés. Chaque pilier est normalisé entre 0 et 100
            avant d&apos;être agrégé. Un bonus/malus de convergence (jusqu&apos;à ±8 pts) récompense les titres
            où plusieurs piliers s&apos;alignent dans le même sens.
          </p>
        </div>

        {/* Pillars */}
        <div className="border-t border-[#1A2520] divide-y divide-[#1A2520] mb-12">
          {PILLARS.map(p => (
            <div key={p.num} className="py-5 flex items-baseline gap-6">
              <span className="text-[10px] uppercase tracking-[0.22em] text-[#6D7A72] w-10 shrink-0"
                style={{ fontFamily: 'var(--font-jetbrains-mono, monospace)' }}>
                {p.num}
              </span>
              <div className="flex-1">
                <div className="flex items-baseline gap-3 mb-1 flex-wrap">
                  <h3 className="text-xl text-[#F0EBDB]"
                    style={{ fontFamily: 'var(--font-fraunces, serif)', fontWeight: 500, letterSpacing: '-0.02em' }}>
                    {p.title}
                  </h3>
                  <span className="text-[10px] uppercase tracking-[0.18em] text-[#7EE5A3] font-bold"
                    style={{ fontFamily: 'var(--font-jetbrains-mono, monospace)' }}>
                    PONDÉRATION {p.weight}
                  </span>
                </div>
                <p className="text-sm text-[#C6C0A9] leading-relaxed">{p.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Score bands */}
        <div className="mb-12">
          <p className="text-[10px] uppercase tracking-[0.22em] text-[#7EE5A3] mb-3"
            style={{ fontFamily: 'var(--font-jetbrains-mono, monospace)' }}>
            § BARÈME
          </p>
          <h2 className="text-2xl mb-5"
            style={{ fontFamily: 'var(--font-fraunces, serif)', fontWeight: 500, letterSpacing: '-0.02em' }}>
            Comment <span style={{ fontStyle: 'italic' }}>lire le score</span>.
          </h2>
          <div className="rounded-xl border border-[#1A2520] bg-[#0E1511] overflow-hidden">
            {SCORE_BANDS.map((s, i) => (
              <div
                key={s.range}
                className={`flex items-center justify-between px-5 py-3 ${
                  i < SCORE_BANDS.length - 1 ? 'border-b border-[#1A2520]' : ''
                }`}
              >
                <span className="text-sm tabular-nums text-[#C6C0A9]"
                  style={{ fontFamily: 'var(--font-jetbrains-mono, monospace)' }}>
                  {s.range}
                </span>
                <span
                  className="text-xs uppercase tracking-[0.18em] font-bold"
                  style={{ fontFamily: 'var(--font-jetbrains-mono, monospace)', color: s.color }}
                >
                  {s.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Disclaimer */}
        <p className="text-[10px] uppercase tracking-[0.18em] text-[#4A6355] text-center leading-relaxed"
          style={{ fontFamily: 'var(--font-jetbrains-mono, monospace)' }}>
          OUTIL D&apos;AIDE À LA DÉCISION QUANTITATIVE · NE CONSTITUE PAS UN CONSEIL EN INVESTISSEMENT
          AU SENS MIF II · ALPHABRIEF N&apos;EST PAS ENREGISTRÉ AUPRÈS DE L&apos;AMF EN QUALITÉ DE CIF
        </p>
      </main>
    </div>
  )
}

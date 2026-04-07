import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import AppNav from '@/components/AppNav'

const PILLARS = [
  { icon: '📊', title: 'Qualité (18%)', desc: 'Marge EBIT, ROE, FCF Margin, Cash Conversion. Mesure la qualité opérationnelle de l\'entreprise.' },
  { icon: '📈', title: 'Croissance (13%)', desc: 'CAGR revenus 3 ans + tendance d\'accélération/décélération. Qualifie la dynamique de croissance.' },
  { icon: '💎', title: 'Valorisation (25%)', desc: 'FCF Yield, P/E, EV/EBITDA, P/B, PEG, Dividend Yield. Le pilier le plus pondéré.' },
  { icon: '🚀', title: 'Momentum (12%)', desc: 'Performance 1m/3m/6m/12m absolue + momentum relatif vs secteur. Filtre la direction du marché.' },
  { icon: '📡', title: 'Technique (10%)', desc: 'RSI 14j, SMA 50/200, MACD, position 52 semaines. Confirme ou invalide le signal fondamental.' },
  { icon: '🛡️', title: 'Risque (10%)', desc: 'Beta, Dette/EBITDA, couverture intérêts, volatilité, drawdown, Altman Z-Score.' },
  { icon: '🎯', title: 'Analystes (12%)', desc: 'Consensus analystes, target moyen, recommandation. Absent pour les small caps.' },
]

export default async function MethodePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <div className="min-h-screen bg-[#0f0f1a] text-white">
      <AppNav activePath="/methode" />
      <main className="max-w-3xl mx-auto px-6 py-10">
        <h1 className="text-2xl font-bold mb-2">Méthodologie</h1>
        <p className="text-zinc-400 text-sm mb-8 leading-relaxed">
          Le score AlphaBrief (0–100) combine 7 piliers pondérés. Chaque pilier est normalisé entre 0 et 100
          avant d&apos;être agrégé. Un bonus/malus de convergence (jusqu&apos;à ±8 pts) récompense
          les titres où plusieurs piliers s&apos;alignent dans le même sens.
        </p>

        <div className="grid gap-3 mb-10">
          {PILLARS.map(p => (
            <div key={p.title} className="rounded-xl border border-white/[0.06] bg-white/[0.01] p-4 flex gap-4">
              <span className="text-2xl shrink-0">{p.icon}</span>
              <div>
                <div className="font-bold text-sm mb-1">{p.title}</div>
                <div className="text-sm text-zinc-400 leading-relaxed">{p.desc}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-xl border border-white/[0.06] bg-white/[0.01] p-5">
          <h2 className="font-bold mb-3">Interprétation des scores</h2>
          <div className="grid grid-cols-2 gap-2 text-sm">
            {[
              { range: '75 – 100', label: 'Exceptionnel', color: 'text-emerald-400' },
              { range: '65 – 74',  label: 'Fort',         color: 'text-emerald-400' },
              { range: '50 – 64',  label: 'Modéré',       color: 'text-amber-400' },
              { range: '35 – 49',  label: 'Neutre',       color: 'text-amber-400' },
              { range: '20 – 34',  label: 'Faible',       color: 'text-rose-400' },
              { range: '0  – 19',  label: 'À éviter',     color: 'text-rose-400' },
            ].map(s => (
              <div key={s.range} className="flex items-center justify-between px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.05]">
                <span className="text-zinc-500 tabular-nums">{s.range}</span>
                <span className={`font-semibold ${s.color}`}>{s.label}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="mt-6 text-xs text-zinc-700 text-center leading-relaxed">
          Outil d&apos;aide à la décision quantitative — pas un conseil en investissement au sens MIF II.
          AlphaBrief n&apos;est pas enregistré auprès de l&apos;AMF en qualité de CIF.
        </p>
      </main>
    </div>
  )
}

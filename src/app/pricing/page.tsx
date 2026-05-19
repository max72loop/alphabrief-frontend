import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

const LEMON_CHECKOUT_URL = process.env.NEXT_PUBLIC_LEMON_CHECKOUT_URL || '#'

export default async function PricingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let isPremium = false
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('plan')
      .eq('id', user.id)
      .single()
    isPremium = (profile?.plan ?? '').toLowerCase() === 'premium'
  }

  return (
    <div className="min-h-screen bg-[#0f0f1a] text-white">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 h-14 border-b border-white/[0.06]">
        <Link href="/" className="text-base font-bold tracking-tight hover:opacity-80 transition-opacity">
          Alpha<span className="text-indigo-400">Brief</span>
        </Link>
        <div className="flex items-center gap-3">
          {user ? (
            <Link href="/dashboard" className="text-sm text-zinc-400 hover:text-white transition-colors">
              Dashboard →
            </Link>
          ) : (
            <Link href="/login" className="text-sm text-zinc-400 hover:text-white transition-colors">
              Se connecter
            </Link>
          )}
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-6 py-20">
        <div className="text-center mb-14">
          <h1 className="text-4xl font-black mb-4">
            Analysez les marchés.<br />
            <span className="text-indigo-400">Sans bruit.</span>
          </h1>
          <p className="text-zinc-400 text-lg max-w-md mx-auto">
            Un score 0–100 par action, calculé sur les fondamentaux, les indicateurs techniques et le momentum.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Free */}
          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-7 flex flex-col">
            <div className="mb-6">
              <p className="text-xs uppercase tracking-widest text-zinc-500 mb-1">Gratuit</p>
              <p className="text-4xl font-black">0 €</p>
              <p className="text-zinc-500 text-sm mt-1">Pour toujours</p>
            </div>
            <ul className="space-y-3 text-sm flex-1 mb-8">
              <FeatureRow included text="5 analyses / jour" />
              <FeatureRow included text="Score total + 3 piliers" />
              <FeatureRow included text="Accès au screener" />
              <FeatureRow text="Facteurs détaillés" />
              <FeatureRow text="Métriques fondamentales complètes" />
              <FeatureRow text="Refresh à la demande" />
              <FeatureRow text="Alertes personnalisées" />
            </ul>
            {user ? (
              <div className="text-center text-sm text-zinc-500 py-3 rounded-xl border border-white/[0.06]">
                {isPremium ? 'Votre ancien plan' : 'Votre plan actuel'}
              </div>
            ) : (
              <Link
                href="/login"
                className="block text-center py-3 rounded-xl border border-white/[0.08] text-sm font-semibold text-zinc-300 hover:bg-white/[0.04] transition-colors"
              >
                Commencer gratuitement
              </Link>
            )}
          </div>

          {/* Premium */}
          <div className="rounded-2xl border border-indigo-500/40 bg-indigo-500/5 p-7 flex flex-col relative overflow-hidden">
            <div className="absolute top-4 right-4 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 uppercase tracking-wider">
              Populaire
            </div>
            <div className="mb-6">
              <p className="text-xs uppercase tracking-widest text-indigo-400 mb-1">Premium</p>
              <p className="text-4xl font-black">4,99 €<span className="text-xl font-normal text-zinc-400"> / mois</span></p>
              <p className="text-zinc-500 text-sm mt-1">Sans engagement</p>
            </div>
            <ul className="space-y-3 text-sm flex-1 mb-8">
              <FeatureRow included text="Analyses illimitées" />
              <FeatureRow included text="Score total + 3 piliers" />
              <FeatureRow included text="Accès au screener" />
              <FeatureRow included text="Facteurs détaillés" />
              <FeatureRow included text="Métriques fondamentales complètes" />
              <FeatureRow included text="Refresh à la demande" />
              <FeatureRow included text="Alertes personnalisées" />
            </ul>
            {isPremium ? (
              <div className="text-center text-sm text-indigo-300 py-3 rounded-xl border border-indigo-500/30 bg-indigo-500/10">
                Votre plan actuel ✓
              </div>
            ) : (
              <a
                href={user ? `${LEMON_CHECKOUT_URL}?checkout[email]=${encodeURIComponent(user.email ?? '')}&checkout[custom][user_id]=${user.id}` : LEMON_CHECKOUT_URL}
                className="block text-center py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 transition-colors text-sm font-bold text-white shadow-lg shadow-indigo-500/20"
              >
                {user ? 'Passer à Premium' : 'Démarrer l\'essai'}
              </a>
            )}
          </div>
        </div>

        <p className="text-center text-xs text-zinc-600 mt-10">
          AlphaBrief est un outil d&apos;aide à la décision. Les scores ne constituent pas un conseil financier.
        </p>
      </main>
    </div>
  )
}

function FeatureRow({ included = false, text }: { included?: boolean; text: string }) {
  return (
    <li className="flex items-center gap-2.5">
      {included ? (
        <span className="text-emerald-400 shrink-0">✓</span>
      ) : (
        <span className="text-zinc-700 shrink-0">✗</span>
      )}
      <span className={included ? 'text-zinc-200' : 'text-zinc-600'}>{text}</span>
    </li>
  )
}

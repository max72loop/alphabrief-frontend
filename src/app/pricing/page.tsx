import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

const LEMON_CHECKOUT_URL = process.env.NEXT_PUBLIC_LEMON_CHECKOUT_URL ?? ''

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

  const checkoutUrl = LEMON_CHECKOUT_URL
    ? (user
        ? `${LEMON_CHECKOUT_URL}?checkout[email]=${encodeURIComponent(user.email ?? '')}&checkout[custom][user_id]=${user.id}`
        : LEMON_CHECKOUT_URL)
    : null

  return (
    <div className="min-h-screen bg-[#0A0F0C] text-[#F0EBDB]">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 h-14 border-b border-[#1A2520]">
        <Link href="/" className="text-base tracking-tight hover:opacity-80 transition-opacity select-none">
          <span
            className="text-xl text-[#7EE5A3]"
            style={{ fontFamily: 'var(--font-fraunces, serif)', fontStyle: 'italic', fontWeight: 500 }}
          >α</span>
          <span className="text-lg font-bold">lpha</span>
          <span className="text-lg font-medium">Brief</span>
        </Link>
        <div className="flex items-center gap-3">
          {user ? (
            <Link href="/dashboard" className="text-sm text-[#6D7A72] hover:text-[#F0EBDB] transition-colors">
              Dashboard →
            </Link>
          ) : (
            <Link href="/login" className="text-sm text-[#6D7A72] hover:text-[#F0EBDB] transition-colors">
              Se connecter
            </Link>
          )}
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-6 py-20">
        <div className="text-center mb-14">
          <p className="text-[10px] uppercase tracking-[0.22em] text-[#7EE5A3] mb-4">§ TARIFS</p>
          <h1
            className="text-5xl mb-5"
            style={{ fontFamily: 'var(--font-fraunces, serif)', fontWeight: 500, letterSpacing: '-0.025em', lineHeight: 1 }}
          >
            Analysez les marchés.<br />
            <span style={{ fontStyle: 'italic', color: '#7EE5A3' }}>Sans bruit.</span>
          </h1>
          <p className="text-[#C6C0A9] text-base max-w-md mx-auto leading-relaxed">
            Un score 0–100 par action, calculé sur les fondamentaux, les indicateurs techniques et le momentum.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Free */}
          <div className="rounded-2xl border border-[#1A2520] bg-[#0E1511] p-7 flex flex-col">
            <div className="mb-6">
              <p className="text-[10px] uppercase tracking-[0.22em] text-[#6D7A72] mb-2"
                style={{ fontFamily: 'var(--font-jetbrains-mono, monospace)' }}>
                Gratuit
              </p>
              <p className="text-4xl font-bold text-[#F0EBDB]">0 €</p>
              <p className="text-[#6D7A72] text-sm mt-1">Pour toujours</p>
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
              <div className="text-center text-xs uppercase tracking-[0.16em] text-[#6D7A72] py-3 rounded-xl border border-[#1A2520]"
                style={{ fontFamily: 'var(--font-jetbrains-mono, monospace)' }}>
                {isPremium ? 'Ancien plan' : 'Plan actuel'}
              </div>
            ) : (
              <Link
                href="/login?mode=signup"
                className="block text-center py-3 rounded-xl border border-[#1A2520] text-sm font-semibold text-[#C6C0A9] hover:bg-[#13201A] transition-colors"
              >
                Commencer gratuitement
              </Link>
            )}
          </div>

          {/* Premium */}
          <div className="rounded-2xl border border-[#7EE5A3]/40 bg-[#7EE5A3]/[0.04] p-7 flex flex-col relative overflow-hidden">
            <div className="absolute top-4 right-4 px-2.5 py-1 rounded-full text-[9px] font-bold bg-[#7EE5A3]/15 text-[#7EE5A3] border border-[#7EE5A3]/30 uppercase tracking-[0.18em]"
              style={{ fontFamily: 'var(--font-jetbrains-mono, monospace)' }}>
              Populaire
            </div>
            <div className="mb-6">
              <p className="text-[10px] uppercase tracking-[0.22em] text-[#7EE5A3] mb-2"
                style={{ fontFamily: 'var(--font-jetbrains-mono, monospace)' }}>
                Premium
              </p>
              <p className="text-4xl font-bold text-[#F0EBDB]">
                4,99 €<span className="text-xl font-normal text-[#6D7A72]"> / mois</span>
              </p>
              <p className="text-[#6D7A72] text-sm mt-1">Sans engagement</p>
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
              <div className="text-center text-sm text-[#7EE5A3] py-3 rounded-xl border border-[#7EE5A3]/30 bg-[#7EE5A3]/10 font-medium">
                Votre plan actuel ✓
              </div>
            ) : checkoutUrl ? (
              <a
                href={checkoutUrl}
                className="block text-center py-3 rounded-xl bg-[#7EE5A3] hover:bg-[#9AEDB5] transition-colors text-sm font-bold text-[#0A0F0C]"
              >
                {user ? 'Passer à Premium' : "Démarrer l'essai"}
              </a>
            ) : (
              <div className="text-center text-sm text-[#E5A04E] py-3 rounded-xl border border-[#E5A04E]/30 bg-[#E5A04E]/[0.05]">
                Checkout temporairement indisponible
              </div>
            )}
          </div>
        </div>

        <p className="text-center text-[10px] uppercase tracking-[0.18em] text-[#4A6355] mt-12"
          style={{ fontFamily: 'var(--font-jetbrains-mono, monospace)' }}>
          ALPHABRIEF · OUTIL D&apos;AIDE À LA DÉCISION · NE CONSTITUE PAS UN CONSEIL EN INVESTISSEMENT
        </p>
      </main>
    </div>
  )
}

function FeatureRow({ included = false, text }: { included?: boolean; text: string }) {
  return (
    <li className="flex items-center gap-2.5">
      {included ? (
        <span className="text-[#7EE5A3] shrink-0">✓</span>
      ) : (
        <span className="text-[#4A6355] shrink-0">✗</span>
      )}
      <span className={included ? 'text-[#F0EBDB]' : 'text-[#6D7A72]'}>{text}</span>
    </li>
  )
}

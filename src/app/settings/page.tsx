import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import AppNav from '@/components/AppNav'
import DigestToggle from './DigestToggle'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('weekly_digest, plan')
    .eq('id', user.id)
    .maybeSingle()

  const isPremium = (profile?.plan ?? '').toLowerCase() === 'premium'

  return (
    <div className="min-h-screen bg-[#0A0F0C] text-[#F0EBDB]">
      <AppNav activePath="/settings" />
      <main className="max-w-2xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-10">
          <p className="text-[10px] uppercase tracking-[0.22em] text-[#7EE5A3] mb-3"
            style={{ fontFamily: 'var(--font-jetbrains-mono, monospace)' }}>
            § PARAMÈTRES
          </p>
          <h1 className="text-3xl"
            style={{ fontFamily: 'var(--font-fraunces, serif)', fontWeight: 500, letterSpacing: '-0.02em' }}>
            Votre <span style={{ fontStyle: 'italic', color: '#7EE5A3' }}>compte</span>.
          </h1>
        </div>

        {/* Account */}
        <section className="mb-8">
          <h2 className="text-[10px] uppercase tracking-[0.22em] text-[#6D7A72] mb-3"
            style={{ fontFamily: 'var(--font-jetbrains-mono, monospace)' }}>
            COMPTE
          </h2>
          <div className="rounded-xl border border-[#1A2520] bg-[#0E1511] divide-y divide-[#1A2520]">
            <div className="px-5 py-4 flex items-center justify-between gap-4 flex-wrap">
              <div>
                <p className="text-xs uppercase tracking-[0.14em] text-[#6D7A72] mb-1"
                  style={{ fontFamily: 'var(--font-jetbrains-mono, monospace)' }}>
                  Email
                </p>
                <p className="text-sm font-medium text-[#F0EBDB]">{user.email}</p>
              </div>
            </div>
            <div className="px-5 py-4 flex items-center justify-between gap-4 flex-wrap">
              <div>
                <p className="text-xs uppercase tracking-[0.14em] text-[#6D7A72] mb-1"
                  style={{ fontFamily: 'var(--font-jetbrains-mono, monospace)' }}>
                  Plan
                </p>
                <p className="text-sm font-medium" style={{ color: isPremium ? '#7EE5A3' : '#F0EBDB' }}>
                  {isPremium ? 'Premium ✓' : 'Gratuit (5 analyses / jour)'}
                </p>
              </div>
              {!isPremium && (
                <a
                  href="/pricing"
                  className="text-xs uppercase tracking-[0.16em] text-[#7EE5A3] hover:underline"
                  style={{ fontFamily: 'var(--font-jetbrains-mono, monospace)' }}
                >
                  Passer Premium →
                </a>
              )}
            </div>
          </div>
        </section>

        {/* Notifications */}
        <section>
          <h2 className="text-[10px] uppercase tracking-[0.22em] text-[#6D7A72] mb-3"
            style={{ fontFamily: 'var(--font-jetbrains-mono, monospace)' }}>
            NOTIFICATIONS
          </h2>
          <div className="rounded-xl border border-[#1A2520] bg-[#0E1511]">
            <DigestToggle initialValue={profile?.weekly_digest ?? false} />
          </div>
        </section>
      </main>
    </div>
  )
}

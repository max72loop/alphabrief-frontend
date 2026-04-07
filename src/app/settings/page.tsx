import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import DigestToggle from './DigestToggle'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // weekly_digest sera disponible après la migration SQL
  const { data: profile } = await supabase
    .from('profiles')
    .select('weekly_digest')
    .eq('id', user.id)
    .maybeSingle()

  return (
    <div className="min-h-screen bg-[#0f0f1a] text-white">
      <nav className="flex items-center justify-between px-6 h-14 border-b border-white/[0.06]">
        <Link href="/dashboard" className="text-base font-bold tracking-tight hover:opacity-80 transition-opacity">
          Alpha<span className="text-indigo-400">Brief</span>
        </Link>
        <span className="text-sm text-zinc-500">{user.email}</span>
      </nav>

      <main className="max-w-xl mx-auto px-6 py-12">
        <div className="mb-8">
          <Link href="/dashboard" className="text-sm text-zinc-500 hover:text-white transition-colors">
            ← Dashboard
          </Link>
          <h1 className="text-xl font-bold mt-4">Paramètres</h1>
        </div>

        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-1">
            Notifications
          </h2>
          <DigestToggle initialValue={profile?.weekly_digest ?? false} />
        </div>

        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5 mt-4">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-3">
            Compte
          </h2>
          <div className="py-2">
            <p className="text-sm text-zinc-400">Email</p>
            <p className="text-sm font-medium text-white mt-0.5">{user.email}</p>
          </div>
        </div>
      </main>
    </div>
  )
}

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import AppNav from '@/components/AppNav'
import AlertsClient from './AlertsClient'

export default async function AlertsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: alerts } = await supabase
    .from('alerts')
    .select('*')
    .or(`user_id.is.null,user_id.eq.${user.id}`)
    .order('created_at', { ascending: false })
    .limit(100)

  return (
    <div className="min-h-screen bg-[#0A0F0C] text-[#F0EBDB]">
      <AppNav activePath="/alerts" />
      <main className="max-w-3xl mx-auto px-6 py-12">
        <div className="mb-10">
          <p className="text-[10px] uppercase tracking-[0.22em] text-[#7EE5A3] mb-3"
            style={{ fontFamily: 'var(--font-jetbrains-mono, monospace)' }}>
            § ALERTES
          </p>
          <div className="flex items-baseline justify-between gap-4 flex-wrap">
            <h1 className="text-3xl"
              style={{ fontFamily: 'var(--font-fraunces, serif)', fontWeight: 500, letterSpacing: '-0.02em' }}>
              {(alerts?.length ?? 0) === 0 ? 'Tout calme.' : `${alerts?.length} ${alerts?.length === 1 ? 'signal' : 'signaux'}.`}
            </h1>
            {(alerts?.length ?? 0) > 0 && <AlertsClient.MarkReadButton />}
          </div>
        </div>
        <AlertsClient initialAlerts={alerts ?? []} />
      </main>
    </div>
  )
}

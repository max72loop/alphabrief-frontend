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
    <div className="min-h-screen bg-[#0f0f1a] text-white">
      <AppNav activePath="/alerts" />
      <main className="max-w-3xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold">Alertes</h1>
          {(alerts?.length ?? 0) > 0 && <AlertsClient.MarkReadButton />}
        </div>
        <AlertsClient initialAlerts={alerts ?? []} />
      </main>
    </div>
  )
}

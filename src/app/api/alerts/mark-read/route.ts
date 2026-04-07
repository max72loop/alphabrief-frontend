import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await supabase
    .from('alerts')
    .update({ read: true })
    .or(`user_id.is.null,user_id.eq.${user.id}`)
    .eq('read', false)

  return NextResponse.json({ ok: true })
}

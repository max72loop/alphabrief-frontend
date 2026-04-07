import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function PATCH(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { weekly_digest } = body
  if (typeof weekly_digest !== 'boolean') {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }

  const { error } = await supabase.from('profiles').upsert(
    { id: user.id, weekly_digest, updated_at: new Date().toISOString() },
    { onConflict: 'id' }
  )

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

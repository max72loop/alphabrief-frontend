import { createHmac } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const WEBHOOK_SECRET = process.env.LEMON_WEBHOOK_SECRET ?? ''
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''

// Client admin (service role) pour écrire dans profiles sans RLS
function adminClient() {
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { persistSession: false },
  })
}

function verifySignature(body: string, signature: string): boolean {
  if (!WEBHOOK_SECRET) return false
  const hmac = createHmac('sha256', WEBHOOK_SECRET)
  hmac.update(body)
  const digest = hmac.digest('hex')
  return digest === signature
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text()
  const signature = req.headers.get('x-signature') ?? ''

  if (!verifySignature(rawBody, signature)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  let payload: Record<string, unknown>
  try {
    payload = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const eventName = payload.meta && typeof payload.meta === 'object'
    ? (payload.meta as Record<string, unknown>).event_name as string
    : ''

  const data = payload.data as Record<string, unknown> | undefined
  const attributes = data?.attributes as Record<string, unknown> | undefined
  const customData = (payload.meta as Record<string, unknown>)?.custom_data as Record<string, unknown> | undefined
  const userId = customData?.user_id as string | undefined

  if (!userId) {
    // Lemon Squeezy a envoyé un event sans user_id dans custom_data
    return NextResponse.json({ received: true, skipped: 'no user_id' })
  }

  const supabase = adminClient()

  switch (eventName) {
    case 'order_created':
    case 'subscription_created':
    case 'subscription_resumed':
    case 'subscription_unpaused': {
      const orderId = data?.id as string | undefined
      await supabase.from('profiles').upsert({
        id: userId,
        is_premium: true,
        lemon_order_id: orderId ?? null,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'id' })
      break
    }

    case 'subscription_cancelled':
    case 'subscription_expired':
    case 'subscription_paused': {
      // On garde is_premium true jusqu'à la fin de la période — Lemon gère ça
      // On passe à false seulement sur expired
      if (eventName === 'subscription_expired') {
        const status = attributes?.status as string | undefined
        if (status === 'expired') {
          await supabase.from('profiles').upsert({
            id: userId,
            is_premium: false,
            updated_at: new Date().toISOString(),
          }, { onConflict: 'id' })
        }
      }
      break
    }

    case 'subscription_payment_failed': {
      // Ne pas révoquer immédiatement — Lemon réessaiera
      break
    }

    default:
      // Event non géré, on répond 200 quand même pour éviter les retries
      break
  }

  return NextResponse.json({ received: true })
}

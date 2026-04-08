import { createHmac, timingSafeEqual } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Force Node.js runtime — l'edge runtime peut tronquer req.text() sur gros payloads
export const runtime = 'nodejs'

const WEBHOOK_SECRET = process.env.LEMON_WEBHOOK_SECRET ?? ''
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''

function adminClient() {
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { persistSession: false },
  })
}

// Comparaison en temps constant pour éviter les timing attacks
function verifySignature(body: string, signature: string): boolean {
  if (!WEBHOOK_SECRET) {
    console.error('[webhook] LEMON_WEBHOOK_SECRET non configuré')
    return false
  }
  if (!signature) return false
  const hmac = createHmac('sha256', WEBHOOK_SECRET)
  hmac.update(body)
  const digest = hmac.digest('hex')
  try {
    return timingSafeEqual(Buffer.from(digest, 'hex'), Buffer.from(signature, 'hex'))
  } catch {
    // Les deux buffers n'ont pas la même taille → signature invalide
    return false
  }
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text()
  const signature = req.headers.get('x-signature') ?? ''

  if (!verifySignature(rawBody, signature)) {
    console.warn('[webhook] Signature invalide — rejeté')
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  let payload: Record<string, unknown>
  try {
    payload = JSON.parse(rawBody)
  } catch {
    console.error('[webhook] JSON invalide')
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const meta = payload.meta as Record<string, unknown> | undefined
  const eventName = meta?.event_name as string | undefined
  const data = payload.data as Record<string, unknown> | undefined
  const attributes = data?.attributes as Record<string, unknown> | undefined
  const customData = meta?.custom_data as Record<string, unknown> | undefined
  const userId = customData?.user_id as string | undefined

  console.log(`[webhook] event=${eventName} userId=${userId ?? 'none'} dataId=${data?.id ?? 'none'}`)

  if (!userId) {
    // Event sans user_id dans custom_data — probablement un test manuel depuis Lemon
    console.warn('[webhook] Pas de user_id dans custom_data — ignoré')
    return NextResponse.json({ received: true, skipped: 'no user_id' })
  }

  const supabase = adminClient()

  switch (eventName) {
    case 'order_created':
    case 'subscription_created':
    case 'subscription_resumed':
    case 'subscription_unpaused': {
      const orderId = data?.id as string | undefined
      const { error } = await supabase.from('profiles').upsert({
        id: userId,
        is_premium: true,
        lemon_order_id: orderId ?? null,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'id' })
      if (error) console.error(`[webhook] Erreur upsert premium userId=${userId}`, error)
      else console.log(`[webhook] Premium activé userId=${userId}`)
      break
    }

    case 'subscription_cancelled':
    case 'subscription_paused': {
      // Lemon continue à facturer jusqu'à la fin de période — on ne révoque pas encore
      // L'event subscription_expired arrivera quand la période sera vraiment terminée
      console.log(`[webhook] ${eventName} userId=${userId} — en attente de subscription_expired`)
      break
    }

    case 'subscription_expired': {
      // La période est terminée, on révoque l'accès
      const { error } = await supabase.from('profiles').upsert({
        id: userId,
        is_premium: false,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'id' })
      if (error) console.error(`[webhook] Erreur révocation premium userId=${userId}`, error)
      else console.log(`[webhook] Premium révoqué userId=${userId}`)
      break
    }

    case 'subscription_payment_failed': {
      // Lemon réessaiera automatiquement — on log seulement
      const status = attributes?.status as string | undefined
      console.warn(`[webhook] Paiement échoué userId=${userId} status=${status ?? 'unknown'}`)
      break
    }

    default:
      console.log(`[webhook] Event non géré: ${eventName}`)
      break
  }

  return NextResponse.json({ received: true })
}

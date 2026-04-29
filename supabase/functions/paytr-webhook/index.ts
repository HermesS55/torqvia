import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const MERCHANT_KEY  = Deno.env.get('PAYTR_MERCHANT_KEY')!
const MERCHANT_SALT = Deno.env.get('PAYTR_MERCHANT_SALT')!

async function hmac(key: string, message: string): Promise<string> {
  const enc = new TextEncoder()
  const cryptoKey = await crypto.subtle.importKey(
    'raw', enc.encode(key), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  )
  const sig = await crypto.subtle.sign('HMAC', cryptoKey, enc.encode(message))
  return btoa(String.fromCharCode(...new Uint8Array(sig)))
}

Deno.serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  const body = await req.text()
  const p = new URLSearchParams(body)

  const merchantOid  = p.get('merchant_oid')!
  const status       = p.get('status')!
  const totalAmount  = p.get('total_amount')!
  const receivedHash = p.get('hash')!
  const utoken       = p.get('utoken') || null

  // PayTR webhook hash: HMAC-SHA256(merchantOid + merchantSalt + status + totalAmount, merchantKey)
  const expectedHash = await hmac(MERCHANT_KEY, merchantOid + MERCHANT_SALT + status + totalAmount)

  if (receivedHash !== expectedHash) {
    // Hash uyuşmazlığı — sahte istek
    return new Response('PAYTR_HASH_ERROR', { status: 400 })
  }

  const { data: sub } = await supabase
    .from('subscriptions')
    .select('id, user_id, plan')
    .eq('merchant_oid', merchantOid)
    .maybeSingle()

  if (!sub) return new Response('ORDER_NOT_FOUND', { status: 404 })

  if (status === 'success') {
    // Bu subscription'ı active yap
    await supabase
      .from('subscriptions')
      .update({ status: 'active', paytr_utoken: utoken, updated_at: new Date().toISOString() })
      .eq('merchant_oid', merchantOid)

    // Kullanıcının önceki aktif aboneliklerini iptal et
    await supabase
      .from('subscriptions')
      .update({ status: 'cancelled', updated_at: new Date().toISOString() })
      .eq('user_id', sub.user_id)
      .eq('status', 'active')
      .neq('merchant_oid', merchantOid)

    // Profile planını güncelle
    await supabase
      .from('profiles')
      .update({ plan: sub.plan })
      .eq('id', sub.user_id)
  } else {
    await supabase
      .from('subscriptions')
      .update({ status: 'expired', updated_at: new Date().toISOString() })
      .eq('merchant_oid', merchantOid)
  }

  // PayTR "OK" beklior
  return new Response('OK', { status: 200 })
})

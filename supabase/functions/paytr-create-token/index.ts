import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const MERCHANT_ID   = Deno.env.get('PAYTR_MERCHANT_ID')!
const MERCHANT_KEY  = Deno.env.get('PAYTR_MERCHANT_KEY')!
const MERCHANT_SALT = Deno.env.get('PAYTR_MERCHANT_SALT')!
const BASE_URL      = Deno.env.get('APP_BASE_URL')!
// PayTR onayı gelince '0' yap
const TEST_MODE = '1'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const PLANS: Record<string, { name: string; amount: number }> = {
  turbo: { name: 'Torqvia Turbo Üyelik (Aylık)', amount: 7900 },
  elite: { name: 'Torqvia Elite Üyelik (Aylık)',  amount: 19900 },
}

async function hmac(key: string, message: string): Promise<string> {
  const enc = new TextEncoder()
  const cryptoKey = await crypto.subtle.importKey(
    'raw', enc.encode(key), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  )
  const sig = await crypto.subtle.sign('HMAC', cryptoKey, enc.encode(message))
  return btoa(String.fromCharCode(...new Uint8Array(sig)))
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS })

  const authHeader = req.headers.get('Authorization')
  if (!authHeader) return new Response('Unauthorized', { status: 401 })

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  const { data: { user }, error: authErr } = await supabase.auth.getUser(
    authHeader.replace('Bearer ', '')
  )
  if (authErr || !user) return new Response('Unauthorized', { status: 401 })

  const { plan } = await req.json()
  if (!PLANS[plan]) {
    return new Response(JSON.stringify({ error: 'Geçersiz plan' }), {
      status: 400, headers: { ...CORS, 'Content-Type': 'application/json' },
    })
  }

  const planInfo = PLANS[plan]
  const merchantOid = `${user.id.replace(/-/g, '').slice(0, 16)}_${plan}_${Date.now()}`
  const userIp = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || '1.1.1.1'

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, phone')
    .eq('id', user.id)
    .maybeSingle()

  const basket = btoa(JSON.stringify([[planInfo.name, String(planInfo.amount), '1']]))
  const noInstallment = '1'
  const maxInstallment = '0'
  const currency = 'TL'

  // PayTR hash: HMAC-SHA256(hashStr + merchant_salt, merchant_key)
  const hashStr = [
    MERCHANT_ID, userIp, merchantOid, user.email,
    planInfo.amount, basket, noInstallment, maxInstallment, currency, TEST_MODE
  ].join('')
  const paytrToken = await hmac(MERCHANT_KEY, hashStr + MERCHANT_SALT)

  const params = new URLSearchParams({
    merchant_id:      MERCHANT_ID,
    user_ip:          userIp,
    merchant_oid:     merchantOid,
    email:            user.email!,
    payment_amount:   String(planInfo.amount),
    paytr_token:      paytrToken,
    user_basket:      basket,
    debug_on:         TEST_MODE,
    no_installment:   noInstallment,
    max_installment:  maxInstallment,
    user_name:        profile?.full_name || 'Kullanıcı',
    user_address:     'Türkiye',
    user_phone:       profile?.phone || '5000000000',
    merchant_ok_url:  `${BASE_URL}/payment/success`,
    merchant_fail_url:`${BASE_URL}/payment/failed`,
    timeout_limit:    '30',
    currency,
    test_mode:        TEST_MODE,
    lang:             'tr',
  })

  const paytrRes = await fetch('https://www.paytr.com/odeme/api/get-token', {
    method: 'POST',
    body: params,
  })
  const result = await paytrRes.json()

  if (result.status !== 'success') {
    return new Response(JSON.stringify({ error: result.reason || 'Token alınamadı' }), {
      status: 400, headers: { ...CORS, 'Content-Type': 'application/json' },
    })
  }

  // Pending kaydı oluştur — webhook gelince active'e çekilecek
  await supabase.from('subscriptions').insert({
    user_id:              user.id,
    plan,
    status:               'pending',
    merchant_oid:         merchantOid,
    amount:               planInfo.amount,
    current_period_start: new Date().toISOString(),
    current_period_end:   new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  })

  return new Response(JSON.stringify({ token: result.token }), {
    headers: { ...CORS, 'Content-Type': 'application/json' },
  })
})

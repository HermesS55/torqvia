import { createHmac, randomBytes } from 'crypto'

const API_KEY         = process.env.IYZICO_API_KEY
const SECRET_KEY      = process.env.IYZICO_SECRET_KEY
const BASE_URL        = process.env.IYZICO_BASE_URL || 'https://api.iyzipay.com'
const SUPABASE_URL    = process.env.VITE_SUPABASE_URL
const SUPABASE_SVC    = process.env.SUPABASE_SERVICE_ROLE_KEY

function generateAuth(body) {
  const randomKey = randomBytes(12).toString('hex')
  const sig = createHmac('sha256', SECRET_KEY)
    .update(API_KEY + randomKey + body)
    .digest('base64')
  const pki = `apiKey:${API_KEY}&randomKey:${randomKey}&signature:${sig}`
  return `IYZWSv2 ${Buffer.from(pki).toString('base64')}`
}

async function verifyPayment(token) {
  const payload = JSON.stringify({ locale: 'tr', conversationId: `cb_${Date.now()}`, token })
  const res = await fetch(`${BASE_URL}/payment/iyzipos/check-payment/detail`, {
    method: 'POST',
    headers: { Authorization: generateAuth(payload), 'Content-Type': 'application/json' },
    body: payload,
  })
  return res.json()
}

async function updateUserPlan(userId, plan) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}`, {
    method: 'PATCH',
    headers: {
      apikey: SUPABASE_SVC,
      Authorization: `Bearer ${SUPABASE_SVC}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
    body: JSON.stringify({ plan }),
  })
  if (!res.ok) throw new Error(`Supabase PATCH failed: ${res.status} ${await res.text()}`)
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const token = req.body?.token
  if (!token) return res.redirect(302, '/payment/failed?reason=no_token')

  try {
    const result = await verifyPayment(token)

    if (result.status !== 'success' || result.paymentStatus !== 'SUCCESS') {
      console.warn('iyzico payment not successful:', result.paymentStatus, result.errorMessage)
      return res.redirect(302, '/payment/failed?reason=payment_failed')
    }

    // conversationId was set as "userId__plan" during checkout
    const conversationId = result.conversationId || ''
    const sepIdx = conversationId.indexOf('__')
    if (sepIdx === -1) {
      console.error('Missing __ in conversationId:', conversationId)
      return res.redirect(302, '/payment/failed?reason=invalid_id')
    }

    const userId = conversationId.slice(0, sepIdx)
    const plan   = conversationId.slice(sepIdx + 2)

    if (!['turbo', 'elite'].includes(plan) || !userId) {
      console.error('Invalid plan or userId from conversationId:', conversationId)
      return res.redirect(302, '/payment/failed?reason=invalid_plan')
    }

    if (!SUPABASE_SVC || SUPABASE_SVC === 'replace-with-your-service-role-key') {
      console.error('SUPABASE_SERVICE_ROLE_KEY not configured')
      return res.redirect(302, '/payment/failed?reason=config_error')
    }

    await updateUserPlan(userId, plan)
    console.log(`✓ Plan updated: ${userId} → ${plan}`)
    return res.redirect(302, `/payment/success?plan=${plan}`)
  } catch (err) {
    console.error('iyzico callback error:', err)
    return res.redirect(302, '/payment/failed?reason=server_error')
  }
}

import { createHmac, randomBytes } from 'crypto'

export const config = {
  api: { bodyParser: { sizeLimit: '1mb' } },
}

const API_KEY    = process.env.IYZICO_API_KEY
const SECRET_KEY = process.env.IYZICO_SECRET_KEY
const BASE_URL   = process.env.IYZICO_BASE_URL || 'https://api.iyzipay.com'
const SITE_URL   = 'https://www.torqvia.net'

const PLAN_PRICES = { turbo: '79.00', elite: '199.00' }

function generateAuth(body) {
  const randomKey = randomBytes(12).toString('hex')
  const sig = createHmac('sha256', SECRET_KEY)
    .update(API_KEY + randomKey + body)
    .digest('base64')
  const pki = `apiKey:${API_KEY}&randomKey:${randomKey}&signature:${sig}`
  return `IYZWSv2 ${Buffer.from(pki).toString('base64')}`
}

function parseBody(raw) {
  if (!raw) return {}
  if (typeof raw === 'object') return raw
  try { return JSON.parse(raw) } catch { return {} }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const body = parseBody(req.body)
  const { plan, userId, userEmail, userName } = body

  const price = PLAN_PRICES[plan]

  console.log('[checkout] body keys:', Object.keys(body), '| plan:', plan, '| userId:', userId ? userId.slice(0, 8) + '...' : 'MISSING')

  if (!plan || !price) {
    return res.status(400).json({ error: `Geçersiz plan: "${plan}"`, _debug: { bodyType: typeof req.body, keys: Object.keys(body) } })
  }
  if (!userId) {
    return res.status(400).json({ error: 'Kullanıcı oturumu bulunamadı', _debug: { plan, bodyType: typeof req.body } })
  }

  const parts     = (userName || 'Torqvia Kullanicisi').split(' ')
  const firstName = parts[0] || 'Kullanici'
  const lastName  = parts.slice(1).join(' ') || 'Kullanici'
  const email     = userEmail || 'kullanici@torqvia.net'
  const ip        = ((req.headers['x-forwarded-for'] || '') + ',127.0.0.1').split(',')[0].trim()

  const payload = {
    locale: 'tr',
    conversationId: `${userId}__${plan}`,
    price,
    paidPrice: price,
    currency: 'TRY',
    basketId: `${userId}_${plan}_${Date.now()}`,
    paymentGroup: 'SUBSCRIPTION',
    callbackUrl: `${SITE_URL}/api/iyzico-callback`,
    enabledInstallments: [1, 2, 3, 6, 9],
    buyer: {
      id: userId,
      name: firstName,
      surname: lastName,
      gsmNumber: '+905350000000',
      email,
      identityNumber: '74300864791',
      registrationAddress: 'Türkiye',
      ip,
      city: 'Istanbul',
      country: 'Turkey',
    },
    shippingAddress: {
      contactName: `${firstName} ${lastName}`,
      city: 'Istanbul',
      country: 'Turkey',
      address: 'Türkiye',
    },
    billingAddress: {
      contactName: `${firstName} ${lastName}`,
      city: 'Istanbul',
      country: 'Turkey',
      address: 'Türkiye',
    },
    basketItems: [
      {
        id: plan,
        name: `Torqvia ${plan.charAt(0).toUpperCase() + plan.slice(1)} Üyelik`,
        category1: 'Üyelik',
        itemType: 'VIRTUAL',
        price,
      },
    ],
  }

  const reqBody       = JSON.stringify(payload)
  const authorization = generateAuth(reqBody)

  try {
    const iyziRes = await fetch(`${BASE_URL}/payment/iyzipos/initialize`, {
      method: 'POST',
      headers: { Authorization: authorization, 'Content-Type': 'application/json' },
      body: reqBody,
    })
    const data = await iyziRes.json()

    if (data.status !== 'success') {
      console.error('iyzico checkout error:', JSON.stringify(data))
      return res.status(400).json({ error: data.errorMessage || 'Ödeme başlatılamadı' })
    }

    return res.status(200).json({ paymentPageUrl: data.paymentPageUrl, token: data.token })
  } catch (err) {
    console.error('iyzico checkout exception:', err)
    return res.status(500).json({ error: 'Sunucu hatası: ' + err.message })
  }
}

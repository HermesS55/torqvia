import { createHmac, randomBytes } from 'crypto'

const MAGIC      = 'v11'
const API_KEY    = process.env.IYZICO_API_KEY
const SECRET_KEY = process.env.IYZICO_SECRET_KEY
const BASE_URL   = process.env.IYZICO_BASE_URL || 'https://api.iyzipay.com'
const SITE_URL   = 'https://www.torqvia.net'

const PLAN_PRICES = { turbo: '79.00', elite: '199.00' }

function generateAuth(bodyStr) {
  const randomKey = randomBytes(12).toString('hex')
  const sig = createHmac('sha256', SECRET_KEY)
    .update(API_KEY + randomKey + bodyStr)
    .digest('base64')
  const pki = `apiKey:${API_KEY}&randomKey:${randomKey}&signature:${sig}`
  return `IYZWSv2 ${Buffer.from(pki).toString('base64')}`
}

export default async function handler(req, res) {
  // GET: health check — env var varlığını da kontrol et
  if (req.method === 'GET') {
    return res.status(200).json({
      magic: MAGIC,
      ts: Date.now(),
      env: {
        api_key_len:    API_KEY    ? API_KEY.length    : 0,
        secret_key_len: SECRET_KEY ? SECRET_KEY.length : 0,
        base_url:       BASE_URL,
      },
    })
  }

  if (req.method !== 'POST') return res.status(405).end()

  // Okuma: req.body (Vercel parsed) veya raw stream
  let parsed = {}
  if (req.body && typeof req.body === 'object') {
    parsed = req.body
  } else {
    const raw = await new Promise((resolve, reject) => {
      const c = []; req.on('data', d => c.push(d)); req.on('end', () => resolve(Buffer.concat(c).toString())); req.on('error', reject)
    })
    try { parsed = JSON.parse(raw) } catch { /* empty body */ }
  }

  const { plan, userId, userEmail, userName } = parsed
  const price = PLAN_PRICES[plan]

  if (!price)  return res.status(400).json({ magic: MAGIC, code: 'NO_PLAN',  plan })
  if (!userId) return res.status(400).json({ magic: MAGIC, code: 'NO_USER' })

  const parts     = (userName || 'Torqvia Kullanicisi').split(' ')
  const firstName = parts[0] || 'Kullanici'
  const lastName  = parts.slice(1).join(' ') || 'Kullanici'
  const email     = userEmail || 'kullanici@torqvia.net'
  const ip        = ((req.headers['x-forwarded-for'] || '') + ',127.0.0.1').split(',')[0].trim()

  const payload = {
    locale: 'tr',
    conversationId: `${userId}__${plan}`,
    price, paidPrice: price, currency: 'TRY',
    basketId: `${userId}_${plan}_${Date.now()}`,
    paymentGroup: 'PRODUCT',
    callbackUrl: `${SITE_URL}/api/iyzico-callback`,
    buyer: {
      id: userId, name: firstName, surname: lastName,
      gsmNumber: '+905350000000', email,
      identityNumber: '74300864791', registrationAddress: 'Turkiye',
      ip, city: 'Istanbul', country: 'Turkey',
    },
    shippingAddress: { contactName: `${firstName} ${lastName}`, city: 'Istanbul', country: 'Turkey', address: 'Turkiye' },
    billingAddress:  { contactName: `${firstName} ${lastName}`, city: 'Istanbul', country: 'Turkey', address: 'Turkiye' },
    basketItems: [{ id: plan, name: `Torqvia ${plan[0].toUpperCase() + plan.slice(1)} Uyelik`, category1: 'Uyelik', itemType: 'VIRTUAL', price }],
  }

  const reqBody = JSON.stringify(payload)
  const auth    = generateAuth(reqBody)

  try {
    const iyziRes = await fetch(`${BASE_URL}/payment/iyzipos/initialize`, {
      method: 'POST',
      headers: { Authorization: auth, 'Content-Type': 'application/json' },
      body: reqBody,
    })
    const data = await iyziRes.json()
    if (data.status !== 'success') {
      return res.status(400).json({ magic: MAGIC, code: 'IYZICO_ERR', error: data.errorMessage || 'odeme baslatilmadi', iyzico: data, sentPrice: price, sentLocale: payload.locale })
    }
    return res.status(200).json({ paymentPageUrl: data.paymentPageUrl, token: data.token })
  } catch (err) {
    return res.status(500).json({ magic: MAGIC, code: 'SERVER_ERR', error: err.message })
  }
}

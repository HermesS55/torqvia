import { readFileSync, writeFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT      = resolve(__dirname, '..')
const TODAY     = new Date().toISOString().split('T')[0]
const BASE_URL  = 'https://www.torqvia.net'

/* ── .env okuyucu (local dev). Vercel'de process.env kullanılır) ── */
function loadEnv() {
  try {
    const raw = readFileSync(resolve(ROOT, '.env'), 'utf-8')
    return Object.fromEntries(
      raw.split('\n')
        .filter(l => l.includes('=') && !l.trim().startsWith('#'))
        .map(l => {
          const i = l.indexOf('=')
          return [l.slice(0, i).trim(), l.slice(i + 1).trim()]
        })
    )
  } catch { return {} }
}

const localEnv    = loadEnv()
const SUPABASE_URL = process.env.VITE_SUPABASE_URL  || localEnv.VITE_SUPABASE_URL
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || localEnv.VITE_SUPABASE_ANON_KEY

/* ── Statik sayfalar ── */
const STATIC_PAGES = [
  { loc: '/',            priority: '1.00', freq: 'daily'   },
  { loc: '/ustalar',     priority: '0.95', freq: 'daily'   },
  { loc: '/listings',    priority: '0.90', freq: 'daily'   },
  { loc: '/events',      priority: '0.85', freq: 'daily'   },
  { loc: '/communities', priority: '0.80', freq: 'weekly'  },
  { loc: '/pricing',     priority: '0.80', freq: 'monthly' },
  { loc: '/people',      priority: '0.70', freq: 'weekly'  },
  { loc: '/terms',       priority: '0.30', freq: 'yearly'  },
  { loc: '/privacy',     priority: '0.30', freq: 'yearly'  },
  { loc: '/refund',      priority: '0.30', freq: 'yearly'  },
]

function urlTag({ loc, priority, freq, lastmod = TODAY }) {
  return [
    '  <url>',
    `    <loc>${BASE_URL}${loc}</loc>`,
    `    <lastmod>${lastmod}</lastmod>`,
    `    <changefreq>${freq}</changefreq>`,
    `    <priority>${priority}</priority>`,
    '  </url>',
  ].join('\n')
}

async function fetchProProfiles() {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.warn('⚠  VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY bulunamadı — pro profiller atlanıyor')
    return []
  }
  try {
    const endpoint =
      `${SUPABASE_URL}/rest/v1/profiles` +
      `?role=eq.pro&banned=not.eq.true&full_name=not.is.null` +
      `&select=id,created_at`

    const res = await fetch(endpoint, {
      headers: {
        apikey:        SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        'Accept':      'application/json',
      },
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`)
    return await res.json()
  } catch (err) {
    console.warn('⚠  Pro profil sorgusu başarısız:', err.message)
    return []
  }
}

async function run() {
  console.log('🗺  Sitemap oluşturuluyor...')

  const pros = await fetchProProfiles()
  console.log(`   ${pros.length} aktif pro profil bulundu`)

  const staticTags = STATIC_PAGES.map(p => urlTag(p))

  const proTags = pros.map(p =>
    urlTag({
      loc:     `/usta/${p.id}`,
      priority: '0.70',
      freq:    'weekly',
      lastmod: p.created_at ? p.created_at.split('T')[0] : TODAY,
    })
  )

  const xml =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    [...staticTags, ...proTags].join('\n') +
    `\n</urlset>\n`

  const outPath = resolve(ROOT, 'public', 'sitemap.xml')
  writeFileSync(outPath, xml, 'utf-8')
  console.log(`✓  public/sitemap.xml → ${staticTags.length} statik + ${proTags.length} pro profil`)
}

run().catch(err => {
  console.error('Sitemap oluşturma hatası:', err)
  process.exit(1)
})

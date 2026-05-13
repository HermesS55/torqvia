import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import webPush from 'npm:web-push'

const VAPID_PUBLIC  = Deno.env.get('VAPID_PUBLIC_KEY')!
const VAPID_PRIVATE = Deno.env.get('VAPID_PRIVATE_KEY')!
const VAPID_SUBJECT = Deno.env.get('VAPID_SUBJECT')!

webPush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC, VAPID_PRIVATE)

const TYPE_LABELS: Record<string, string> = {
  like:            'gönderini beğendi',
  comment:         'gönderine yorum yaptı',
  follow:          'seni takip etti',
  follow_request:  'seni takip etmek istiyor',
  follow_accepted: 'takip isteğini kabul etti',
  message:         'sana mesaj gönderdi',
  mention:         'senden bahsetti',
  new_offer:       'ilanına teklif gönderdi',
  offer_accepted:  'teklifini kabul etti',
  offer_rejected:  'teklifini reddetti',
  rating:          'seni değerlendirdi',
}

const URL_MAP: Record<string, (n: Record<string, string>) => string> = {
  message:         () => '/messages',
  new_offer:       n => n.listing_id ? `/listings/${n.listing_id}` : '/',
  offer_accepted:  n => n.listing_id ? `/listings/${n.listing_id}` : '/',
  offer_rejected:  n => n.listing_id ? `/listings/${n.listing_id}` : '/',
  like:            n => n.post_id ? `/posts/${n.post_id}` : '/',
  comment:         n => n.post_id ? `/posts/${n.post_id}` : '/',
  mention:         n => n.post_id ? `/posts/${n.post_id}` : '/',
  follow:          n => n.from_user_id ? `/profile/${n.from_user_id}` : '/',
  follow_request:  n => n.from_user_id ? `/profile/${n.from_user_id}` : '/',
  follow_accepted: n => n.from_user_id ? `/profile/${n.from_user_id}` : '/',
  rating:          () => '/dashboard',
}

Deno.serve(async req => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: { 'Access-Control-Allow-Origin': '*' } })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  const body = await req.json()
  const notif = body.record as Record<string, string>

  const fromName = notif.from_user_name || 'Biri'
  const label    = TYPE_LABELS[notif.type] || 'bir işlem yaptı'
  const url      = URL_MAP[notif.type]?.(notif) ?? '/'

  const { data: subs } = await supabase
    .from('push_subscriptions')
    .select('id, endpoint, p256dh, auth')
    .eq('user_id', notif.user_id)

  if (!subs?.length) return new Response('no subs', { status: 200 })

  const payload = JSON.stringify({
    title: 'Torqvia',
    body:  `${fromName} ${label}`,
    url,
  })

  await Promise.allSettled(
    subs.map(row => {
      const subscription = {
        endpoint: row.endpoint,
        keys: { p256dh: row.p256dh, auth: row.auth },
      }
      return webPush.sendNotification(subscription, payload).catch(async (err: { statusCode?: number }) => {
        if (err.statusCode === 410 || err.statusCode === 404) {
          await supabase.from('push_subscriptions').delete().eq('id', row.id)
        }
      })
    })
  )

  return new Response('ok', { status: 200 })
})

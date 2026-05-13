import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

Deno.serve(async req => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: { 'Access-Control-Allow-Origin': '*' } })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  const now = new Date()
  const from = new Date(now.getTime() + 23 * 60 * 60 * 1000).toISOString()
  const to   = new Date(now.getTime() + 25 * 60 * 60 * 1000).toISOString()

  const { data: appts, error } = await supabase
    .from('appointments')
    .select('id, usta_id, musteri_id, arac_bilgisi, tarih')
    .gte('tarih', from)
    .lte('tarih', to)
    .not('durum', 'in', '("iptal","tamamlandi")')
    .is('reminded_at', null)

  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  if (!appts?.length) return new Response('no upcoming appointments', { status: 200 })

  const notifications = []
  for (const appt of appts) {
    const tarihStr = new Date(appt.tarih).toLocaleString('tr-TR', {
      day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit'
    })
    const msg = `"${appt.arac_bilgisi || 'Araç'}" randevunuz yarın saat ${tarihStr} başlıyor. Hazır olun!`

    notifications.push(
      { user_id: appt.usta_id,    type: 'appointment_reminder', message: msg },
      { user_id: appt.musteri_id, type: 'appointment_reminder', message: msg },
    )
  }

  if (notifications.length > 0) {
    await supabase.from('notifications').insert(notifications)
  }

  // Mark as reminded
  const apptIds = appts.map(a => a.id)
  await supabase
    .from('appointments')
    .update({ reminded_at: now.toISOString() })
    .in('id', apptIds)

  return new Response(JSON.stringify({ sent: appts.length }), { status: 200 })
})

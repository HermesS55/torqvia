export function useProfileCompletion(profile) {
  if (!profile) return { pct: 0, missing: [], done: [] }

  const isPro = profile.role === 'pro'

  const checks = [
    { key: 'avatar',    label: 'Profil fotoğrafı',    done: !!profile.avatar_url,    weight: 20 },
    { key: 'name',      label: 'Ad soyad',             done: !!profile.full_name?.trim(), weight: 15 },
    { key: 'bio',       label: 'Hakkında yazısı',      done: !!profile.bio?.trim(),   weight: 15 },
    { key: 'phone',     label: 'Telefon numarası',     done: !!profile.phone?.trim(), weight: 10 },
    ...(isPro ? [
      { key: 'specialty',  label: 'Uzmanlık alanı',    done: !!(profile.specialties?.length || profile.specialty), weight: 15 },
      { key: 'city',       label: 'Şehir / konum',     done: !!profile.city?.trim(),  weight: 10 },
      { key: 'shop_name',  label: 'Dükkan adı',        done: !!profile.shop_name?.trim(), weight: 10 },
      { key: 'price',      label: 'Fiyat aralığı',     done: !!profile.price_range?.trim(), weight: 5 },
    ] : []),
  ]

  const totalWeight = checks.reduce((s, c) => s + c.weight, 0)
  const doneWeight  = checks.filter(c => c.done).reduce((s, c) => s + c.weight, 0)
  const pct = Math.round((doneWeight / totalWeight) * 100)

  return {
    pct,
    missing: checks.filter(c => !c.done).map(c => c.label),
    done:    checks.filter(c =>  c.done).map(c => c.label),
    checks,
  }
}

const STATUSES = ['orijinal', 'boyali', 'lokal', 'degisen', 'hasarli']

const STATUS_CONFIG = {
  orijinal: { label: 'Orijinal',     bg: 'bg-zinc-800',        border: 'border-zinc-600',     text: 'text-zinc-400' },
  boyali:   { label: 'Boyalı',       bg: 'bg-amber-500/25',    border: 'border-amber-500/70', text: 'text-amber-300' },
  lokal:    { label: 'Lokal Boyalı', bg: 'bg-yellow-400/20',   border: 'border-yellow-400/60',text: 'text-yellow-300' },
  degisen:  { label: 'Değişen',      bg: 'bg-blue-500/25',     border: 'border-blue-500/70',  text: 'text-blue-300' },
  hasarli:  { label: 'Hasarlı',      bg: 'bg-red-500/25',      border: 'border-red-500/70',   text: 'text-red-300' },
}

export const DEFAULT_DAMAGE_REPORT = {
  on_tampon:          'orijinal',
  sol_on_camurluk:    'orijinal',
  kaput:              'orijinal',
  sag_on_camurluk:    'orijinal',
  sol_on_kapi:        'orijinal',
  tavan:              'orijinal',
  sag_on_kapi:        'orijinal',
  sol_arka_kapi:      'orijinal',
  sag_arka_kapi:      'orijinal',
  sol_arka_camurluk:  'orijinal',
  bagaj:              'orijinal',
  sag_arka_camurluk:  'orijinal',
  arka_tampon:        'orijinal',
}

function Part({ label, status, onClick, readOnly, span }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.orijinal
  return (
    <button
      type="button"
      onClick={readOnly ? undefined : onClick}
      disabled={readOnly}
      title={readOnly ? cfg.label : `${label}: ${cfg.label} → tıkla`}
      className={`
        flex items-center justify-center text-center text-[10px] font-semibold leading-tight
        border rounded-lg px-1 py-2 transition-all select-none
        ${cfg.bg} ${cfg.border} ${cfg.text}
        ${readOnly ? 'cursor-default' : 'cursor-pointer hover:brightness-125 active:scale-95'}
        ${span ? span : ''}
      `}
      style={{ minHeight: 44 }}
    >
      <span className="whitespace-pre-line">{label}</span>
    </button>
  )
}

export default function CarDamageReport({ report = {}, onChange, readOnly = false }) {
  const r = { ...DEFAULT_DAMAGE_REPORT, ...report }

  function cycle(part) {
    if (readOnly) return
    const curr = r[part] || 'orijinal'
    const next = STATUSES[(STATUSES.indexOf(curr) + 1) % STATUSES.length]
    onChange({ ...r, [part]: next })
  }

  const hasAnyDamage = Object.values(r).some(v => v !== 'orijinal')

  return (
    <div className="space-y-3">
      {!readOnly && (
        <p className="text-xs text-zinc-500">
          Parçaya tıklayarak durumunu değiştir. Renk: <span className="text-zinc-400">Orijinal</span> → <span className="text-amber-300">Boyalı</span> → <span className="text-yellow-300">Lokal</span> → <span className="text-blue-300">Değişen</span> → <span className="text-red-300">Hasarlı</span>
        </p>
      )}

      {/* Araç diyagramı */}
      <div className="relative bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
        {/* Ok işareti - ÖN */}
        <div className="flex justify-center mb-1">
          <span className="text-[10px] font-bold text-zinc-600 tracking-widest uppercase">▲ ÖN</span>
        </div>

        <div className="grid gap-1.5" style={{ gridTemplateColumns: '1fr 1.6fr 1fr' }}>
          {/* Row 1: Ön Tampon */}
          <Part label="Ön Tampon" status={r.on_tampon} onClick={() => cycle('on_tampon')} readOnly={readOnly} span="col-span-3" />

          {/* Row 2: Çamurluklar + Kaput */}
          <Part label={'Sol Ön\nÇamurluk'} status={r.sol_on_camurluk} onClick={() => cycle('sol_on_camurluk')} readOnly={readOnly} />
          <Part label="Kaput"               status={r.kaput}           onClick={() => cycle('kaput')}           readOnly={readOnly} />
          <Part label={'Sağ Ön\nÇamurluk'} status={r.sag_on_camurluk} onClick={() => cycle('sag_on_camurluk')} readOnly={readOnly} />

          {/* Row 3: Ön Kapılar + Tavan üst */}
          <Part label={'Sol Ön\nKapı'}  status={r.sol_on_kapi} onClick={() => cycle('sol_on_kapi')} readOnly={readOnly} />
          <div
            className={`
              row-span-2 flex items-center justify-center text-[10px] font-semibold border rounded-lg transition-all
              ${STATUS_CONFIG[r.tavan]?.bg} ${STATUS_CONFIG[r.tavan]?.border} ${STATUS_CONFIG[r.tavan]?.text}
              ${readOnly ? 'cursor-default' : 'cursor-pointer hover:brightness-125 active:scale-95'}
            `}
            onClick={() => cycle('tavan')}
            title={readOnly ? STATUS_CONFIG[r.tavan]?.label : `Tavan: ${STATUS_CONFIG[r.tavan]?.label}`}
          >
            Tavan
          </div>
          <Part label={'Sağ Ön\nKapı'} status={r.sag_on_kapi} onClick={() => cycle('sag_on_kapi')} readOnly={readOnly} />

          {/* Row 4: Arka Kapılar */}
          <Part label={'Sol Arka\nKapı'}  status={r.sol_arka_kapi} onClick={() => cycle('sol_arka_kapi')} readOnly={readOnly} />
          <Part label={'Sağ Arka\nKapı'}  status={r.sag_arka_kapi} onClick={() => cycle('sag_arka_kapi')} readOnly={readOnly} />

          {/* Row 5: Arka çamurluklar + Bagaj */}
          <Part label={'Sol Arka\nÇamurluk'} status={r.sol_arka_camurluk} onClick={() => cycle('sol_arka_camurluk')} readOnly={readOnly} />
          <Part label="Bagaj"                 status={r.bagaj}             onClick={() => cycle('bagaj')}             readOnly={readOnly} />
          <Part label={'Sağ Arka\nÇamurluk'} status={r.sag_arka_camurluk} onClick={() => cycle('sag_arka_camurluk')} readOnly={readOnly} />

          {/* Row 6: Arka Tampon */}
          <Part label="Arka Tampon" status={r.arka_tampon} onClick={() => cycle('arka_tampon')} readOnly={readOnly} span="col-span-3" />
        </div>

        <div className="flex justify-center mt-1">
          <span className="text-[10px] font-bold text-zinc-600 tracking-widest uppercase">▼ ARKA</span>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-2">
        {STATUSES.map(s => (
          <span key={s} className={`inline-flex items-center gap-1.5 text-[11px] font-medium px-2 py-1 rounded-full border ${STATUS_CONFIG[s].bg} ${STATUS_CONFIG[s].border} ${STATUS_CONFIG[s].text}`}>
            {STATUS_CONFIG[s].label}
          </span>
        ))}
      </div>

      {/* Özet - sadece hasar varsa */}
      {hasAnyDamage && (
        <div className="bg-zinc-800/60 border border-zinc-700 rounded-xl p-3 space-y-1">
          <p className="text-xs font-semibold text-zinc-400 mb-2">Hasar Özeti</p>
          {Object.entries(r)
            .filter(([, v]) => v !== 'orijinal')
            .map(([part, status]) => {
              const label = PART_LABELS[part] || part
              const cfg = STATUS_CONFIG[status]
              return (
                <div key={part} className="flex items-center justify-between text-xs">
                  <span className="text-zinc-400">{label}</span>
                  <span className={`font-semibold ${cfg.text}`}>{cfg.label}</span>
                </div>
              )
            })}
        </div>
      )}
    </div>
  )
}

const PART_LABELS = {
  on_tampon:          'Ön Tampon',
  sol_on_camurluk:    'Sol Ön Çamurluk',
  kaput:              'Kaput',
  sag_on_camurluk:    'Sağ Ön Çamurluk',
  sol_on_kapi:        'Sol Ön Kapı',
  tavan:              'Tavan',
  sag_on_kapi:        'Sağ Ön Kapı',
  sol_arka_kapi:      'Sol Arka Kapı',
  sag_arka_kapi:      'Sağ Arka Kapı',
  sol_arka_camurluk:  'Sol Arka Çamurluk',
  bagaj:              'Bagaj',
  sag_arka_camurluk:  'Sağ Arka Çamurluk',
  arka_tampon:        'Arka Tampon',
}

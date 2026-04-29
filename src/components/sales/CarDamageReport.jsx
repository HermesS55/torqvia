const STATUSES = ['orijinal', 'boyali', 'lokal', 'degisen', 'hasarli']

const STATUS_CFG = {
  orijinal: { label: 'Orijinal',     fill: '#3f3f46', fillOp: 1,    stroke: '#52525b', strokeOp: 1,    text: '#a1a1aa', pill: 'bg-zinc-800 border-zinc-600 text-zinc-400' },
  boyali:   { label: 'Boyalı',       fill: '#d97706', fillOp: 0.28, stroke: '#d97706', strokeOp: 0.85, text: '#fcd34d', pill: 'bg-amber-500/20 border-amber-500/60 text-amber-300' },
  lokal:    { label: 'Lokal Boyalı', fill: '#eab308', fillOp: 0.22, stroke: '#eab308', strokeOp: 0.8,  text: '#fef08a', pill: 'bg-yellow-400/20 border-yellow-400/60 text-yellow-200' },
  degisen:  { label: 'Değişen',      fill: '#3b82f6', fillOp: 0.28, stroke: '#3b82f6', strokeOp: 0.85, text: '#93c5fd', pill: 'bg-blue-500/20 border-blue-500/60 text-blue-300' },
  hasarli:  { label: 'Hasarlı',      fill: '#ef4444', fillOp: 0.28, stroke: '#ef4444', strokeOp: 0.85, text: '#fca5a5', pill: 'bg-red-500/20 border-red-500/60 text-red-300' },
}

export const DEFAULT_DAMAGE_REPORT = {
  on_tampon: 'orijinal', sol_on_camurluk: 'orijinal', kaput: 'orijinal',
  sag_on_camurluk: 'orijinal', sol_on_kapi: 'orijinal', tavan: 'orijinal',
  sag_on_kapi: 'orijinal', sol_arka_kapi: 'orijinal', sag_arka_kapi: 'orijinal',
  sol_arka_camurluk: 'orijinal', bagaj: 'orijinal', sag_arka_camurluk: 'orijinal',
  arka_tampon: 'orijinal',
}

const PART_LABELS = {
  on_tampon: 'Ön Tampon', sol_on_camurluk: 'Sol Ön Çamurluk', kaput: 'Kaput',
  sag_on_camurluk: 'Sağ Ön Çamurluk', sol_on_kapi: 'Sol Ön Kapı', tavan: 'Tavan',
  sag_on_kapi: 'Sağ Ön Kapı', sol_arka_kapi: 'Sol Arka Kapı', sag_arka_kapi: 'Sağ Arka Kapı',
  sol_arka_camurluk: 'Sol Arka Çamurluk', bagaj: 'Bagaj', sag_arka_camurluk: 'Sağ Arka Çamurluk',
  arka_tampon: 'Arka Tampon',
}

// Araç parçaları — SVG path koordinatları (viewBox 200x510)
const PARTS = [
  {
    key: 'on_tampon',
    d: 'M 50,4 Q 100,0 150,4 L 165,36 L 35,36 Z',
    textX: 100, textY: 23, fontSize: 8.5, rotate: 0,
    lines: ['Ön', 'Tampon'],
  },
  {
    key: 'sol_on_camurluk',
    d: 'M 20,37 L 40,37 L 40,183 L 4,183 Q 2,158 2,115 Q 2,68 20,37 Z',
    textX: 22, textY: 112, fontSize: 7, rotate: -90,
    lines: ['Sol Ön Çmrlk'],
  },
  {
    key: 'kaput',
    d: 'M 40,37 L 160,37 L 160,183 L 40,183 Z',
    textX: 100, textY: 112, fontSize: 13, rotate: 0,
    lines: ['Kaput'],
  },
  {
    key: 'sag_on_camurluk',
    d: 'M 160,37 L 180,37 Q 198,68 198,115 Q 198,158 196,183 L 160,183 Z',
    textX: 178, textY: 112, fontSize: 7, rotate: 90,
    lines: ['Sağ Ön Çmrlk'],
  },
  {
    key: 'sol_on_kapi',
    d: 'M 2,185 L 40,185 L 40,312 L 2,312 Z',
    textX: 21, textY: 250, fontSize: 7.5, rotate: -90,
    lines: ['Sol Ön Kapı'],
  },
  {
    key: 'tavan',
    d: 'M 40,185 L 160,185 L 160,378 L 40,378 Z',
    textX: 100, textY: 283, fontSize: 14, rotate: 0,
    lines: ['Tavan'],
  },
  {
    key: 'sag_on_kapi',
    d: 'M 160,185 L 198,185 L 198,312 L 160,312 Z',
    textX: 179, textY: 250, fontSize: 7.5, rotate: 90,
    lines: ['Sağ Ön Kapı'],
  },
  {
    key: 'sol_arka_kapi',
    d: 'M 2,312 L 40,312 L 40,378 L 2,378 Z',
    textX: 21, textY: 345, fontSize: 7, rotate: -90,
    lines: ['Sol Arka Kapı'],
  },
  {
    key: 'sag_arka_kapi',
    d: 'M 160,312 L 198,312 L 198,378 L 160,378 Z',
    textX: 179, textY: 345, fontSize: 7, rotate: 90,
    lines: ['Sağ Arka Kapı'],
  },
  {
    key: 'sol_arka_camurluk',
    d: 'M 2,380 L 40,380 L 40,462 L 20,468 Q 4,448 2,410 Q 2,392 2,380 Z',
    textX: 21, textY: 423, fontSize: 7, rotate: -90,
    lines: ['Sol Arka Çmrlk'],
  },
  {
    key: 'bagaj',
    d: 'M 40,380 L 160,380 L 160,462 L 40,462 Z',
    textX: 100, textY: 423, fontSize: 13, rotate: 0,
    lines: ['Bagaj'],
  },
  {
    key: 'sag_arka_camurluk',
    d: 'M 160,380 L 198,380 Q 198,392 198,410 Q 196,448 180,468 L 160,462 Z',
    textX: 179, textY: 423, fontSize: 7, rotate: 90,
    lines: ['Sağ Arka Çmrlk'],
  },
  {
    key: 'arka_tampon',
    d: 'M 20,469 L 40,463 L 160,463 L 180,469 L 152,503 Q 100,510 48,503 Z',
    textX: 100, textY: 490, fontSize: 8.5, rotate: 0,
    lines: ['Arka', 'Tampon'],
  },
]

// Dekoratif elemanlar (tıklanamaz)
const DECORATIONS = {
  // Araç gövde arka planı
  body: 'M 50,4 Q 100,0 150,4 L 180,37 Q 198,65 198,115 Q 198,158 198,185 L 198,312 L 198,378 Q 198,395 198,410 Q 196,448 180,469 L 152,503 Q 100,510 48,503 L 20,469 Q 4,448 2,410 Q 2,395 2,378 L 2,312 L 2,185 Q 2,158 2,115 Q 2,65 20,37 Z',
  // Ön cam
  windshield: 'M 42,183 L 158,183 L 155,200 L 45,200 Z',
  // Arka cam
  rearWindow: 'M 45,362 L 155,362 L 158,378 L 42,378 Z',
}

export default function CarDamageReport({ report = {}, onChange, readOnly = false }) {
  const r = { ...DEFAULT_DAMAGE_REPORT, ...report }

  function cycle(key) {
    if (readOnly) return
    const curr = r[key] || 'orijinal'
    const next = STATUSES[(STATUSES.indexOf(curr) + 1) % STATUSES.length]
    onChange({ ...r, [key]: next })
  }

  const hasAnyDamage = Object.values(r).some(v => v !== 'orijinal')

  return (
    <div className="space-y-4">
      {!readOnly && (
        <p className="text-xs text-zinc-500">
          Parçaya tıkla → durum değişir. Tüm parçalar varsayılan olarak <span className="text-zinc-400 font-medium">Orijinal</span>'dir.
        </p>
      )}

      <div className="flex justify-center">
        <div className="relative" style={{ width: 200, height: 510 }}>
          <svg
            viewBox="0 0 200 510"
            width="200"
            height="510"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Araç gövde arka planı */}
            <path d={DECORATIONS.body} fill="#18181b" stroke="#3f3f46" strokeWidth="1.5" />

            {/* Tekerlek yuvası göstergeleri */}
            <circle cx="8"   cy="105" r="20" fill="#09090b" />
            <circle cx="192" cy="105" r="20" fill="#09090b" />
            <circle cx="8"   cy="420" r="20" fill="#09090b" />
            <circle cx="192" cy="420" r="20" fill="#09090b" />

            {/* Araç parçaları */}
            {PARTS.map(part => {
              const status = r[part.key] || 'orijinal'
              const cfg = STATUS_CFG[status]
              return (
                <g
                  key={part.key}
                  onClick={() => cycle(part.key)}
                  style={{ cursor: readOnly ? 'default' : 'pointer' }}
                >
                  <path
                    d={part.d}
                    fill={cfg.fill}
                    fillOpacity={cfg.fillOp}
                    stroke={cfg.stroke}
                    strokeOpacity={cfg.strokeOp}
                    strokeWidth="1.2"
                  />
                  <text
                    x={part.textX}
                    y={part.textY}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize={part.fontSize}
                    fontWeight="600"
                    fill={cfg.text}
                    style={{ pointerEvents: 'none', userSelect: 'none' }}
                    transform={part.rotate ? `rotate(${part.rotate}, ${part.textX}, ${part.textY})` : undefined}
                  >
                    {part.lines.map((line, i) => (
                      <tspan key={i} x={part.textX} dy={i === 0 ? 0 : part.fontSize * 1.3}>
                        {line}
                      </tspan>
                    ))}
                  </text>
                </g>
              )
            })}

            {/* Ön cam çizgisi */}
            <path d={DECORATIONS.windshield} fill="#1e3a5f" fillOpacity="0.5" stroke="#3b82f6" strokeOpacity="0.3" strokeWidth="0.5" style={{ pointerEvents: 'none' }} />
            {/* Arka cam çizgisi */}
            <path d={DECORATIONS.rearWindow}  fill="#1e3a5f" fillOpacity="0.5" stroke="#3b82f6" strokeOpacity="0.3" strokeWidth="0.5" style={{ pointerEvents: 'none' }} />

            {/* Ön/Arka etiketleri */}
            <text x="100" y="28" textAnchor="middle" dominantBaseline="middle" fontSize="7" fontWeight="700" fill="#52525b" letterSpacing="3" style={{ pointerEvents: 'none' }}>ÖN</text>
            <text x="100" y="498" textAnchor="middle" dominantBaseline="middle" fontSize="7" fontWeight="700" fill="#52525b" letterSpacing="3" style={{ pointerEvents: 'none' }}>ARKA</text>
          </svg>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-2 justify-center">
        {STATUSES.map(s => (
          <span key={s} className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full border ${STATUS_CFG[s].pill}`}>
            {STATUS_CFG[s].label}
          </span>
        ))}
      </div>

      {/* Hasar özeti */}
      {hasAnyDamage && (
        <div className="bg-zinc-800/60 border border-zinc-700 rounded-xl p-3 space-y-1.5">
          <p className="text-[11px] font-bold text-zinc-400 mb-2 uppercase tracking-wide">Hasar Özeti</p>
          {Object.entries(r)
            .filter(([, v]) => v !== 'orijinal')
            .map(([key, status]) => {
              const cfg = STATUS_CFG[status]
              return (
                <div key={key} className="flex items-center justify-between text-xs">
                  <span className="text-zinc-400">{PART_LABELS[key]}</span>
                  <span className={`font-bold ${cfg.pill.split(' ').find(c => c.startsWith('text-'))}`}>{cfg.label}</span>
                </div>
              )
            })}
        </div>
      )}
    </div>
  )
}

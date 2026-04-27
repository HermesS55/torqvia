import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import Spinner from '../ui/Spinner'
import { MapPin, Calendar } from 'lucide-react'

const DARK_TILES = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
const DARK_ATTR  = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
const TURKEY_CENTER = [39.1, 35.6]

const geocodeCache = {}

async function geocodeOne(location) {
  if (geocodeCache[location]) return geocodeCache[location]
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(location)}&format=json&limit=1&accept-language=tr`,
      { headers: { 'User-Agent': 'Torqvia/1.0' } }
    )
    const data = await res.json()
    if (data[0]) {
      const coords = [parseFloat(data[0].lat), parseFloat(data[0].lon)]
      geocodeCache[location] = coords
      return coords
    }
  } catch {}
  return null
}

function brandIcon(isPast) {
  const fill = isPast ? '#52525b' : '#f97316'
  return L.divIcon({
    className: '',
    iconSize: [34, 44],
    iconAnchor: [17, 44],
    popupAnchor: [0, -46],
    html: `
      <svg xmlns="http://www.w3.org/2000/svg" width="34" height="44" viewBox="0 0 34 44">
        <filter id="sh${isPast ? 'p' : ''}">
          <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="#000" flood-opacity="0.5"/>
        </filter>
        <path d="M17 1C8.716 1 2 7.716 2 16c0 11 15 27 15 27S32 27 32 16C32 7.716 25.284 1 17 1z"
          fill="${fill}" filter="url(#sh${isPast ? 'p' : ''})"/>
        <circle cx="17" cy="16" r="6" fill="white" opacity="0.9"/>
      </svg>`,
  })
}

const fmtDate = dt =>
  new Date(dt).toLocaleDateString('tr-TR', {
    day: 'numeric', month: 'short', year: 'numeric',
  })

export default function EventsMapView({ events }) {
  const [pins, setPins] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const withLoc = events.filter(e => e.location)
    if (!withLoc.length) { setLoading(false); return }

    let cancelled = false
    ;(async () => {
      const results = []
      for (const event of withLoc) {
        if (cancelled) break
        const coords = await geocodeOne(event.location)
        if (coords) {
          results.push({ ...event, coords })
          setPins([...results])
        }
        await new Promise(r => setTimeout(r, 250))
      }
      if (!cancelled) setLoading(false)
    })()

    return () => { cancelled = true }
  }, [events])

  const noLocation = events.every(e => !e.location)

  if (noLocation) return (
    <div className="h-64 flex flex-col items-center justify-center bg-zinc-900/40 rounded-xl border border-zinc-800">
      <MapPin className="h-8 w-8 text-zinc-700 mb-2" />
      <p className="text-zinc-500 text-sm">Konum girilmiş etkinlik yok</p>
      <p className="text-zinc-600 text-xs mt-1">Etkinlik oluştururken konum ekle</p>
    </div>
  )

  const center = pins.length > 0 ? pins[0].coords : TURKEY_CENTER

  return (
    <div className="relative h-[440px] sm:h-[540px] rounded-xl overflow-hidden border border-zinc-800">
      <MapContainer
        center={center}
        zoom={pins.length > 0 ? 7 : 6}
        style={{ height: '100%', width: '100%' }}
        attributionControl={true}
      >
        <TileLayer url={DARK_TILES} attribution={DARK_ATTR} />

        {pins.map(event => {
          const isPast = new Date(event.event_date) < new Date()
          return (
            <Marker key={event.id} position={event.coords} icon={brandIcon(isPast)}>
              <Popup>
                <div style={{ padding: '12px 14px', minWidth: 180, maxWidth: 240 }}>
                  {event.category && (
                    <span style={{
                      display: 'inline-block', fontSize: 10, fontWeight: 700,
                      color: '#f97316', background: 'rgba(249,115,22,0.12)',
                      border: '1px solid rgba(249,115,22,0.25)',
                      borderRadius: 20, padding: '2px 8px', marginBottom: 6,
                    }}>
                      {event.category}
                    </span>
                  )}
                  <p style={{ fontSize: 13, fontWeight: 700, color: '#f4f4f5', margin: '0 0 6px', lineHeight: 1.3 }}>
                    {event.title}
                  </p>
                  <p style={{ fontSize: 11, color: '#71717a', margin: '0 0 3px', display: 'flex', alignItems: 'center', gap: 4 }}>
                    📅 {fmtDate(event.event_date)}
                  </p>
                  {event.location && (
                    <p style={{ fontSize: 11, color: '#71717a', margin: '0 0 10px' }}>
                      📍 {event.location}
                    </p>
                  )}
                  <a
                    href={`/events/${event.id}`}
                    style={{
                      display: 'inline-block', fontSize: 12, fontWeight: 600,
                      color: '#f97316', textDecoration: 'none',
                      background: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.25)',
                      borderRadius: 8, padding: '5px 12px',
                    }}
                  >
                    Detayları gör →
                  </a>
                </div>
              </Popup>
            </Marker>
          )
        })}
      </MapContainer>

      {loading && pins.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center bg-zinc-950/80 backdrop-blur-sm">
          <div className="text-center">
            <Spinner size="lg" />
            <p className="text-zinc-400 text-sm mt-3">Harita yükleniyor...</p>
          </div>
        </div>
      )}

      {loading && pins.length > 0 && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-zinc-900/90 backdrop-blur border border-zinc-700 rounded-full px-3 py-1.5 flex items-center gap-2 text-xs text-zinc-400 pointer-events-none">
          <Spinner size="sm" />
          Konumlar yükleniyor...
        </div>
      )}
    </div>
  )
}

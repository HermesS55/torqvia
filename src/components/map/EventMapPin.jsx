import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import { useGeocode } from '../../hooks/useGeocode'
import Spinner from '../ui/Spinner'

const DARK_TILES = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
const DARK_ATTR  = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'

function brandIcon() {
  return L.divIcon({
    className: '',
    iconSize: [34, 44],
    iconAnchor: [17, 44],
    popupAnchor: [0, -46],
    html: `
      <svg xmlns="http://www.w3.org/2000/svg" width="34" height="44" viewBox="0 0 34 44">
        <filter id="sh"><feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="#000" flood-opacity="0.5"/></filter>
        <path d="M17 1C8.716 1 2 7.716 2 16c0 11 15 27 15 27S32 27 32 16C32 7.716 25.284 1 17 1z"
          fill="#f97316" filter="url(#sh)"/>
        <circle cx="17" cy="16" r="6" fill="white" opacity="0.95"/>
      </svg>`,
  })
}

export default function EventMapPin({ location, title }) {
  const { coords, loading } = useGeocode(location)

  if (loading) return (
    <div className="h-44 flex items-center justify-center bg-zinc-900/60 rounded-xl border border-zinc-800 mt-3">
      <Spinner />
    </div>
  )

  if (!coords) return null

  return (
    <div className="h-44 rounded-xl overflow-hidden border border-zinc-800 mt-3">
      <MapContainer
        center={coords}
        zoom={14}
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
        attributionControl={false}
        dragging={false}
        scrollWheelZoom={false}
        doubleClickZoom={false}
      >
        <TileLayer url={DARK_TILES} attribution={DARK_ATTR} />
        <Marker position={coords} icon={brandIcon()}>
          {title && (
            <Popup>
              <div style={{ padding: '10px 12px', minWidth: 140 }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: '#f4f4f5', margin: 0 }}>{title}</p>
                {location && (
                  <p style={{ fontSize: 11, color: '#71717a', margin: '4px 0 0' }}>{location}</p>
                )}
              </div>
            </Popup>
          )}
        </Marker>
      </MapContainer>
    </div>
  )
}

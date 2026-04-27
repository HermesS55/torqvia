import { useEffect, useState } from 'react'

const cache = {}

export function useGeocode(location) {
  const [coords, setCoords] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!location) return
    if (cache[location]) { setCoords(cache[location]); return }
    const controller = new AbortController()
    setLoading(true)
    fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(location)}&format=json&limit=1&accept-language=tr`,
      { signal: controller.signal, headers: { 'User-Agent': 'Torqvia/1.0' } }
    )
      .then(r => r.json())
      .then(data => {
        if (data[0]) {
          const c = [parseFloat(data[0].lat), parseFloat(data[0].lon)]
          cache[location] = c
          setCoords(c)
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
    return () => controller.abort()
  }, [location])

  return { coords, loading }
}

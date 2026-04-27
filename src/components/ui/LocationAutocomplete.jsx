import { useEffect, useRef, useState } from 'react'
import { MapPin, X, Loader2 } from 'lucide-react'

export default function LocationAutocomplete({ value, onChange, placeholder = 'Konum ara...' }) {
  const [query, setQuery] = useState(value || '')
  const [suggestions, setSuggestions] = useState([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const timer = useRef()
  const ref = useRef()

  useEffect(() => { setQuery(value || '') }, [value])

  useEffect(() => {
    function handler(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  function handleChange(e) {
    const val = e.target.value
    setQuery(val)
    onChange(val)
    clearTimeout(timer.current)
    if (val.length < 3) { setSuggestions([]); setOpen(false); return }
    setLoading(true)
    timer.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(val)}&format=json&limit=5&accept-language=tr`,
          { headers: { 'User-Agent': 'Torqvia/1.0' } }
        )
        const data = await res.json()
        setSuggestions(data)
        setOpen(data.length > 0)
      } catch {}
      setLoading(false)
    }, 500)
  }

  function handleSelect(item) {
    const parts = item.display_name.split(',')
    const name = parts.slice(0, 3).join(',').trim()
    setQuery(name)
    onChange(name)
    setSuggestions([])
    setOpen(false)
  }

  return (
    <div className="relative" ref={ref}>
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500 pointer-events-none" />
        <input
          value={query}
          onChange={handleChange}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          placeholder={placeholder}
          className="input-base pl-9 pr-8"
        />
        <div className="absolute right-2.5 top-1/2 -translate-y-1/2">
          {loading
            ? <Loader2 className="h-3.5 w-3.5 text-zinc-600 animate-spin" />
            : query
              ? <button type="button" onClick={() => { setQuery(''); onChange(''); setSuggestions([]); setOpen(false) }}>
                  <X className="h-3.5 w-3.5 text-zinc-600 hover:text-zinc-400 transition-colors" />
                </button>
              : null
          }
        </div>
      </div>

      {open && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl z-50 overflow-hidden">
          {suggestions.map((item, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handleSelect(item)}
              className="w-full text-left px-3 py-2.5 text-sm text-zinc-300 hover:bg-zinc-800 transition-colors flex items-start gap-2 border-b border-zinc-800/60 last:border-0"
            >
              <MapPin className="h-3.5 w-3.5 text-zinc-600 mt-0.5 shrink-0" />
              <span className="line-clamp-2 text-xs leading-relaxed">{item.display_name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

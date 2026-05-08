import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, X, Users, List, Hash, FileText, Car } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import UserAvatar from './UserAvatar'
import Spinner from './Spinner'

export default function GlobalSearch({ onClose }) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const inputRef = useRef()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState({ users: [], listings: [], communities: [], posts: [] })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    inputRef.current?.focus()
    function onKey(e) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  useEffect(() => {
    if (query.length < 2) {
      setResults({ users: [], listings: [], communities: [], posts: [] })
      setLoading(false)
      return
    }
    setLoading(true)
    const t = setTimeout(() => search(query), 300)
    return () => clearTimeout(t)
  }, [query])

  async function search(q) {
    const [
      { data: users },
      { data: listings },
      { data: communities },
      { data: posts },
    ] = await Promise.all([
      supabase.from('profiles')
        .select('id, full_name, role, avatar_url, specialty')
        .or(`full_name.ilike.%${q}%,specialty.ilike.%${q}%,bio.ilike.%${q}%`)
        .neq('id', user.id)
        .limit(5),
      supabase.from('listings')
        .select('id, brand, model, year, location, cover_image')
        .or(`brand.ilike.%${q}%,model.ilike.%${q}%,description.ilike.%${q}%`)
        .limit(5),
      supabase.from('communities')
        .select('id, name, description, avatar_url, category')
        .or(`name.ilike.%${q}%,description.ilike.%${q}%`)
        .limit(4),
      supabase.from('posts')
        .select('id, content, user_id, profiles!posts_user_id_fkey(id, full_name, avatar_url)')
        .ilike('content', `%${q}%`)
        .order('created_at', { ascending: false })
        .limit(4),
    ])
    setResults({
      users: users || [],
      listings: listings || [],
      communities: communities || [],
      posts: posts || [],
    })
    setLoading(false)
  }

  function go(path) {
    navigate(path)
    onClose()
  }

  const total = results.users.length + results.listings.length + results.communities.length + results.posts.length
  const hasQuery = query.length >= 2

  return (
    <div
      className="fixed inset-0 z-[200] flex items-start justify-center pt-[8vh] px-4 bg-black/75 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-zinc-900 rounded-2xl border border-zinc-700 shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Input */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-zinc-800">
          <Search className="h-5 w-5 text-zinc-400 shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Kullanıcı, ilan, topluluk veya paylaşım ara..."
            className="flex-1 bg-transparent text-white placeholder-zinc-500 text-base outline-none"
          />
          {loading ? (
            <Spinner size="sm" />
          ) : query ? (
            <button onClick={() => setQuery('')} className="text-zinc-600 hover:text-zinc-400 p-1">
              <X className="h-4 w-4" />
            </button>
          ) : null}
          <kbd className="hidden sm:flex items-center gap-1 text-[11px] text-zinc-600 border border-zinc-800 rounded px-1.5 py-0.5 font-mono shrink-0">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-[65vh] overflow-y-auto">
          {!hasQuery ? (
            <div className="py-14 text-center">
              <Search className="h-9 w-9 text-zinc-800 mx-auto mb-3" />
              <p className="text-zinc-600 text-sm">En az 2 karakter yaz</p>
              <p className="text-zinc-700 text-xs mt-1">Kullanıcı, ilan, topluluk, paylaşım</p>
            </div>
          ) : !loading && total === 0 ? (
            <div className="py-14 text-center">
              <p className="text-zinc-400 text-sm font-medium">"{query}" için sonuç bulunamadı</p>
              <p className="text-zinc-600 text-xs mt-1">Farklı kelimeler deneyin</p>
            </div>
          ) : (
            <div className="p-2 space-y-1">

              {results.users.length > 0 && (
                <section>
                  <p className="text-[10px] font-semibold text-zinc-600 uppercase tracking-wider px-3 py-1.5 flex items-center gap-1.5">
                    <Users className="h-3 w-3" /> Kullanıcılar
                  </p>
                  {results.users.map(u => (
                    <button key={u.id} onClick={() => go(u.role === 'pro' ? `/usta/${u.id}` : `/profile/${u.id}`)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-zinc-800 transition-colors text-left">
                      <UserAvatar profile={u} size="sm" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">{u.full_name || 'İsimsiz'}</p>
                        <p className="text-xs text-zinc-500 truncate">
                          {u.role === 'pro' ? 'Servis Uzmanı' : 'Araç Sahibi'}
                          {u.specialty ? ` · ${u.specialty}` : ''}
                        </p>
                      </div>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full border shrink-0 ${
                        u.role === 'pro' ? 'text-blue-400 bg-blue-500/10 border-blue-500/20' : 'text-brand-400 bg-brand-500/10 border-brand-500/20'
                      }`}>
                        {u.role === 'pro' ? 'Uzman' : 'Sahip'}
                      </span>
                    </button>
                  ))}
                </section>
              )}

              {results.listings.length > 0 && (
                <section>
                  <p className="text-[10px] font-semibold text-zinc-600 uppercase tracking-wider px-3 py-1.5 flex items-center gap-1.5">
                    <List className="h-3 w-3" /> İlanlar
                  </p>
                  {results.listings.map(l => (
                    <button key={l.id} onClick={() => go(`/listings/${l.id}`)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-zinc-800 transition-colors text-left">
                      {l.cover_image ? (
                        <img src={l.cover_image} alt="" className="h-10 w-14 rounded-lg object-cover border border-zinc-700 shrink-0" />
                      ) : (
                        <div className="h-10 w-14 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center shrink-0">
                          <Car className="h-4 w-4 text-zinc-600" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">
                          {l.brand} {l.model}{l.year ? ` (${l.year})` : ''}
                        </p>
                        <p className="text-xs text-zinc-500">{l.location || 'Konum belirtilmemiş'}</p>
                      </div>
                    </button>
                  ))}
                </section>
              )}

              {results.communities.length > 0 && (
                <section>
                  <p className="text-[10px] font-semibold text-zinc-600 uppercase tracking-wider px-3 py-1.5 flex items-center gap-1.5">
                    <Hash className="h-3 w-3" /> Topluluklar
                  </p>
                  {results.communities.map(c => (
                    <button key={c.id} onClick={() => go(`/communities/${c.id}`)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-zinc-800 transition-colors text-left">
                      <div className="h-9 w-9 rounded-xl bg-brand-500/20 border border-brand-500/20 flex items-center justify-center shrink-0 overflow-hidden">
                        {c.avatar_url
                          ? <img src={c.avatar_url} alt="" className="w-full h-full object-cover" />
                          : <Hash className="h-4 w-4 text-brand-400" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">{c.name}</p>
                        {c.description && <p className="text-xs text-zinc-500 truncate">{c.description}</p>}
                      </div>
                    </button>
                  ))}
                </section>
              )}

              {results.posts.length > 0 && (
                <section>
                  <p className="text-[10px] font-semibold text-zinc-600 uppercase tracking-wider px-3 py-1.5 flex items-center gap-1.5">
                    <FileText className="h-3 w-3" /> Paylaşımlar
                  </p>
                  {results.posts.map(p => (
                    <button key={p.id} onClick={() => go(`/profile/${p.user_id}`)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-zinc-800 transition-colors text-left">
                      <UserAvatar profile={p.profiles} size="sm" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-zinc-300">{p.profiles?.full_name || 'Kullanıcı'}</p>
                        <p className="text-sm text-zinc-400 line-clamp-1 mt-0.5">{p.content}</p>
                      </div>
                    </button>
                  ))}
                </section>
              )}

              {total > 0 && (
                <div className="px-2 pt-1 pb-1">
                  <button onClick={() => go(`/search?q=${encodeURIComponent(query)}`)}
                    className="w-full text-center text-xs text-brand-400 hover:text-brand-300 py-2.5 rounded-xl hover:bg-zinc-800/50 transition-colors">
                    Tüm sonuçları gör →
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

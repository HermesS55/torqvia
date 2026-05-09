import { useEffect, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { Search, Users, List, Hash, FileText, X, Car, Clock, Trash2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import UserAvatar from '../components/ui/UserAvatar'
import Spinner from '../components/ui/Spinner'
import { useMeta } from '../hooks/useMeta'
import { useLang } from '../contexts/LangContext'

const TABS = [
  { id: 'all',         label: { tr: 'Hepsi', en: 'All' } },
  { id: 'users',       label: { tr: 'Kullanıcılar', en: 'Users' } },
  { id: 'listings',    label: { tr: 'İlanlar', en: 'Listings' } },
  { id: 'communities', label: { tr: 'Topluluklar', en: 'Communities' } },
  { id: 'posts',       label: { tr: 'Paylaşımlar', en: 'Posts' } },
]

const HISTORY_KEY = 'torqvia_search_history'
const MAX_HISTORY = 10

function loadHistory() {
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]') }
  catch { return [] }
}

function saveToHistory(query) {
  if (!query || query.length < 2) return
  const prev = loadHistory().filter(q => q !== query)
  const next = [query, ...prev].slice(0, MAX_HISTORY)
  localStorage.setItem(HISTORY_KEY, JSON.stringify(next))
}

function removeFromHistory(query) {
  const next = loadHistory().filter(q => q !== query)
  localStorage.setItem(HISTORY_KEY, JSON.stringify(next))
}

function clearHistory() {
  localStorage.removeItem(HISTORY_KEY)
}

export default function SearchPage() {
  const { lang } = useLang()
  const tr = lang === 'tr'
  useMeta(tr ? 'Arama' : 'Search', { robots: 'noindex, follow' })
  const { user } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const [query, setQuery] = useState(searchParams.get('q') || '')
  const [tab, setTab] = useState('all')
  const [results, setResults] = useState({ users: [], listings: [], communities: [], posts: [] })
  const [loading, setLoading] = useState(false)
  const [history, setHistory] = useState(loadHistory)

  // Sync input → URL with debounce
  useEffect(() => {
    const t = setTimeout(() => {
      const current = searchParams.get('q') || ''
      if (query !== current) setSearchParams(query ? { q: query } : {}, { replace: true })
    }, 300)
    return () => clearTimeout(t)
  }, [query])

  // Search when URL param changes
  useEffect(() => {
    const q = (searchParams.get('q') || '').trim()
    setQuery(q)
    if (q.length >= 2) {
      performSearch(q)
      saveToHistory(q)
      setHistory(loadHistory())
    }
    else setResults({ users: [], listings: [], communities: [], posts: [] })
  }, [searchParams.get('q')])

  async function performSearch(q) {
    setLoading(true)
    const [
      { data: users },
      { data: listings },
      { data: communities },
      { data: posts },
    ] = await Promise.all([
      supabase.from('profiles')
        .select('id, full_name, role, avatar_url, specialty, plan, bio')
        .or(`full_name.ilike.%${q}%,specialty.ilike.%${q}%,bio.ilike.%${q}%`)
        .neq('id', user.id)
        .limit(9),
      supabase.from('listings')
        .select('id, brand, model, year, budget, location, cover_image, urgency')
        .or(`brand.ilike.%${q}%,model.ilike.%${q}%,description.ilike.%${q}%,location.ilike.%${q}%`)
        .limit(9),
      supabase.from('communities')
        .select('id, name, description, avatar_url, category')
        .or(`name.ilike.%${q}%,description.ilike.%${q}%`)
        .limit(9),
      supabase.from('posts')
        .select('id, content, created_at, user_id, profiles!posts_user_id_fkey(id, full_name, avatar_url)')
        .ilike('content', `%${q}%`)
        .order('created_at', { ascending: false })
        .limit(9),
    ])
    setResults({
      users: users || [],
      listings: listings || [],
      communities: communities || [],
      posts: posts || [],
    })
    setLoading(false)
  }

  function handleRemoveHistory(q, e) {
    e.stopPropagation()
    removeFromHistory(q)
    setHistory(loadHistory())
  }

  function handleClearHistory() {
    clearHistory()
    setHistory([])
  }

  const q = (searchParams.get('q') || '').trim()
  const hasQuery = q.length >= 2
  const totalCount = results.users.length + results.listings.length + results.communities.length + results.posts.length

  const show = (section) => tab === 'all' || tab === section
  const slice = (arr) => tab === 'all' ? arr.slice(0, 4) : arr

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-white mb-4">{tr ? 'Arama' : 'Search'}</h1>
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
          <input
            autoFocus
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder={tr ? 'Kullanıcı, ilan, topluluk veya paylaşım ara...' : 'Search users, listings, communities or posts...'}
            className="input-base pl-10 pr-10"
          />
          {query && (
            <button onClick={() => setQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Recent searches — shown when no query */}
      {!hasQuery && history.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" /> {tr ? 'Son Aramalar' : 'Recent Searches'}
            </h2>
            <button onClick={handleClearHistory}
              className="text-xs text-zinc-600 hover:text-red-400 transition-colors flex items-center gap-1">
              <Trash2 className="h-3 w-3" /> {tr ? 'Temizle' : 'Clear'}
            </button>
          </div>
          <div className="space-y-1">
            {history.map((item) => (
              <div key={item}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-zinc-800/60 cursor-pointer group transition-colors"
                onClick={() => setQuery(item)}>
                <Clock className="h-3.5 w-3.5 text-zinc-600 shrink-0" />
                <span className="flex-1 text-sm text-zinc-300">{item}</span>
                <button
                  onClick={(e) => handleRemoveHistory(item, e)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-zinc-700 text-zinc-600 hover:text-zinc-400">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {!hasQuery && history.length === 0 && (
        <div className="text-center py-16">
          <Search className="h-12 w-12 text-zinc-700 mx-auto mb-3" />
          <p className="text-zinc-500 font-medium">{tr ? 'Aramak istediğiniz şeyi yazın' : 'Type to search'}</p>
          <p className="text-zinc-600 text-sm mt-1">{tr ? 'Kullanıcı, ilan, topluluk veya paylaşım arayabilirsiniz' : 'Search users, listings, communities or posts'}</p>
        </div>
      )}

      {hasQuery && (
        <>
          {/* Tabs */}
          <div className="flex gap-1 border-b border-zinc-800 mb-6 overflow-x-auto scrollbar-none">
            {TABS.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap ${
                  tab === t.id ? 'border-brand-500 text-brand-400' : 'border-transparent text-zinc-500 hover:text-zinc-300'
                }`}>
                {t.label[lang] || t.label.tr}
                {t.id !== 'all' && results[t.id]?.length > 0 && (
                  <span className={`text-xs px-1.5 py-0.5 rounded-full ${tab === t.id ? 'bg-brand-500/20 text-brand-400' : 'bg-zinc-800 text-zinc-600'}`}>
                    {results[t.id].length}
                  </span>
                )}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="flex justify-center py-16"><Spinner size="lg" /></div>
          ) : !totalCount ? (
            <div className="text-center py-16">
              <Search className="h-12 w-12 text-zinc-700 mx-auto mb-3" />
              <p className="text-zinc-400 font-medium">"{q}" {tr ? 'için sonuç bulunamadı' : '— no results found'}</p>
              <p className="text-zinc-600 text-sm mt-1">{tr ? 'Farklı kelimeler deneyin' : 'Try different keywords'}</p>
            </div>
          ) : (
            <div className="space-y-8">

              {/* Users */}
              {show('users') && results.users.length > 0 && (
                <section>
                  <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5" /> {tr ? 'Kullanıcılar' : 'Users'}
                  </h2>
                  <div className="space-y-2">
                    {slice(results.users).map(u => (
                      <Link key={u.id} to={u.role === 'pro' ? `/usta/${u.id}` : `/profile/${u.id}`}
                        className="card flex items-center gap-3 hover:border-zinc-700 transition-colors py-3">
                        <UserAvatar profile={u} size="md" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-white text-sm truncate">{u.full_name || (tr ? 'İsimsiz' : 'Unnamed')}</p>
                          <p className="text-xs text-zinc-500 truncate">
                            {u.role === 'pro' ? (tr ? 'Servis Uzmanı' : 'Service Expert') : (tr ? 'Araç Sahibi' : 'Car Owner')}
                            {u.specialty ? ` · ${u.specialty}` : ''}
                          </p>
                        </div>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full border shrink-0 ${
                          u.role === 'pro'
                            ? 'text-blue-400 bg-blue-500/10 border-blue-500/20'
                            : 'text-brand-400 bg-brand-500/10 border-brand-500/20'
                        }`}>
                          {u.role === 'pro' ? (tr ? 'Uzman' : 'Expert') : (tr ? 'Sahip' : 'Owner')}
                        </span>
                      </Link>
                    ))}
                    {tab === 'all' && results.users.length > 4 && (
                      <button onClick={() => setTab('users')} className="text-xs text-brand-400 hover:text-brand-300 transition-colors pl-1">
                        +{results.users.length - 4} {tr ? 'kullanıcı daha →' : 'more users →'}
                      </button>
                    )}
                  </div>
                </section>
              )}

              {/* Listings */}
              {show('listings') && results.listings.length > 0 && (
                <section>
                  <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <List className="h-3.5 w-3.5" /> {tr ? 'İlanlar' : 'Listings'}
                  </h2>
                  <div className="space-y-2">
                    {slice(results.listings).map(l => (
                      <Link key={l.id} to={`/listings/${l.id}`}
                        className="card flex items-center gap-3 hover:border-zinc-700 transition-colors py-3">
                        {l.cover_image ? (
                          <img src={l.cover_image} alt="" className="h-12 w-16 rounded-lg object-cover border border-zinc-700 shrink-0" />
                        ) : (
                          <div className="h-12 w-16 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center shrink-0">
                            <Car className="h-5 w-5 text-zinc-600" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-white text-sm">{l.brand} {l.model}{l.year ? ` (${l.year})` : ''}</p>
                          <p className="text-xs text-zinc-500">{l.location || (tr ? 'Konum belirtilmemiş' : 'Location not specified')}</p>
                        </div>
                        {l.budget && (
                          <span className="text-sm font-semibold text-brand-400 shrink-0">₺{Number(l.budget).toLocaleString('tr-TR')}</span>
                        )}
                      </Link>
                    ))}
                    {tab === 'all' && results.listings.length > 4 && (
                      <button onClick={() => setTab('listings')} className="text-xs text-brand-400 hover:text-brand-300 transition-colors pl-1">
                        +{results.listings.length - 4} {tr ? 'ilan daha →' : 'more listings →'}
                      </button>
                    )}
                  </div>
                </section>
              )}

              {/* Communities */}
              {show('communities') && results.communities.length > 0 && (
                <section>
                  <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <Hash className="h-3.5 w-3.5" /> {tr ? 'Topluluklar' : 'Communities'}
                  </h2>
                  <div className="space-y-2">
                    {slice(results.communities).map(c => (
                      <Link key={c.id} to={`/communities/${c.id}`}
                        className="card flex items-center gap-3 hover:border-zinc-700 transition-colors py-3">
                        {c.avatar_url ? (
                          <img src={c.avatar_url} alt="" className="h-10 w-10 rounded-xl object-cover border border-zinc-700 shrink-0" />
                        ) : (
                          <div className="h-10 w-10 rounded-xl bg-brand-500/20 border border-brand-500/20 flex items-center justify-center shrink-0">
                            <Hash className="h-5 w-5 text-brand-400" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-white text-sm truncate">{c.name}</p>
                          {c.description && <p className="text-xs text-zinc-500 truncate">{c.description}</p>}
                        </div>
                        {c.category && (
                          <span className="text-[10px] text-zinc-500 bg-zinc-800 border border-zinc-700/50 px-2 py-0.5 rounded-full shrink-0">{c.category}</span>
                        )}
                      </Link>
                    ))}
                    {tab === 'all' && results.communities.length > 4 && (
                      <button onClick={() => setTab('communities')} className="text-xs text-brand-400 hover:text-brand-300 transition-colors pl-1">
                        +{results.communities.length - 4} {tr ? 'topluluk daha →' : 'more communities →'}
                      </button>
                    )}
                  </div>
                </section>
              )}

              {/* Posts */}
              {show('posts') && results.posts.length > 0 && (
                <section>
                  <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <FileText className="h-3.5 w-3.5" /> {tr ? 'Paylaşımlar' : 'Posts'}
                  </h2>
                  <div className="space-y-2">
                    {slice(results.posts).map(p => (
                      <Link key={p.id} to={`/posts/${p.id}`}
                        className="card hover:border-zinc-700 transition-colors py-3">
                        <div className="flex items-center gap-2 mb-1.5">
                          <UserAvatar profile={p.profiles} size="xs" />
                          <span className="text-xs font-medium text-zinc-300">{p.profiles?.full_name || (tr ? 'Kullanıcı' : 'User')}</span>
                          <span className="text-xs text-zinc-600">
                            · {new Date(p.created_at).toLocaleDateString(lang === 'tr' ? 'tr-TR' : 'en-US', { day: 'numeric', month: 'short' })}
                          </span>
                        </div>
                        <p className="text-sm text-zinc-400 line-clamp-2">{p.content}</p>
                      </Link>
                    ))}
                    {tab === 'all' && results.posts.length > 4 && (
                      <button onClick={() => setTab('posts')} className="text-xs text-brand-400 hover:text-brand-300 transition-colors pl-1">
                        +{results.posts.length - 4} {tr ? 'paylaşım daha →' : 'more posts →'}
                      </button>
                    )}
                  </div>
                </section>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}

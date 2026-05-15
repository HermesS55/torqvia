import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Search, Users, PlusCircle, X, Hash } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import Spinner from '../../components/ui/Spinner'
import EmptyState from '../../components/ui/EmptyState'
import UserAvatar from '../../components/ui/UserAvatar'
import toast from 'react-hot-toast'
import { useMeta } from '../../hooks/useMeta'

const CATEGORIES = ['Tümü', 'Motor', 'Kaporta & Boya', 'Tuning', 'Klasik Araçlar', 'Elektrikli Araçlar', 'Off-Road', 'Genel']

const CATEGORY_COLORS = {
  'Motor':              'bg-red-500/10 text-red-400 border-red-500/20',
  'Kaporta & Boya':     'bg-blue-500/10 text-blue-400 border-blue-500/20',
  'Tuning':             'bg-purple-500/10 text-purple-400 border-purple-500/20',
  'Klasik Araçlar':     'bg-amber-500/10 text-amber-400 border-amber-500/20',
  'Elektrikli Araçlar': 'bg-green-500/10 text-green-400 border-green-500/20',
  'Off-Road':           'bg-orange-500/10 text-orange-400 border-orange-500/20',
  'Genel':              'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
}

export default function Communities() {
  useMeta('Topluluklar | Torqvia', { description: 'Türkiye\'nin oto topluluklarına katıl, marka ve model gruplarında deneyim ve bilgi paylaş.' })
  const { user } = useAuth()
  const [communities, setCommunities] = useState([])
  const [loading, setLoading]         = useState(true)
  const [search, setSearch]           = useState('')
  const [category, setCategory]       = useState('Tümü')
  const [memberMap, setMemberMap]     = useState({})
  const [joiningId, setJoiningId]     = useState(null)

  useEffect(() => { fetchCommunities() }, [])

  async function fetchCommunities() {
    const { data } = await supabase
      .from('communities')
      .select('*, profiles!communities_created_by_fkey(id, full_name, avatar_url, role), community_members(user_id)')
      .order('created_at', { ascending: false })

    if (data) {
      setCommunities(data)
      const map = {}
      data.forEach(c => { map[c.id] = c.community_members?.some(m => m.user_id === user?.id) || false })
      setMemberMap(map)
    }
    setLoading(false)
  }

  async function toggleMembership(community, e) {
    e.preventDefault()
    if (!user) return
    setJoiningId(community.id)
    if (memberMap[community.id]) {
      await supabase.from('community_members').delete()
        .eq('community_id', community.id).eq('user_id', user.id)
      setMemberMap(m => ({ ...m, [community.id]: false }))
      setCommunities(cs => cs.map(c =>
        c.id === community.id
          ? { ...c, community_members: c.community_members.filter(m => m.user_id !== user.id) }
          : c
      ))
    } else {
      await supabase.from('community_members').insert({ community_id: community.id, user_id: user.id })
      setMemberMap(m => ({ ...m, [community.id]: true }))
      setCommunities(cs => cs.map(c =>
        c.id === community.id
          ? { ...c, community_members: [...(c.community_members || []), { user_id: user.id }] }
          : c
      ))
    }
    setJoiningId(null)
  }

  const filtered = communities.filter(c => {
    if (category !== 'Tümü' && c.category !== category) return false
    if (search) {
      const q = search.toLowerCase()
      if (!c.name.toLowerCase().includes(q) && !c.description?.toLowerCase().includes(q)) return false
    }
    return true
  })

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Hash className="h-6 w-6 text-brand-400" />
            Topluluklar
          </h1>
          <p className="text-zinc-500 text-sm mt-0.5">{communities.length} aktif topluluk</p>
        </div>
        <Link to="/communities/new" className="btn-primary flex items-center gap-2">
          <PlusCircle className="h-4 w-4" />
          <span className="hidden sm:inline">Topluluk Kur</span>
        </Link>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Topluluk ara..."
          className="input-base pl-10 pr-10"
        />
        {search && (
          <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Category chips */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-none" style={{ touchAction: 'pan-x', WebkitOverflowScrolling: 'touch' }}>
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={`text-xs px-3 py-1.5 rounded-full border whitespace-nowrap transition-all ${
              category === cat
                ? 'bg-brand-500/20 border-brand-500/50 text-brand-300 font-medium'
                : 'bg-zinc-800 border-zinc-700 text-zinc-500 hover:border-zinc-600'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Users}
          title={search || category !== 'Tümü' ? 'Topluluk bulunamadı' : 'Henüz topluluk yok'}
          description={!search && category === 'Tümü' ? 'İlk topluluğu sen kur ve insanları davet et!' : ''}
          action={
            !search && category === 'Tümü' ? (
              <Link to="/communities/new" className="btn-primary">Topluluk Kur</Link>
            ) : null
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(community => {
            const isMember    = memberMap[community.id]
            const isOwner     = community.created_by === user?.id
            const memberCount = community.community_members?.length || 0
            const catColor    = CATEGORY_COLORS[community.category] || CATEGORY_COLORS['Genel']

            return (
              <div key={community.id} className="card hover:border-zinc-700 transition-all group overflow-hidden">
                {/* Cover */}
                {community.cover_url ? (
                  <div className="relative -mx-5 -mt-5 mb-4 h-28 overflow-hidden">
                    <img src={community.cover_url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-900/70 to-transparent" />
                    <span className={`absolute top-2 right-2 text-[10px] font-medium px-2 py-0.5 rounded-full border ${catColor}`}>
                      {community.category}
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-2.5 bg-brand-500/10 rounded-xl">
                      <Hash className="h-5 w-5 text-brand-400" />
                    </div>
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${catColor}`}>
                      {community.category}
                    </span>
                  </div>
                )}

                {/* Avatar + name */}
                <div className="flex items-start gap-3 mb-2">
                  {community.avatar_url ? (
                    <img src={community.avatar_url} alt="" className="h-10 w-10 rounded-xl object-cover border border-zinc-700 shrink-0" />
                  ) : (
                    <div className="h-10 w-10 rounded-xl bg-brand-500/15 border border-brand-500/20 flex items-center justify-center shrink-0">
                      <Hash className="h-5 w-5 text-brand-400" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <h3 className="font-semibold text-white text-sm leading-tight">
                      {community.name}
                    </h3>
                    <p className="text-[11px] text-zinc-600 flex items-center gap-1 mt-0.5">
                      <Users className="h-3 w-3" />
                      {memberCount} üye
                    </p>
                  </div>
                </div>

                {community.description && (
                  <p className="text-xs text-zinc-500 line-clamp-2 mb-3">{community.description}</p>
                )}

                {community.profiles && (
                  <div className="flex items-center gap-1.5 mb-3">
                    <UserAvatar profile={community.profiles} size="xs" />
                    <span className="text-[10px] text-zinc-600">
                      {community.profiles.full_name || 'Kullanıcı'} tarafından kuruldu
                    </span>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-2 mt-auto pt-2 border-t border-zinc-800/60">
                  <Link to={`/communities/${community.id}`} className="btn-ghost flex-1 text-center text-sm py-1.5">
                    Görüntüle
                  </Link>
                  {isOwner ? (
                    <span className="text-[11px] text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-1 rounded-lg">
                      Admin
                    </span>
                  ) : (
                    <button
                      onClick={e => toggleMembership(community, e)}
                      disabled={joiningId === community.id}
                      className={`text-sm px-3 py-1.5 rounded-lg border transition-all ${
                        isMember
                          ? 'border-zinc-700 text-zinc-400 hover:border-red-500/40 hover:text-red-400'
                          : 'border-brand-500/40 text-brand-400 bg-brand-500/10 hover:bg-brand-500/20'
                      }`}
                    >
                      {joiningId === community.id ? <Spinner size="sm" /> : isMember ? 'Ayrıl' : 'Katıl'}
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

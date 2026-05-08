import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Search, Users, Car, Wrench, X, ChevronDown, Star, MessageCircle } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import UserAvatar from '../components/ui/UserAvatar'
import FollowButton from '../components/profile/FollowButton'
import PlanBadge from '../components/ui/PlanBadge'
import toast from 'react-hot-toast'
import { useMeta } from '../hooks/useMeta'

function SkeletonCard() {
  return (
    <div className="card animate-pulse">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-zinc-800 shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 space-y-1.5">
              <div className="h-3.5 bg-zinc-800 rounded w-28" />
              <div className="h-3 bg-zinc-800 rounded w-20" />
            </div>
            <div className="h-7 w-16 bg-zinc-800 rounded-lg shrink-0" />
          </div>
          <div className="h-3 bg-zinc-800 rounded w-full mt-3" />
          <div className="h-3 bg-zinc-800 rounded w-3/4 mt-1.5" />
        </div>
      </div>
      <div className="flex gap-4 pt-2.5 mt-2.5 border-t border-zinc-800/60">
        <div className="h-3 bg-zinc-800 rounded w-20" />
        <div className="h-3 bg-zinc-800 rounded w-16" />
      </div>
    </div>
  )
}

function StarRating({ rating, count }) {
  const filled = Math.round(rating)
  return (
    <div className="flex items-center gap-1 mt-1">
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map(i => (
          <Star key={i} className={`h-2.5 w-2.5 ${i <= filled ? 'text-yellow-400 fill-yellow-400' : 'text-zinc-700 fill-zinc-700'}`} />
        ))}
      </div>
      <span className="text-[10px] text-zinc-500">{rating.toFixed(1)} <span className="text-zinc-700">({count})</span></span>
    </div>
  )
}

function UserCard({ profile }) {
  const isPro = profile.role === 'pro'
  const navigate = useNavigate()
  return (
    <div className={`card hover:border-zinc-700 transition-all relative overflow-hidden flex flex-col gap-3 ${
      isPro ? 'hover:border-blue-500/40 border-blue-500/10' : 'hover:border-brand-500/30'
    }`}>
      {isPro && (
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-600/40 via-blue-400/70 to-blue-600/40" />
      )}

      {/* Avatar + info */}
      <div className="flex gap-3">
        <Link to={isPro ? `/usta/${profile.id}` : `/profile/${profile.id}`} className="shrink-0">
          <UserAvatar profile={profile} size="md" />
        </Link>
        <div className="flex-1 min-w-0">
          <Link to={isPro ? `/usta/${profile.id}` : `/profile/${profile.id}`}>
            <p className="font-semibold text-white hover:text-brand-400 transition-colors text-sm leading-tight truncate">
              {profile.full_name || 'İsimsiz Kullanıcı'}
            </p>
          </Link>
          <div className="flex items-center gap-1 mt-1 flex-wrap">
            {isPro
              ? <span className="inline-flex items-center gap-1 text-[10px] text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded-full">
                  <Wrench className="h-2.5 w-2.5" />Servis Uzmanı
                </span>
              : <span className="inline-flex items-center gap-1 text-[10px] text-brand-400 bg-brand-500/10 px-1.5 py-0.5 rounded-full">
                  <Car className="h-2.5 w-2.5" />Araç Sahibi
                </span>
            }
            {profile.plan && profile.plan !== 'free' && <PlanBadge plan={profile.plan} size="xs" />}
          </div>
          {isPro && profile.specialty && (
            <p className="text-xs text-blue-300/70 mt-1 truncate">{profile.specialty}</p>
          )}
          {isPro && profile.avg_rating > 0 && (
            <StarRating rating={profile.avg_rating} count={profile.rating_count} />
          )}
        </div>
      </div>

      {/* Bio */}
      {profile.bio && (
        <p className="text-xs text-zinc-500 line-clamp-2 leading-relaxed">{profile.bio}</p>
      )}

      {/* Skills */}
      {isPro && profile.skills?.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {profile.skills.slice(0, 3).map(s => (
            <span key={s} className="text-[10px] bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded-full">{s}</span>
          ))}
          {profile.skills.length > 3 && (
            <span className="text-[10px] text-zinc-600 py-0.5">+{profile.skills.length - 3}</span>
          )}
        </div>
      )}

      {/* Footer: stats + actions */}
      <div className="flex items-center justify-between pt-2.5 border-t border-zinc-800/60 mt-auto">
        <div className="flex items-center gap-3 text-xs text-zinc-600">
          <span><span className="text-zinc-400 font-medium">{profile.follower_count || 0}</span> takipçi</span>
          <span className="text-zinc-800">·</span>
          <span><span className="text-zinc-400 font-medium">{profile.post_count || 0}</span> paylaşım</span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => navigate(`/messages?to=${profile.id}`)}
            className="p-1.5 rounded-lg border border-zinc-800 hover:border-zinc-700 text-zinc-500 hover:text-brand-400 hover:bg-brand-500/5 transition-colors"
            title="Mesaj gönder"
          >
            <MessageCircle className="h-3.5 w-3.5" />
          </button>
          <FollowButton targetId={profile.id} size="sm" />
        </div>
      </div>
    </div>
  )
}

const PAGE_SIZE = 18

export default function People() {
  useMeta('Kişiler | Torqvia', { description: 'Torqvia\'daki araç sahiplerini ve servis uzmanlarını keşfet, takip et, teklif gönder.' })
  const { user } = useAuth()
  const [tab, setTab] = useState('all')
  const [roleFilter, setRoleFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [allUsers, setAllUsers] = useState([])
  const [suggestions, setSuggestions] = useState([])
  const [following, setFollowing] = useState([])
  const [loading, setLoading] = useState(true)
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)

  useEffect(() => { fetchAll() }, [])
  useEffect(() => { setVisibleCount(PAGE_SIZE) }, [tab, search, roleFilter])

  async function fetchAll() {
    setLoading(true)

    const [{ data: users, error: usersErr }, { data: myFollows }, { data: blocks }] = await Promise.all([
      supabase
        .from('profiles')
        .select('id, full_name, role, avatar_url, bio, specialty, skills, plan, private_account, created_at')
        .neq('id', user.id)
        .order('full_name', { ascending: true }),
      supabase.from('follows').select('following_id').eq('follower_id', user.id),
      supabase.from('blocks').select('blocker_id, blocked_id')
        .or(`blocker_id.eq.${user.id},blocked_id.eq.${user.id}`),
    ])

    if (usersErr) {
      toast.error('Kullanıcılar yüklenemedi')
      setLoading(false)
      return
    }

    const followingIds = new Set((myFollows || []).map(f => f.following_id))
    const blockedIds = new Set()
    ;(blocks || []).forEach(b => {
      if (b.blocker_id === user.id) blockedIds.add(b.blocked_id)
      else blockedIds.add(b.blocker_id)
    })
    const allIds = (users || []).filter(u => !blockedIds.has(u.id)).map(u => u.id)

    if (allIds.length === 0) {
      setAllUsers([])
      setSuggestions([])
      setFollowing([])
      setLoading(false)
      return
    }

    const [{ data: followData }, { data: postData }, { data: ratingData }, { data: listingData }] = await Promise.all([
      supabase.from('follows').select('following_id').in('following_id', allIds),
      supabase.from('posts').select('user_id').in('user_id', allIds),
      supabase.from('pro_ratings').select('pro_id, rating').in('pro_id', allIds),
      supabase.from('listings').select('user_id').in('user_id', allIds),
    ])

    const followerMap = {}
    followData?.forEach(f => { followerMap[f.following_id] = (followerMap[f.following_id] || 0) + 1 })
    const postMap = {}
    postData?.forEach(p => { postMap[p.user_id] = (postMap[p.user_id] || 0) + 1 })
    const ratingMap = {}
    ratingData?.forEach(r => {
      if (!ratingMap[r.pro_id]) ratingMap[r.pro_id] = { sum: 0, count: 0 }
      ratingMap[r.pro_id].sum += r.rating
      ratingMap[r.pro_id].count += 1
    })
    const listingMap = {}
    listingData?.forEach(l => { listingMap[l.user_id] = (listingMap[l.user_id] || 0) + 1 })

    const mapped = (users || [])
      .filter(u => !blockedIds.has(u.id))
      .filter(u => !u.private_account || followingIds.has(u.id))
      .map(u => ({
        ...u,
        follower_count: followerMap[u.id] || 0,
        post_count: postMap[u.id] || 0,
        listing_count: listingMap[u.id] || 0,
        avg_rating: ratingMap[u.id] ? ratingMap[u.id].sum / ratingMap[u.id].count : 0,
        rating_count: ratingMap[u.id]?.count || 0,
        is_following: followingIds.has(u.id),
      }))

    setAllUsers(mapped)
    setSuggestions(
      mapped
        .filter(u => !u.is_following)
        .sort((a, b) =>
          (b.role === 'pro' ? 1 : 0) - (a.role === 'pro' ? 1 : 0) ||
          b.avg_rating - a.avg_rating ||
          b.follower_count - a.follower_count
        )
        .slice(0, 12)
    )
    setFollowing(mapped.filter(u => u.is_following))
    setLoading(false)
  }

  const filtered = allUsers.filter(u => {
    const q = search.toLowerCase()
    return (
      (u.full_name || '').toLowerCase().includes(q) ||
      (u.specialty || '').toLowerCase().includes(q) ||
      (u.bio || '').toLowerCase().includes(q) ||
      (u.skills || []).some(s => s.toLowerCase().includes(q))
    )
  })

  const baseList = search
    ? filtered
    : tab === 'suggestions' ? suggestions
    : tab === 'following' ? following
    : allUsers

  const displayList = roleFilter === 'all'
    ? baseList
    : baseList.filter(u => u.role === roleFilter)

  const paginatedList = displayList.slice(0, visibleCount)
  const hasMore = displayList.length > visibleCount

  const proCount = baseList.filter(u => u.role === 'pro').length
  const ownerCount = baseList.filter(u => u.role === 'owner').length

  const tabs = [
    { id: 'all', label: 'Herkesi Gör', count: allUsers.length },
    { id: 'suggestions', label: 'Öneriler', count: suggestions.length },
    { id: 'following', label: 'Takip Ettiklerim', count: following.length },
  ]

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <Users className="h-5 w-5 text-brand-400" />
          <h1 className="text-xl font-bold text-white">Kullanıcılar</h1>
        </div>
        <p className="text-zinc-500 text-sm">Araç sahipleri ve servis uzmanlarını bul, takip et</p>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="İsim, uzmanlık veya yetenek ara..."
          className="input-base pl-10 pr-10"
        />
        {search && (
          <button onClick={() => setSearch('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Role filter */}
      <div className="flex gap-2 mb-5 flex-wrap">
        {[
          { id: 'all', label: 'Tümü', count: allUsers.length },
          { id: 'pro', label: 'Servis Uzmanı', count: proCount, icon: <Wrench className="h-3 w-3" /> },
          { id: 'owner', label: 'Araç Sahibi', count: ownerCount, icon: <Car className="h-3 w-3" /> },
        ].map(r => (
          <button
            key={r.id}
            onClick={() => setRoleFilter(r.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
              roleFilter === r.id
                ? r.id === 'pro'
                  ? 'bg-blue-500/15 border-blue-500/30 text-blue-400'
                  : r.id === 'owner'
                  ? 'bg-brand-500/15 border-brand-500/30 text-brand-400'
                  : 'bg-zinc-700 border-zinc-600 text-white'
                : 'bg-transparent border-zinc-800 text-zinc-500 hover:border-zinc-700 hover:text-zinc-300'
            }`}
          >
            {r.icon}
            {r.label}
            <span className="opacity-50 font-normal">{r.count}</span>
          </button>
        ))}
      </div>

      {/* Tabs */}
      {!search && (
        <div className="flex gap-1 border-b border-zinc-800 mb-6">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
                tab === t.id
                  ? 'border-brand-500 text-brand-400'
                  : 'border-transparent text-zinc-500 hover:text-zinc-300'
              }`}>
              {t.label}
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${tab === t.id ? 'bg-brand-500/20 text-brand-400' : 'bg-zinc-800 text-zinc-600'}`}>
                {t.count}
              </span>
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : displayList.length === 0 ? (
        <div className="text-center py-16">
          <Users className="h-10 w-10 text-zinc-700 mx-auto mb-3" />
          <p className="text-zinc-500 text-sm">
            {search
              ? 'Aramanızla eşleşen kullanıcı bulunamadı'
              : roleFilter !== 'all'
              ? 'Bu kategoride kullanıcı bulunamadı'
              : 'Henüz kullanıcı yok'}
          </p>
        </div>
      ) : (
        <>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {paginatedList.map(p => <UserCard key={p.id} profile={p} />)}
          </div>
          {hasMore && (
            <div className="flex justify-center mt-6">
              <button
                onClick={() => setVisibleCount(c => c + PAGE_SIZE)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm font-medium transition-colors"
              >
                <ChevronDown className="h-4 w-4" />
                Daha fazla göster ({displayList.length - visibleCount} kişi)
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

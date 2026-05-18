import { useEffect, useRef, useState } from 'react'
import { TrendingUp, Users, RefreshCw, Flame, ChevronDown, UserPlus, Bookmark } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import PostCard from '../components/posts/PostCard'
import CreatePost from '../components/posts/CreatePost'
import Spinner from '../components/ui/Spinner'
import EmptyState from '../components/ui/EmptyState'
import TorqviaLogo from '../components/ui/TorqviaLogo'
import UserAvatar from '../components/ui/UserAvatar'
import FollowButton from '../components/profile/FollowButton'
import { Link } from 'react-router-dom'

const PAGE_SIZE = 20
const FEED_CACHE_KEY = 'torqvia_feed_cache'

function FeedSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map(i => (
        <div key={i} className="card animate-pulse">
          <div className="flex gap-3">
            <div className="h-10 w-10 rounded-full bg-zinc-800 shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-32 bg-zinc-800 rounded" />
              <div className="h-3 w-full bg-zinc-800 rounded" />
              <div className="h-3 w-3/4 bg-zinc-800 rounded" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

const TABS = [
  { id: 'discover',  label: 'Keşfet' },
  { id: 'following', label: 'Takip',     icon: Users },
  { id: 'trending',  label: 'Trend',     icon: TrendingUp },
  { id: 'saved',     label: 'Kaydedilenler', icon: Bookmark },
]

function FeedLogo() {
  return (
    <div>
      <h1 className="text-xl font-bold text-white leading-none">Akış</h1>
      <p className="text-[10px] text-zinc-500 mt-0.5">Torqvia Topluluğu</p>
    </div>
  )
}

export default function Feed() {
  const { user } = useAuth()
  const [tab, setTab] = useState('discover')
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [page, setPage] = useState(0)
  const [followingIds, setFollowingIds] = useState(new Set())
  const [blockedIds, setBlockedIds] = useState(new Set())
  const [suggestedUsers, setSuggestedUsers] = useState([])
  const [savedPosts, setSavedPosts] = useState([])
  const [loadingSaved, setLoadingSaved] = useState(false)
  // Keep refs so fetchPosts always reads current filter values
  const followingRef = useRef(new Set())
  const blockedRef = useRef(new Set())

  useEffect(() => {
    if (tab === 'saved') {
      fetchSavedPosts()
      return
    }
    setPage(0)
    setPosts([])
    setHasMore(false)
    loadFeed(0, false, false)
  }, [tab])

  async function loadFilters() {
    const [{ data: follows }, { data: blocks }] = await Promise.all([
      supabase.from('follows').select('following_id').eq('follower_id', user.id),
      supabase.from('blocks').select('blocker_id, blocked_id')
        .or(`blocker_id.eq.${user.id},blocked_id.eq.${user.id}`),
    ])
    const fids = new Set((follows || []).map(f => f.following_id))
    const bids = new Set()
    ;(blocks || []).forEach(b => {
      if (b.blocker_id === user.id) bids.add(b.blocked_id)
      else bids.add(b.blocker_id)
    })
    setFollowingIds(fids)
    setBlockedIds(bids)
    followingRef.current = fids
    blockedRef.current = bids
    return { fids, bids }
  }

  async function loadFeed(pageNum, quiet, append) {
    const { fids, bids } = await loadFilters()
    await fetchPosts(pageNum, quiet, append, fids, bids)
  }

  async function fetchPosts(pageNum, quiet, append, fids, bids) {
    if (!quiet && !append) {
      // Show cached posts immediately while loading
      if (pageNum === 0 && tab === 'discover') {
        try {
          const cached = JSON.parse(localStorage.getItem(FEED_CACHE_KEY) || 'null')
          if (cached?.length) setPosts(cached)
        } catch {}
      }
      setLoading(true)
    }
    else if (append) setLoadingMore(true)
    else setRefreshing(true)

    const uid = user?.id
    const currentFids = fids ?? followingRef.current
    const currentBids = bids ?? blockedRef.current

    let query = supabase
      .from('posts')
      .select(`
        *,
        profiles!posts_user_id_fkey(id, avatar_url, full_name, role, specialty, plan),
        post_tags(tagged_user_id, profiles!post_tags_tagged_user_id_fkey(id, full_name)),
        post_likes(user_id),
        post_comments(count),
        original_post:repost_of(id, user_id, profiles!posts_user_id_fkey(id, full_name, avatar_url))
      `)
      .order('created_at', { ascending: false })

    if (tab === 'trending') {
      query = query
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .limit(100)
    } else {
      const fetchSize = PAGE_SIZE * 3
      query = query.range(pageNum * fetchSize, (pageNum + 1) * fetchSize - 1)
    }

    const { data } = await query

    let mapped = (data || []).map(post => ({
      ...post,
      like_count: post.post_likes?.length || 0,
      comment_count: post.post_comments?.[0]?.count || 0,
      liked_by_me: post.post_likes?.some(l => l.user_id === uid) || false,
    }))

    mapped = mapped.filter(p => !currentBids.has(p.user_id))

    if (tab === 'following') {
      mapped = mapped.filter(p => currentFids.has(p.user_id) || p.user_id === uid)
    }

    if (tab === 'following' && mapped.filter(p => p.user_id !== uid).length === 0) {
      fetchSuggested(currentFids)
    }

    if (tab === 'trending') {
      mapped = mapped
        .sort((a, b) => (b.like_count + b.comment_count * 2) - (a.like_count + a.comment_count * 2))
        .slice(0, 30)
      setPosts(mapped)
      setHasMore(false)
    } else {
      const newPosts = mapped.slice(0, PAGE_SIZE)
      if (append) {
        setPosts(prev => {
          const existingIds = new Set(prev.map(p => p.id))
          return [...prev, ...newPosts.filter(p => !existingIds.has(p.id))]
        })
      } else {
        setPosts(newPosts)
        // Cache first page of discover feed for offline use
        if (tab === 'discover' && pageNum === 0 && newPosts.length > 0) {
          try { localStorage.setItem(FEED_CACHE_KEY, JSON.stringify(newPosts.slice(0, 10))) } catch {}
        }
      }
      setHasMore((data || []).length === PAGE_SIZE * 3)
    }

    setLoading(false)
    setRefreshing(false)
    setLoadingMore(false)
  }

  async function fetchSuggested(alreadyFollowing) {
    const fids = alreadyFollowing ?? followingRef.current
    const { data } = await supabase
      .from('profiles')
      .select('id, full_name, avatar_url, role, specialty')
      .neq('id', user.id)
      .limit(20)
    const filtered = (data || []).filter(u => !fids.has(u.id)).slice(0, 6)
    setSuggestedUsers(filtered)
  }

  async function fetchSavedPosts() {
    setLoadingSaved(true)
    const uid = user?.id
    const { data } = await supabase
      .from('post_bookmarks')
      .select(`post_id, posts(*, profiles!posts_user_id_fkey(id, avatar_url, full_name, role, specialty, plan), post_likes(user_id), post_comments(count))`)
      .eq('user_id', uid)
      .order('created_at', { ascending: false })
    const mapped = (data || [])
      .map(r => r.posts)
      .filter(Boolean)
      .map(p => ({
        ...p,
        like_count: p.post_likes?.length || 0,
        comment_count: p.post_comments?.[0]?.count || 0,
        liked_by_me: p.post_likes?.some(l => l.user_id === uid) || false,
      }))
    setSavedPosts(mapped)
    setLoadingSaved(false)
  }

  function handleRefresh() {
    setPage(0)
    setPosts([])
    setLoading(true)
    loadFeed(0, true, false)
  }

  async function handleLoadMore() {
    const nextPage = page + 1
    setPage(nextPage)
    await fetchPosts(nextPage, false, true, null, null)
  }

  const emptyMessages = {
    discover: { title: 'Henüz paylaşım yok', desc: 'İlk paylaşımı sen yap!' },
    following: { title: 'Takip ettiğin kimse yok', desc: 'Kişiler sayfasından kullanıcı bul ve takip et' },
    trending: { title: 'Trend içerik yok', desc: 'Bu hafta paylaşım yapılmadı' },
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <FeedLogo />
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="p-2 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-colors"
          title="Yenile"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-zinc-800 mb-5 overflow-x-auto scrollbar-none">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap ${
              tab === id
                ? 'border-brand-500 text-brand-400'
                : 'border-transparent text-zinc-500 hover:text-zinc-300'
            }`}
          >
            {Icon && <Icon className="h-3.5 w-3.5" />}
            {label}
            {id === 'trending' && <Flame className="h-3 w-3 text-orange-400" />}
          </button>
        ))}
      </div>

      {tab === 'discover' && (
        <CreatePost onCreated={post => setPosts(prev => [post, ...prev])} />
      )}

      {tab === 'saved' ? (
        loadingSaved ? (
          <div className="flex justify-center py-16"><Spinner size="lg" /></div>
        ) : savedPosts.length === 0 ? (
          <EmptyState icon={Bookmark} title="Kaydedilen gönderi yok" description="Gönderilerin altındaki kaydet ikonuna tıklayarak içerikleri buraya ekleyebilirsin." />
        ) : (
          <div>
            {savedPosts.map(post => (
              <div key={post.id} className="mb-4">
                <PostCard post={post} onDelete={id => setSavedPosts(prev => prev.filter(p => p.id !== id))} />
              </div>
            ))}
          </div>
        )
      ) : loading && posts.length === 0 ? (
        <FeedSkeleton />
      ) : loading ? (
        <div className="flex justify-center py-8"><Spinner size="md" /></div>
      ) : posts.length === 0 ? (
        tab === 'following' && suggestedUsers.length > 0 ? (
          <div>
            <div className="text-center mb-6">
              <Users className="h-10 w-10 text-zinc-700 mx-auto mb-3" />
              <p className="text-white font-semibold">Takip ettiğin kimse yok</p>
              <p className="text-zinc-500 text-sm mt-1">Şu kişileri takip etmeye ne dersin?</p>
            </div>
            <div className="space-y-3">
              {suggestedUsers.map(u => (
                <div key={u.id} className="card flex items-center justify-between gap-3">
                  <Link to={`/profile/${u.id}`} className="flex items-center gap-3 hover:opacity-80 transition-opacity min-w-0">
                    <UserAvatar profile={u} size="sm" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-zinc-200 truncate">{u.full_name || 'İsimsiz'}</p>
                      <p className="text-xs text-zinc-600">{u.role === 'pro' ? 'Servis Uzmanı' : 'Araç Sahibi'}{u.specialty ? ` · ${u.specialty}` : ''}</p>
                    </div>
                  </Link>
                  <FollowButton targetId={u.id} size="sm" onToggle={() => loadFeed(0, true, false)} />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <EmptyState
            icon={tab === 'trending' ? TrendingUp : tab === 'following' ? Users : TorqviaLogo}
            title={emptyMessages[tab].title}
            description={emptyMessages[tab].desc}
          />
        )
      ) : (
        <div>
          {tab === 'trending' && (
            <div className="flex items-center gap-2 mb-4 px-1">
              <TrendingUp className="h-3.5 w-3.5 text-orange-400" />
              <p className="text-xs text-zinc-500">Bu haftanın en popüler gönderileri</p>
            </div>
          )}
          {posts.map((post, idx) => (
            <div key={post.id} className="mb-4">
              {tab === 'trending' && idx < 3 && (
                <div className="flex items-center gap-1.5 mb-1 px-1">
                  <span className={`text-xs font-bold ${idx === 0 ? 'text-yellow-400' : idx === 1 ? 'text-zinc-400' : 'text-orange-700'}`}>
                    #{idx + 1}
                  </span>
                  <div className="flex items-center gap-1 text-[10px] text-zinc-600">
                    <span>{post.like_count} beğeni</span>
                    <span>·</span>
                    <span>{post.comment_count} yorum</span>
                  </div>
                </div>
              )}
              <PostCard
                post={post}
                onDelete={id => setPosts(prev => prev.filter(p => p.id !== id))}
                onRepost={p => setPosts(prev => [p, ...prev])}
              />
            </div>
          ))}

          {/* Load more */}
          {hasMore && tab !== 'trending' && (
            <div className="flex justify-center mt-2 mb-8">
              <button
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm font-medium transition-colors disabled:opacity-50"
              >
                {loadingMore ? <Spinner size="sm" /> : <ChevronDown className="h-4 w-4" />}
                Daha fazla yükle
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

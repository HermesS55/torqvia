import { useEffect, useRef, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  Car, Wrench, Store, Globe, Phone, Edit2, Camera,
  MessageCircle, Star, Grid3X3, FileText,
  Flag, ShieldOff, Crown, Zap, Flame, Ban,
  Image as ImageIcon, PlusCircle, Trash2, UserCheck, UserX,
  MapPin, Clock, Banknote, ChevronLeft,
} from 'lucide-react'
import TorqviaLogo from '../components/ui/TorqviaLogo'

function EliteParticleCanvas() {
  const ref = useRef(null)
  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let raf
    canvas.width = canvas.offsetWidth
    canvas.height = canvas.offsetHeight
    const colors = ['#8b5cf6', '#c4a000', '#a78bfa', '#d4aa00']
    const N = 55
    const pts = Array.from({ length: N }, (_, i) => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      color: colors[i % colors.length],
      size: 0.8 + Math.random() * 1.4,
      isStar: i % 5 === 0,
      pulse: Math.random() * Math.PI * 2,
      pulseSpeed: 0.02 + Math.random() * 0.025,
    }))
    function drawStar(x, y, r, color) {
      ctx.save()
      ctx.translate(x, y)
      ctx.fillStyle = color
      const spikes = 4
      ctx.beginPath()
      for (let k = 0; k < spikes * 2; k++) {
        const angle = (k * Math.PI) / spikes - Math.PI / 2
        const rad = k % 2 === 0 ? r : r * 0.38
        ctx[k === 0 ? 'moveTo' : 'lineTo'](Math.cos(angle) * rad, Math.sin(angle) * rad)
      }
      ctx.closePath()
      ctx.fill()
      ctx.restore()
    }
    function frame() {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      for (let i = 0; i < N; i++) {
        const p = pts[i]
        p.x += p.vx; p.y += p.vy
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1
        p.pulse += p.pulseSpeed
        const ps = 1 + Math.sin(p.pulse) * 0.4
        if (p.isStar) {
          drawStar(p.x, p.y, p.size * 2.5 * ps, p.color)
        } else {
          ctx.beginPath()
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
          ctx.fillStyle = p.color
          ctx.fill()
        }
        for (let j = i + 1; j < N; j++) {
          const q = pts[j]
          const d = Math.hypot(p.x - q.x, p.y - q.y)
          if (d < 90) {
            const alpha = (1 - d / 90) * 0.2
            ctx.beginPath()
            ctx.moveTo(p.x, p.y)
            ctx.lineTo(q.x, q.y)
            const grd = ctx.createLinearGradient(p.x, p.y, q.x, q.y)
            grd.addColorStop(0, `rgba(139,92,246,${alpha})`)
            grd.addColorStop(1, `rgba(196,160,0,${alpha})`)
            ctx.strokeStyle = grd
            ctx.lineWidth = 0.5
            ctx.stroke()
          }
        }
      }
      raf = requestAnimationFrame(frame)
    }
    frame()
    const ro = new ResizeObserver(() => {
      canvas.width = canvas.offsetWidth
      canvas.height = canvas.offsetHeight
    })
    ro.observe(canvas)
    return () => { cancelAnimationFrame(raf); ro.disconnect() }
  }, [])
  return <canvas ref={ref} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block' }} />
}

function EliteAvatarRings({ children }) {
  return (
    <div style={{ position: 'relative', display: 'inline-block', padding: 16 }}>
      {/* Outer pulse ring */}
      <div style={{
        position: 'absolute', inset: 3, borderRadius: '50%',
        border: '1px solid rgba(139,92,246,0.25)',
        boxShadow: '0 0 20px rgba(139,92,246,0.3)',
        animation: 'pulse-outer-ring 2.5s ease-in-out infinite',
      }} />
      {/* Inner ring CCW — purple+gold */}
      <div style={{
        position: 'absolute', inset: 8, borderRadius: '50%',
        background: 'conic-gradient(from 0deg, #8b5cf6, #c4a000, #8b5cf6, #c4a000)',
        animation: 'spin-ring-ccw 4s linear infinite',
        maskImage: 'radial-gradient(farthest-side at 50% 50%, transparent calc(100% - 2px), black 100%)',
        WebkitMaskImage: 'radial-gradient(farthest-side at 50% 50%, transparent calc(100% - 2px), black 100%)',
      }} />
      {/* Outer ring CW */}
      <div style={{
        position: 'absolute', inset: 3, borderRadius: '50%',
        background: 'conic-gradient(from 90deg, rgba(196,160,0,0.55), transparent 40%, rgba(139,92,246,0.45), transparent 80%)',
        animation: 'spin-ring-cw 6s linear infinite',
        maskImage: 'radial-gradient(farthest-side at 50% 50%, transparent calc(100% - 2px), black 100%)',
        WebkitMaskImage: 'radial-gradient(farthest-side at 50% 50%, transparent calc(100% - 2px), black 100%)',
      }} />
      {children}
    </div>
  )
}
import { supabase } from '../lib/supabase'
import { uploadAvatar } from '../lib/avatar'
import { useAuth } from '../contexts/AuthContext'
import { validateImageFile, sanitizeUrl, sanitizeText } from '../lib/security'
import UserAvatar from '../components/ui/UserAvatar'
import PostCard from '../components/posts/PostCard'
import CreatePost from '../components/posts/CreatePost'
import Spinner from '../components/ui/Spinner'
import EmptyState from '../components/ui/EmptyState'
import FollowButton from '../components/profile/FollowButton'
import FollowListModal from '../components/profile/FollowListModal'
import PlanBadge from '../components/ui/PlanBadge'
import ReportModal from '../components/ui/ReportModal'
import RatingModal from '../components/ui/RatingModal'
import { VehicleCard } from './Garage'
import toast from 'react-hot-toast'

function ProfileActions({ onReport, onBlock, isBlocked }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        className="p-2 rounded-lg border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800 text-zinc-500 hover:text-zinc-300 transition-colors"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01" />
        </svg>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 w-44 bg-zinc-900 border border-zinc-800 rounded-xl shadow-xl z-20 overflow-hidden">
            <button onClick={() => { onReport(); setOpen(false) }}
              className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-zinc-300 hover:bg-zinc-800 transition-colors">
              <Flag className="h-3.5 w-3.5" /> Şikayet Et
            </button>
            <div className="border-t border-zinc-800" />
            <button onClick={() => { onBlock(); setOpen(false) }}
              className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors">
              <ShieldOff className="h-3.5 w-3.5" /> {isBlocked ? 'Engeli Kaldır' : 'Engelle'}
            </button>
          </div>
        </>
      )}
    </div>
  )
}

const SKILLS_OPTIONS = [
  'Motor', 'Kaporta', 'Boya', 'Elektrik', 'Lastik',
  'Süspansiyon', 'Fren', 'Tuning', 'Detailing', 'Egzoz',
  'Klima', 'Cam', 'Döşeme', 'Yakıt Sistemi',
]

const SPECIALTIES_OPTIONS = ['Motor', 'Kaporta-Boya', 'Elektrik', 'Lastik-Jant', 'Klima', 'Genel Bakım', 'Diğer']

export default function Profile() {
  const { id } = useParams()
  const { user, profile: myProfile, refetchProfile } = useAuth()
  const [profile, setProfile] = useState(null)
  const [email, setEmail] = useState('')
  const [posts, setPosts] = useState([])
  const [pinnedPost, setPinnedPost] = useState(null)
  const [listings, setListings] = useState([])
  const [vehicles, setVehicles] = useState([])
  const [portfolio, setPortfolio] = useState([])
  const [loading, setLoading] = useState(true)
  // HIDDEN_FOR_LAUNCH: sosyal medya, sonra açılacak - default tab role'e göre ayarlandı
  const [tab, setTab] = useState('posts')
  const [editing, setEditing] = useState(false)
  const [followCounts, setFollowCounts] = useState({ followers: 0, following: 0 })
  const [followModal, setFollowModal] = useState(null)
  const [editForm, setEditForm] = useState({})
  const [saving, setSaving] = useState(false)
  const [avatarUploading, setAvatarUploading] = useState(false)
  const [portfolioUploading, setPortfolioUploading] = useState(false)
  const portfolioRef = useRef()
  const [showReport, setShowReport] = useState(false)
  const [showRating, setShowRating] = useState(false)
  const [isBlocked, setIsBlocked] = useState(false)
  const [isBlockedByThem, setIsBlockedByThem] = useState(false)
  const [isFollowing, setIsFollowing] = useState(false)
  const [avgRating, setAvgRating] = useState(null)
  const [ratingCount, setRatingCount] = useState(0)
  const [myRating, setMyRating] = useState(null)
  const [followRequests, setFollowRequests] = useState([])
  const [ratings, setRatings] = useState([])
  const fileRef = useRef()

  const isOwn = id === user?.id
  const isOwner = profile?.role === 'owner'
  const isPro = profile?.role === 'pro'

  useEffect(() => {
    fetchAll()
    fetchFollowCounts()
    if (!isOwn) checkBlock()
    fetchRatings()
    if (isOwn) fetchFollowRequests()
  }, [id])

  useEffect(() => {
    if (user?.id && id && user.id !== id) {
      supabase.rpc('increment_profile_view', { target_id: id }).then(() => {})
    }
  }, [id, user?.id])

  // HIDDEN_FOR_LAUNCH: sosyal medya, sonra açılacak - posts sekmesi gizlendiği için
  useEffect(() => {
    if (!profile) return
    if (profile.role === 'pro') setTab('portfolio')
    else if (profile.role === 'owner') setTab('listings')
  }, [profile?.id])

  async function fetchRatings() {
    const { data } = await supabase
      .from('pro_ratings')
      .select('id, rating, comment, created_at, owner_id, reviewer:profiles!pro_ratings_owner_id_fkey(id, full_name, avatar_url)')
      .eq('pro_id', id)
      .order('created_at', { ascending: false })
    const arr = data || []
    setRatings(arr)
    if (arr.length > 0) {
      const avg = arr.reduce((s, r) => s + r.rating, 0) / arr.length
      setAvgRating(Math.round(avg * 10) / 10)
      setRatingCount(arr.length)
      if (user?.id) {
        const mine = arr.find(r => r.owner_id === user.id)
        setMyRating(mine?.rating || null)
      }
    } else {
      setAvgRating(null)
      setRatingCount(0)
    }
  }

  async function checkBlock() {
    const { data } = await supabase.from('blocks')
      .select('blocker_id, blocked_id')
      .or(`and(blocker_id.eq.${user?.id},blocked_id.eq.${id}),and(blocker_id.eq.${id},blocked_id.eq.${user?.id})`)
    ;(data || []).forEach(b => {
      if (b.blocker_id === user?.id) setIsBlocked(true)
      if (b.blocked_id === user?.id) setIsBlockedByThem(true)
    })
  }

  async function fetchFollowCounts() {
    const [{ count: followers }, { count: following }] = await Promise.all([
      supabase.from('follows').select('*', { count: 'exact', head: true }).eq('following_id', id),
      supabase.from('follows').select('*', { count: 'exact', head: true }).eq('follower_id', id),
    ])
    setFollowCounts({ followers: followers || 0, following: following || 0 })

    if (user?.id && !isOwn) {
      const { data } = await supabase.from('follows').select('follower_id').eq('follower_id', user.id).eq('following_id', id).maybeSingle()
      setIsFollowing(!!data)
    }
  }

  async function fetchAll() {
    setLoading(true)
    const [{ data: p }, { data: postsData }, { data: listingsData }, { data: vehiclesData }, { data: portfolioData }] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', id).single(),
      supabase.from('posts')
        .select(`*,
          profiles!posts_user_id_fkey(id, avatar_url, full_name, role, specialty, plan),
          post_tags(tagged_user_id, profiles!post_tags_tagged_user_id_fkey(id, full_name)),
          post_likes(user_id),
          post_comments(count)`)
        .eq('user_id', id)
        .order('created_at', { ascending: false }),
      supabase.from('listings').select('*').eq('user_id', id).order('created_at', { ascending: false }),
      supabase.from('vehicles').select('*').eq('user_id', id).order('created_at', { ascending: false }),
      supabase.from('portfolio_items').select('*').eq('pro_id', id).order('created_at', { ascending: false }),
    ])
    setProfile(p)
    setEditForm({
      full_name: p?.full_name || '',
      bio: p?.bio || '',
      specialty: p?.specialty || '',
      skills: p?.skills || [],
      website: p?.website || '',
      phone: p?.phone || '',
      location: p?.location || '',
      service_hours: p?.service_hours || '',
      price_range: p?.price_range || '',
      shop_name: p?.shop_name || '',
      city: p?.city || '',
      specialties: p?.specialties || [],
    })

    const uid = user?.id
    const mapped = (postsData || []).map(post => ({
      ...post,
      like_count: post.post_likes?.length || 0,
      comment_count: post.post_comments?.[0]?.count || 0,
      liked_by_me: post.post_likes?.some(l => l.user_id === uid) || false,
    }))

    if (p?.pinned_post_id) {
      const pinned = mapped.find(po => po.id === p.pinned_post_id)
      setPinnedPost(pinned || null)
    } else {
      setPinnedPost(null)
    }

    setPosts(mapped)
    setListings(listingsData || [])
    setVehicles(vehiclesData || [])
    setPortfolio(portfolioData || [])
    if (isOwn) setEmail(user?.email || '')
    setLoading(false)
  }

  async function handleAvatarUpload(e) {
    const file = e.target.files[0]
    if (!file) return
    try { await validateImageFile(file, 3 * 1024 * 1024) }
    catch (err) { toast.error(err.message); e.target.value = ''; return }
    setAvatarUploading(true)
    try {
      const url = await uploadAvatar(user.id, file)
      await supabase.from('profiles').update({ avatar_url: url }).eq('id', user.id)
      setProfile(p => ({ ...p, avatar_url: url }))
      refetchProfile?.()
      toast.success('Profil fotoğrafı güncellendi!')
    } catch { toast.error('Yüklenemedi') }
    finally { setAvatarUploading(false) }
  }

  async function handleSave() {
    setSaving(true)
    try {
      const { error } = await supabase.from('profiles').update({
        full_name: sanitizeText(editForm.full_name, 80),
        bio: sanitizeText(editForm.bio, 300),
        specialty: sanitizeText(editForm.specialty, 100),
        skills: editForm.skills,
        website: sanitizeUrl(editForm.website),
        phone: sanitizeText(editForm.phone, 20),
        location: sanitizeText(editForm.location, 100),
        service_hours: sanitizeText(editForm.service_hours, 100),
        price_range: sanitizeText(editForm.price_range, 50),
        shop_name: sanitizeText(editForm.shop_name, 100),
        city: sanitizeText(editForm.city, 100),
        specialties: editForm.specialties,
      }).eq('id', user.id)
      if (error) throw error
      setProfile(p => ({ ...p, ...editForm }))
      refetchProfile?.()
      setEditing(false)
      toast.success('Profil güncellendi!')
    } catch { toast.error('Kaydedilemedi') }
    finally { setSaving(false) }
  }

  async function handleBlock() {
    if (!confirm(`${profile?.full_name || 'Bu kullanıcıyı'} engellemek istediğinizden emin misiniz?`)) return
    if (isBlocked) {
      await supabase.from('blocks').delete().eq('blocker_id', user.id).eq('blocked_id', id)
      setIsBlocked(false)
      toast.success('Engel kaldırıldı')
    } else {
      const { error } = await supabase.from('blocks').insert({ blocker_id: user.id, blocked_id: id })
      if (error && error.code !== '23505') toast.error('Engellenemedi')
      else { setIsBlocked(true); toast.success('Kullanıcı engellendi') }
    }
  }

  async function handlePortfolioUpload(e) {
    const file = e.target.files[0]
    if (!file) return
    try { await validateImageFile(file, 5 * 1024 * 1024) }
    catch (err) { toast.error(err.message); e.target.value = ''; return }
    setPortfolioUploading(true)
    try {
      const ext = file.name.split('.').pop()
      const path = `portfolio/${user.id}/${Date.now()}.${ext}`
      const { error: upErr } = await supabase.storage.from('post-images').upload(path, file, { upsert: false })
      if (upErr) throw upErr
      const { data: { publicUrl } } = supabase.storage.from('post-images').getPublicUrl(path)
      const { data, error } = await supabase.from('portfolio_items').insert({ pro_id: user.id, image_url: publicUrl }).select().single()
      if (error) throw error
      setPortfolio(prev => [data, ...prev])
      toast.success('Portföy fotoğrafı eklendi!')
    } catch { toast.error('Yüklenemedi') }
    finally { setPortfolioUploading(false); e.target.value = '' }
  }

  async function handlePortfolioDelete(itemId) {
    if (!confirm('Bu fotoğrafı portföyden kaldırmak istediğine emin misin?')) return
    const { error } = await supabase.from('portfolio_items').delete().eq('id', itemId)
    if (error) toast.error('Silinemedi')
    else setPortfolio(prev => prev.filter(p => p.id !== itemId))
  }

  async function fetchFollowRequests() {
    const { data } = await supabase
      .from('follow_requests')
      .select('from_user_id, created_at, profiles!follow_requests_from_user_id_fkey(id, full_name, avatar_url, role)')
      .eq('to_user_id', user.id)
      .order('created_at', { ascending: false })
    setFollowRequests(data || [])
  }

  async function acceptFollowRequest(fromId) {
    await supabase.from('follows').insert({ follower_id: fromId, following_id: user.id })
    await supabase.from('follow_requests').delete().eq('from_user_id', fromId).eq('to_user_id', user.id)
    setFollowRequests(prev => prev.filter(r => r.from_user_id !== fromId))
    fetchFollowCounts()
    toast.success('Takip isteği kabul edildi')
  }

  async function rejectFollowRequest(fromId) {
    await supabase.from('follow_requests').delete().eq('from_user_id', fromId).eq('to_user_id', user.id)
    setFollowRequests(prev => prev.filter(r => r.from_user_id !== fromId))
  }

  function toggleSkill(skill) {
    setEditForm(f => ({
      ...f,
      skills: f.skills.includes(skill) ? f.skills.filter(s => s !== skill) : [...f.skills, skill],
    }))
  }

  function toggleSpecialty(s) {
    setEditForm(f => ({
      ...f,
      specialties: f.specialties.includes(s) ? f.specialties.filter(x => x !== s) : [...f.specialties, s],
    }))
  }

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>
  if (!profile) return <div className="text-center py-20 text-zinc-500">Kullanıcı bulunamadı</div>

  const plan = profile.plan || 'free'
  const isElite = plan === 'elite'
  const isTurbo = plan === 'turbo'
  const hasPlan = isElite || isTurbo

  /* ── Engelleme ekranı ── */
  if (isBlockedByThem && !isOwn) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="card text-center py-16">
          <Ban className="h-10 w-10 text-zinc-700 mx-auto mb-3" />
          <p className="text-white font-semibold">Bu içerik kullanılamıyor</p>
          <p className="text-zinc-500 text-sm mt-1">Bu profili görüntüleme iznin yok.</p>
        </div>
      </div>
    )
  }

  /* ── Stil hesapları ── */
  const cardBorder = isElite
    ? 'border-violet-500/40 shadow-[0_0_50px_rgba(139,92,246,0.15),0_0_0_1px_rgba(167,139,250,0.08)]'
    : isTurbo
      ? 'border-orange-500/35 shadow-[0_0_30px_rgba(249,115,22,0.12)]'
      : isOwner ? 'border-brand-500/20' : 'border-blue-500/15'

  const coverH = isElite ? 'h-36' : isTurbo ? 'h-28' : 'h-20'

  const coverStyle = isElite
    ? { background: 'linear-gradient(135deg, #1e0a3c 0%, #2d1b69 30%, #1a1a2e 60%, #2a1a0a 100%)' }
    : isTurbo
      ? { background: 'linear-gradient(135deg, #431407 0%, #7c2d12 40%, #1c0a00 100%)' }
      : isOwner
        ? { background: 'linear-gradient(135deg, #1c0f00 0%, #431407 100%)' }
        : { background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)' }

  const avatarRing = isElite
    ? { boxShadow: '0 0 0 3px rgba(167,139,250,0.5), 0 0 20px rgba(139,92,246,0.3)', borderRadius: '50%' }
    : isTurbo
      ? { boxShadow: '0 0 0 3px rgba(249,115,22,0.5), 0 0 16px rgba(249,115,22,0.25)', borderRadius: '50%' }
      : {}

  const eliteParticles = Array.from({ length: 8 }, (_, i) => ({
    id: i,
    left: `${10 + i * 11}%`,
    delay: `${i * 0.5}s`,
    dur: `${2.5 + (i % 3) * 0.7}s`,
    px: `${-15 + (i % 5) * 8}px`,
    size: i % 2 === 0 ? 2 : 1.5,
    color: i % 3 === 0 ? '#a78bfa' : i % 3 === 1 ? '#fbbf24' : '#c4b5fd',
  }))

  return (
    <div className="max-w-2xl mx-auto">
      {/* Profile Header Card */}
      <div className={`rounded-2xl border overflow-hidden mb-6 bg-zinc-900 ${cardBorder}`}>

        {/* Elite shimmer top border */}
        {isElite && (
          <div style={{
            height: 2,
            background: 'linear-gradient(90deg, #7c3aed, #a78bfa, #fbbf24, #a78bfa, #7c3aed)',
            backgroundSize: '200% auto',
            animation: 'elite-shimmer 3s linear infinite',
          }} />
        )}
        {isTurbo && <div className="h-0.5 bg-gradient-to-r from-orange-600 via-red-500 to-orange-600" />}

        {/* Cover */}
        <div className={`relative overflow-hidden ${coverH}`} style={isElite ? { background: '#080808' } : coverStyle}>
          {/* Elite canvas */}
          {isElite && <EliteParticleCanvas />}
          {/* Non-elite particles kept as fallback */}
          {!isElite && eliteParticles.map(p => (
            <div key={p.id} style={{
              position: 'absolute', bottom: 0, left: p.left,
              width: p.size, height: p.size, borderRadius: '50%',
              backgroundColor: p.color,
              boxShadow: `0 0 ${p.size * 4}px ${p.color}`,
              '--px': p.px,
              animation: `float-particle ${p.dur} ease-in-out infinite`,
              animationDelay: p.delay,
            }} />
          ))}

          {/* Elite radial glow */}
          {isElite && (
            <div style={{
              position: 'absolute', inset: 0,
              background: 'radial-gradient(ellipse at 50% 50%, rgba(139,92,246,0.18) 0%, transparent 70%)',
              pointerEvents: 'none',
            }} />
          )}

          {/* Watermark logo */}
          <div className="absolute inset-0 flex items-center justify-end pr-6 opacity-[0.04] pointer-events-none">
            <TorqviaLogo size={isElite ? 100 : 70} />
          </div>

          {/* Elite banner */}
          {isElite && (
            <div style={{
              position: 'absolute', top: 10, left: 12, right: 12,
              background: 'linear-gradient(90deg, rgba(139,92,246,0.15), rgba(196,160,0,0.1))',
              border: '1px solid rgba(139,92,246,0.25)',
              borderRadius: 8, padding: '6px 12px',
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <Crown size={13} style={{ color: '#c4a000', animation: 'elite-pulse 2s ease-in-out infinite' }} />
              <span style={{
                fontSize: 10, fontWeight: 800, letterSpacing: '0.14em',
                background: 'linear-gradient(90deg, #fbbf24, #a78bfa)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                backgroundSize: '200% auto', animation: 'elite-shimmer 3s linear infinite',
              }}>⚡ ELITE ÜYE</span>
              <span style={{ marginLeft: 'auto', fontSize: 10, color: '#555' }}>Öncelikli erişim aktif</span>
            </div>
          )}
          {isTurbo && (
            <div className="absolute top-3 left-4 flex items-center gap-1.5">
              <Flame className="h-3.5 w-3.5 text-orange-400" />
              <span className="text-[10px] font-bold tracking-widest text-orange-400">TURBO ÜYESİ</span>
            </div>
          )}
        </div>

        <div className="px-5 pb-5">
          {/* Avatar row — only avatar + small ⋮ menu, so nothing overlaps the cover */}
          <div className="flex items-end justify-between -mt-10 mb-3">
            <div className="relative shrink-0">
              {isElite ? (
                <EliteAvatarRings>
                  <div style={{ position: 'relative' }}>
                    <UserAvatar profile={profile} email={email} size="xl" />
                    {isOwn && (
                      <>
                        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
                        <button onClick={() => fileRef.current?.click()} disabled={avatarUploading}
                          style={{ position: 'absolute', bottom: 0, right: 0 }}
                          className="p-1.5 bg-zinc-800 border border-zinc-700 rounded-full hover:bg-zinc-700 transition-colors">
                          {avatarUploading ? <Spinner size="sm" /> : <Camera className="h-3.5 w-3.5 text-zinc-300" />}
                        </button>
                      </>
                    )}
                  </div>
                </EliteAvatarRings>
              ) : (
                <>
                  <div style={avatarRing}>
                    <UserAvatar profile={profile} email={email} size="xl" />
                  </div>
                  {isOwn && (
                    <>
                      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
                      <button onClick={() => fileRef.current?.click()} disabled={avatarUploading}
                        className="absolute bottom-0 right-0 p-1.5 bg-zinc-800 border border-zinc-700 rounded-full hover:bg-zinc-700 transition-colors">
                        {avatarUploading ? <Spinner size="sm" /> : <Camera className="h-3.5 w-3.5 text-zinc-300" />}
                      </button>
                    </>
                  )}
                </>
              )}
            </div>
            {!isOwn && (
              <ProfileActions
                onReport={() => setShowReport(true)}
                onBlock={handleBlock}
                isBlocked={isBlocked}
              />
            )}
            {isElite && isOwn && (
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '6px 14px', borderRadius: 99,
                background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.3)',
                color: '#a78bfa', fontSize: 12, fontWeight: 800,
                animation: 'badge-elite-glow 2.5s ease-in-out infinite',
                backgroundImage: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)',
                backgroundSize: '200% auto',
                animationName: 'badge-elite-glow, shimmer-sweep',
                animationDuration: '2.5s, 3s',
                animationTimingFunction: 'ease-in-out, linear',
                animationIterationCount: 'infinite',
              }}>
                ⚡ ELITE ÜYE
              </div>
            )}
          </div>

          {/* Action buttons — separate row, fully below cover */}
          <div className="flex gap-2 mb-4 flex-wrap">
            {isOwn ? (
              <button onClick={() => setEditing(true)}
                className="btn-secondary flex items-center gap-1.5 text-sm">
                <Edit2 className="h-3.5 w-3.5" /> Düzenle
              </button>
            ) : (
              <>
                {!isBlocked && <FollowButton targetId={id} onToggle={fetchFollowCounts} />}
                {!isBlocked && (
                  <Link to={`/messages?to=${id}`}
                    className="btn-secondary flex items-center gap-1.5 text-sm">
                    <MessageCircle className="h-3.5 w-3.5" /> Mesaj
                  </Link>
                )}
                {isPro && myProfile?.role === 'owner' && !isBlocked && (
                  <button onClick={() => setShowRating(true)}
                    className={`flex items-center gap-1.5 text-sm px-3 py-2 rounded-lg border transition-colors ${
                      myRating
                        ? 'border-yellow-500/40 text-yellow-400 bg-yellow-500/10'
                        : 'border-zinc-700 text-zinc-400 hover:border-yellow-500/40 hover:text-yellow-400'
                    }`}>
                    <Star className={`h-3.5 w-3.5 ${myRating ? 'fill-yellow-400' : ''}`} />
                    {myRating ? `${myRating}★` : 'Değerlendir'}
                  </button>
                )}
              </>
            )}
          </div>

          {/* Engellendi banner */}
          {isBlocked && !isOwn && (
            <div className="mb-4 flex items-center gap-2 bg-zinc-800/60 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-zinc-400">
              <Ban className="h-4 w-4 text-zinc-500" />
              Bu kullanıcıyı engellediniz.
              <button onClick={handleBlock} className="ml-auto text-xs text-brand-400 hover:text-brand-300">Engeli Kaldır</button>
            </div>
          )}

          {/* Name + plan + role */}
          <div className="mb-3">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className={`text-xl font-bold ${isElite
                ? 'bg-gradient-to-r from-white via-violet-200 to-amber-200 bg-clip-text text-transparent'
                : 'text-white'
              }`}>
                {profile.full_name || 'İsimsiz Kullanıcı'}
              </h1>
              {hasPlan && <PlanBadge plan={plan} size="md" />}
              {isPro
                ? <span className="inline-flex items-center gap-1 text-xs text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20"><Wrench className="h-3 w-3" />Servis Uzmanı</span>
                : <span className="inline-flex items-center gap-1 text-xs text-brand-400 bg-brand-500/10 px-2 py-0.5 rounded-full border border-brand-500/20"><Car className="h-3 w-3" />Araç Sahibi</span>
              }
            </div>
            {isPro && profile.specialty && (
              <p className="text-sm font-medium mt-0.5 text-blue-300">{profile.specialty}</p>
            )}
            {isPro && profile.shop_name && (
              <p className="flex items-center gap-1 text-sm text-zinc-300 font-medium mt-0.5">
                <Store className="h-3.5 w-3.5 text-zinc-500 shrink-0" />
                {profile.shop_name}
              </p>
            )}
            {isPro && avgRating !== null && (
              <div className="flex items-center gap-1.5 mt-1.5">
                {[1,2,3,4,5].map(s => (
                  <Star key={s} className={`h-3.5 w-3.5 ${s <= Math.round(avgRating) ? 'fill-yellow-400 text-yellow-400' : 'fill-zinc-700 text-zinc-700'}`} />
                ))}
                <span className="text-xs font-bold text-yellow-400">{avgRating}</span>
                <span className="text-xs text-zinc-600">({ratingCount} değerlendirme)</span>
              </div>
            )}
          </div>

          {!isBlocked && (
            <>
              {profile.bio && (
                <p className="text-zinc-400 text-sm mb-3 leading-relaxed">{profile.bio}</p>
              )}
              {isPro && profile.skills?.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {profile.skills.map(skill => (
                    <span key={skill} className={`text-xs px-2 py-0.5 rounded-full border ${
                      isElite
                        ? 'bg-violet-500/10 text-violet-300 border-violet-500/25'
                        : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                    }`}>{skill}</span>
                  ))}
                </div>
              )}
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-500">
                {profile.phone && (isOwn || profile.phone_public) && (
                  <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{profile.phone}</span>
                )}
                {profile.website && (
                  <a href={profile.website} target="_blank" rel="noreferrer"
                    className="flex items-center gap-1 hover:text-brand-400 transition-colors">
                    <Globe className="h-3 w-3" />{profile.website.replace(/https?:\/\//, '')}
                  </a>
                )}
                {isPro && profile.location && (
                  <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{profile.location}</span>
                )}
              </div>
              {isPro && (profile.service_hours || profile.price_range) && (
                <div className="flex flex-wrap gap-3 mt-2">
                  {profile.service_hours && (
                    <span className="flex items-center gap-1.5 text-xs text-zinc-400 bg-zinc-800/60 border border-zinc-700/50 px-2.5 py-1 rounded-lg">
                      <Clock className="h-3 w-3 text-zinc-500" />{profile.service_hours}
                    </span>
                  )}
                  {profile.price_range && (
                    <span className="flex items-center gap-1.5 text-xs text-zinc-400 bg-zinc-800/60 border border-zinc-700/50 px-2.5 py-1 rounded-lg">
                      <Banknote className="h-3 w-3 text-zinc-500" />{profile.price_range}
                    </span>
                  )}
                </div>
              )}
            </>
          )}

          {/* HIDDEN_FOR_LAUNCH: sosyal medya, sonra açılacak */}
          {false && (
          <div className={`grid gap-px mt-4 pt-4 border-t ${
            isElite ? 'border-violet-500/20' : 'border-zinc-800'
          } ${(isOwner || isPro) ? 'grid-cols-4' : 'grid-cols-3'}`}>
            <div className="text-center py-1">
              <div className={`text-lg font-bold ${isElite ? 'text-violet-200' : 'text-white'}`}>{posts.length}</div>
              <div className="text-[11px] text-zinc-500">Paylaşım</div>
            </div>
            <button onClick={() => setFollowModal('followers')}
              className="text-center py-1 rounded-lg transition-colors hover:bg-zinc-800/60">
              <div className={`text-lg font-bold ${isElite ? 'text-violet-200' : 'text-white'}`}>{followCounts.followers}</div>
              <div className="text-[11px] text-zinc-500">Takipçi</div>
            </button>
            <button onClick={() => setFollowModal('following')}
              className="text-center py-1 rounded-lg transition-colors hover:bg-zinc-800/60">
              <div className={`text-lg font-bold ${isElite ? 'text-violet-200' : 'text-white'}`}>{followCounts.following}</div>
              <div className="text-[11px] text-zinc-500">Takip</div>
            </button>
            {isOwner && (
              <div className="text-center py-1">
                <div className={`text-lg font-bold ${isElite ? 'text-violet-200' : 'text-white'}`}>{listings.length}</div>
                <div className="text-[11px] text-zinc-500">İlan</div>
              </div>
            )}
            {isPro && (
              <div className="text-center py-1">
                <div className={`text-lg font-bold ${isElite ? 'text-violet-200' : 'text-white'}`}>
                  {(profile.view_count || 0).toLocaleString('tr-TR')}
                </div>
                <div className="text-[11px] text-zinc-500">Görüntülenme</div>
              </div>
            )}
          </div>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-zinc-900 rounded-2xl border border-zinc-700 overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between p-5 border-b border-zinc-800">
              <h2 className="font-semibold text-white">Profili Düzenle</h2>
              <button onClick={() => setEditing(false)} className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-500">✕</button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1.5">Ad Soyad</label>
                <input value={editForm.full_name} onChange={e => setEditForm(f => ({ ...f, full_name: e.target.value }))}
                  placeholder="Adın ve soyadın" className="input-base" />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1.5">Hakkında</label>
                <textarea value={editForm.bio} onChange={e => setEditForm(f => ({ ...f, bio: e.target.value }))}
                  placeholder={isPro ? 'Deneyimini, uzmanlık alanını anlat...' : 'Kendini kısaca tanıt...'}
                  rows={3} maxLength={300} className="input-base resize-none" />
              </div>
              {isPro && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-1.5">Dükkan Adı</label>
                    <input value={editForm.shop_name} onChange={e => setEditForm(f => ({ ...f, shop_name: e.target.value }))}
                      placeholder="Örn: Ahmet Oto" className="input-base" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-1.5">Şehir / İlçe</label>
                    <input value={editForm.city} onChange={e => setEditForm(f => ({ ...f, city: e.target.value }))}
                      placeholder="Örn: Samsun / Atakum" className="input-base" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-1.5">Uzmanlık Alanları</label>
                    <div className="flex flex-wrap gap-2">
                      {SPECIALTIES_OPTIONS.map(s => (
                        <button key={s} type="button" onClick={() => toggleSpecialty(s)}
                          className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                            editForm.specialties.includes(s)
                              ? 'bg-blue-500/20 border-blue-500/50 text-blue-300'
                              : 'bg-zinc-800 border-zinc-700 text-zinc-500 hover:border-zinc-600'
                          }`}>
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-1.5">Uzmanlık Alanı</label>
                    <input value={editForm.specialty} onChange={e => setEditForm(f => ({ ...f, specialty: e.target.value }))}
                      placeholder="ör. Motor Tamircisi, Kaporta Ustası..." className="input-base" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-1.5">Konum</label>
                    <input value={editForm.location} onChange={e => setEditForm(f => ({ ...f, location: e.target.value }))}
                      placeholder="ör. İstanbul / Kadıköy" className="input-base" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-zinc-300 mb-1.5">Servis Saatleri</label>
                      <input value={editForm.service_hours} onChange={e => setEditForm(f => ({ ...f, service_hours: e.target.value }))}
                        placeholder="ör. Haftaiçi 09:00-18:00" className="input-base" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-zinc-300 mb-1.5">Fiyat Aralığı</label>
                      <input value={editForm.price_range} onChange={e => setEditForm(f => ({ ...f, price_range: e.target.value }))}
                        placeholder="ör. ₺200-₺500/saat" className="input-base" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-1.5">Yetenekler</label>
                    <div className="flex flex-wrap gap-2">
                      {SKILLS_OPTIONS.map(skill => (
                        <button key={skill} type="button" onClick={() => toggleSkill(skill)}
                          className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                            editForm.skills.includes(skill)
                              ? 'bg-blue-500/20 border-blue-500/50 text-blue-300'
                              : 'bg-zinc-800 border-zinc-700 text-zinc-500 hover:border-zinc-600'
                          }`}>
                          {skill}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1.5">Telefon</label>
                <input value={editForm.phone} onChange={e => setEditForm(f => ({ ...f, phone: e.target.value }))}
                  placeholder="+90 555 000 0000" className="input-base" />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1.5">Website</label>
                <input value={editForm.website} onChange={e => setEditForm(f => ({ ...f, website: e.target.value }))}
                  placeholder="https://..." className="input-base" />
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setEditing(false)} className="btn-secondary flex-1">İptal</button>
                <button onClick={handleSave} disabled={saving} className="btn-primary flex-1 flex items-center justify-center gap-2">
                  {saving ? <Spinner size="sm" /> : 'Kaydet'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* HIDDEN_FOR_LAUNCH: sosyal medya, sonra açılacak */}
      {false && isOwn && followRequests.length > 0 && (
        <div className="card mb-6">
          <div className="flex items-center gap-2 mb-4">
            <UserCheck className="h-4 w-4 text-brand-400" />
            <h3 className="font-semibold text-white text-sm">Takip İstekleri</h3>
            <span className="text-xs bg-brand-500 text-white rounded-full px-2 py-0.5">{followRequests.length}</span>
          </div>
          <div className="space-y-3">
            {followRequests.map(req => (
              <div key={req.from_user_id} className="flex items-center justify-between gap-3">
                <Link to={`/profile/${req.from_user_id}`} className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
                  <UserAvatar profile={req.profiles} size="sm" />
                  <div>
                    <div className="text-sm font-medium text-zinc-200">{req.profiles?.full_name || 'İsimsiz'}</div>
                    <div className="text-xs text-zinc-600">{req.profiles?.role === 'pro' ? 'Servis Uzmanı' : 'Araç Sahibi'}</div>
                  </div>
                </Link>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => acceptFollowRequest(req.from_user_id)}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors"
                  >
                    <UserCheck className="h-3 w-3" /> Kabul
                  </button>
                  <button
                    onClick={() => rejectFollowRequest(req.from_user_id)}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium border border-zinc-700 text-zinc-400 rounded-lg hover:border-red-500/40 hover:text-red-400 transition-colors"
                  >
                    <UserX className="h-3 w-3" /> Reddet
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Owner 2-column layout ── */}
      {isOwner && (
        <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: 16, marginBottom: 28 }}
          className="owner-profile-grid">
          {/* Left: Araçlarım + Son İlanlar */}
          <div>
            <p style={{ fontFamily: 'monospace', fontSize: 9, color: isElite ? '#8b5cf6' : '#444', textTransform: 'uppercase', letterSpacing: '0.18em', marginBottom: 12 }}>
              // ARAÇLARIM
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
              {vehicles.length === 0 ? (
                <div style={{ background: '#0b0b0b', border: '1px solid #141414', borderRadius: 10, padding: '16px', textAlign: 'center', color: '#333', fontSize: 12 }}>
                  {isOwn ? (
                    <Link to="/garage" style={{ color: isElite ? '#8b5cf6' : '#ff6b00', textDecoration: 'none' }}>Araç ekle →</Link>
                  ) : 'Araç yok'}
                </div>
              ) : vehicles.slice(0, 3).map(v => (
                <div key={v.id} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  background: '#0b0b0b', border: `1px solid ${isElite ? 'rgba(139,92,246,0.15)' : '#141414'}`,
                  borderRadius: 10, padding: '12px 14px',
                }}>
                  <div style={{
                    width: 38, height: 38, borderRadius: 8,
                    background: isElite ? 'rgba(139,92,246,0.1)' : 'rgba(255,107,0,0.07)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    <Car size={16} style={{ color: isElite ? '#8b5cf6' : '#ff6b00' }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#f0f0f0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {v.year} {v.brand} {v.model}
                    </div>
                    {v.mileage && <div style={{ fontSize: 11, color: '#444', marginTop: 2 }}>{v.mileage?.toLocaleString('tr-TR')} km</div>}
                  </div>
                  <span style={{
                    fontSize: 10, padding: '3px 8px', borderRadius: 99,
                    background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', color: '#22c55e',
                  }}>Aktif</span>
                </div>
              ))}
              {isOwn && (
                <Link to="/garage" style={{ fontSize: 12, color: isElite ? '#8b5cf6' : '#ff6b00', textDecoration: 'none', textAlign: 'center', padding: '8px 0' }}>
                  Garajı Yönet →
                </Link>
              )}
            </div>

            <p style={{ fontFamily: 'monospace', fontSize: 9, color: isElite ? '#8b5cf6' : '#444', textTransform: 'uppercase', letterSpacing: '0.18em', marginBottom: 12 }}>
              // SON İLANLAR
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {listings.length === 0 ? (
                <div style={{ background: '#0b0b0b', border: '1px solid #141414', borderRadius: 10, padding: '14px', textAlign: 'center', color: '#333', fontSize: 12 }}>
                  İlan yok
                </div>
              ) : listings.slice(0, 3).map(l => (
                <Link key={l.id} to={`/listings/${l.id}`} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  background: '#0b0b0b', border: `1px solid ${isElite ? 'rgba(139,92,246,0.12)' : '#141414'}`,
                  borderRadius: 10, padding: '11px 14px', textDecoration: 'none',
                }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#f0f0f0' }}>{l.brand} {l.model}</div>
                    <div style={{ fontSize: 10, color: '#444', marginTop: 2 }}>{new Date(l.created_at).toLocaleDateString('tr-TR')}</div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Right: Özet + Favori Ustalar */}
          <div>
            <p style={{ fontFamily: 'monospace', fontSize: 9, color: isElite ? '#8b5cf6' : '#444', textTransform: 'uppercase', letterSpacing: '0.18em', marginBottom: 12 }}>
              // ÖZET
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 20 }}>
              {[
                { label: 'Araç', value: vehicles.length },
                { label: 'İlan', value: listings.length },
                { label: 'Plan', value: (plan === 'elite' ? 'ELITE' : plan === 'turbo' ? 'TURBO' : 'FREE') },
                { label: 'Üye', value: profile.created_at ? new Date(profile.created_at).getFullYear() : '—' },
              ].map(item => (
                <div key={item.label} style={{
                  background: '#0b0b0b',
                  border: `1px solid ${isElite ? 'rgba(139,92,246,0.15)' : '#141414'}`,
                  borderRadius: 10, padding: '12px 14px',
                }}>
                  <div style={{ fontSize: 9, color: '#333', marginBottom: 4, fontFamily: 'monospace', letterSpacing: '0.1em' }}>{item.label}</div>
                  <div style={{ fontSize: 18, fontWeight: 900, color: isElite ? '#a78bfa' : '#f0f0f0' }}>{item.value}</div>
                </div>
              ))}
            </div>

            <p style={{ fontFamily: 'monospace', fontSize: 9, color: isElite ? '#8b5cf6' : '#444', textTransform: 'uppercase', letterSpacing: '0.18em', marginBottom: 12 }}>
              // FAVORİ USTALAR
            </p>
            <div style={{ background: '#0b0b0b', border: `1px solid ${isElite ? 'rgba(139,92,246,0.15)' : '#141414'}`, borderRadius: 10, padding: '16px' }}>
              {[
                { name: 'Ahmet Oto Tamiri', spec: 'Motor · Elektrik', rating: 4.9 },
                { name: 'Tuğrul Lastik', spec: 'Lastik · Jant', rating: 4.7 },
              ].map((m, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, paddingBottom: i < 1 ? 10 : 0, marginBottom: i < 1 ? 10 : 0, borderBottom: i < 1 ? '1px solid #141414' : 'none' }}>
                  <div style={{ width: 34, height: 34, borderRadius: '50%', background: isElite ? 'rgba(139,92,246,0.1)' : 'rgba(255,107,0,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 14, fontWeight: 700, color: isElite ? '#8b5cf6' : '#ff6b00' }}>
                    {m.name[0]}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#888' }}>{m.name}</div>
                    <div style={{ fontSize: 10, color: '#444', marginTop: 1 }}>{m.spec}</div>
                  </div>
                  <span style={{ fontSize: 11, color: '#f59e0b', fontWeight: 700 }}>★{m.rating}</span>
                </div>
              ))}
              <Link to="/listings" style={{ display: 'block', textAlign: 'center', marginTop: 12, fontSize: 12, color: isElite ? '#8b5cf6' : '#ff6b00', textDecoration: 'none' }}>
                Usta Ara →
              </Link>
            </div>
          </div>
        </div>
      )}

      <>
          {/* Tabs */}
          <div className="flex gap-1 border-b border-zinc-800 mb-6">
            {[
              // HIDDEN_FOR_LAUNCH: sosyal medya, sonra açılacak
              // { id: 'posts', label: 'Paylaşımlar', icon: Grid3X3 },
              ...(isPro ? [{ id: 'portfolio', label: 'Portföy', icon: ImageIcon }] : []),
              ...(isPro ? [{ id: 'reviews', label: `Değerlendirmeler${ratingCount > 0 ? ` (${ratingCount})` : ''}`, icon: Star }] : []),
              ...(isOwner ? [{ id: 'listings', label: 'İlanlar', icon: FileText }] : []),
              ...(isOwner ? [{ id: 'garage', label: 'Garaj', icon: Car }] : []),
            ].map(tabItem => (
              <button key={tabItem.id} onClick={() => setTab(tabItem.id)}
                className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
                  tab === tabItem.id
                    ? 'border-brand-500 text-brand-400'
                    : 'border-transparent text-zinc-500 hover:text-zinc-300'
                }`}>
                <tabItem.icon className="h-4 w-4" />
                {tabItem.label}
              </button>
            ))}
          </div>

          {/* HIDDEN_FOR_LAUNCH: sosyal medya, sonra açılacak */}
          {false && tab === 'posts' && (
            <div>
              {isOwn && <CreatePost onCreated={post => setPosts(prev => [post, ...prev])} />}

              {/* Pinned post */}
              {pinnedPost && (
                <div className="mb-4">
                  <PostCard
                    post={pinnedPost}
                    pinnedPostId={profile.pinned_post_id}
                    onDelete={id => {
                      setPosts(prev => prev.filter(p => p.id !== id))
                      if (pinnedPost?.id === id) setPinnedPost(null)
                    }}
                    onRepost={p => setPosts(prev => [p, ...prev])}
                  />
                </div>
              )}

              {posts.filter(p => p.id !== pinnedPost?.id).length === 0 && !pinnedPost
                ? <EmptyState icon={Grid3X3} title="Henüz paylaşım yok" description={isOwn ? 'İlk paylaşımını yap!' : 'Bu kullanıcı henüz paylaşım yapmadı'} />
                : posts.filter(p => p.id !== pinnedPost?.id).map(post => (
                    <div key={post.id} className="mb-4">
                      <PostCard
                        post={post}
                        pinnedPostId={profile.pinned_post_id}
                        onDelete={id => setPosts(prev => prev.filter(p => p.id !== id))}
                        onRepost={p => setPosts(prev => [p, ...prev])}
                      />
                    </div>
                  ))
              }
            </div>
          )}

          {/* Portfolio tab (pro users only) */}
          {tab === 'portfolio' && (
            <div>
              {isOwn && (
                <div className="mb-4">
                  <input ref={portfolioRef} type="file" accept="image/*" className="hidden" onChange={handlePortfolioUpload} />
                  <button onClick={() => portfolioRef.current?.click()} disabled={portfolioUploading}
                    className="btn-secondary flex items-center gap-2 text-sm w-full justify-center">
                    {portfolioUploading ? <Spinner size="sm" /> : <PlusCircle className="h-4 w-4" />}
                    {portfolioUploading ? 'Yükleniyor...' : 'Fotoğraf Ekle'}
                  </button>
                </div>
              )}
              {portfolio.length === 0 ? (
                <EmptyState icon={ImageIcon} title="Portföy boş"
                  description={isOwn ? 'Geçmiş işlerinden fotoğraf ekle' : 'Bu usta henüz portföy eklememiş'} />
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {portfolio.map(item => (
                    <div key={item.id} className="relative group rounded-xl overflow-hidden aspect-square border border-zinc-800">
                      <img src={item.image_url} alt="" className="w-full h-full object-cover" />
                      {item.caption && (
                        <div className="absolute bottom-0 inset-x-0 bg-black/60 px-2 py-1 text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity line-clamp-2">
                          {item.caption}
                        </div>
                      )}
                      {isOwn && (
                        <button onClick={() => handlePortfolioDelete(item.id)}
                          className="absolute top-2 right-2 p-1 bg-black/60 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500/80">
                          <Trash2 className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Listings tab (owners only) */}
          {tab === 'listings' && (
            <div className="space-y-3">
              {listings.length === 0
                ? <EmptyState icon={Car} title="Henüz ilan yok" />
                : listings.map(l => (
                    <Link key={l.id} to={`/listings/${l.id}`}
                      className="card flex items-center justify-between hover:border-zinc-700 transition-colors">
                      <div>
                        <div className="font-medium text-white">{l.brand} {l.model}</div>
                        {l.description && <div className="text-xs text-zinc-500 mt-0.5 line-clamp-1">{l.description}</div>}
                      </div>
                      <span className="text-xs text-zinc-600">{new Date(l.created_at).toLocaleDateString('tr-TR')}</span>
                    </Link>
                  ))
              }
            </div>
          )}

          {/* Reviews tab (pro only - visible to everyone) */}
          {tab === 'reviews' && isPro && (
            <div>
              {ratings.length === 0 ? (
                <EmptyState icon={Star} title="Henüz değerlendirme yok"
                  description="Bu uzman henüz değerlendirilmemiş" />
              ) : (
                <>
                  {/* Summary */}
                  <div className="card mb-4 flex items-center gap-5">
                    <div className="text-center shrink-0">
                      <div className="text-4xl font-black text-white leading-none">{avgRating}</div>
                      <div className="flex items-center justify-center gap-0.5 my-1.5">
                        {[1,2,3,4,5].map(s => (
                          <Star key={s} className={`h-3.5 w-3.5 ${s <= Math.round(avgRating) ? 'fill-yellow-400 text-yellow-400' : 'fill-zinc-700 text-zinc-700'}`} />
                        ))}
                      </div>
                      <div className="text-xs text-zinc-500">{ratingCount} yorum</div>
                    </div>
                    <div className="flex-1 space-y-1.5">
                      {[5,4,3,2,1].map(star => {
                        const count = ratings.filter(r => r.rating === star).length
                        const pct   = ratingCount > 0 ? (count / ratingCount) * 100 : 0
                        return (
                          <div key={star} className="flex items-center gap-2">
                            <span className="text-xs text-zinc-500 w-2 shrink-0">{star}</span>
                            <Star className="h-2.5 w-2.5 fill-zinc-700 text-zinc-700 shrink-0" />
                            <div className="flex-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                              <div className="h-full bg-yellow-400 rounded-full transition-all" style={{ width: `${pct}%` }} />
                            </div>
                            <span className="text-xs text-zinc-600 w-4 text-right shrink-0">{count}</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                  {/* Individual reviews */}
                  <div className="space-y-3">
                    {ratings.map(r => (
                      <div key={r.id} className="card">
                        <div className="flex items-start gap-3">
                          <UserAvatar profile={r.reviewer} size="sm" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2 flex-wrap">
                              <Link to={`/profile/${r.owner_id}`}
                                className="text-sm font-medium text-zinc-200 hover:text-brand-400 transition-colors">
                                {r.reviewer?.full_name || 'Kullanıcı'}
                              </Link>
                              <span className="text-xs text-zinc-600 shrink-0">
                                {new Date(r.created_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' })}
                              </span>
                            </div>
                            <div className="flex items-center gap-0.5 mt-1">
                              {[1,2,3,4,5].map(s => (
                                <Star key={s} className={`h-3 w-3 ${s <= r.rating ? 'fill-yellow-400 text-yellow-400' : 'fill-zinc-700 text-zinc-700'}`} />
                              ))}
                            </div>
                            {r.comment && (
                              <p className="text-sm text-zinc-400 mt-2 leading-relaxed">{r.comment}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Garage tab (owners only) */}
          {tab === 'garage' && (
            <div>
              {vehicles.length === 0 ? (
                <EmptyState icon={Car} title="Garaj boş" description={isOwn ? 'Araçlarını eklemek için Garajım sayfasına git' : 'Bu kullanıcının garajında araç yok'} />
              ) : (
                <div className="grid sm:grid-cols-2 gap-4">
                  {vehicles.map(v => (
                    <VehicleCard key={v.id} vehicle={v} isOwn={false} />
                  ))}
                </div>
              )}
              {isOwn && (
                <div className="mt-4 text-center">
                  <Link to="/garage" className="btn-secondary text-sm inline-flex items-center gap-2">
                    <Car className="h-4 w-4" /> Garajı Yönet
                  </Link>
                </div>
              )}
            </div>
          )}
      </>

      <style>{`
        @media (max-width: 640px) {
          .owner-profile-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      {followModal && (
        <FollowListModal userId={id} type={followModal} onClose={() => setFollowModal(null)} />
      )}

      {showReport && (
        <ReportModal
          targetType="user"
          targetId={id}
          reportedUserId={id}
          onClose={() => setShowReport(false)}
        />
      )}
      {showRating && (
        <RatingModal
          pro={profile}
          onClose={() => setShowRating(false)}
          onRated={fetchRatings}
        />
      )}
    </div>
  )
}

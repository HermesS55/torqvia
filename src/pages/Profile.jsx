import { useEffect, useRef, useState } from 'react'
import { useParams, Link, Navigate } from 'react-router-dom'
import {
  Car, Wrench, Store, Globe, Phone, Edit2, Camera,
  MessageCircle, Star, FileText, Flag, ShieldOff, Zap, Ban,
  Image as ImageIcon, PlusCircle, Trash2, UserCheck, UserX,
  MapPin, Clock, Banknote, CheckCircle, X,
} from 'lucide-react'
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
import ReportModal from '../components/ui/ReportModal'
import RatingModal from '../components/ui/RatingModal'
import { VehicleCard } from './Garage'
import toast from 'react-hot-toast'

/* ─── Particle canvas ─── */
function ParticleCanvas({ rgb1 = '255,107,0', rgb2 = null }) {
  const ref = useRef(null)
  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let raf
    const setSize = () => { canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight }
    setSize()
    const N = 55
    const pts = Array.from({ length: N }, (_, i) => ({
      x: Math.random() * canvas.width, y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.4, vy: (Math.random() - 0.5) * 0.4,
      rgb: rgb2 && i % 3 === 0 ? rgb2 : rgb1,
    }))
    function frame() {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      for (let i = 0; i < N; i++) {
        const p = pts[i]
        p.x += p.vx; p.y += p.vy
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1
        ctx.beginPath(); ctx.arc(p.x, p.y, 1.6, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(${p.rgb},0.85)`
        ctx.shadowColor = `rgb(${p.rgb})`; ctx.shadowBlur = 6
        ctx.fill(); ctx.shadowBlur = 0
        for (let j = i + 1; j < N; j++) {
          const q = pts[j]; const d = Math.hypot(p.x - q.x, p.y - q.y)
          if (d < 115) {
            ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y)
            ctx.strokeStyle = `rgba(${p.rgb},${(1 - d / 115) * 0.28})`; ctx.lineWidth = 0.65; ctx.stroke()
          }
        }
      }
      raf = requestAnimationFrame(frame)
    }
    frame()
    const ro = new ResizeObserver(setSize); ro.observe(canvas)
    return () => { cancelAnimationFrame(raf); ro.disconnect() }
  }, [rgb1, rgb2])
  return <canvas ref={ref} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block' }} />
}

/* ─── Plain avatar (free plan) ─── */
function PlainAvatar({ profile: p }) {
  return (
    <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <div style={{ width: 88, height: 88, borderRadius: '50%', overflow: 'hidden', border: '2px solid #1e1e1e', boxShadow: '0 4px 24px rgba(0,0,0,0.5)' }}>
        <UserAvatar profile={p} fill />
      </div>
    </div>
  )
}

/* ─── Avatar with spinning rings (turbo / elite) ─── */
function TurboAvatar({ profile: p, accent, accentLight, rgb, rgb2 = null, label, badgeClass }) {
  const outerRing = rgb2
    ? `conic-gradient(from 0deg, rgba(${rgb},0.6), transparent 30%, rgba(${rgb2},0.5), transparent 65%, rgba(${rgb},0.6))`
    : `conic-gradient(from 0deg, rgba(${rgb},0.6), transparent 35%, rgba(${rgb},0.45), transparent 70%, rgba(${rgb},0.6))`
  const innerRing = rgb2
    ? `conic-gradient(from 60deg, ${accent}, rgba(${rgb},0.05), ${accentLight}, rgba(${rgb2},0.4), ${accent})`
    : `conic-gradient(from 60deg, ${accent}, rgba(${rgb},0.07), ${accentLight}, rgba(${rgb},0.09), ${accent})`
  return (
    <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <div className="pp-pulse-ring" style={{ position: 'absolute', width: 124, height: 124, borderRadius: '50%', border: `1.5px solid rgba(${rgb},0.2)` }} />
      <div className="pp-spin-ccw" style={{
        position: 'absolute', width: 110, height: 110, borderRadius: '50%', background: outerRing,
        maskImage: 'radial-gradient(farthest-side at 50% 50%, transparent calc(100% - 2.5px), black 100%)',
        WebkitMaskImage: 'radial-gradient(farthest-side at 50% 50%, transparent calc(100% - 2.5px), black 100%)',
      }} />
      <div className="pp-spin-cw" style={{
        position: 'absolute', width: 98, height: 98, borderRadius: '50%', background: innerRing,
        maskImage: 'radial-gradient(farthest-side at 50% 50%, transparent calc(100% - 2.5px), black 100%)',
        WebkitMaskImage: 'radial-gradient(farthest-side at 50% 50%, transparent calc(100% - 2.5px), black 100%)',
      }} />
      <div style={{ position: 'relative', width: 88, height: 88, borderRadius: '50%', overflow: 'hidden', border: '2.5px solid #080808', zIndex: 2, boxShadow: `0 0 0 1px rgba(${rgb},0.15)` }}>
        <UserAvatar profile={p} fill />
      </div>
      <div className={badgeClass} style={{
        position: 'absolute', bottom: -16, left: '50%', transform: 'translateX(-50%)',
        display: 'inline-flex', alignItems: 'center', gap: 4,
        padding: '3px 11px', borderRadius: 99,
        background: `linear-gradient(135deg, ${accent}, ${accentLight})`,
        color: '#fff', fontSize: 10, fontWeight: 900, letterSpacing: '0.12em',
        whiteSpace: 'nowrap', zIndex: 3,
        boxShadow: `0 0 14px rgba(${rgb},0.75), 0 0 32px rgba(${rgb},0.3)`,
      }}>
        <Zap size={9} fill="#fff" /> {label}
      </div>
    </div>
  )
}

/* ─── Stars ─── */
function Stars({ value, size = 12 }) {
  return (
    <span style={{ display: 'inline-flex', gap: 2 }}>
      {[1, 2, 3, 4, 5].map(s => (
        <Star key={s} size={size} style={{ color: s <= Math.round(value) ? '#f59e0b' : '#222' }} fill={s <= Math.round(value) ? '#f59e0b' : 'none'} />
      ))}
    </span>
  )
}

/* ─── 3-dot action menu (for non-own profiles) ─── */
function ProfileActions({ onReport, onBlock, isBlocked }) {
  const [open, setOpen] = useState(false)
  return (
    <div style={{ position: 'relative' }}>
      <button onClick={() => setOpen(v => !v)} style={{
        padding: '7px 10px', borderRadius: 9, background: 'transparent',
        border: '1px solid #1e1e1e', color: '#555', cursor: 'pointer',
        display: 'flex', alignItems: 'center',
      }}>
        <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01" />
        </svg>
      </button>
      {open && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 10 }} onClick={() => setOpen(false)} />
          <div style={{
            position: 'absolute', right: 0, top: '100%', marginTop: 4,
            width: 176, background: '#111', border: '1px solid #1e1e1e',
            borderRadius: 12, boxShadow: '0 8px 24px rgba(0,0,0,0.6)', zIndex: 20, overflow: 'hidden',
          }}>
            <button onClick={() => { onReport(); setOpen(false) }} style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 14px', fontSize: 13, color: '#aaa', background: 'transparent',
              border: 'none', cursor: 'pointer', textAlign: 'left',
            }}
              onMouseOver={e => e.currentTarget.style.background = '#1a1a1a'}
              onMouseOut={e => e.currentTarget.style.background = 'transparent'}
            >
              <Flag size={13} /> Şikayet Et
            </button>
            <div style={{ height: 1, background: '#1e1e1e' }} />
            <button onClick={() => { onBlock(); setOpen(false) }} style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 14px', fontSize: 13, color: '#f87171', background: 'transparent',
              border: 'none', cursor: 'pointer', textAlign: 'left',
            }}
              onMouseOver={e => e.currentTarget.style.background = 'rgba(239,68,68,0.06)'}
              onMouseOut={e => e.currentTarget.style.background = 'transparent'}
            >
              <ShieldOff size={13} /> {isBlocked ? 'Engeli Kaldır' : 'Engelle'}
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
  const shopPhotoRef = useRef()
  const [shopPhotoUploading, setShopPhotoUploading] = useState(false)
  const [photoSrc, setPhotoSrc] = useState(null)

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
        .select(`*, profiles!posts_user_id_fkey(id, avatar_url, full_name, role, specialty, plan), post_tags(tagged_user_id, profiles!post_tags_tagged_user_id_fkey(id, full_name)), post_likes(user_id), post_comments(count)`)
        .eq('user_id', id).order('created_at', { ascending: false }),
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

  async function handleShopPhotoUpload(e) {
    const file = e.target.files[0]
    if (!file) return
    try { await validateImageFile(file, 5 * 1024 * 1024) }
    catch (err) { toast.error(err.message); e.target.value = ''; return }
    setShopPhotoUploading(true)
    try {
      const ext = file.name.split('.').pop()
      const path = `shop-photos/${user.id}/${Date.now()}.${ext}`
      const { error: upErr } = await supabase.storage.from('post-images').upload(path, file, { upsert: true })
      if (upErr) throw upErr
      const { data: { publicUrl } } = supabase.storage.from('post-images').getPublicUrl(path)
      await supabase.from('profiles').update({ shop_photo: publicUrl }).eq('id', user.id)
      setProfile(p => ({ ...p, shop_photo: publicUrl }))
      toast.success('Dükkan fotoğrafı güncellendi!')
    } catch { toast.error('Yüklenemedi') }
    finally { setShopPhotoUploading(false); e.target.value = '' }
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
    setEditForm(f => ({ ...f, skills: f.skills.includes(skill) ? f.skills.filter(s => s !== skill) : [...f.skills, skill] }))
  }

  function toggleSpecialty(s) {
    setEditForm(f => ({ ...f, specialties: f.specialties.includes(s) ? f.specialties.filter(x => x !== s) : [...f.specialties, s] }))
  }

  /* ─── Loading / not found ─── */
  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}>
      <Spinner size="lg" />
    </div>
  )
  if (!profile) return <div style={{ textAlign: 'center', padding: '80px 0', color: '#555' }}>Kullanıcı bulunamadı</div>
  if (!isOwn && profile.role === 'pro') return <Navigate to={`/usta/${id}`} replace />

  /* ─── Derived plan values ─── */
  const planValue = profile.plan || profile.membership_type || 'free'
  const isTurbo = planValue === 'turbo'
  const isElite = planValue === 'elite'
  const hasPlan = isTurbo || isElite
  const planAccent      = isElite ? '#8b5cf6' : '#ff6b00'
  const planAccentLight = isElite ? '#a78bfa' : '#ff8c33'
  const planRgb         = isElite ? '139,92,246' : '255,107,0'
  const planRgb2        = isElite ? '196,160,0' : null
  const planLabel       = isElite ? '⚡ ELİTE ÜYE' : '⚡ TURBO ÜYE'
  const badgeAnimClass  = isElite ? 'pp-badge-elite-glow' : 'pp-badge-glow'

  const satisfactionPct = ratings.length > 0
    ? Math.round((ratings.filter(r => r.rating >= 4).length / ratings.length) * 100)
    : null
  const locationText = [profile.city, profile.location].filter(Boolean).join(' / ')
  const specialties = profile.specialties?.length ? profile.specialties : profile.specialty ? [profile.specialty] : []

  /* ─── Blocked by them ─── */
  if (isBlockedByThem && !isOwn) {
    return (
      <div style={{ maxWidth: 640, margin: '0 auto', padding: '80px 20px', textAlign: 'center' }}>
        <Ban size={40} style={{ color: '#222', margin: '0 auto 12px' }} />
        <p style={{ fontSize: 16, fontWeight: 600, color: '#f0f0f0', marginBottom: 6 }}>Bu içerik kullanılamıyor</p>
        <p style={{ fontSize: 14, color: '#444' }}>Bu profili görüntüleme iznin yok.</p>
      </div>
    )
  }

  /* ─── Panel helper ─── */
  const Panel = ({ label, children, style: s = {} }) => (
    <div style={{
      background: 'linear-gradient(160deg, #0d0d0d 0%, #0b0b0b 100%)',
      border: '1px solid #141414', borderRadius: 16, padding: '22px 24px', ...s,
    }}>
      {label && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
          <span style={{ fontFamily: 'monospace', fontSize: 9, color: '#444', textTransform: 'uppercase', letterSpacing: '0.22em' }}>{label}</span>
          <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, #1a1a1a, transparent)' }} />
        </div>
      )}
      {children}
    </div>
  )

  /* ═══════════════════════════ RENDER ═══════════════════════════ */
  return (
    <div className="pp-outer" style={{ maxWidth: 980, margin: '0 auto', padding: '0 20px 80px' }}>

      {/* ══ HERO ══ */}
      <div style={{
        position: 'relative', borderRadius: 22, overflow: 'hidden',
        marginTop: 22, marginBottom: 14,
        border: `1px solid ${hasPlan ? `rgba(${planRgb},0.2)` : '#141414'}`,
        boxShadow: hasPlan ? `0 0 100px rgba(${planRgb},0.07), 0 4px 40px rgba(0,0,0,0.6)` : '0 4px 40px rgba(0,0,0,0.5)',
      }}>

        {/* Background */}
        <div style={{ position: 'absolute', inset: 0, background: '#080808' }}>
          {hasPlan && <ParticleCanvas rgb1={planRgb} rgb2={planRgb2} />}
        </div>

        {/* Shimmer (paid only) */}
        {hasPlan && (
          <div className="pp-shimmer" style={{
            position: 'absolute', inset: 0, pointerEvents: 'none',
            background: 'linear-gradient(108deg, transparent 30%, rgba(255,255,255,0.022) 50%, transparent 70%)',
            backgroundSize: '220% 100%',
          }} />
        )}

        {/* Bottom fade */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: 'linear-gradient(to bottom, rgba(8,8,8,0) 0%, rgba(8,8,8,0.45) 55%, rgba(8,8,8,0.92) 100%)',
        }} />

        {/* Top border accent (paid only) */}
        {hasPlan && (
          <div className="pp-shimmer" style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: 2, pointerEvents: 'none',
            background: `linear-gradient(90deg, transparent 0%, ${planAccent} 38%, ${planAccentLight} 62%, transparent 100%)`,
            backgroundSize: '220% auto',
          }} />
        )}

        {/* Hero content */}
        <div className="pp-hero-content" style={{ position: 'relative', zIndex: 2, padding: '48px 40px' }}>
          <div className="pp-hero-inner" style={{ display: 'flex', alignItems: 'flex-start', gap: 36 }}>

            {/* Avatar + camera */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0, marginTop: 4, paddingBottom: hasPlan ? 22 : 0 }}>
              <div
                style={{ position: 'relative', cursor: profile.avatar_url ? 'zoom-in' : 'default' }}
                onClick={() => profile.avatar_url && !isOwn && setPhotoSrc(profile.avatar_url)}
                title={profile.avatar_url && !isOwn ? 'Fotoğrafı büyüt' : undefined}
              >
                {hasPlan
                  ? <TurboAvatar profile={profile} accent={planAccent} accentLight={planAccentLight} rgb={planRgb} rgb2={planRgb2} label={planLabel} badgeClass={badgeAnimClass} />
                  : <PlainAvatar profile={profile} />
                }
                {isOwn && (
                  <>
                    <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarUpload} />
                    <button
                      onClick={() => fileRef.current?.click()}
                      disabled={avatarUploading}
                      style={{
                        position: 'absolute', bottom: 2, right: -10, zIndex: 20,
                        width: 28, height: 28, borderRadius: '50%',
                        background: '#1a1a1a', border: '2px solid #080808',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: avatarUploading ? 'not-allowed' : 'pointer', color: '#aaa',
                      }}
                    >
                      {avatarUploading ? <Spinner size="sm" /> : <Camera size={12} />}
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Info */}
            <div style={{ flex: 1, minWidth: 0 }}>

              {/* Name + plan badge + action menu */}
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, marginBottom: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                  <h1 style={{ fontSize: 28, fontWeight: 900, color: '#f0f0f0', letterSpacing: '-0.025em', lineHeight: 1.1, margin: 0 }}>
                    {profile.full_name || 'İsimsiz Kullanıcı'}
                  </h1>
                  {hasPlan && (
                    <span className={badgeAnimClass} style={{
                      display: 'inline-flex', alignItems: 'center', gap: 5,
                      padding: '4px 13px', borderRadius: 99,
                      background: `rgba(${planRgb},0.1)`, border: `1px solid rgba(${planRgb},0.3)`,
                      color: planAccent, fontSize: 11, fontWeight: 800, letterSpacing: '0.08em',
                    }}>
                      <Zap size={11} fill={planAccent} /> {planLabel}
                    </span>
                  )}
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: 5,
                    padding: '4px 12px', borderRadius: 99,
                    background: isPro ? 'rgba(59,130,246,0.07)' : 'rgba(255,107,0,0.07)',
                    border: isPro ? '1px solid rgba(59,130,246,0.18)' : '1px solid rgba(255,107,0,0.18)',
                    color: isPro ? '#60a5fa' : '#ff8c33', fontSize: 11, fontWeight: 700,
                  }}>
                    {isPro ? <Wrench size={10} strokeWidth={2.5} /> : <Car size={10} strokeWidth={2.5} />}
                    {isPro ? 'Servis Uzmanı' : 'Araç Sahibi'}
                  </span>
                </div>
                {!isOwn && (
                  <ProfileActions onReport={() => setShowReport(true)} onBlock={handleBlock} isBlocked={isBlocked} />
                )}
              </div>

              {/* Shop + city */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 18, marginBottom: 16 }}>
                {profile.shop_name && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, color: '#777' }}>
                    <Store size={13} style={{ color: '#444', flexShrink: 0 }} /> {profile.shop_name}
                  </span>
                )}
                {locationText && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 14, color: '#777' }}>
                    <MapPin size={13} style={{ color: '#444', flexShrink: 0 }} /> {locationText}
                  </span>
                )}
                {profile.website && (
                  <a href={profile.website} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 14, color: '#555', textDecoration: 'none' }}>
                    <Globe size={13} style={{ color: '#444', flexShrink: 0 }} /> {profile.website.replace(/https?:\/\//, '')}
                  </a>
                )}
              </div>

              {/* Meta row */}
              {isPro && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 18 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 14px', borderRadius: 10, background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.12)' }}>
                    <Stars value={avgRating || 0} size={12} />
                    <span style={{ fontSize: 14, fontWeight: 800, color: '#f0f0f0' }}>{avgRating ?? '—'}</span>
                    {ratings.length > 0 && <span style={{ fontSize: 11, color: '#444' }}>({ratings.length})</span>}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '7px 14px', borderRadius: 10, background: 'rgba(34,197,94,0.05)', border: '1px solid rgba(34,197,94,0.1)', fontSize: 13 }}>
                    <CheckCircle size={13} style={{ color: '#22c55e' }} />
                    <span style={{ fontWeight: 700, color: '#f0f0f0' }}>{ratings.length}</span>
                    <span style={{ color: '#444' }}>tamamlanan</span>
                  </div>
                  {profile.price_range && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '7px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.02)', border: '1px solid #1e1e1e', fontSize: 13 }}>
                      <Banknote size={13} style={{ color: '#444' }} />
                      <span style={{ color: '#777' }}>{profile.price_range}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Specialty chips */}
              {specialties.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginBottom: 24 }}>
                  {specialties.map(s => (
                    <span key={s} style={{ padding: '5px 14px', borderRadius: 99, fontSize: 12, fontWeight: 500, background: '#111', border: '1px solid #1e1e1e', color: '#777', letterSpacing: '0.01em' }}>
                      {s}
                    </span>
                  ))}
                </div>
              )}

              {/* Bio */}
              {profile.bio && (
                <p style={{ fontSize: 14, color: '#555', lineHeight: 1.7, marginBottom: 20 }}>{profile.bio}</p>
              )}

              {/* CTAs */}
              {!isBlocked && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                  {isOwn ? (
                    <button
                      onClick={() => setEditing(true)}
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: 8,
                        padding: '11px 22px', borderRadius: 11,
                        background: 'rgba(255,255,255,0.05)', border: '1px solid #2a2a2a',
                        color: '#ccc', fontWeight: 700, fontSize: 14, cursor: 'pointer',
                      }}
                      onMouseOver={e => { e.currentTarget.style.borderColor = '#3a3a3a'; e.currentTarget.style.color = '#f0f0f0' }}
                      onMouseOut={e => { e.currentTarget.style.borderColor = '#2a2a2a'; e.currentTarget.style.color = '#ccc' }}
                    >
                      <Edit2 size={14} /> Profili Düzenle
                    </button>
                  ) : (
                    <>
                      {!isBlocked && <FollowButton targetId={id} onToggle={fetchFollowCounts} />}
                      {!isBlocked && (
                        <Link to={`/messages?to=${id}`} style={{
                          display: 'inline-flex', alignItems: 'center', gap: 8,
                          padding: '11px 20px', borderRadius: 11,
                          background: 'rgba(255,255,255,0.04)', border: '1px solid #1e1e1e',
                          color: '#888', fontWeight: 600, fontSize: 14, textDecoration: 'none',
                        }}
                          onMouseOver={e => { e.currentTarget.style.borderColor = '#2a2a2a'; e.currentTarget.style.color = '#bbb' }}
                          onMouseOut={e => { e.currentTarget.style.borderColor = '#1e1e1e'; e.currentTarget.style.color = '#888' }}
                        >
                          <MessageCircle size={14} /> Mesaj Gönder
                        </Link>
                      )}
                      {isPro && myProfile?.role === 'owner' && !isBlocked && (
                        <button
                          onClick={() => setShowRating(true)}
                          style={{
                            display: 'inline-flex', alignItems: 'center', gap: 8,
                            padding: '11px 18px', borderRadius: 11,
                            background: myRating ? 'rgba(245,158,11,0.08)' : 'rgba(255,255,255,0.02)',
                            border: myRating ? '1px solid rgba(245,158,11,0.3)' : '1px solid #1a1a1a',
                            color: myRating ? '#f59e0b' : '#555', fontWeight: 600, fontSize: 14, cursor: 'pointer',
                          }}
                        >
                          <Star size={14} fill={myRating ? '#f59e0b' : 'none'} />
                          {myRating ? `${myRating}★ Değerlendirin` : 'Değerlendir'}
                        </button>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ══ SPOTLIGHT BANNER ══ */}
      {hasPlan && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '13px 20px', borderRadius: 12, marginBottom: 28,
          background: `linear-gradient(90deg, rgba(${planRgb},0.07) 0%, rgba(${planRgb},0.03) 100%)`,
          border: `1px solid rgba(${planRgb},0.12)`,
          borderLeft: `3px solid ${planAccent}`,
        }}>
          <Zap size={15} style={{ color: planAccent, flexShrink: 0 }} fill={planAccent} />
          <span style={{ fontSize: 13, color: '#777', lineHeight: 1.5 }}>
            {isElite
              ? <>Bu usta <strong style={{ color: planAccentLight, fontWeight: 700 }}>ELİTE ÜYE</strong> sayesinde arama sonuçlarında en üstte listeleniyor ve premium rozet taşıyor.</>
              : <>Bu usta <strong style={{ color: planAccentLight, fontWeight: 700 }}>TURBO ÜYE</strong> sayesinde arama sonuçlarında öncelikli listeleniyor.</>
            }
          </span>
        </div>
      )}

      {/* ══ BLOCKED BANNER ══ */}
      {isBlocked && !isOwn && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28,
          padding: '12px 18px', borderRadius: 12,
          background: 'rgba(255,255,255,0.02)', border: '1px solid #1e1e1e', fontSize: 13, color: '#555',
        }}>
          <Ban size={15} style={{ color: '#333' }} />
          Bu kullanıcıyı engellediniz.
          <button onClick={handleBlock} style={{ marginLeft: 'auto', fontSize: 12, color: '#ff6b00', background: 'none', border: 'none', cursor: 'pointer' }}>
            Engeli Kaldır
          </button>
        </div>
      )}

      {/* ══ PRO BODY ══ */}
      {isPro && (
        <div className="pp-body-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 18, alignItems: 'start' }}>

          {/* ── LEFT ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Hakkında */}
            <Panel label="// HAKKINDA">
              <div className="pp-info-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: profile.bio ? 20 : 0 }}>
                {[
                  { icon: <Wrench size={14} style={{ color: '#ff6b00' }} />, label: 'Uzmanlık', value: profile.specialty || '—' },
                  { icon: <Clock size={14} style={{ color: '#ff6b00' }} />, label: 'Çalışma Saatleri', value: profile.service_hours || '—' },
                  { icon: <Phone size={14} style={{ color: '#ff6b00' }} />, label: 'Telefon', value: profile.phone ? <a href={`tel:${profile.phone}`} style={{ color: '#ccc', textDecoration: 'none' }}>{profile.phone}</a> : '—' },
                  { icon: <Banknote size={14} style={{ color: '#ff6b00' }} />, label: 'Ortalama Fiyat', value: profile.price_range || '—' },
                ].map((item, i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'flex-start', gap: 12,
                    padding: '14px 16px', background: 'linear-gradient(135deg, #0e0e0e, #0c0c0c)',
                    border: '1px solid #181818', borderRadius: 12, transition: 'border-color 0.15s',
                  }}
                    onMouseOver={e => e.currentTarget.style.borderColor = '#222'}
                    onMouseOut={e => e.currentTarget.style.borderColor = '#181818'}
                  >
                    <div style={{ width: 32, height: 32, borderRadius: 8, flexShrink: 0, background: 'rgba(255,107,0,0.08)', border: '1px solid rgba(255,107,0,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {item.icon}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 9, color: '#333', fontFamily: 'monospace', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 5 }}>{item.label}</div>
                      <div style={{ fontSize: 13, color: '#888', fontWeight: 500, lineHeight: 1.4 }}>{item.value}</div>
                    </div>
                  </div>
                ))}
              </div>
              {profile.bio && <p style={{ fontSize: 14, color: '#5a5a5a', lineHeight: 1.75, margin: 0 }}>{profile.bio}</p>}
              {!profile.bio && !profile.specialty && !profile.service_hours && (
                <p style={{ fontSize: 13, color: '#2e2e2e', fontStyle: 'italic', margin: 0 }}>Profil açıklaması henüz eklenmemiş.</p>
              )}
            </Panel>

            {/* Portföy */}
            <Panel label="// PORTFÖY">
              {isOwn && (
                <div style={{ marginBottom: 14 }}>
                  <input ref={portfolioRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePortfolioUpload} />
                  <button
                    onClick={() => portfolioRef.current?.click()}
                    disabled={portfolioUploading}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                      padding: '10px 0', borderRadius: 10,
                      background: 'rgba(255,255,255,0.02)', border: '1px dashed #1e1e1e',
                      color: '#555', fontWeight: 600, fontSize: 13, cursor: portfolioUploading ? 'not-allowed' : 'pointer',
                    }}
                    onMouseOver={e => { if (!portfolioUploading) e.currentTarget.style.borderColor = '#2a2a2a' }}
                    onMouseOut={e => { e.currentTarget.style.borderColor = '#1e1e1e' }}
                  >
                    {portfolioUploading ? <Spinner size="sm" /> : <PlusCircle size={15} />}
                    {portfolioUploading ? 'Yükleniyor...' : 'Fotoğraf Ekle'}
                  </button>
                </div>
              )}
              {portfolio.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '24px 0' }}>
                  <div style={{ fontSize: 28, marginBottom: 8 }}>🖼️</div>
                  <p style={{ color: '#2e2e2e', fontSize: 13, margin: 0 }}>{isOwn ? 'Henüz portföy eklenmemiş.' : 'Bu usta henüz portföy eklememiş.'}</p>
                </div>
              ) : (
                <div className="pp-portfolio-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                  {portfolio.map(item => (
                    <div key={item.id} style={{ position: 'relative', borderRadius: 11, overflow: 'hidden', aspectRatio: '1', border: '1px solid #1a1a1a' }}>
                      <img src={item.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      {item.caption && (
                        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(transparent, rgba(0,0,0,0.85))', padding: '18px 8px 7px', fontSize: 11, color: '#ddd' }}>
                          {item.caption}
                        </div>
                      )}
                      {isOwn && (
                        <button
                          onClick={() => handlePortfolioDelete(item.id)}
                          style={{
                            position: 'absolute', top: 6, right: 6,
                            width: 24, height: 24, borderRadius: '50%',
                            background: 'rgba(0,0,0,0.6)', border: 'none',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: '#fff', cursor: 'pointer', opacity: 0, transition: 'opacity 0.15s',
                          }}
                          onMouseOver={e => { e.currentTarget.style.opacity = 1; e.currentTarget.style.background = 'rgba(220,38,38,0.7)' }}
                          onMouseOut={e => { e.currentTarget.style.opacity = 0; e.currentTarget.style.background = 'rgba(0,0,0,0.6)' }}
                        >
                          <Trash2 size={11} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </Panel>

            {/* Yorumlar */}
            <Panel label={`// YORUMLAR${ratings.length > 0 ? ` (${ratings.length})` : ''}`}>
              {ratings.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '24px 0' }}>
                  <div style={{ fontSize: 28, marginBottom: 8 }}>💬</div>
                  <p style={{ color: '#2e2e2e', fontSize: 13, margin: 0 }}>Henüz yorum yapılmamış.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {ratings.slice(0, 6).map(r => (
                    <div key={r.id} style={{
                      padding: '15px 17px',
                      background: 'linear-gradient(135deg, #0d0d0d, #0b0b0b)',
                      border: '1px solid #181818', borderRadius: 13, transition: 'border-color 0.15s',
                    }}
                      onMouseOver={e => e.currentTarget.style.borderColor = '#222'}
                      onMouseOut={e => e.currentTarget.style.borderColor = '#181818'}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: r.comment ? 11 : 0 }}>
                        <div style={{
                          width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                          background: 'linear-gradient(135deg, rgba(255,107,0,0.12), rgba(255,107,0,0.06))',
                          border: '1px solid rgba(255,107,0,0.14)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 14, fontWeight: 800, color: '#ff8c33',
                        }}>
                          {(r.reviewer?.full_name || 'K')[0].toUpperCase()}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                            <Link to={`/profile/${r.owner_id}`} style={{ fontSize: 13, fontWeight: 700, color: '#d0d0d0', textDecoration: 'none' }}>
                              {r.reviewer?.full_name || 'Kullanıcı'}
                            </Link>
                            <span style={{ fontSize: 10, color: '#2e2e2e', fontFamily: 'monospace' }}>
                              {new Date(r.created_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </span>
                          </div>
                          <Stars value={r.rating} size={11} />
                        </div>
                      </div>
                      {r.comment && <p style={{ fontSize: 13, color: '#555', lineHeight: 1.65, margin: 0, paddingLeft: 48 }}>{r.comment}</p>}
                    </div>
                  ))}
                </div>
              )}
            </Panel>

            {/* Posts */}
            <Panel label="// PAYLAŞIMLAR">
              {isOwn && (
                <div style={{ marginBottom: 16 }}>
                  <CreatePost onCreated={post => setPosts(prev => [{ ...post, like_count: 0, comment_count: 0, liked_by_me: false }, ...prev])} />
                </div>
              )}
              {posts.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '24px 0' }}>
                  <div style={{ fontSize: 28, marginBottom: 8 }}>📝</div>
                  <p style={{ color: '#2e2e2e', fontSize: 13, margin: 0 }}>{isOwn ? 'Henüz paylaşım yok. İlk paylaşımını yap!' : 'Bu kullanıcı henüz paylaşım yapmadı.'}</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {posts.map(post => (
                    <PostCard key={post.id} post={post} onDelete={postId => setPosts(prev => prev.filter(p => p.id !== postId))} onRepost={p => setPosts(prev => [p, ...prev])} />
                  ))}
                </div>
              )}
            </Panel>
          </div>

          {/* ── RIGHT ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* İstatistikler */}
            <Panel label="// İSTATİSTİKLER">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
                {[
                  { label: 'Puan', value: avgRating ? avgRating.toFixed(1) : '—', unit: '/ 5.0', accent: '#f59e0b' },
                  { label: 'Yorum', value: ratingCount, unit: 'adet', accent: '#22c55e' },
                  { label: 'Memnuniyet', value: satisfactionPct != null ? `%${satisfactionPct}` : '—', unit: '', accent: '#8b5cf6' },
                  { label: 'Fiyat Aralığı', value: profile.price_range || '—', unit: '', accent: '#ff6b00', small: true },
                ].map(s => (
                  <div key={s.label} style={{ padding: '14px 14px 13px', background: 'linear-gradient(135deg, #0e0e0e, #0c0c0c)', border: '1px solid #181818', borderRadius: 12 }}>
                    <div style={{ fontSize: 9, color: '#2e2e2e', fontFamily: 'monospace', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 9 }}>{s.label}</div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, overflow: 'hidden' }}>
                      <span style={{ fontSize: s.small ? 14 : 23, fontWeight: 900, color: s.accent, lineHeight: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.value}</span>
                      {s.unit && <span style={{ fontSize: 11, color: '#333' }}>{s.unit}</span>}
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[5, 4, 3, 2, 1].map(star => {
                  const count = ratings.filter(r => r.rating === star).length
                  const pct = ratings.length > 0 ? (count / ratings.length) * 100 : 0
                  return (
                    <div key={star} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 11, color: '#333', width: 8, flexShrink: 0, textAlign: 'right' }}>{star}</span>
                      <Star size={10} style={{ color: '#f59e0b', flexShrink: 0 }} fill="#f59e0b" />
                      <div style={{ flex: 1, height: 5, background: '#141414', borderRadius: 3, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${pct}%`, background: 'linear-gradient(90deg, #ff6b00, #ffb347)', borderRadius: 3, transition: 'width 0.7s ease', minWidth: pct > 0 ? 4 : 0 }} />
                      </div>
                      <span style={{ fontSize: 10, color: '#2e2e2e', width: 16, textAlign: 'right', flexShrink: 0 }}>{count}</span>
                    </div>
                  )
                })}
              </div>
            </Panel>

            {/* Çalışma saatleri */}
            {profile.service_hours && (
              <Panel label="// ÇALIŞMA SAATLERİ">
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Clock size={14} style={{ color: '#ff6b00', flexShrink: 0 }} />
                  <span style={{ fontSize: 13, color: '#666', lineHeight: 1.6 }}>{profile.service_hours}</span>
                </div>
              </Panel>
            )}

            {/* Hızlı ulaş (non-own only) */}
            {!isOwn && !isBlocked && (
              <Panel>
                <p style={{ fontFamily: 'monospace', fontSize: 9, color: '#333', textTransform: 'uppercase', letterSpacing: '0.22em', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                  // HIZLI ULAŞ <span style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, #1a1a1a, transparent)', display: 'inline-block' }} />
                </p>
                {profile.phone && (
                  <a href={`tel:${profile.phone}`} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9,
                    padding: '13px 0', borderRadius: 11, marginBottom: 10,
                    background: 'linear-gradient(135deg, #ff6b00, #ff7d1a)',
                    color: '#fff', fontWeight: 700, fontSize: 15, textDecoration: 'none',
                    boxShadow: '0 4px 22px rgba(255,107,0,0.3)',
                  }}>
                    <Phone size={15} strokeWidth={2.5} /> {profile.phone}
                  </a>
                )}
                <Link to={`/messages?to=${id}`} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  padding: '11px 0', borderRadius: 11,
                  background: 'rgba(255,255,255,0.03)', border: '1px solid #1e1e1e',
                  color: '#666', fontWeight: 600, fontSize: 14, textDecoration: 'none',
                }}>
                  <MessageCircle size={14} /> Mesaj Gönder
                </Link>
              </Panel>
            )}
          </div>
        </div>
      )}

      {/* ══ OWNER BODY ══ */}
      {isOwner && (
        <div className="pp-body-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 18, alignItems: 'start' }}>

          {/* ── LEFT ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            <Panel label="// ARAÇLARIM">
              {vehicles.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '16px 0', color: '#2e2e2e', fontSize: 13 }}>
                  {isOwn ? <Link to="/garage" style={{ color: '#ff6b00', textDecoration: 'none' }}>Araç ekle →</Link> : 'Araç yok'}
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {vehicles.slice(0, 4).map(v => (
                    <div key={v.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: 'linear-gradient(135deg, #0e0e0e, #0c0c0c)', border: '1px solid #181818', borderRadius: 12 }}>
                      <div style={{ width: 36, height: 36, borderRadius: 8, background: 'rgba(255,107,0,0.07)', border: '1px solid rgba(255,107,0,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Car size={16} style={{ color: '#ff6b00' }} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#e0e0e0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{v.year} {v.brand} {v.model}</div>
                        {v.mileage && <div style={{ fontSize: 11, color: '#444', marginTop: 2 }}>{v.mileage?.toLocaleString('tr-TR')} km</div>}
                      </div>
                      <span style={{ fontSize: 10, padding: '3px 8px', borderRadius: 99, background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', color: '#22c55e', whiteSpace: 'nowrap' }}>Aktif</span>
                    </div>
                  ))}
                  {isOwn && (
                    <Link to="/garage" style={{ fontSize: 12, color: '#ff6b00', textDecoration: 'none', textAlign: 'center', padding: '8px 0' }}>Garajı Yönet →</Link>
                  )}
                </div>
              )}
            </Panel>

            <Panel label="// SON İLANLAR">
              {listings.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '16px 0', color: '#2e2e2e', fontSize: 13 }}>İlan yok</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {listings.slice(0, 5).map(l => (
                    <Link key={l.id} to={`/listings/${l.id}`} style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '11px 14px', background: 'linear-gradient(135deg, #0e0e0e, #0c0c0c)',
                      border: '1px solid #181818', borderRadius: 12, textDecoration: 'none',
                    }}
                      onMouseOver={e => e.currentTarget.style.borderColor = '#222'}
                      onMouseOut={e => e.currentTarget.style.borderColor = '#181818'}
                    >
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#e0e0e0' }}>{l.brand} {l.model}</div>
                        {l.description && <div style={{ fontSize: 11, color: '#444', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 280 }}>{l.description}</div>}
                      </div>
                      <span style={{ fontSize: 11, color: '#2e2e2e', fontFamily: 'monospace', flexShrink: 0, marginLeft: 12 }}>{new Date(l.created_at).toLocaleDateString('tr-TR')}</span>
                    </Link>
                  ))}
                </div>
              )}
            </Panel>

            <Panel label="// PAYLAŞIMLAR">
              {isOwn && (
                <div style={{ marginBottom: 16 }}>
                  <CreatePost onCreated={post => setPosts(prev => [{ ...post, like_count: 0, comment_count: 0, liked_by_me: false }, ...prev])} />
                </div>
              )}
              {posts.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '24px 0' }}>
                  <div style={{ fontSize: 28, marginBottom: 8 }}>📝</div>
                  <p style={{ color: '#2e2e2e', fontSize: 13, margin: 0 }}>{isOwn ? 'Henüz paylaşım yok. İlk paylaşımını yap!' : 'Bu kullanıcı henüz paylaşım yapmadı.'}</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {posts.map(post => (
                    <PostCard key={post.id} post={post} onDelete={postId => setPosts(prev => prev.filter(p => p.id !== postId))} onRepost={p => setPosts(prev => [p, ...prev])} />
                  ))}
                </div>
              )}
            </Panel>
          </div>

          {/* ── RIGHT ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Panel label="// ÖZET">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {[
                  { label: 'Araç', value: vehicles.length },
                  { label: 'İlan', value: listings.length },
                  { label: 'Plan', value: planValue === 'elite' ? 'ELITE' : planValue === 'turbo' ? 'TURBO' : 'FREE' },
                  { label: 'Üye', value: profile.created_at ? new Date(profile.created_at).getFullYear() : '—' },
                ].map(item => (
                  <div key={item.label} style={{ padding: '12px 14px', background: 'linear-gradient(135deg, #0e0e0e, #0c0c0c)', border: '1px solid #181818', borderRadius: 10 }}>
                    <div style={{ fontSize: 9, color: '#333', marginBottom: 4, fontFamily: 'monospace', letterSpacing: '0.1em', textTransform: 'uppercase' }}>{item.label}</div>
                    <div style={{ fontSize: 20, fontWeight: 900, color: '#f0f0f0' }}>{item.value}</div>
                  </div>
                ))}
              </div>
            </Panel>

            {!isOwn && !isBlocked && (
              <Panel>
                <p style={{ fontFamily: 'monospace', fontSize: 9, color: '#333', textTransform: 'uppercase', letterSpacing: '0.22em', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                  // HIZLI ULAŞ <span style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, #1a1a1a, transparent)', display: 'inline-block' }} />
                </p>
                <Link to={`/messages?to=${id}`} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  padding: '12px 0', borderRadius: 11,
                  background: 'linear-gradient(135deg, #ff6b00, #ff7d1a)',
                  color: '#fff', fontWeight: 700, fontSize: 14, textDecoration: 'none',
                  boxShadow: '0 4px 22px rgba(255,107,0,0.3)',
                }}>
                  <MessageCircle size={14} /> Mesaj Gönder
                </Link>
              </Panel>
            )}
          </div>
        </div>
      )}

      {/* ══ EDIT MODAL ══ */}
      {editing && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}>
          <div style={{ width: '100%', maxWidth: 520, background: '#0e0e0e', border: '1px solid #1e1e1e', borderRadius: 20, overflow: 'hidden', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: '1px solid #141414' }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: '#f0f0f0', margin: 0 }}>Profili Düzenle</h2>
              <button onClick={() => setEditing(false)} style={{ padding: '4px 8px', borderRadius: 8, background: 'rgba(255,255,255,0.04)', border: '1px solid #1e1e1e', color: '#555', cursor: 'pointer', fontSize: 14 }}>✕</button>
            </div>
            <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#888', marginBottom: 6 }}>Ad Soyad</label>
                <input value={editForm.full_name} onChange={e => setEditForm(f => ({ ...f, full_name: e.target.value }))} placeholder="Adın ve soyadın" className="input-base" />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#888', marginBottom: 6 }}>Hakkında</label>
                <textarea value={editForm.bio} onChange={e => setEditForm(f => ({ ...f, bio: e.target.value }))} placeholder={isPro ? 'Deneyimini, uzmanlık alanını anlat...' : 'Kendini kısaca tanıt...'} rows={3} maxLength={300} className="input-base" style={{ resize: 'none' }} />
              </div>
              {isPro && (
                <>
                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#888', marginBottom: 6 }}>Dükkan Fotoğrafı</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      {profile?.shop_photo
                        ? <img src={profile.shop_photo} alt="Dükkan" style={{ width: 80, height: 56, borderRadius: 8, objectFit: 'cover', border: '1px solid #1e1e1e' }} />
                        : <div style={{ width: 80, height: 56, borderRadius: 8, background: '#111', border: '1px solid #1e1e1e', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#333', fontSize: 11 }}>Yok</div>
                      }
                      <div>
                        <button type="button" onClick={() => shopPhotoRef.current?.click()} disabled={shopPhotoUploading} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
                          {shopPhotoUploading ? <Spinner size="sm" /> : <Camera size={13} />}
                          {profile?.shop_photo ? 'Değiştir' : 'Yükle'}
                        </button>
                        <p style={{ fontSize: 10, color: '#333', marginTop: 4 }}>Maks. 5MB · JPG/PNG/WEBP</p>
                      </div>
                      <input ref={shopPhotoRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleShopPhotoUpload} />
                    </div>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#888', marginBottom: 6 }}>Dükkan Adı</label>
                    <input value={editForm.shop_name} onChange={e => setEditForm(f => ({ ...f, shop_name: e.target.value }))} placeholder="Örn: Ahmet Oto" className="input-base" />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#888', marginBottom: 6 }}>Şehir / İlçe</label>
                    <input value={editForm.city} onChange={e => setEditForm(f => ({ ...f, city: e.target.value }))} placeholder="Örn: Samsun / Atakum" className="input-base" />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#888', marginBottom: 6 }}>Uzmanlık Alanları</label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {SPECIALTIES_OPTIONS.map(s => (
                        <button key={s} type="button" onClick={() => toggleSpecialty(s)} style={{
                          fontSize: 12, padding: '6px 14px', borderRadius: 99, border: '1px solid', cursor: 'pointer',
                          background: editForm.specialties.includes(s) ? 'rgba(59,130,246,0.15)' : '#0e0e0e',
                          borderColor: editForm.specialties.includes(s) ? 'rgba(59,130,246,0.4)' : '#1e1e1e',
                          color: editForm.specialties.includes(s) ? '#60a5fa' : '#555',
                        }}>{s}</button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#888', marginBottom: 6 }}>Uzmanlık Alanı</label>
                    <input value={editForm.specialty} onChange={e => setEditForm(f => ({ ...f, specialty: e.target.value }))} placeholder="ör. Motor Tamircisi, Kaporta Ustası..." className="input-base" />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#888', marginBottom: 6 }}>Konum</label>
                    <input value={editForm.location} onChange={e => setEditForm(f => ({ ...f, location: e.target.value }))} placeholder="ör. İstanbul / Kadıköy" className="input-base" />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#888', marginBottom: 6 }}>Servis Saatleri</label>
                      <input value={editForm.service_hours} onChange={e => setEditForm(f => ({ ...f, service_hours: e.target.value }))} placeholder="ör. Haftaiçi 09:00-18:00" className="input-base" />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#888', marginBottom: 6 }}>Fiyat Aralığı</label>
                      <input value={editForm.price_range} onChange={e => setEditForm(f => ({ ...f, price_range: e.target.value }))} placeholder="ör. ₺200-₺500/saat" className="input-base" />
                    </div>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#888', marginBottom: 6 }}>Yetenekler</label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {SKILLS_OPTIONS.map(skill => (
                        <button key={skill} type="button" onClick={() => toggleSkill(skill)} style={{
                          fontSize: 12, padding: '6px 14px', borderRadius: 99, border: '1px solid', cursor: 'pointer',
                          background: editForm.skills.includes(skill) ? 'rgba(59,130,246,0.15)' : '#0e0e0e',
                          borderColor: editForm.skills.includes(skill) ? 'rgba(59,130,246,0.4)' : '#1e1e1e',
                          color: editForm.skills.includes(skill) ? '#60a5fa' : '#555',
                        }}>{skill}</button>
                      ))}
                    </div>
                  </div>
                </>
              )}
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#888', marginBottom: 6 }}>Telefon</label>
                <input value={editForm.phone} onChange={e => setEditForm(f => ({ ...f, phone: e.target.value }))} placeholder="+90 555 000 0000" className="input-base" />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#888', marginBottom: 6 }}>Website</label>
                <input value={editForm.website} onChange={e => setEditForm(f => ({ ...f, website: e.target.value }))} placeholder="https://..." className="input-base" />
              </div>
              <div style={{ display: 'flex', gap: 12, paddingTop: 8 }}>
                <button onClick={() => setEditing(false)} className="btn-secondary" style={{ flex: 1 }}>İptal</button>
                <button onClick={handleSave} disabled={saving} className="btn-primary" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  {saving ? <Spinner size="sm" /> : 'Kaydet'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══ MODALS ══ */}
      {followModal && <FollowListModal userId={id} type={followModal} onClose={() => setFollowModal(null)} />}
      {showReport && <ReportModal targetType="user" targetId={id} reportedUserId={id} onClose={() => setShowReport(false)} />}
      {showRating && <RatingModal pro={profile} onClose={() => setShowRating(false)} onRated={fetchRatings} />}

      {/* ══ PHOTO LIGHTBOX ══ */}
      {photoSrc && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.92)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'zoom-out', backdropFilter: 'blur(6px)' }}
          onClick={() => setPhotoSrc(null)}
        >
          <button onClick={() => setPhotoSrc(null)} style={{ position: 'absolute', top: 20, right: 20, width: 40, height: 40, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 1 }}>
            <X size={18} />
          </button>
          <img
            src={photoSrc}
            alt=""
            style={{ maxWidth: '90vw', maxHeight: '90vh', borderRadius: 12, objectFit: 'contain', boxShadow: '0 20px 80px rgba(0,0,0,0.8)' }}
            onClick={e => e.stopPropagation()}
          />
        </div>
      )}

      {/* ══ STYLES ══ */}
      <style>{`
        @keyframes pp-pulse-ring {
          0%, 100% { opacity: 0.4; transform: scale(1); }
          50%       { opacity: 1;   transform: scale(1.06); }
        }
        @keyframes pp-spin-ccw { from { transform: rotate(0deg); } to { transform: rotate(-360deg); } }
        @keyframes pp-spin-cw  { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes pp-badge-glow {
          0%, 100% { box-shadow: 0 0 14px rgba(255,107,0,0.7), 0 0 30px rgba(255,107,0,0.28); }
          50%       { box-shadow: 0 0 22px rgba(255,107,0,0.95), 0 0 50px rgba(255,107,0,0.45); }
        }
        @keyframes pp-badge-elite {
          0%, 100% { box-shadow: 0 0 14px rgba(139,92,246,0.7), 0 0 30px rgba(139,92,246,0.28); }
          50%       { box-shadow: 0 0 22px rgba(139,92,246,0.95), 0 0 50px rgba(139,92,246,0.45); }
        }
        @keyframes pp-shimmer {
          0%   { background-position: 200% center; }
          100% { background-position: -200% center; }
        }
        .pp-pulse-ring       { animation: pp-pulse-ring 2.4s ease-in-out infinite; }
        .pp-spin-ccw         { animation: pp-spin-ccw 6s linear infinite; }
        .pp-spin-cw          { animation: pp-spin-cw 3.5s linear infinite; }
        .pp-badge-glow       { animation: pp-badge-glow 2.2s ease-in-out infinite; }
        .pp-badge-elite-glow { animation: pp-badge-elite 2.2s ease-in-out infinite; }
        .pp-shimmer          { animation: pp-shimmer 5s linear infinite; }

        @media (max-width: 768px) {
          .pp-body-grid    { grid-template-columns: 1fr !important; }
          .pp-hero-content { padding: 32px 24px !important; }
          .pp-outer        { padding-left: 12px !important; padding-right: 12px !important; }
        }
        @media (max-width: 600px) {
          .pp-hero-inner { flex-direction: column !important; align-items: center !important; text-align: center !important; }
          .pp-hero-inner > div:first-child { margin-top: 0 !important; }
          .pp-hero-inner > div:last-child > div { justify-content: center !important; }
          .pp-hero-content { padding: 24px 16px !important; }
          .pp-outer        { padding-left: 8px !important; padding-right: 8px !important; }
          .pp-info-grid    { grid-template-columns: 1fr !important; }
          .pp-portfolio-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
      `}</style>
    </div>
  )
}

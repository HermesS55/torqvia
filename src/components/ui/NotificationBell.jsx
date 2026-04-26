import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Bell, BellOff, BellRing, Heart, MessageCircle, UserPlus, UserCheck, AtSign, X, Check, Trash2, Star } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import UserAvatar from './UserAvatar'
import toast from 'react-hot-toast'

function getPushPermission() {
  if (!('Notification' in window)) return 'unsupported'
  return Notification.permission
}

async function sendBrowserNotif(title, body) {
  if (getPushPermission() !== 'granted') return
  if ('serviceWorker' in navigator) {
    const reg = await navigator.serviceWorker.getRegistration()
    if (reg) { reg.showNotification(title, { body, icon: '/icons/icon-192.png', badge: '/icons/icon-192.png' }); return }
  }
  new Notification(title, { body, icon: '/icons/icon-192.png' })
}

const TYPE_CONFIG = {
  like:           { icon: Heart,          color: 'text-red-400',    label: 'gönderini beğendi' },
  comment:        { icon: MessageCircle,  color: 'text-blue-400',   label: 'yorum yaptı' },
  follow:         { icon: UserPlus,       color: 'text-green-400',  label: 'seni takip etti' },
  follow_request: { icon: UserPlus,       color: 'text-yellow-400', label: 'seni takip etmek istiyor' },
  follow_accepted:{ icon: UserCheck,      color: 'text-green-400',  label: 'takip isteğini kabul etti' },
  message:        { icon: MessageCircle,  color: 'text-brand-400',  label: 'mesaj gönderdi' },
  mention:        { icon: AtSign,         color: 'text-purple-400', label: 'senden bahsetti' },
  new_offer:      { icon: MessageCircle,  color: 'text-amber-400',  label: 'ilanına teklif gönderdi' },
  offer_accepted: { icon: UserCheck,      color: 'text-green-400',  label: 'teklifini kabul etti' },
  offer_rejected: { icon: UserCheck,      color: 'text-red-400',    label: 'teklifini reddetti' },
  rating:         { icon: Star,           color: 'text-yellow-400', label: 'seni değerlendirdi' },
}

export default function NotificationBell() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [notifications, setNotifications] = useState([])
  const [open, setOpen]   = useState(false)
  const [unread, setUnread] = useState(0)
  const [pushPerm, setPushPerm] = useState(getPushPermission)
  const ref = useRef()

  async function enablePush() {
    if (!('Notification' in window)) { toast.error('Tarayıcın bildirimleri desteklemiyor'); return }
    const result = await Notification.requestPermission()
    setPushPerm(result)
    if (result === 'granted') toast.success('Tarayıcı bildirimleri etkinleştirildi!')
    else toast.error('Bildirim izni reddedildi')
  }

  useEffect(() => {
    if (!user?.id) return
    fetchNotifications()
    const channel = supabase
      .channel(`notifs-${user.id}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'notifications',
        filter: `user_id=eq.${user.id}`,
      }, async payload => {
        const { data } = await supabase
          .from('notifications')
          .select('*, from_profile:profiles!notifications_from_user_id_fkey(id, full_name, avatar_url, role)')
          .eq('id', payload.new.id).single()
        if (data) {
          setNotifications(prev => [data, ...prev])
          setUnread(u => u + 1)
          const cfg = TYPE_CONFIG[data.type] || TYPE_CONFIG.like
          const who = data.from_profile?.full_name || 'Biri'
          sendBrowserNotif('Torqvia', `${who} ${cfg.label}`)
        }
      })
      .subscribe()
    return () => channel.unsubscribe()
  }, [user?.id])

  useEffect(() => {
    function handleOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [])

  async function fetchNotifications() {
    const { data } = await supabase
      .from('notifications')
      .select('*, from_profile:profiles!notifications_from_user_id_fkey(id, full_name, avatar_url, role)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(40)
    setNotifications(data || [])
    setUnread((data || []).filter(n => !n.read).length)
  }

  async function markAllRead() {
    await supabase.from('notifications').update({ read: true })
      .eq('user_id', user.id).eq('read', false)
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    setUnread(0)
  }

  async function clearAll() {
    await supabase.from('notifications').delete().eq('user_id', user.id)
    setNotifications([])
    setUnread(0)
  }

  async function markOne(id) {
    await supabase.from('notifications').update({ read: true }).eq('id', id)
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
    setUnread(u => Math.max(0, u - 1))
  }

  async function acceptFollowRequest(n) {
    const fromId = n.from_user_id
    const { error } = await supabase.from('follows').insert({
      follower_id: fromId, following_id: user.id,
    })
    if (error && error.code !== '23505') { toast.error('Kabul edilemedi'); return }
    await supabase.from('follow_requests').delete()
      .eq('from_user_id', fromId).eq('to_user_id', user.id)
    supabase.from('notifications').insert({
      user_id: fromId, type: 'follow_accepted', from_user_id: user.id,
    }).then(() => {})
    markOne(n.id)
    setNotifications(prev => prev.filter(x => x.id !== n.id))
    toast.success('Takip isteği kabul edildi')
  }

  async function rejectFollowRequest(n) {
    await supabase.from('follow_requests').delete()
      .eq('from_user_id', n.from_user_id).eq('to_user_id', user.id)
    markOne(n.id)
    setNotifications(prev => prev.filter(x => x.id !== n.id))
    toast('Takip isteği reddedildi')
  }

  const timeAgo = ts => {
    const m = Math.floor((Date.now() - new Date(ts)) / 60000)
    if (m < 1) return 'şimdi'
    if (m < 60) return `${m}d`
    const h = Math.floor(m / 60)
    if (h < 24) return `${h}s`
    return `${Math.floor(h / 24)}g`
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => { setOpen(o => !o); if (!open) fetchNotifications() }}
        className="relative p-2 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-colors"
        title="Bildirimler"
      >
        <Bell className="h-4 w-4" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[9px] font-bold rounded-full h-4 w-4 flex items-center justify-center leading-none">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden z-50">
          <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
            <h3 className="font-semibold text-white text-sm">Bildirimler</h3>
            <div className="flex items-center gap-1.5">
              {unread > 0 && (
                <button onClick={markAllRead} className="text-xs text-brand-400 hover:text-brand-300 transition-colors px-1">
                  Tümünü oku
                </button>
              )}
              {pushPerm === 'unsupported' ? null : pushPerm === 'granted' ? (
                <button title="Tarayıcı bildirimleri aktif"
                  className="p-1 rounded hover:bg-zinc-800 text-green-500 transition-colors">
                  <BellRing className="h-3.5 w-3.5" />
                </button>
              ) : (
                <button onClick={enablePush} title="Masaüstü bildirimlerini etkinleştir"
                  className="p-1 rounded hover:bg-zinc-800 text-zinc-500 hover:text-brand-400 transition-colors">
                  <BellOff className="h-3.5 w-3.5" />
                </button>
              )}
              {notifications.length > 0 && (
                <button onClick={clearAll} title="Tümünü temizle"
                  className="p-1 rounded hover:bg-zinc-800 text-zinc-600 hover:text-red-400 transition-colors">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
              <button onClick={() => setOpen(false)} className="p-1 rounded hover:bg-zinc-800">
                <X className="h-3.5 w-3.5 text-zinc-500" />
              </button>
            </div>
          </div>

          {pushPerm === 'default' && (
            <button
              onClick={enablePush}
              className="w-full flex items-center gap-3 px-4 py-2.5 bg-brand-500/10 hover:bg-brand-500/15 border-b border-brand-500/20 transition-colors text-left"
            >
              <div className="h-7 w-7 rounded-lg bg-brand-500/20 border border-brand-500/30 flex items-center justify-center shrink-0">
                <Bell className="h-3.5 w-3.5 text-brand-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-brand-400">Masaüstü bildirimlerini etkinleştir</p>
                <p className="text-[10px] text-zinc-600">Yeni bildirim geldiğinde haberdar ol</p>
              </div>
              <span className="text-[10px] text-brand-400 bg-brand-500/20 rounded-full px-2 py-0.5 shrink-0">Etkinleştir</span>
            </button>
          )}

          <div className="max-h-[420px] overflow-y-auto divide-y divide-zinc-800/50">
            {notifications.length === 0 ? (
              <div className="text-center py-10">
                <Bell className="h-8 w-8 text-zinc-700 mx-auto mb-2" />
                <p className="text-zinc-600 text-sm">Bildirim yok</p>
              </div>
            ) : (
              notifications.map(n => {
                const cfg = TYPE_CONFIG[n.type] || TYPE_CONFIG.like
                const Icon = cfg.icon
                const isReq = n.type === 'follow_request'
                const postLink = n.post_id ? `/posts/${n.post_id}` : null
                const msgLink = n.type === 'message' ? '/messages' : null
                const listingLink = n.listing_id ? `/listings/${n.listing_id}` : null
                const targetLink = postLink || listingLink || msgLink

                function handleClick() {
                  if (!isReq) {
                    markOne(n.id)
                    if (targetLink) setOpen(false)
                  }
                }

                const inner = (
                  <div className="flex items-start gap-3">
                    <div className="relative shrink-0">
                      {n.from_profile ? (
                        <button type="button" onClick={e => { e.stopPropagation(); navigate(`/profile/${n.from_profile.id}`); setOpen(false) }}>
                          <UserAvatar profile={n.from_profile} size="sm" />
                        </button>
                      ) : (
                        <div className="h-8 w-8 bg-zinc-800 rounded-full flex items-center justify-center">
                          <Bell className="h-4 w-4 text-zinc-500" />
                        </div>
                      )}
                      <span className={`absolute -bottom-0.5 -right-0.5 ${cfg.color} bg-zinc-900 rounded-full p-0.5`}>
                        <Icon className="h-2.5 w-2.5" />
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-zinc-300 leading-snug">
                        <span className="font-semibold text-white">{n.from_profile?.full_name || 'Biri'}</span>
                        {' '}{cfg.label}
                        {n.message && (
                          <span className="text-zinc-500 ml-1">
                            "{n.message.slice(0, 50)}{n.message.length > 50 ? '…' : ''}"
                          </span>
                        )}
                      </p>
                      <p className="text-[10px] text-zinc-600 mt-0.5">{timeAgo(n.created_at)}</p>

                      {isReq && (
                        <div className="flex gap-1.5 mt-2">
                          <button
                            onClick={e => { e.stopPropagation(); acceptFollowRequest(n) }}
                            className="flex items-center gap-1 text-xs bg-brand-500/20 border border-brand-500/40 text-brand-400 px-2.5 py-1 rounded-lg hover:bg-brand-500/30 transition-colors"
                          >
                            <Check className="h-3 w-3" /> Kabul Et
                          </button>
                          <button
                            onClick={e => { e.stopPropagation(); rejectFollowRequest(n) }}
                            className="flex items-center gap-1 text-xs bg-zinc-800 border border-zinc-700 text-zinc-400 px-2.5 py-1 rounded-lg hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30 transition-colors"
                          >
                            <X className="h-3 w-3" /> Reddet
                          </button>
                        </div>
                      )}
                    </div>
                    {!n.read && !isReq && <div className="h-2 w-2 bg-brand-500 rounded-full shrink-0 mt-1.5" />}
                  </div>
                )

                return targetLink ? (
                  <Link
                    key={n.id}
                    to={targetLink}
                    onClick={handleClick}
                    className={`block px-4 py-3 transition-colors cursor-pointer hover:bg-zinc-800/50 ${!n.read ? 'bg-brand-500/5 border-l-2 border-l-brand-500/40' : ''}`}
                  >
                    {inner}
                  </Link>
                ) : (
                  <div
                    key={n.id}
                    onClick={handleClick}
                    className={`px-4 py-3 transition-colors ${!isReq ? 'cursor-pointer hover:bg-zinc-800/50' : ''} ${!n.read ? 'bg-brand-500/5 border-l-2 border-l-brand-500/40' : ''}`}
                  >
                    {inner}
                  </div>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}

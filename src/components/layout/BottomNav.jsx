import { useEffect, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, List, Calendar, MessageCircle,
  Search, Newspaper, Hash, Users, MoreHorizontal,
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { useUnreadCount } from '../../contexts/UnreadMessagesContext'

export default function BottomNav() {
  const { user, profile } = useAuth()
  const { unread, markRead } = useUnreadCount()
  const { pathname } = useLocation()
  const [showMore, setShowMore] = useState(false)

  useEffect(() => { setShowMore(false) }, [pathname])

  if (!user) return null

  const isPro   = profile?.role === 'pro'
  const isOwner = profile?.role === 'owner'

  // 4 primary tabs + overflow for each role
  const config = isPro ? {
    primary: [
      { to: '/dashboard',  icon: LayoutDashboard, label: 'Panel' },
      { to: '/listings',   icon: List,            label: 'İlanlar' },
      { to: '/randevular', icon: Calendar,        label: 'Randevu' },
      { to: '/messages',   icon: MessageCircle,   label: 'Mesaj', msg: true },
    ],
    more: [
      { to: '/feed',        icon: Newspaper, label: 'Akış' },
      { to: '/communities', icon: Hash,      label: 'Topluluk' },
      { to: '/people',      icon: Users,     label: 'Kişiler' },
    ],
  } : isOwner ? {
    primary: [
      { to: '/dashboard',  icon: LayoutDashboard, label: 'Panel' },
      { to: '/listings',   icon: List,            label: 'İlanlar' },
      { to: '/randevular', icon: Calendar,        label: 'Randevu' },
      { to: '/messages',   icon: MessageCircle,   label: 'Mesaj', msg: true },
    ],
    more: [
      { to: '/feed',        icon: Newspaper, label: 'Akış' },
      { to: '/communities', icon: Hash,      label: 'Topluluk' },
      { to: '/ustalar',     icon: Search,    label: 'Usta Ara' },
      { to: '/people',      icon: Users,     label: 'Kişiler' },
    ],
  } : {
    primary: [
      { to: '/feed',        icon: Newspaper,       label: 'Akış' },
      { to: '/communities', icon: Hash,            label: 'Topluluk' },
      { to: '/people',      icon: Users,           label: 'Kişiler' },
      { to: '/ustalar',     icon: Search,          label: 'Ustalar' },
      { to: '/messages',    icon: MessageCircle,   label: 'Mesaj', msg: true },
    ],
    more: [],
  }

  const { primary, more } = config
  const moreActive = more.some(item => pathname === item.to || pathname.startsWith(item.to + '/'))

  return (
    <>
      {/* Backdrop — covers content area below nav, closes the more menu */}
      {showMore && (
        <div
          className="fixed inset-x-0 top-0 z-[39]"
          style={{ bottom: 52 }}
          onClick={() => setShowMore(false)}
        />
      )}

      {/* More menu popup */}
      {showMore && more.length > 0 && (
        <div className="fixed right-2 z-50 bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl shadow-black/60"
          style={{ bottom: 60 }}>
          {more.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => setShowMore(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors min-w-[152px] ${
                  isActive
                    ? 'text-brand-400 bg-brand-500/10'
                    : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon className={`h-4 w-4 shrink-0 ${isActive ? 'stroke-[2.2]' : ''}`} />
                  {label}
                </>
              )}
            </NavLink>
          ))}
        </div>
      )}

      {/* Bottom nav */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-zinc-950/95 backdrop-blur border-t border-zinc-800 pb-safe">
        <div className="flex items-stretch">
          {primary.map(({ to, icon: Icon, label, msg }) => (
            <NavLink
              key={to}
              to={to}
              onClick={msg ? markRead : undefined}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center gap-0.5 flex-1 min-h-[52px] py-2 text-[10px] font-medium transition-colors relative ${
                  isActive ? 'text-brand-400' : 'text-zinc-500 hover:text-zinc-300'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div className="relative">
                    <Icon className={`h-5 w-5 ${isActive ? 'stroke-[2.2]' : ''}`} />
                    {msg && unread > 0 && (
                      <span className="absolute -top-1 -right-1.5 bg-brand-500 text-white text-[8px] font-bold rounded-full h-3.5 w-3.5 flex items-center justify-center leading-none">
                        {unread > 9 ? '9+' : unread}
                      </span>
                    )}
                  </div>
                  <span>{label}</span>
                </>
              )}
            </NavLink>
          ))}

          {/* More button — only for logged-in roles */}
          {more.length > 0 && (
            <button
              onClick={() => setShowMore(s => !s)}
              className={`flex flex-col items-center justify-center gap-0.5 flex-1 min-h-[52px] py-2 text-[10px] font-medium transition-colors ${
                showMore || moreActive ? 'text-brand-400' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <MoreHorizontal className={`h-5 w-5 ${showMore || moreActive ? 'stroke-[2.2]' : ''}`} />
              <span>Daha Fazla</span>
            </button>
          )}
        </div>
      </nav>
    </>
  )
}

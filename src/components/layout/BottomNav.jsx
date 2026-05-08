import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, List, Calendar, MessageCircle,
  TrendingUp, Car, Search,
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { useUnreadCount } from '../../contexts/UnreadMessagesContext'

export default function BottomNav() {
  const { user, profile } = useAuth()
  const { unread, markRead } = useUnreadCount()
  if (!user) return null

  const isPro   = profile?.role === 'pro'
  const isOwner = profile?.role === 'owner'

  const items = isPro ? [
    { to: '/dashboard',  icon: LayoutDashboard, label: 'Panel' },
    { to: '/listings',   icon: List,            label: 'İlanlar' },
    { to: '/randevular', icon: Calendar,        label: 'Randevu' },
    { to: '/messages',   icon: MessageCircle,   label: 'Mesaj', msg: true },
    { to: '/analytics',  icon: TrendingUp,      label: 'Analitik' },
  ] : isOwner ? [
    { to: '/dashboard',  icon: LayoutDashboard, label: 'Panel' },
    { to: '/ustalar',    icon: Search,          label: 'Usta Bul' },
    { to: '/randevular', icon: Calendar,        label: 'Randevu' },
    { to: '/messages',   icon: MessageCircle,   label: 'Mesaj', msg: true },
    { to: '/garage',     icon: Car,             label: 'Garaj' },
  ] : [
    { to: '/listings',   icon: List,            label: 'İlanlar' },
    { to: '/ustalar',    icon: Search,          label: 'Ustalar' },
    { to: '/messages',   icon: MessageCircle,   label: 'Mesaj', msg: true },
  ]

  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-zinc-950/95 backdrop-blur border-t border-zinc-800 pb-safe">
      <div className="flex items-stretch">
        {items.map(({ to, icon: Icon, label, msg }) => (
          <NavLink
            key={to}
            to={to}
            onClick={msg ? markRead : undefined}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center gap-0.5 flex-1 py-2 text-[10px] font-medium transition-colors relative ${
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
      </div>
    </nav>
  )
}

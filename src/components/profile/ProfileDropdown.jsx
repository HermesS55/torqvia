import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  LogOut, LayoutDashboard,
  Phone, Mail, ChevronDown, Wrench, Car,
  User, Settings, Flame,
} from 'lucide-react'
import PlanBadge from '../ui/PlanBadge'
import { useAuth } from '../../contexts/AuthContext'
import { useT } from '../../contexts/LangContext'
import UserAvatar from '../ui/UserAvatar'
import toast from 'react-hot-toast'

export default function ProfileDropdown() {
  const { user, profile, signOut } = useAuth()
  const t = useT()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  const isOwner = profile?.role === 'owner'

  useEffect(() => {
    function onClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  async function handleSignOut() {
    setOpen(false)
    try { await signOut(); navigate('/login') }
    catch { toast.error('Çıkış yapılamadı') }
  }

  if (!user) return null

  const accentBg     = isOwner ? 'bg-brand-500/5'  : 'bg-blue-500/5'
  const accentBorder = isOwner ? 'border-brand-500/30' : 'border-blue-500/30'
  const accentText   = isOwner ? 'text-brand-400'  : 'text-blue-400'
  const accentIcon   = isOwner ? 'bg-brand-500/10' : 'bg-blue-500/10'
  const accentBadge  = isOwner ? 'bg-brand-500/10 border-brand-500/20' : 'bg-blue-500/10 border-blue-500/20'

  const navItems = [
    { to: `/profile/${user.id}`, icon: User,          label: t('dd.myProfile'),  desc: t('dd.myProfileDesc') },
    { to: '/dashboard',          icon: LayoutDashboard,label: t('dd.dashboard'), desc: isOwner ? t('dd.dashboardDescOwner') : t('dd.dashboardDescPro') },
    ...(isOwner ? [{ to: '/garage', icon: Car, label: 'Garajım', desc: 'Araçlarını yönet' }] : []),
    { to: '/pricing',            icon: Flame,          label: t('dd.plans'),      desc: t('dd.plansDesc') },
    { to: '/settings',           icon: Settings,       label: t('dd.settings'),   desc: t('dd.settingsDesc') },
  ]

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        className={`flex items-center gap-2 px-2 py-1.5 rounded-xl border transition-all ${
          open ? `${accentBg} ${accentBorder}` : 'border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800/60'
        }`}
      >
        <UserAvatar profile={profile} email={user.email} size="sm" />
        <span className="hidden sm:block text-xs text-zinc-400 max-w-[100px] truncate">
          {profile?.full_name || user.email}
        </span>
        <ChevronDown className={`h-3.5 w-3.5 text-zinc-500 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-64 z-50 rounded-2xl border border-zinc-800 bg-zinc-950 shadow-2xl shadow-black/60 overflow-hidden">

          {/* Header */}
          <div className={`px-4 py-4 border-b border-zinc-800 ${accentBg}`}>
            <div className="flex items-center gap-3">
              <UserAvatar profile={profile} email={user.email} size="lg" />
              <div className="min-w-0">
                <div className="flex items-center gap-1 mb-0.5">
                  {isOwner
                    ? <Car className="h-3 w-3 text-brand-400 shrink-0" />
                    : <Wrench className="h-3 w-3 text-blue-400 shrink-0" />
                  }
                  <span className={`text-[10px] font-semibold ${accentText}`}>
                    {isOwner ? t('profile.carOwner') : t('profile.serviceExpert')}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <p className="text-sm font-medium text-white truncate">
                    {profile?.full_name || 'İsimsiz'}
                  </p>
                  {profile?.plan && profile.plan !== 'free' && (
                    <PlanBadge plan={profile.plan} size="xs" />
                  )}
                </div>
                <div className="flex items-center gap-1 text-zinc-500 text-xs mt-0.5 truncate">
                  <Mail className="h-3 w-3 shrink-0" />
                  <span className="truncate">{user.email}</span>
                </div>
                {profile?.phone && (
                  <div className="flex items-center gap-1 text-zinc-600 text-xs mt-0.5">
                    <Phone className="h-3 w-3 shrink-0" />
                    {profile.phone}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Nav items */}
          <div className="p-2">
            {navItems.map(item => (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-zinc-800 transition-colors group"
              >
                <div className={`p-1.5 rounded-lg ${accentIcon}`}>
                  <item.icon className={`h-4 w-4 ${accentText}`} />
                </div>
                <div>
                  <div className="text-sm font-medium text-zinc-200 group-hover:text-white">{item.label}</div>
                  <div className="text-xs text-zinc-600">{item.desc}</div>
                </div>
              </Link>
            ))}
          </div>

          {/* Role badge */}
          <div className={`mx-3 mb-2 rounded-xl px-3 py-2 flex items-center gap-2 border ${accentBadge}`}>
            {isOwner
              ? <Car className="h-4 w-4 text-brand-400 shrink-0" />
              : <Wrench className="h-4 w-4 text-blue-400 shrink-0" />
            }
            <span className={`text-xs ${isOwner ? 'text-brand-300' : 'text-blue-300'}`}>
              {isOwner ? 'İlan oluşturabilir, teklifleri yönetebilirsin' : 'İlanları görüp teklif gönderebilirsin'}
            </span>
          </div>

          {/* Sign out */}
          <div className="p-2 pt-0">
            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-red-500/10 transition-colors group"
            >
              <div className="p-1.5 rounded-lg bg-zinc-800 group-hover:bg-red-500/20 transition-colors">
                <LogOut className="h-4 w-4 text-zinc-500 group-hover:text-red-400 transition-colors" />
              </div>
              <span className="text-sm font-medium text-zinc-400 group-hover:text-red-400 transition-colors">
                {t('dd.signOut')}
              </span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

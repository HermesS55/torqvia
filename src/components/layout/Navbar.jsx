import { useState, useRef, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { List, PlusCircle, MessageCircle, Users, Flame, Globe, Hash, Gauge, Search, Car, Menu, X, Shield, Calendar, Tag, ChevronDown } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { useLang, useT } from '../../contexts/LangContext'
import { useUnreadCount } from '../../contexts/UnreadMessagesContext'
import ProfileDropdown from '../profile/ProfileDropdown'
import NotificationBell from '../ui/NotificationBell'
import TorqviaLogo from '../ui/TorqviaLogo'


export default function Navbar({ onOpenSearch }) {
  const { user, profile, loading } = useAuth()
  const { lang, toggle } = useLang()
  const t = useT()
  const { unread: unreadMessages, markRead } = useUnreadCount()
  const [mobileOpen, setMobileOpen] = useState(false)
  const plan = profile?.plan || 'free'
  const hasPlan = plan !== 'free'
  const isOwner = profile?.role === 'owner'
  const isAdmin = profile?.role === 'admin'
  const isPro = profile?.role === 'pro'

  const navLinks = user ? [
    { to: '/messages', icon: MessageCircle, label: t('nav.messages'), badge: unreadMessages, onClick: markRead },
    // HIDDEN_FOR_LAUNCH: sosyal medya, sonra açılacak
    // { to: '/feed',        icon: Gauge,         label: t('nav.feed') },
    // { to: '/communities', icon: Hash,          label: 'Topluluklar' },
    // { to: '/events',      icon: Calendar,      label: 'Etkinlikler' },
    // { to: '/people',      icon: Users,         label: t('nav.people') },
    ...(isOwner ? [{ to: '/garage', icon: Car, label: 'Garaj' }] : []),
    ...(isAdmin ? [{ to: '/admin', icon: Shield, label: 'Admin' }] : []),
  ] : []

  function closeMobile() { setMobileOpen(false) }

  // İlanlar dropdown
  const [listingsOpen, setListingsOpen] = useState(false)
  const listingsRef = useRef(null)
  const { pathname } = useLocation()
  const listingsActive = pathname.startsWith('/listings') || pathname.startsWith('/sales')

  useEffect(() => {
    function handleClick(e) {
      if (listingsRef.current && !listingsRef.current.contains(e.target)) setListingsOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <nav className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur sticky top-0 z-50 pt-safe">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          <Link to={user ? (profile?.role === 'pro' ? '/listings' : '/dashboard') : '/'} className="flex items-center gap-2 text-white font-bold text-xl shrink-0 hover:opacity-90 transition-opacity">
            <TorqviaLogo />
            <span className="hidden sm:inline">Torqvia</span>
          </Link>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-1">
            {loading ? (
              <>
                <div className="h-8 w-16 bg-zinc-800 rounded-lg animate-pulse" />
                <div className="h-8 w-16 bg-zinc-800 rounded-lg animate-pulse" />
              </>
            ) : (
              <>
                {/* İlanlar dropdown */}
                {user && (
                  <div ref={listingsRef} className="relative">
                    <button
                      onClick={() => setListingsOpen(o => !o)}
                      className={`btn-ghost flex items-center gap-1 px-2 py-1.5 text-sm ${listingsActive ? 'text-brand-400' : ''}`}
                      title="İlanlar"
                    >
                      <List className="h-4 w-4 shrink-0" />
                      <span className="hidden xl:inline">İlanlar</span>
                      <ChevronDown className={`h-3 w-3 transition-transform ${listingsOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {listingsOpen && (
                      <div className="absolute top-full left-0 mt-1 w-44 bg-zinc-900 border border-zinc-700 rounded-xl shadow-xl overflow-hidden z-50">
                        <Link to="/listings" onClick={() => setListingsOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-3 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors">
                          <List className="h-4 w-4 text-zinc-500" />
                          Servis İlanları
                        </Link>
                        <Link to="/sales" onClick={() => setListingsOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-3 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors border-t border-zinc-800">
                          <Tag className="h-4 w-4 text-zinc-500" />
                          Satılık Araçlar
                        </Link>
                      </div>
                    )}
                  </div>
                )}

                {navLinks.map(link => (
                  <Link key={link.to} to={link.to} onClick={link.onClick}
                    title={link.label}
                    className="btn-ghost flex items-center gap-1 px-2 py-1.5 text-sm relative">
                    <link.icon className="h-4 w-4 shrink-0" />
                    <span className="hidden xl:inline">{link.label}</span>
                    {link.badge > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 bg-brand-500 text-white text-[9px] font-bold rounded-full h-4 w-4 flex items-center justify-center leading-none">
                        {link.badge > 9 ? '9+' : link.badge}
                      </span>
                    )}
                  </Link>
                ))}
              </>
            )}
          </div>

          {/* Right side controls */}
          <div className="flex items-center gap-1">
            {loading ? (
              <div className="flex items-center gap-1">
                <div className="h-8 w-8 bg-zinc-800 rounded-lg animate-pulse" />
                <div className="h-8 w-8 bg-zinc-800 rounded-lg animate-pulse" />
              </div>
            ) : user ? (
              <>
                {/* Search */}
                <button onClick={onOpenSearch} className="btn-ghost p-2" title="Ara (Ctrl+K)">
                  <Search className="h-4 w-4" />
                </button>

                {/* Upgrade (desktop only) */}
                {!hasPlan && (
                  <Link to="/pricing"
                    className="hidden lg:flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-lg border border-orange-500/20 text-orange-400/70 hover:border-orange-500/40 hover:text-orange-400 transition-colors">
                    <Flame className="h-3 w-3" />
                    Turbo
                  </Link>
                )}

                {/* İlanları Keşfet (desktop, Pro kullanıcı) */}
                {isPro && (
                  <Link to="/listings"
                    className="hidden sm:flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-lg border border-blue-500/40 text-blue-400 hover:bg-blue-500/10 transition-colors">
                    <List className="h-3.5 w-3.5" />
                    <span className="hidden lg:inline">İlanları Keşfet</span>
                  </Link>
                )}

                {/* New listing (desktop, Owner — ana CTA) */}
                {isOwner && (
                  <Link to="/listings/new"
                    className="hidden sm:flex items-center gap-1.5 text-sm font-semibold px-3 py-2 rounded-lg bg-brand-500 text-white hover:bg-brand-600 transition-colors shadow-lg shadow-brand-500/20">
                    <PlusCircle className="h-3.5 w-3.5" />
                    <span className="hidden lg:inline">{t('nav.newListing')}</span>
                  </Link>
                )}

                {/* Notifications */}
                <NotificationBell />

                {/* Profile */}
                <div className="ml-1">
                  <ProfileDropdown />
                </div>

                {/* Hamburger (mobile only) */}
                <button
                  onClick={() => setMobileOpen(o => !o)}
                  className="md:hidden p-2 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors relative"
                >
                  {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                  {unreadMessages > 0 && !mobileOpen && (
                    <span className="absolute top-1 right-1 h-2 w-2 bg-brand-500 rounded-full" />
                  )}
                </button>
              </>
            ) : (
              <>
                <Link to="/pricing"  className="btn-ghost text-sm hidden sm:block">{t('nav.plans')}</Link>
                <Link to="/login"    className="text-sm px-3 py-1.5 rounded-lg text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors">{t('nav.login')}</Link>
                <Link to="/register" className="btn-primary text-sm px-3 py-1.5">{t('nav.register')}</Link>
              </>
            )}

            {/* Lang toggle */}
            <button
              onClick={toggle}
              title={lang === 'tr' ? 'Switch to English' : "Türkçe'ye geç"}
              className="hidden sm:flex ml-1 items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800/60 transition-colors text-xs font-medium text-zinc-500 hover:text-zinc-300"
            >
              <Globe className="h-3.5 w-3.5" />
              {lang === 'tr' ? 'EN' : 'TR'}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && user && (
        <div className="md:hidden border-t border-zinc-800 bg-zinc-950 px-4 py-3 space-y-1">
          <Link to="/listings" onClick={closeMobile}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors">
            <List className="h-4 w-4 text-zinc-500" />Servis İlanları
          </Link>
          <Link to="/sales" onClick={closeMobile}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors">
            <Tag className="h-4 w-4 text-zinc-500" />Satılık Araçlar
          </Link>
          {/* İlanları Keşfet (mobil, Pro kullanıcı) */}
          {isPro && (
            <Link to="/listings" onClick={closeMobile}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-blue-400 hover:bg-blue-500/10 transition-colors">
              <List className="h-4 w-4" />İlanları Keşfet
            </Link>
          )}
          {navLinks.map(link => (
            <Link key={link.to} to={link.to}
              onClick={() => { link.onClick?.(); closeMobile() }}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors">
              <link.icon className="h-4 w-4 text-zinc-500" />
              {link.label}
              {link.badge > 0 && (
                <span className="ml-auto bg-brand-500 text-white text-[10px] font-bold rounded-full px-1.5 py-0.5 leading-none">
                  {link.badge > 9 ? '9+' : link.badge}
                </span>
              )}
            </Link>
          ))}
          <div className="pt-2 border-t border-zinc-800 flex items-center gap-2">
            {isOwner && (
              <Link to="/listings/new" onClick={closeMobile} className="btn-primary flex items-center gap-1.5 text-sm flex-1 justify-center">
                <PlusCircle className="h-4 w-4" /> {t('nav.newListing')}
              </Link>
            )}
            {!hasPlan && (
              <Link to="/pricing" onClick={closeMobile}
                className="flex items-center gap-1.5 text-sm font-semibold px-3 py-2 rounded-lg bg-gradient-to-r from-orange-500/15 to-red-500/10 border border-orange-500/30 text-orange-400 flex-1 justify-center">
                <Flame className="h-3.5 w-3.5" /> {t('nav.upgrade')}
              </Link>
            )}
            <button onClick={() => { toggle(); closeMobile() }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-zinc-800 hover:bg-zinc-800 text-xs font-medium text-zinc-500 hover:text-zinc-300 transition-colors">
              <Globe className="h-3.5 w-3.5" />
              {lang === 'tr' ? 'EN' : 'TR'}
            </button>
          </div>
        </div>
      )}
    </nav>
  )
}

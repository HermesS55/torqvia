import { useState, useRef, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { List, PlusCircle, MessageCircle, Users, Flame, Globe, Search, Car, Menu, X, Shield, Tag, ChevronDown, Wrench } from 'lucide-react'
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

  const { pathname } = useLocation()

  const navLinks = user ? [
    { to: '/messages', icon: MessageCircle, label: t('nav.messages'), badge: unreadMessages, onClick: markRead },
    { to: '/people', icon: Users, label: t('nav.people') },
    ...(isOwner ? [{ to: '/garage', icon: Car, label: lang === 'tr' ? 'Garaj' : 'Garage' }] : []),
    ...(isAdmin ? [{ to: '/admin', icon: Shield, label: 'Admin' }] : []),
  ] : []

  function closeMobile() { setMobileOpen(false) }

  // İlanlar dropdown
  const [listingsOpen, setListingsOpen] = useState(false)
  const listingsRef = useRef(null)
  const listingsActive = pathname.startsWith('/listings') || pathname.startsWith('/sales')
  const ustaActive = pathname === '/ustalar' || pathname.startsWith('/usta/')

  useEffect(() => {
    function handleClick(e) {
      if (listingsRef.current && !listingsRef.current.contains(e.target)) setListingsOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <nav style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(8,8,8,0.92)', backdropFilter: 'blur(16px)', position: 'sticky', top: 0, zIndex: 50 }} className="pt-safe">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 60 }}>

          {/* Logo */}
          <Link to={user ? (profile?.role === 'pro' ? '/listings' : '/dashboard') : '/'} style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', flexShrink: 0 }}
            className="hover:opacity-90 transition-opacity">
            <TorqviaLogo />
            <span style={{ fontWeight: 800, fontSize: 17, color: '#f0f0f0', letterSpacing: '-0.02em' }} className="hidden sm:inline">Torqvia</span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center" style={{ gap: 2 }}>
            {loading ? (
              <>
                <div className="h-8 w-16 bg-zinc-800 rounded-lg animate-pulse" />
                <div className="h-8 w-16 bg-zinc-800 rounded-lg animate-pulse" />
              </>
            ) : user ? (
              <>
                {/* İlanlar dropdown */}
                <div ref={listingsRef} style={{ position: 'relative' }}>
                  <button
                    onClick={() => setListingsOpen(o => !o)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 5,
                      padding: '6px 10px', borderRadius: 8, fontSize: 13, fontWeight: 500,
                      background: listingsActive ? 'rgba(255,107,0,0.08)' : 'transparent',
                      color: listingsActive ? '#ff8c33' : '#999',
                      border: 'none', cursor: 'pointer', transition: 'all 0.15s',
                    }}
                    onMouseOver={e => { if (!listingsActive) { e.currentTarget.style.color = '#ccc'; e.currentTarget.style.background = 'rgba(255,255,255,0.04)' } }}
                    onMouseOut={e => { if (!listingsActive) { e.currentTarget.style.color = '#999'; e.currentTarget.style.background = 'transparent' } }}
                  >
                    <List size={15} />
                    <span className="hidden xl:inline">{lang === 'tr' ? 'İlanlar' : 'Listings'}</span>
                    <ChevronDown size={12} style={{ transform: listingsOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                  </button>
                  {listingsOpen && (
                    <div style={{
                      position: 'absolute', top: 'calc(100% + 6px)', left: 0,
                      width: 180, background: '#111', border: '1px solid #222',
                      borderRadius: 12, overflow: 'hidden', zIndex: 50,
                      boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                    }}>
                      <Link to="/listings" onClick={() => setListingsOpen(false)}
                        style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 16px', fontSize: 13, color: '#ccc', textDecoration: 'none', transition: 'background 0.1s' }}
                        onMouseOver={e => e.currentTarget.style.background = '#1a1a1a'}
                        onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
                        <List size={14} style={{ color: '#555' }} />
                        {lang === 'tr' ? 'Servis İlanları' : 'Service Listings'}
                      </Link>
                      <Link to="/sales" onClick={() => setListingsOpen(false)}
                        style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 16px', fontSize: 13, color: '#ccc', textDecoration: 'none', borderTop: '1px solid #1a1a1a', transition: 'background 0.1s' }}
                        onMouseOver={e => e.currentTarget.style.background = '#1a1a1a'}
                        onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
                        <Tag size={14} style={{ color: '#555' }} />
                        {lang === 'tr' ? 'Satılık Araçlar' : 'Cars for Sale'}
                      </Link>
                    </div>
                  )}
                </div>

                {/* Usta Ara */}
                <Link to="/ustalar"
                  style={{
                    display: 'flex', alignItems: 'center', gap: 5,
                    padding: '6px 10px', borderRadius: 8, fontSize: 13, fontWeight: 500,
                    background: ustaActive ? 'rgba(255,107,0,0.08)' : 'transparent',
                    color: ustaActive ? '#ff8c33' : '#999',
                    textDecoration: 'none', transition: 'all 0.15s',
                  }}
                  onMouseOver={e => { if (!ustaActive) { e.currentTarget.style.color = '#ccc'; e.currentTarget.style.background = 'rgba(255,255,255,0.04)' } }}
                  onMouseOut={e => { if (!ustaActive) { e.currentTarget.style.color = ustaActive ? '#ff8c33' : '#999'; e.currentTarget.style.background = ustaActive ? 'rgba(255,107,0,0.08)' : 'transparent' } }}
                >
                  <Wrench size={15} />
                  <span className="hidden xl:inline">{lang === 'tr' ? 'Usta Ara' : 'Find Mechanic'}</span>
                </Link>

                {/* Nav links (messages, feed, people…) */}
                {navLinks.map(link => {
                  const isActive = pathname === link.to
                  return (
                    <Link key={link.to} to={link.to} onClick={link.onClick}
                      title={link.label}
                      style={{
                        position: 'relative', display: 'flex', alignItems: 'center', gap: 5,
                        padding: '6px 10px', borderRadius: 8, fontSize: 13, fontWeight: 500,
                        background: isActive ? 'rgba(255,107,0,0.08)' : 'transparent',
                        color: isActive ? '#ff8c33' : '#999',
                        textDecoration: 'none', transition: 'all 0.15s',
                      }}
                      onMouseOver={e => { if (!isActive) { e.currentTarget.style.color = '#ccc'; e.currentTarget.style.background = 'rgba(255,255,255,0.04)' } }}
                      onMouseOut={e => { if (!isActive) { e.currentTarget.style.color = '#999'; e.currentTarget.style.background = 'transparent' } }}
                    >
                      <link.icon size={15} />
                      <span className="hidden xl:inline">{link.label}</span>
                      {link.badge > 0 && (
                        <span style={{
                          position: 'absolute', top: 2, right: 2,
                          background: '#ff6b00', color: '#fff', fontSize: 9, fontWeight: 800,
                          borderRadius: '50%', minWidth: 16, height: 16, display: 'flex', alignItems: 'center', justifyContent: 'center',
                          lineHeight: 1,
                        }}>
                          {link.badge > 9 ? '9+' : link.badge}
                        </span>
                      )}
                    </Link>
                  )
                })}
              </>
            ) : null}
          </div>

          {/* Right side */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {loading ? (
              <div style={{ display: 'flex', gap: 6 }}>
                <div className="h-8 w-8 bg-zinc-800 rounded-lg animate-pulse" />
                <div className="h-8 w-8 bg-zinc-800 rounded-lg animate-pulse" />
              </div>
            ) : user ? (
              <>
                {/* Search */}
                <button onClick={onOpenSearch}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 34, height: 34, borderRadius: 8, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#888', cursor: 'pointer', transition: 'all 0.15s' }}
                  onMouseOver={e => { e.currentTarget.style.color = '#ccc'; e.currentTarget.style.background = 'rgba(255,255,255,0.08)' }}
                  onMouseOut={e => { e.currentTarget.style.color = '#888'; e.currentTarget.style.background = 'rgba(255,255,255,0.04)' }}
                  title={lang === 'tr' ? 'Ara (Ctrl+K)' : 'Search (Ctrl+K)'}>
                  <Search size={15} />
                </button>

                {/* Upgrade */}
                {!hasPlan && (
                  <Link to="/pricing"
                    className="hidden lg:flex items-center gap-1"
                    style={{ fontSize: 12, fontWeight: 600, padding: '5px 11px', borderRadius: 7, border: '1px solid rgba(255,107,0,0.2)', color: 'rgba(255,140,51,0.7)', textDecoration: 'none', transition: 'all 0.15s' }}
                    onMouseOver={e => { e.currentTarget.style.borderColor = 'rgba(255,107,0,0.4)'; e.currentTarget.style.color = '#ff8c33' }}
                    onMouseOut={e => { e.currentTarget.style.borderColor = 'rgba(255,107,0,0.2)'; e.currentTarget.style.color = 'rgba(255,140,51,0.7)' }}
                  >
                    <Flame size={11} /> Turbo
                  </Link>
                )}

                {/* İlanları Keşfet (Pro) */}
                {isPro && (
                  <Link to="/listings"
                    className="hidden sm:flex items-center gap-1.5"
                    style={{ fontSize: 12, fontWeight: 600, padding: '5px 11px', borderRadius: 7, border: '1px solid rgba(59,130,246,0.3)', color: '#60a5fa', textDecoration: 'none', transition: 'all 0.15s' }}
                    onMouseOver={e => e.currentTarget.style.background = 'rgba(59,130,246,0.08)'}
                    onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <List size={13} />
                    <span className="hidden lg:inline">{lang === 'tr' ? 'İlanları Keşfet' : 'Browse Listings'}</span>
                  </Link>
                )}

                {/* Yeni ilan (Owner) */}
                {isOwner && (
                  <Link to="/listings/new"
                    className="hidden sm:flex items-center gap-1.5"
                    style={{ fontSize: 13, fontWeight: 700, padding: '7px 14px', borderRadius: 8, background: '#ff6b00', color: '#fff', textDecoration: 'none', boxShadow: '0 2px 12px rgba(255,107,0,0.3)', transition: 'all 0.15s' }}
                    onMouseOver={e => e.currentTarget.style.background = '#e05e00'}
                    onMouseOut={e => e.currentTarget.style.background = '#ff6b00'}
                  >
                    <PlusCircle size={14} />
                    <span className="hidden lg:inline">{t('nav.newListing')}</span>
                  </Link>
                )}

                <NotificationBell />

                <div style={{ marginLeft: 2 }}>
                  <ProfileDropdown />
                </div>

                {/* Hamburger */}
                <button
                  onClick={() => setMobileOpen(o => !o)}
                  className="md:hidden"
                  style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', width: 34, height: 34, borderRadius: 8, background: 'rgba(255,255,255,0.04)', color: '#888', border: 'none', cursor: 'pointer' }}
                >
                  {mobileOpen ? <X size={18} /> : <Menu size={18} />}
                  {unreadMessages > 0 && !mobileOpen && (
                    <span style={{ position: 'absolute', top: 6, right: 6, width: 8, height: 8, borderRadius: '50%', background: '#ff6b00' }} />
                  )}
                </button>
              </>
            ) : (
              <>
                <Link to="/pricing" style={{ fontSize: 13, color: '#888', textDecoration: 'none', padding: '6px 10px' }} className="hidden sm:block">{t('nav.plans')}</Link>
                <Link to="/login" style={{ fontSize: 13, padding: '6px 12px', borderRadius: 8, color: '#ccc', textDecoration: 'none', transition: 'background 0.15s' }}
                  onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
                  onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                >{t('nav.login')}</Link>
                <Link to="/register" style={{ fontSize: 13, fontWeight: 700, padding: '7px 14px', borderRadius: 8, background: '#ff6b00', color: '#fff', textDecoration: 'none', boxShadow: '0 2px 12px rgba(255,107,0,0.3)', transition: 'all 0.15s' }}
                  onMouseOver={e => e.currentTarget.style.background = '#e05e00'}
                  onMouseOut={e => e.currentTarget.style.background = '#ff6b00'}
                >{t('nav.register')}</Link>
              </>
            )}

            {/* Lang toggle */}
            <button
              onClick={toggle}
              title={lang === 'tr' ? 'Switch to English' : "Türkçe'ye geç"}
              style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px', borderRadius: 7, border: '1px solid rgba(255,255,255,0.08)', background: 'transparent', color: '#666', cursor: 'pointer', fontSize: 11, fontWeight: 600, transition: 'all 0.15s', marginLeft: 2 }}
              onMouseOver={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'; e.currentTarget.style.color = '#aaa' }}
              onMouseOut={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = '#666' }}
            >
              <Globe size={13} />
              {lang === 'tr' ? 'EN' : 'TR'}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && user && (
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', background: '#080808', padding: '12px 16px' }} className="md:hidden">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Link to="/listings" onClick={closeMobile}
              style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 10, fontSize: 14, color: '#ccc', textDecoration: 'none', transition: 'background 0.1s' }}
              onMouseOver={e => e.currentTarget.style.background = '#111'}
              onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
              <List size={16} style={{ color: '#555' }} />{lang === 'tr' ? 'Servis İlanları' : 'Service Listings'}
            </Link>
            <Link to="/sales" onClick={closeMobile}
              style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 10, fontSize: 14, color: '#ccc', textDecoration: 'none', transition: 'background 0.1s' }}
              onMouseOver={e => e.currentTarget.style.background = '#111'}
              onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
              <Tag size={16} style={{ color: '#555' }} />{lang === 'tr' ? 'Satılık Araçlar' : 'Cars for Sale'}
            </Link>
            <Link to="/ustalar" onClick={closeMobile}
              style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 10, fontSize: 14, color: '#ccc', textDecoration: 'none', transition: 'background 0.1s' }}
              onMouseOver={e => e.currentTarget.style.background = '#111'}
              onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
              <Wrench size={16} style={{ color: '#555' }} />{lang === 'tr' ? 'Usta Ara' : 'Find Mechanic'}
            </Link>
            {isPro && (
              <Link to="/listings" onClick={closeMobile}
                style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 10, fontSize: 14, color: '#60a5fa', textDecoration: 'none' }}>
                <List size={16} />{lang === 'tr' ? 'İlanları Keşfet' : 'Browse Listings'}
              </Link>
            )}
            {navLinks.map(link => (
              <Link key={link.to} to={link.to}
                onClick={() => { link.onClick?.(); closeMobile() }}
                style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 10, fontSize: 14, color: '#ccc', textDecoration: 'none', transition: 'background 0.1s' }}
                onMouseOver={e => e.currentTarget.style.background = '#111'}
                onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
                <link.icon size={16} style={{ color: '#555' }} />
                {link.label}
                {link.badge > 0 && (
                  <span style={{ marginLeft: 'auto', background: '#ff6b00', color: '#fff', fontSize: 10, fontWeight: 800, borderRadius: 99, padding: '1px 7px' }}>
                    {link.badge > 9 ? '9+' : link.badge}
                  </span>
                )}
              </Link>
            ))}

            <div style={{ paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', gap: 8, marginTop: 4 }}>
              {isOwner && (
                <Link to="/listings/new" onClick={closeMobile}
                  style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '9px 0', borderRadius: 9, background: '#ff6b00', color: '#fff', fontWeight: 700, fontSize: 13, textDecoration: 'none' }}>
                  <PlusCircle size={15} /> {t('nav.newListing')}
                </Link>
              )}
              {!hasPlan && (
                <Link to="/pricing" onClick={closeMobile}
                  style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '9px 0', borderRadius: 9, background: 'rgba(255,107,0,0.1)', border: '1px solid rgba(255,107,0,0.25)', color: '#ff8c33', fontWeight: 700, fontSize: 13, textDecoration: 'none' }}>
                  <Flame size={14} /> {t('nav.upgrade')}
                </Link>
              )}
              <button onClick={() => { toggle(); closeMobile() }}
                style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '9px 14px', borderRadius: 9, border: '1px solid rgba(255,255,255,0.08)', background: 'transparent', color: '#666', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
                <Globe size={13} />
                {lang === 'tr' ? 'EN' : 'TR'}
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}

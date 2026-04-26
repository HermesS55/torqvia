import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import Navbar from './Navbar'
import Footer from './Footer'
import OnboardingModal from '../ui/OnboardingModal'
import GlobalSearch from '../ui/GlobalSearch'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => { window.scrollTo({ top: 0, behavior: 'instant' }) }, [pathname])
  return null
}

export default function Layout({ children }) {
  const { user, profile, loading } = useAuth()
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)

  useEffect(() => {
    if (!loading && user && profile && !profile.full_name) {
      setShowOnboarding(true)
    }
  }, [loading, user, profile?.full_name])

  // last_seen güncelle — giriş + her 5 dakikada bir
  useEffect(() => {
    if (!user?.id) return
    const update = () => supabase.from('profiles').update({ last_seen: new Date().toISOString() }).eq('id', user.id).then(() => {})
    update()
    const interval = setInterval(update, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [user?.id])

  useEffect(() => {
    function onKey(e) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        setSearchOpen(true)
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  return (
    <div className="min-h-screen flex flex-col">
      <ScrollToTop />
      <Navbar onOpenSearch={() => setSearchOpen(true)} />
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
      <Footer />
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: '#18181b',
            color: '#f4f4f5',
            border: '1px solid #27272a',
          },
        }}
      />
      {showOnboarding && (
        <OnboardingModal onComplete={() => setShowOnboarding(false)} />
      )}
      {searchOpen && (
        <GlobalSearch onClose={() => setSearchOpen(false)} />
      )}
    </div>
  )
}

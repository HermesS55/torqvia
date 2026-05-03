import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const currentUserIdRef = useRef(null)

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        // Callback MUST be synchronous — async here deadlocks Supabase auth internals.
        // fetchProfile is called without await; it updates state independently.
        const newUser = session?.user ?? null
        const newUserId = newUser?.id ?? null

        // Token yenilendi — Supabase zaten halletti, dokunma
        if (event === 'TOKEN_REFRESHED') return

        // Aynı kullanıcı tab focus / cross-tab sync ile tekrar geldi
        // SIGNED_IN ama user.id değişmedi → gerçek login değil, loading gösterme
        if (event === 'SIGNED_IN' && newUserId && newUserId === currentUserIdRef.current) {
          setUser(newUser)
          fetchProfile(newUserId, newUser.user_metadata, true)
          return
        }

        // Gerçek auth değişimi: ilk yüklenme, farklı kullanıcı login, logout
        currentUserIdRef.current = newUserId
        setUser(newUser)
        if (newUser) {
          setLoading(true)
          fetchProfile(newUserId, newUser.user_metadata)
        } else {
          setProfile(null)
          setLoading(false)
        }
      }
    )
    return () => subscription.unsubscribe()
  }, [])

  async function fetchProfile(userId, meta = {}, silent = false) {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle()

      if (data) {
        if (data.banned) {
          await supabase.auth.signOut()
          setProfile(null)
          if (!silent) setLoading(false)
          return
        }
        setProfile(data)
        return
      }

      // Profile row missing — try to auto-create from signup metadata
      if (meta?.role) {
        const { data: created, error } = await supabase
          .from('profiles')
          .insert({
            id: userId,
            role: meta.role,
            phone: meta.phone || '',
            full_name: meta.full_name || '',
          })
          .select()
          .single()
        setProfile(error ? null : created)
      } else {
        setProfile(null)
      }
    } catch {
      setProfile(null)
    } finally {
      if (!silent) setLoading(false)
    }
  }

  async function signUp({ email, password, phone, role, full_name = '', shop_name = '', city = '', specialties = [] }) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { role, phone, full_name, shop_name, city, specialties } },
    })
    if (error) throw error
    // Supabase, e-posta doğrulama kapalıyken mevcut e-posta ile kayıt denemesinde
    // hata vermez; bunun yerine boş identities dizisiyle user döner.
    if (data.user && data.user.identities?.length === 0) {
      throw new Error('Bu e-posta adresi zaten kullanımda')
    }
    return data
  }

  async function signIn({ email, password, rememberMe = true }) {
    localStorage.setItem('torqvia_remember', rememberMe ? 'true' : 'false')
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    return data
  }

  async function signOut() {
    localStorage.removeItem('torqvia_remember')
    await supabase.auth.signOut().catch(() => {})
  }

  async function resetPassword(email) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    if (error) throw error
  }

  async function updatePassword(newPassword) {
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) throw error
  }

  const value = {
    user,
    profile,
    loading,
    signUp,
    signIn,
    signOut,
    resetPassword,
    updatePassword,
    refetchProfile: () => user && fetchProfile(user.id, user.user_metadata),
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        // Callback MUST be synchronous — async here deadlocks Supabase auth internals.
        // fetchProfile is called without await; it updates state independently.
        const currentUser = session?.user ?? null
        setUser(currentUser)
        if (currentUser) {
          setLoading(true)
          fetchProfile(currentUser.id, currentUser.user_metadata)
        } else {
          setProfile(null)
          setLoading(false)
        }
      }
    )
    return () => subscription.unsubscribe()
  }, [])

  async function fetchProfile(userId, meta = {}) {
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
          setLoading(false)
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
      setLoading(false)
    }
  }

  async function signUp({ email, password, phone, role }) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { role, phone, full_name: '' } },
    })
    if (error) throw error
    // Supabase, e-posta doğrulama kapalıyken mevcut e-posta ile kayıt denemesinde
    // hata vermez; bunun yerine boş identities dizisiyle user döner.
    if (data.user && data.user.identities?.length === 0) {
      throw new Error('Bu e-posta adresi zaten kullanımda')
    }
    return data
  }

  async function signIn({ email, password }) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    return data
  }

  async function signOut() {
    await supabase.auth.signOut().catch(() => {})
  }

  async function signInWithGoogle() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/dashboard` },
    })
    if (error) throw error
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
    signInWithGoogle,
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

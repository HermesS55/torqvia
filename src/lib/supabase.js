import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Check your .env file.')
}

// When "remember me" is false, session is stored in sessionStorage (cleared on browser close).
// When true (default), session lives in localStorage (persists across sessions).
const authStorage = {
  getItem: (key) => sessionStorage.getItem(key) ?? localStorage.getItem(key),
  setItem: (key, value) => {
    if (localStorage.getItem('torqvia_remember') === 'false') {
      sessionStorage.setItem(key, value)
      localStorage.removeItem(key)
    } else {
      localStorage.setItem(key, value)
    }
  },
  removeItem: (key) => {
    localStorage.removeItem(key)
    sessionStorage.removeItem(key)
  },
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: authStorage,
  },
})

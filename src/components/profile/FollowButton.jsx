import { useEffect, useState } from 'react'
import { UserPlus, UserCheck, Loader2 } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'

export default function FollowButton({ targetId, size = 'md', onToggle }) {
  const { user } = useAuth()
  const [following, setFollowing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [pending, setPending] = useState(false)

  useEffect(() => {
    if (!user || targetId === user.id) { setLoading(false); return }
    loadState()
  }, [targetId, user?.id])

  async function loadState() {
    setLoading(true)
    const { data } = await supabase
      .from('follows')
      .select('follower_id')
      .eq('follower_id', user.id)
      .eq('following_id', targetId)
      .maybeSingle()
    setFollowing(!!data)
    setLoading(false)
  }

  async function toggle() {
    if (pending) return
    setPending(true)
    if (following) {
      await supabase.from('follows').delete().eq('follower_id', user.id).eq('following_id', targetId)
      setFollowing(false)
    } else {
      await supabase.from('follows').insert({ follower_id: user.id, following_id: targetId })
      setFollowing(true)
      supabase.from('notifications').insert({
        user_id: targetId, type: 'follow', from_user_id: user.id,
      }).then(() => {})
    }
    setPending(false)
    onToggle?.()
  }

  if (!user || targetId === user.id) return null
  if (loading) return null

  const sm = size === 'sm'
  const base = `flex items-center gap-1.5 font-medium transition-all disabled:opacity-60 rounded-lg border ${sm ? 'text-xs px-3 py-1.5' : 'text-sm px-4 py-2'}`

  if (pending) {
    return (
      <button disabled className={`${base} bg-zinc-800 border-zinc-700 text-zinc-400`}>
        <Loader2 className={`animate-spin ${sm ? 'h-3 w-3' : 'h-4 w-4'}`} />
      </button>
    )
  }

  if (following) {
    return (
      <button onClick={toggle} className={`${base} bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-red-500/10 hover:border-red-500/40 hover:text-red-400`}>
        <UserCheck className={sm ? 'h-3 w-3' : 'h-4 w-4'} />Takip Ediliyor
      </button>
    )
  }

  return (
    <button onClick={toggle} className={`${base} bg-brand-500 border-brand-500 text-white hover:bg-brand-600`}>
      <UserPlus className={sm ? 'h-3 w-3' : 'h-4 w-4'} />Takip Et
    </button>
  )
}

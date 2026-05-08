import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

export function useUnreadMessages() {
  const { user } = useAuth()
  const [unread, setUnread] = useState(0)

  useEffect(() => {
    if (!user?.id) return
    fetchCount()
    const channel = supabase
      .channel(`unread-msgs-${user.id}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'messages',
        filter: `receiver_id=eq.${user.id}`,
      }, () => setUnread(u => u + 1))
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'messages',
        filter: `receiver_id=eq.${user.id}`,
      }, () => fetchCount())
      .subscribe()
    return () => channel.unsubscribe()
  }, [user?.id])

  async function fetchCount() {
    const { count } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('receiver_id', user.id)
      .is('read_at', null)
    setUnread(count || 0)
  }

  async function markRead() {
    setUnread(0)
    if (!user?.id) return
    await supabase.from('messages')
      .update({ read_at: new Date().toISOString() })
      .eq('receiver_id', user.id)
      .is('read_at', null)
  }

  return { unread, markRead }
}

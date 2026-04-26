import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import UserAvatar from '../ui/UserAvatar'
import FollowButton from './FollowButton'
import Spinner from '../ui/Spinner'

export default function FollowListModal({ userId, type, onClose }) {
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetch() {
      const col = type === 'followers' ? 'following_id' : 'follower_id'
      const joinCol = type === 'followers' ? 'follower_id' : 'following_id'
      const { data } = await supabase
        .from('follows')
        .select(`${joinCol}, profiles!follows_${joinCol}_fkey(id, full_name, role, avatar_url, specialty, private_account)`)
        .eq(col, userId)
        .order('created_at', { ascending: false })
      setList((data || []).map(r => r.profiles).filter(Boolean))
      setLoading(false)
    }
    fetch()
  }, [userId, type])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-sm bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
          <h3 className="font-semibold text-white">{type === 'followers' ? 'Takipçiler' : 'Takip Edilenler'}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-500"><X className="h-4 w-4" /></button>
        </div>
        <div className="max-h-96 overflow-y-auto">
          {loading ? (
            <div className="flex justify-center py-8"><Spinner /></div>
          ) : list.length === 0 ? (
            <p className="text-center text-zinc-600 text-sm py-8">Henüz kimse yok</p>
          ) : (
            list.map(p => (
              <div key={p.id} className="flex items-center justify-between gap-3 px-4 py-3 border-b border-zinc-800/50 last:border-0">
                <Link to={`/profile/${p.id}`} onClick={onClose} className="flex items-center gap-3 min-w-0">
                  <UserAvatar profile={p} size="sm" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-white truncate">{p.full_name || 'İsimsiz'}</p>
                    <p className="text-xs text-zinc-500">{p.role === 'pro' ? (p.specialty || 'Servis Uzmanı') : 'Araç Sahibi'}</p>
                  </div>
                </Link>
                <FollowButton targetId={p.id} size="sm" isPrivate={!!p.private_account} />
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

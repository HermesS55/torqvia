import { useEffect, useState } from 'react'
import { X, Send, Search, Image, Film } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import UserAvatar from '../ui/UserAvatar'
import Spinner from '../ui/Spinner'
import toast from 'react-hot-toast'

export default function SharePostModal({ post, onClose }) {
  const { user } = useAuth()
  const [search, setSearch]   = useState('')
  const [users, setUsers]     = useState([])
  const [loading, setLoading] = useState(true)
  const [sent, setSent]       = useState(new Set())
  const [sending, setSending] = useState(null)

  const hasImage = !!post.image_url
  const hasVideo = !!post.video_url
  const previewText = post.content?.slice(0, 120) || ''

  useEffect(() => { fetchUsers() }, [])

  async function fetchUsers() {
    const { data } = await supabase
      .from('profiles')
      .select('id, full_name, avatar_url, role')
      .neq('id', user.id)
      .order('full_name')
    setUsers(data || [])
    setLoading(false)
  }

  async function sendToUser(toUser) {
    setSending(toUser.id)

    let content = previewText
      ? `📌 "${previewText}${post.content?.length > 120 ? '…' : ''}"`
      : '📌 Bir gönderi paylaştı'

    const { error } = await supabase.from('messages').insert({
      sender_id: user.id,
      receiver_id: toUser.id,
      content,
      image_url: post.image_url || null,
      post_id: post.id,
    })

    if (!error) {
      setSent(s => new Set([...s, toUser.id]))
      toast.success(`${toUser.full_name || 'Kullanıcı'} kişisine iletildi`)
    } else {
      toast.error('Gönderilemedi')
    }
    setSending(null)
  }

  const filtered = users.filter(u =>
    (u.full_name || '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-sm bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
          <h3 className="font-semibold text-white text-sm">Gönderiyi İlet</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-500">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Post preview */}
        <div className="px-4 py-3 bg-zinc-800/40 border-b border-zinc-800 space-y-1.5">
          {previewText && (
            <p className="text-xs text-zinc-400 line-clamp-2">{previewText}</p>
          )}
          {(hasImage || hasVideo) && (
            <div className="flex items-center gap-2">
              {hasImage && (
                <div className="relative">
                  <img src={post.image_url} alt="" className="h-16 w-24 object-cover rounded-lg border border-zinc-700" />
                  <div className="absolute bottom-1 left-1 bg-black/60 rounded px-1 py-0.5 flex items-center gap-0.5">
                    <Image className="h-2.5 w-2.5 text-white" />
                  </div>
                </div>
              )}
              {hasVideo && (
                <div className="h-16 w-24 bg-zinc-800 rounded-lg border border-zinc-700 flex items-center justify-center">
                  <Film className="h-6 w-6 text-zinc-500" />
                </div>
              )}
            </div>
          )}
          {!previewText && !hasImage && !hasVideo && (
            <p className="text-xs text-zinc-500 italic">İçerik yok</p>
          )}
        </div>

        <div className="p-3">
          <div className="relative mb-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Kullanıcı ara..."
              className="input-base pl-9 py-2 text-sm"
              autoFocus
            />
          </div>

          <div className="max-h-60 overflow-y-auto space-y-1">
            {loading ? (
              <div className="flex justify-center py-6"><Spinner /></div>
            ) : filtered.length === 0 ? (
              <p className="text-center text-zinc-600 text-sm py-6">Kullanıcı bulunamadı</p>
            ) : (
              filtered.map(u => (
                <div key={u.id} className="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-zinc-800/50 transition-colors">
                  <UserAvatar profile={u} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-zinc-300 truncate font-medium">{u.full_name || 'İsimsiz'}</p>
                    <p className="text-[10px] text-zinc-600">{u.role === 'pro' ? 'Servis Uzmanı' : 'Araç Sahibi'}</p>
                  </div>
                  <button
                    onClick={() => sendToUser(u)}
                    disabled={sent.has(u.id) || sending === u.id}
                    className={`text-xs px-3 py-1.5 rounded-lg border transition-all shrink-0 flex items-center gap-1 ${
                      sent.has(u.id)
                        ? 'border-green-500/30 text-green-400 bg-green-500/10'
                        : 'border-brand-500/40 text-brand-400 hover:bg-brand-500/10'
                    }`}
                  >
                    {sending === u.id ? <Spinner size="sm" />
                      : sent.has(u.id) ? 'Gönderildi'
                      : <><Send className="h-3 w-3" />Gönder</>
                    }
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

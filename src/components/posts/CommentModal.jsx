import { useEffect, useRef, useState } from 'react'
import { X, Send, Pencil, Trash2, Check } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import UserAvatar from '../ui/UserAvatar'
import Spinner from '../ui/Spinner'
import toast from 'react-hot-toast'

export default function CommentModal({ post, onClose, onCommentAdded }) {
  const { user, profile } = useAuth()
  const [comments, setComments] = useState([])
  const [loading, setLoading] = useState(true)
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [editText, setEditText] = useState('')
  const [savingEdit, setSavingEdit] = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => { fetchComments() }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [comments])

  async function fetchComments() {
    const { data } = await supabase
      .from('post_comments')
      .select('*, profiles(id, avatar_url, full_name, role)')
      .eq('post_id', post.id)
      .order('created_at', { ascending: true })
    setComments(data || [])
    setLoading(false)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!text.trim()) return
    setSending(true)
    const { data, error } = await supabase
      .from('post_comments')
      .insert({ post_id: post.id, user_id: user.id, content: text.trim() })
      .select('*, profiles(id, avatar_url, full_name, role)')
      .single()
    if (!error) {
      setComments(c => [...c, data])
      setText('')
      onCommentAdded?.()
      if (post.user_id !== user.id) {
        supabase.from('notifications').insert({
          user_id: post.user_id,
          type: 'comment',
          from_user_id: user.id,
          post_id: post.id,
          message: text.slice(0, 80),
        }).then(() => {})
      }
    } else toast.error('Yorum gönderilemedi')
    setSending(false)
  }

  async function handleDelete(id) {
    if (!confirm('Yorumu silmek istediğine emin misin?')) return
    const { error } = await supabase.from('post_comments').delete().eq('id', id)
    if (error) { toast.error('Silinemedi'); return }
    setComments(prev => prev.filter(c => c.id !== id))
    onCommentAdded?.()
    toast.success('Yorum silindi')
  }

  async function handleEdit(id) {
    if (!editText.trim()) return
    setSavingEdit(true)
    const { error } = await supabase
      .from('post_comments')
      .update({ content: editText.trim() })
      .eq('id', id)
    if (error) { toast.error('Düzenlenemedi') }
    else {
      setComments(prev => prev.map(c => c.id === id ? { ...c, content: editText.trim() } : c))
      setEditingId(null)
      setEditText('')
    }
    setSavingEdit(false)
  }

  function startEdit(c) {
    setEditingId(c.id)
    setEditText(c.content)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-lg bg-zinc-900 rounded-2xl border border-zinc-800 flex flex-col max-h-[80vh]" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
          <h3 className="font-semibold text-white">Yorumlar</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-500 hover:text-zinc-300 transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Comments list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {loading ? (
            <div className="flex justify-center py-8"><Spinner /></div>
          ) : comments.length === 0 ? (
            <p className="text-center text-zinc-600 text-sm py-8">Henüz yorum yok. İlk sen yaz!</p>
          ) : (
            comments.map(c => (
              <div key={c.id} className="flex gap-3 group">
                <UserAvatar profile={c.profiles} size="sm" />
                <div className="flex-1 min-w-0">
                  <div className="bg-zinc-800 rounded-xl px-3 py-2">
                    <div className="flex items-baseline justify-between gap-2">
                      <div className="flex items-baseline gap-2 min-w-0">
                        <span className="text-xs font-semibold text-white truncate">{c.profiles?.full_name || 'Kullanıcı'}</span>
                        <span className="text-[10px] text-zinc-600 shrink-0">{new Date(c.created_at).toLocaleDateString('tr-TR')}</span>
                      </div>
                      {c.user_id === user.id && editingId !== c.id && (
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                          <button onClick={() => startEdit(c)} className="p-1 rounded text-zinc-500 hover:text-zinc-300 hover:bg-zinc-700 transition-colors">
                            <Pencil className="h-3 w-3" />
                          </button>
                          <button onClick={() => handleDelete(c.id)} className="p-1 rounded text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-colors">
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      )}
                    </div>
                    {editingId === c.id ? (
                      <div className="mt-1.5 flex gap-2">
                        <input
                          value={editText}
                          onChange={e => setEditText(e.target.value)}
                          maxLength={500}
                          className="input-base flex-1 py-1.5 text-sm"
                          autoFocus
                          onKeyDown={e => { if (e.key === 'Escape') { setEditingId(null); setEditText('') } }}
                        />
                        <button onClick={() => handleEdit(c.id)} disabled={savingEdit || !editText.trim()} className="btn-primary px-2 py-1.5">
                          {savingEdit ? <Spinner size="sm" /> : <Check className="h-3.5 w-3.5" />}
                        </button>
                        <button onClick={() => { setEditingId(null); setEditText('') }} className="px-2 py-1.5 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-zinc-700 transition-colors">
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ) : (
                      <p className="text-sm text-zinc-300 mt-0.5">{c.content}</p>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <form onSubmit={handleSubmit} className="p-4 border-t border-zinc-800 flex gap-3">
          <UserAvatar profile={profile} email={user?.email} size="sm" />
          <div className="flex-1 flex gap-2">
            <input
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder="Yorum yaz..."
              maxLength={500}
              className="input-base flex-1 py-2 text-sm"
            />
            <button type="submit" disabled={!text.trim() || sending} className="btn-primary px-3 py-2">
              {sending ? <Spinner size="sm" /> : <Send className="h-4 w-4" />}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

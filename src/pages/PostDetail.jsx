import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Send, Pencil, Trash2, Check, X as XIcon } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import PostCard from '../components/posts/PostCard'
import Spinner from '../components/ui/Spinner'
import UserAvatar from '../components/ui/UserAvatar'
import toast from 'react-hot-toast'

export default function PostDetail() {
  const { id } = useParams()
  const { user, profile } = useAuth()
  const navigate = useNavigate()
  const [post, setPost] = useState(null)
  const [loading, setLoading] = useState(true)
  const [comments, setComments] = useState([])
  const [commentsLoading, setCommentsLoading] = useState(true)
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [editText, setEditText] = useState('')
  const [savingEdit, setSavingEdit] = useState(false)

  useEffect(() => { fetchPost(); fetchComments() }, [id])

  async function fetchPost() {
    setLoading(true)
    const { data } = await supabase
      .from('posts')
      .select(`*,
        profiles!posts_user_id_fkey(id, avatar_url, full_name, role, specialty, plan),
        post_tags(tagged_user_id, profiles!post_tags_tagged_user_id_fkey(id, full_name)),
        post_likes(user_id),
        post_comments(count)`)
      .eq('id', id)
      .single()
    if (data) {
      setPost({
        ...data,
        like_count: data.post_likes?.length || 0,
        comment_count: data.post_comments?.[0]?.count || 0,
        liked_by_me: data.post_likes?.some(l => l.user_id === user?.id) || false,
      })
    }
    setLoading(false)
  }

  async function fetchComments() {
    setCommentsLoading(true)
    const { data } = await supabase
      .from('post_comments')
      .select('*, profiles(id, avatar_url, full_name, role)')
      .eq('post_id', id)
      .order('created_at', { ascending: true })
    setComments(data || [])
    setCommentsLoading(false)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!text.trim()) return
    setSending(true)
    const { data, error } = await supabase
      .from('post_comments')
      .insert({ post_id: id, user_id: user.id, content: text.trim() })
      .select('*, profiles(id, avatar_url, full_name, role)')
      .single()
    if (!error) {
      setComments(c => [...c, data])
      setText('')
      setPost(p => p ? { ...p, comment_count: p.comment_count + 1 } : p)
      if (post?.user_id !== user.id) {
        supabase.from('notifications').insert({
          user_id: post.user_id, type: 'comment',
          from_user_id: user.id, post_id: id,
          message: text.slice(0, 80),
        }).then(() => {})
      }
    } else toast.error('Yorum gönderilemedi')
    setSending(false)
  }

  async function handleDeleteComment(commentId) {
    if (!confirm('Yorumu silmek istediğine emin misin?')) return
    const { error } = await supabase.from('post_comments').delete().eq('id', commentId)
    if (error) { toast.error('Silinemedi'); return }
    setComments(prev => prev.filter(c => c.id !== commentId))
    setPost(p => p ? { ...p, comment_count: Math.max(0, p.comment_count - 1) } : p)
    toast.success('Yorum silindi')
  }

  async function handleEditComment(commentId) {
    if (!editText.trim()) return
    setSavingEdit(true)
    const { error } = await supabase.from('post_comments').update({ content: editText.trim() }).eq('id', commentId)
    if (error) { toast.error('Düzenlenemedi') }
    else {
      setComments(prev => prev.map(c => c.id === commentId ? { ...c, content: editText.trim() } : c))
      setEditingId(null)
      setEditText('')
    }
    setSavingEdit(false)
  }

  if (loading) return <div className="flex justify-center py-16"><Spinner size="lg" /></div>
  if (!post) return (
    <div className="text-center py-16 max-w-2xl mx-auto">
      <p className="text-zinc-500 mb-4">Gönderi bulunamadı</p>
      <button onClick={() => navigate(-1)} className="btn-secondary inline-flex items-center gap-2">
        <ArrowLeft className="h-4 w-4" /> Geri Dön
      </button>
    </div>
  )

  return (
    <div className="max-w-2xl mx-auto">
      <button onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-zinc-500 hover:text-zinc-300 text-sm mb-5 transition-colors">
        <ArrowLeft className="h-4 w-4" /> Geri
      </button>

      <div className="mb-5">
        <PostCard
          post={post}
          onDelete={() => navigate(-1)}
          onRepost={() => {}}
        />
      </div>

      <div className="card">
        <h2 className="font-semibold text-white text-sm mb-4">
          Yorumlar {comments.length > 0 && <span className="text-zinc-500 font-normal">({comments.length})</span>}
        </h2>

        {commentsLoading ? (
          <div className="flex justify-center py-6"><Spinner /></div>
        ) : comments.length === 0 ? (
          <p className="text-center text-zinc-600 text-sm py-4">Henüz yorum yok. İlk sen yaz!</p>
        ) : (
          <div className="space-y-4 mb-5">
            {comments.map(c => (
              <div key={c.id} className="flex gap-3 group">
                <UserAvatar profile={c.profiles} size="sm" />
                <div className="flex-1 min-w-0">
                  <div className="bg-zinc-800 rounded-xl px-3 py-2">
                    <div className="flex items-baseline justify-between gap-2">
                      <div className="flex items-baseline gap-2 min-w-0">
                        <Link to={`/profile/${c.user_id}`}
                          className="text-xs font-semibold text-white hover:text-brand-400 transition-colors truncate">
                          {c.profiles?.full_name || 'Kullanıcı'}
                        </Link>
                        <span className="text-[10px] text-zinc-600 shrink-0">
                          {new Date(c.created_at).toLocaleDateString('tr-TR')}
                        </span>
                      </div>
                      {c.user_id === user?.id && editingId !== c.id && (
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                          <button onClick={() => { setEditingId(c.id); setEditText(c.content) }}
                            className="p-1 rounded text-zinc-500 hover:text-zinc-300 hover:bg-zinc-700 transition-colors">
                            <Pencil className="h-3 w-3" />
                          </button>
                          <button onClick={() => handleDeleteComment(c.id)}
                            className="p-1 rounded text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-colors">
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      )}
                    </div>
                    {editingId === c.id ? (
                      <div className="mt-1.5 flex gap-2">
                        <input value={editText} onChange={e => setEditText(e.target.value)}
                          maxLength={500} className="input-base flex-1 py-1.5 text-sm" autoFocus
                          onKeyDown={e => { if (e.key === 'Escape') { setEditingId(null); setEditText('') } }} />
                        <button onClick={() => handleEditComment(c.id)}
                          disabled={savingEdit || !editText.trim()} className="btn-primary px-2 py-1.5">
                          {savingEdit ? <Spinner size="sm" /> : <Check className="h-3.5 w-3.5" />}
                        </button>
                        <button onClick={() => { setEditingId(null); setEditText('') }}
                          className="px-2 py-1.5 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-zinc-700 transition-colors">
                          <XIcon className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ) : (
                      <p className="text-sm text-zinc-300 mt-0.5">{c.content}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex gap-3 pt-4 border-t border-zinc-800">
          <UserAvatar profile={profile} email={user?.email} size="sm" />
          <div className="flex-1 flex gap-2">
            <input value={text} onChange={e => setText(e.target.value)}
              placeholder="Yorum yaz..." maxLength={500} className="input-base flex-1 py-2 text-sm" />
            <button type="submit" disabled={!text.trim() || sending} className="btn-primary px-3 py-2">
              {sending ? <Spinner size="sm" /> : <Send className="h-4 w-4" />}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

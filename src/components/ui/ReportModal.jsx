import { useState } from 'react'
import { X, Flag, ShieldOff } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import Spinner from './Spinner'
import toast from 'react-hot-toast'

const REASONS = [
  'Spam veya yanıltıcı içerik',
  'Uygunsuz / müstehcen içerik',
  'Hakaret veya taciz',
  'Nefret söylemi',
  'Şiddet veya tehdit',
  'Diğer',
]

export default function ReportModal({ reportedUserId, postId, targetId, onClose, onBlock }) {
  const { user } = useAuth()
  const [mode, setMode]     = useState('report')
  const [reason, setReason] = useState('')
  const [sending, setSending] = useState(false)

  const userId = reportedUserId || null
  const pid    = postId || targetId || null

  async function handleReport() {
    if (!reason) { toast.error('Bir sebep seç'); return }
    setSending(true)
    await supabase.from('reports').insert({
      reporter_id: user.id,
      reported_user_id: userId,
      post_id: pid,
      reason,
    })
    toast.success('Şikayet iletildi. İncelenecektir.')
    onClose()
  }

  async function handleBlock() {
    setSending(true)
    const { error } = await supabase.from('blocks').insert({ blocker_id: user.id, blocked_id: userId })
    if (!error || error.code === '23505') {
      toast.success('Kullanıcı engellendi')
      onBlock?.()
      onClose()
    } else {
      toast.error('Engellenemedi')
    }
    setSending(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-xs bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
          <h3 className="font-semibold text-white text-sm">
            {mode === 'block' ? 'Kullanıcıyı Engelle' : 'Şikayet Et'}
          </h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-500">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-4">
          {userId && (
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setMode('report')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium border transition-all ${
                  mode === 'report' ? 'border-red-500/40 text-red-400 bg-red-500/10' : 'border-zinc-700 text-zinc-500 hover:border-zinc-600'
                }`}
              >
                <Flag className="h-3.5 w-3.5" /> Şikayet
              </button>
              <button
                onClick={() => setMode('block')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium border transition-all ${
                  mode === 'block' ? 'border-orange-500/40 text-orange-400 bg-orange-500/10' : 'border-zinc-700 text-zinc-500 hover:border-zinc-600'
                }`}
              >
                <ShieldOff className="h-3.5 w-3.5" /> Engelle
              </button>
            </div>
          )}

          {mode === 'report' && (
            <div className="space-y-2">
              {REASONS.map(r => (
                <button
                  key={r}
                  onClick={() => setReason(r)}
                  className={`w-full text-left text-xs px-3 py-2.5 rounded-xl border transition-all ${
                    reason === r
                      ? 'border-red-500/40 text-red-300 bg-red-500/10'
                      : 'border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:bg-zinc-800/50'
                  }`}
                >
                  {r}
                </button>
              ))}
              <button
                onClick={handleReport}
                disabled={!reason || sending}
                className="w-full btn-primary mt-3 py-2.5 text-sm flex items-center justify-center gap-2"
              >
                {sending ? <Spinner size="sm" /> : <><Flag className="h-3.5 w-3.5" />Şikayet Gönder</>}
              </button>
            </div>
          )}

          {mode === 'block' && (
            <div>
              <p className="text-sm text-zinc-400 mb-4 leading-relaxed">
                Bu kullanıcıyı engellerseniz birbirinizin içeriklerini göremez ve mesajlaşamazsınız.
              </p>
              <button
                onClick={handleBlock}
                disabled={sending}
                className="w-full py-2.5 rounded-xl border border-orange-500/30 text-orange-400 bg-orange-500/10 hover:bg-orange-500/20 text-sm font-medium transition-all flex items-center justify-center gap-2"
              >
                {sending ? <Spinner size="sm" /> : <><ShieldOff className="h-4 w-4" />Kullanıcıyı Engelle</>}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

import { useEffect, useState } from 'react'
import { Shield, Flag, User, Trash2, Eye, AlertTriangle, UserX, Users, Search, CheckCircle2, XCircle } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { Link, Navigate } from 'react-router-dom'
import UserAvatar from '../components/ui/UserAvatar'
import Spinner from '../components/ui/Spinner'
import PlanBadge from '../components/ui/PlanBadge'
import toast from 'react-hot-toast'

const TABS = [
  { id: 'reports', label: 'Raporlar', icon: Flag },
  { id: 'users',   label: 'Kullanıcılar', icon: Users },
]

export default function Admin() {
  const { profile } = useAuth()
  const [tab, setTab] = useState('reports')
  const [reports, setReports] = useState([])
  const [users, setUsers] = useState([])
  const [userSearch, setUserSearch] = useState('')
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (profile?.role === 'admin') fetchReports()
    else setLoading(false)
  }, [profile?.role])

  useEffect(() => {
    if (tab === 'users' && profile?.role === 'admin') fetchUsers()
  }, [tab])

  async function fetchUsers(search = '') {
    setLoadingUsers(true)
    let q = supabase
      .from('profiles')
      .select('id, full_name, avatar_url, role, plan, banned, created_at')
      .order('created_at', { ascending: false })
      .limit(100)
    if (search.trim()) q = q.ilike('full_name', `%${search.trim()}%`)
    const { data } = await q
    setUsers(data || [])
    setLoadingUsers(false)
  }

  async function fetchReports() {
    setLoading(true)
    const { data, error } = await supabase
      .from('reports')
      .select(`
        *,
        reporter:profiles!reports_reporter_id_fkey(id, full_name, avatar_url, role),
        reported_user:profiles!reports_reported_user_id_fkey(id, full_name, avatar_url, role)
      `)
      .order('created_at', { ascending: false })
      .limit(100)
    if (error) toast.error('Raporlar yüklenemedi')
    else setReports(data || [])
    setLoading(false)
  }

  async function handleDeleteReport(id) {
    if (!confirm('Bu raporu silmek istiyor musun?')) return
    const { error } = await supabase.from('reports').delete().eq('id', id)
    if (error) toast.error('Silinemedi')
    else {
      setReports(prev => prev.filter(r => r.id !== id))
      toast.success('Rapor silindi')
    }
  }

  async function handleBanUser(userId, userName) {
    if (!confirm(`${userName || 'Bu kullanıcıyı'} yasaklamak istediğine emin misin? Hesap silinmez ama giriş yapamaz.`)) return
    const { error } = await supabase.from('profiles').update({ banned: true }).eq('id', userId)
    if (error) { toast.error('İşlem başarısız'); return }
    toast.success('Kullanıcı yasaklandı')
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, banned: true } : u))
    fetchReports()
  }

  async function handleUnbanUser(userId, userName) {
    if (!confirm(`${userName || 'Bu kullanıcının'} yasağını kaldırmak istiyor musun?`)) return
    const { error } = await supabase.from('profiles').update({ banned: false }).eq('id', userId)
    if (error) { toast.error('İşlem başarısız'); return }
    toast.success('Yasak kaldırıldı')
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, banned: false } : u))
  }

  if (profile && profile.role !== 'admin') return <Navigate to="/" replace />

  const timeAgo = ts => {
    const diff = Date.now() - new Date(ts).getTime()
    const m = Math.floor(diff / 60000)
    if (m < 60) return `${m}d önce`
    const h = Math.floor(m / 60)
    if (h < 24) return `${h}s önce`
    return `${Math.floor(h / 24)}g önce`
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="h-10 w-10 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-center">
          <Shield className="h-5 w-5 text-red-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white">Yönetici Paneli</h1>
          <p className="text-xs text-zinc-500">Topluluk moderasyonu</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-1">
            <Flag className="h-4 w-4 text-red-400" />
            <span className="text-xs text-zinc-500">Toplam Rapor</span>
          </div>
          <p className="text-2xl font-bold text-white">{reports.length}</p>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="h-4 w-4 text-orange-400" />
            <span className="text-xs text-zinc-500">Bugün</span>
          </div>
          <p className="text-2xl font-bold text-white">
            {reports.filter(r => new Date(r.created_at).toDateString() === new Date().toDateString()).length}
          </p>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-1">
            <User className="h-4 w-4 text-zinc-400" />
            <span className="text-xs text-zinc-500">Benzersiz Kullanıcı</span>
          </div>
          <p className="text-2xl font-bold text-white">
            {new Set(reports.map(r => r.reported_user_id).filter(Boolean)).size}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-zinc-800 mb-5">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setTab(id)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === id ? 'border-red-500 text-red-400' : 'border-transparent text-zinc-500 hover:text-zinc-300'
            }`}>
            <Icon className="h-3.5 w-3.5" />
            {label}
          </button>
        ))}
      </div>

      {/* Users tab */}
      {tab === 'users' && (
        <div>
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
            <input
              value={userSearch}
              onChange={e => { setUserSearch(e.target.value); fetchUsers(e.target.value) }}
              placeholder="İsme göre ara..."
              className="input-base pl-10"
            />
          </div>
          {loadingUsers ? (
            <div className="flex justify-center py-16"><Spinner size="lg" /></div>
          ) : users.length === 0 ? (
            <div className="text-center py-16">
              <Users className="h-12 w-12 text-zinc-800 mx-auto mb-3" />
              <p className="text-zinc-500">Kullanıcı bulunamadı</p>
            </div>
          ) : (
            <div className="space-y-2">
              {users.map(u => (
                <div key={u.id} className="card p-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <Link to={`/profile/${u.id}`}>
                      <UserAvatar profile={u} size="sm" />
                    </Link>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Link to={`/profile/${u.id}`} className="text-sm font-medium text-white hover:text-brand-400 transition-colors truncate">
                          {u.full_name || 'İsimsiz'}
                        </Link>
                        {u.banned && (
                          <span className="text-[10px] font-bold text-red-400 bg-red-500/10 border border-red-500/20 px-1.5 py-0.5 rounded-full">Yasaklı</span>
                        )}
                        {u.plan && u.plan !== 'free' && <PlanBadge plan={u.plan} size="xs" />}
                      </div>
                      <div className="text-xs text-zinc-600 flex items-center gap-2">
                        <span>{u.role === 'pro' ? 'Servis Uzmanı' : u.role === 'admin' ? 'Admin' : 'Araç Sahibi'}</span>
                        <span>·</span>
                        <span>{new Date(u.created_at).toLocaleDateString('tr-TR')}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Link to={`/profile/${u.id}`}
                      className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-zinc-400 border border-zinc-700 rounded-lg hover:border-zinc-500 hover:text-zinc-200 transition-colors">
                      <Eye className="h-3 w-3" /> Profil
                    </Link>
                    {u.banned ? (
                      <button onClick={() => handleUnbanUser(u.id, u.full_name)}
                        className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-green-400 border border-green-500/30 rounded-lg hover:bg-green-500/10 transition-colors">
                        <CheckCircle2 className="h-3 w-3" /> Yasağı Kaldır
                      </button>
                    ) : (
                      <button onClick={() => handleBanUser(u.id, u.full_name)}
                        className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-orange-400 border border-orange-500/30 rounded-lg hover:bg-orange-500/10 transition-colors">
                        <UserX className="h-3 w-3" /> Yasakla
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'reports' && loading ? (
        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
      ) : tab === 'reports' && reports.length === 0 ? (
        <div className="text-center py-16">
          <Flag className="h-12 w-12 text-zinc-800 mx-auto mb-3" />
          <p className="text-zinc-500">Henüz rapor yok</p>
        </div>
      ) : tab === 'reports' && (
        <div className="space-y-3">
          {reports.map(r => (
            <div key={r.id} className="card p-4 hover:border-zinc-700 transition-colors">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className="inline-flex items-center gap-1 text-[10px] text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full">
                      <Flag className="h-2.5 w-2.5" />
                      Rapor
                    </span>
                    <span className="text-[10px] text-zinc-600">{timeAgo(r.created_at)}</span>
                  </div>

                  {/* Reason */}
                  <p className="text-sm text-zinc-300 font-medium mb-3 line-clamp-2">{r.reason}</p>

                  <div className="grid sm:grid-cols-2 gap-3">
                    {/* Reporter */}
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-zinc-600 shrink-0">Raporlayan:</span>
                      {r.reporter ? (
                        <Link to={`/profile/${r.reporter.id}`} className="flex items-center gap-1.5 hover:text-brand-400 transition-colors">
                          <UserAvatar profile={r.reporter} size="xs" />
                          <span className="text-xs text-zinc-400 truncate">{r.reporter.full_name || 'İsimsiz'}</span>
                        </Link>
                      ) : <span className="text-xs text-zinc-600">Bilinmiyor</span>}
                    </div>

                    {/* Reported user */}
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-zinc-600 shrink-0">Raporlanan:</span>
                      {r.reported_user ? (
                        <Link to={`/profile/${r.reported_user.id}`} className="flex items-center gap-1.5 hover:text-red-400 transition-colors">
                          <UserAvatar profile={r.reported_user} size="xs" />
                          <span className="text-xs text-zinc-300 font-medium truncate">{r.reported_user.full_name || 'İsimsiz'}</span>
                        </Link>
                      ) : <span className="text-xs text-zinc-600">Bilinmiyor</span>}
                    </div>
                  </div>

                  {/* Post link if applicable */}
                  {r.post_id && (
                    <div className="mt-2">
                      <span className="text-[10px] text-zinc-600">Şikayet edilen gönderi ID: </span>
                      <span className="text-[10px] font-mono text-zinc-500">{r.post_id.slice(0, 8)}…</span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2 shrink-0">
                  {r.reported_user_id && (
                    <Link
                      to={`/profile/${r.reported_user_id}`}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-zinc-400 border border-zinc-700 rounded-lg hover:border-zinc-500 hover:text-zinc-200 transition-colors"
                    >
                      <Eye className="h-3 w-3" />
                      Profil
                    </Link>
                  )}
                  {r.reported_user_id && (
                    <button
                      onClick={() => handleBanUser(r.reported_user_id, r.reported_user?.full_name)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-orange-400 border border-orange-500/30 rounded-lg hover:bg-orange-500/10 transition-colors"
                    >
                      <UserX className="h-3 w-3" />
                      Yasakla
                    </button>
                  )}
                  <button
                    onClick={() => handleDeleteReport(r.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-red-400 border border-red-500/30 rounded-lg hover:bg-red-500/10 transition-colors"
                  >
                    <Trash2 className="h-3 w-3" />
                    Sil
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

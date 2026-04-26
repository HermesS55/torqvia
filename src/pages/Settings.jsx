import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Shield, Lock, Bell, User, Eye, EyeOff,
  Phone, Mail, ChevronRight, Check, AlertTriangle,
  KeyRound, Trash2, Moon,
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import Spinner from '../components/ui/Spinner'
import toast from 'react-hot-toast'
import { sanitizeText } from '../lib/security'

function SectionTitle({ icon: Icon, title, desc }) {
  return (
    <div className="flex items-start gap-3 mb-5">
      <div className="p-2 rounded-xl bg-zinc-800 border border-zinc-700 mt-0.5">
        <Icon className="h-4 w-4 text-brand-400" />
      </div>
      <div>
        <h2 className="font-semibold text-white">{title}</h2>
        {desc && <p className="text-xs text-zinc-500 mt-0.5">{desc}</p>}
      </div>
    </div>
  )
}

function Toggle({ checked, onChange, disabled }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none disabled:opacity-50
        ${checked ? 'bg-brand-500' : 'bg-zinc-700'}`}
    >
      <span
        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform
          ${checked ? 'translate-x-5' : 'translate-x-0'}`}
      />
    </button>
  )
}

function SettingRow({ icon: Icon, label, desc, children }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3.5 border-b border-zinc-800/60 last:border-0">
      <div className="flex items-center gap-3 min-w-0">
        {Icon && <Icon className="h-4 w-4 text-zinc-500 shrink-0" />}
        <div className="min-w-0">
          <p className="text-sm font-medium text-zinc-200">{label}</p>
          {desc && <p className="text-xs text-zinc-600 mt-0.5">{desc}</p>}
        </div>
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  )
}

export default function Settings() {
  const { user, profile, refetchProfile, updatePassword } = useAuth()
  const [tab, setTab] = useState('privacy')

  const tabs = [
    { id: 'privacy',   label: 'Gizlilik',  icon: Shield },
    { id: 'account',   label: 'Hesap',     icon: User },
    { id: 'security',  label: 'Güvenlik',  icon: Lock },
  ]

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-white">Ayarlar</h1>
        <p className="text-zinc-500 text-sm mt-0.5">Hesap ve gizlilik tercihlerini yönet</p>
      </div>

      <div className="flex gap-1 border-b border-zinc-800 mb-6">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === t.id
                ? 'border-brand-500 text-brand-400'
                : 'border-transparent text-zinc-500 hover:text-zinc-300'
            }`}>
            <t.icon className="h-4 w-4" />
            {t.label}
          </button>
        ))}
      </div>

      <div className="card p-5">
        {tab === 'privacy'  && <PrivacyTab profile={profile} user={user} refetchProfile={refetchProfile} />}
        {tab === 'account'  && <AccountTab profile={profile} user={user} refetchProfile={refetchProfile} />}
        {tab === 'security' && <SecurityTab updatePassword={updatePassword} user={user} />}
      </div>
    </div>
  )
}

/* ─── Privacy Tab ─── */
function PrivacyTab({ profile, refetchProfile }) {
  const [saving, setSaving] = useState({})

  async function toggle(field, value) {
    setSaving(s => ({ ...s, [field]: true }))
    const { error } = await supabase.from('profiles').update({ [field]: value }).eq('id', profile.id)
    if (error) toast.error('Kaydedilemedi')
    else { await refetchProfile(); toast.success('Kaydedildi') }
    setSaving(s => ({ ...s, [field]: false }))
  }

  if (!profile) return <div className="flex justify-center py-10"><Spinner /></div>

  return (
    <div>
      <SectionTitle icon={Shield} title="Gizlilik Ayarları" desc="Profilinde hangi bilgilerin görüneceğini seç" />

      <div className="space-y-0 divide-y divide-zinc-800/60">
        <SettingRow
          icon={Phone}
          label="Telefon numarası"
          desc={profile.phone_public ? 'Herkese açık' : 'Sadece sen görüyorsun'}
        >
          <div className="flex items-center gap-2">
            {profile.phone_public
              ? <Eye className="h-3.5 w-3.5 text-green-500" />
              : <EyeOff className="h-3.5 w-3.5 text-zinc-600" />
            }
            <Toggle
              checked={!!profile.phone_public}
              onChange={v => toggle('phone_public', v)}
              disabled={saving.phone_public}
            />
          </div>
        </SettingRow>

        <SettingRow
          icon={Mail}
          label="E-posta adresi"
          desc={profile.email_public ? 'Herkese açık' : 'Sadece sen görüyorsun'}
        >
          <div className="flex items-center gap-2">
            {profile.email_public
              ? <Eye className="h-3.5 w-3.5 text-green-500" />
              : <EyeOff className="h-3.5 w-3.5 text-zinc-600" />
            }
            <Toggle
              checked={!!profile.email_public}
              onChange={v => toggle('email_public', v)}
              disabled={saving.email_public}
            />
          </div>
        </SettingRow>

      </div>

      <div className="mt-5 p-3.5 rounded-xl bg-zinc-800/50 border border-zinc-700/50">
        <p className="text-xs text-zinc-500 leading-relaxed">
          Telefon ve e-posta gizliliğini profilinde kimlerin görebileceğini belirler.
        </p>
      </div>
    </div>
  )
}

/* ─── Account Tab ─── */
function AccountTab({ profile, user, refetchProfile }) {
  const [form, setForm] = useState({
    full_name: profile?.full_name || '',
    phone: profile?.phone || '',
    bio: profile?.bio || '',
  })
  const [saving, setSaving] = useState(false)

  async function save() {
    setSaving(true)
    const { error } = await supabase.from('profiles').update({
      full_name: sanitizeText(form.full_name, 80),
      phone: sanitizeText(form.phone, 20),
      bio: sanitizeText(form.bio, 300),
    }).eq('id', user.id)
    if (error) toast.error('Kaydedilemedi')
    else { await refetchProfile(); toast.success('Bilgiler güncellendi!') }
    setSaving(false)
  }

  return (
    <div>
      <SectionTitle icon={User} title="Hesap Bilgileri" desc="Temel profil bilgilerini düzenle" />

      <div className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-zinc-400 mb-1.5">Ad Soyad</label>
          <input value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
            className="input-base" placeholder="Adın ve soyadın" />
        </div>
        <div>
          <label className="block text-xs font-medium text-zinc-400 mb-1.5">Telefon</label>
          <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
            className="input-base" placeholder="+90 555 000 0000" />
        </div>
        <div>
          <label className="block text-xs font-medium text-zinc-400 mb-1.5">Hakkında</label>
          <textarea value={form.bio} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
            rows={3} maxLength={300} className="input-base resize-none" placeholder="Kendini kısaca anlat..." />
          <p className="text-xs text-zinc-700 mt-1 text-right">{form.bio.length}/300</p>
        </div>

        <div>
          <label className="block text-xs font-medium text-zinc-400 mb-1.5">E-posta</label>
          <div className="input-base opacity-50 cursor-not-allowed flex items-center gap-2">
            <Mail className="h-4 w-4 text-zinc-600" />
            <span className="text-zinc-500">{user?.email}</span>
          </div>
          <p className="text-xs text-zinc-700 mt-1">E-posta değiştirmek için destek ile iletişime geç</p>
        </div>

        <button onClick={save} disabled={saving} className="btn-primary w-full flex items-center justify-center gap-2">
          {saving ? <Spinner size="sm" /> : <Check className="h-4 w-4" />}
          Kaydet
        </button>
      </div>
    </div>
  )
}

/* ─── Security Tab ─── */
function SecurityTab({ updatePassword, user }) {
  const navigate = useNavigate()
  const { signOut } = useAuth()
  const [form, setForm] = useState({ newPass: '', confirm: '' })
  const [saving, setSaving] = useState(false)
  const [showPass, setShowPass] = useState(false)
  const [deleteStep, setDeleteStep] = useState(0) // 0=hidden, 1=confirm, 2=typing
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [deleting, setDeleting] = useState(false)

  async function changePassword() {
    if (form.newPass.length < 8) { toast.error('Şifre en az 8 karakter olmalı'); return }
    if (form.newPass !== form.confirm) { toast.error('Şifreler eşleşmiyor'); return }
    setSaving(true)
    try {
      await updatePassword(form.newPass)
      toast.success('Şifre güncellendi!')
      setForm({ newPass: '', confirm: '' })
    } catch (e) {
      toast.error(e.message || 'Şifre güncellenemedi')
    } finally {
      setSaving(false)
    }
  }

  async function handleDeleteAccount() {
    if (deleteConfirmText !== 'hesabımı sil') {
      toast.error('Onay metni hatalı')
      return
    }
    setDeleting(true)
    try {
      const { error } = await supabase.rpc('delete_my_account')
      if (error) throw error
      await signOut()
      navigate('/')
      toast.success('Hesabın silindi')
    } catch (e) {
      toast.error('Hesap silinemedi: ' + (e.message || ''))
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div>
      <SectionTitle icon={Lock} title="Güvenlik" desc="Şifreni güvenli tut" />

      <div className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-zinc-400 mb-1.5">Yeni Şifre</label>
          <div className="relative">
            <input
              type={showPass ? 'text' : 'password'}
              value={form.newPass}
              onChange={e => setForm(f => ({ ...f, newPass: e.target.value }))}
              className="input-base pr-10"
              placeholder="En az 8 karakter"
            />
            <button type="button" onClick={() => setShowPass(v => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300">
              {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-zinc-400 mb-1.5">Yeni Şifre (Tekrar)</label>
          <input
            type={showPass ? 'text' : 'password'}
            value={form.confirm}
            onChange={e => setForm(f => ({ ...f, confirm: e.target.value }))}
            className="input-base"
            placeholder="Şifreyi tekrar gir"
          />
          {form.confirm && form.newPass !== form.confirm && (
            <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" /> Şifreler eşleşmiyor
            </p>
          )}
          {form.confirm && form.newPass === form.confirm && form.newPass.length >= 8 && (
            <p className="text-xs text-green-400 mt-1 flex items-center gap-1">
              <Check className="h-3 w-3" /> Şifreler eşleşiyor
            </p>
          )}
        </div>

        <button
          onClick={changePassword}
          disabled={saving || !form.newPass || !form.confirm}
          className="btn-primary w-full flex items-center justify-center gap-2"
        >
          {saving ? <Spinner size="sm" /> : <KeyRound className="h-4 w-4" />}
          Şifreyi Güncelle
        </button>
      </div>

      {/* Delete Account */}
      <div className="mt-8 pt-6 border-t border-zinc-800">
        <SectionTitle icon={Trash2} title="Tehlikeli Bölge" desc="Bu işlemler geri alınamaz" />

        {deleteStep === 0 && (
          <div className="p-4 rounded-xl border border-red-500/20 bg-red-500/5">
            <p className="text-sm text-zinc-400 mb-3">
              Hesabını ve tüm verilerini kalıcı olarak silmek istiyorsan devam et.
              Bu işlem <span className="text-red-400 font-medium">geri alınamaz</span>.
            </p>
            <button
              onClick={() => setDeleteStep(1)}
              className="flex items-center gap-2 text-sm text-red-400 hover:text-red-300 font-medium transition-colors"
            >
              <Trash2 className="h-4 w-4" />
              Hesabımı Sil
            </button>
          </div>
        )}

        {deleteStep === 1 && (
          <div className="p-4 rounded-xl border border-red-500/40 bg-red-500/10 space-y-4">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-red-300">Emin misin?</p>
                <p className="text-xs text-zinc-500 mt-1">
                  Tüm paylaşımların, mesajların, ilanların ve profil bilgilerin kalıcı olarak silinecek.
                </p>
              </div>
            </div>
            <p className="text-xs text-zinc-400">
              Devam etmek için aşağıya <span className="font-mono font-bold text-red-400">hesabımı sil</span> yazın:
            </p>
            <input
              value={deleteConfirmText}
              onChange={e => setDeleteConfirmText(e.target.value)}
              placeholder="hesabımı sil"
              className="input-base border-red-500/30 focus:border-red-500/60 font-mono text-sm"
            />
            <div className="flex gap-3">
              <button onClick={() => { setDeleteStep(0); setDeleteConfirmText('') }}
                className="btn-secondary flex-1 text-sm">
                İptal
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleting || deleteConfirmText !== 'hesabımı sil'}
                className="flex-1 flex items-center justify-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-xl bg-red-500/20 border border-red-500/40 text-red-400 hover:bg-red-500/30 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                {deleting ? <Spinner size="sm" /> : <Trash2 className="h-4 w-4" />}
                Kalıcı Olarak Sil
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

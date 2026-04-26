import { Wrench, MessageSquare, Check, X, Clock, Calendar, CalendarCheck, CheckCircle2 } from 'lucide-react'
import Spinner from '../ui/Spinner'
import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import toast from 'react-hot-toast'

const STATUS = {
  pending:   { label: 'Beklemede',    cls: 'bg-amber-500/10 text-amber-400 border-amber-500/30' },
  accepted:  { label: 'Kabul Edildi', cls: 'bg-green-500/10 text-green-400 border-green-500/30' },
  rejected:  { label: 'Reddedildi',  cls: 'bg-red-500/10 text-red-400 border-red-500/30' },
  completed: { label: 'Tamamlandı',  cls: 'bg-blue-500/10 text-blue-400 border-blue-500/30' },
}

function AppointmentForm({ offerId, current, onSaved }) {
  const [date, setDate] = useState(current ? current.split('T')[0] : '')
  const [time, setTime] = useState(current ? current.split('T')[1]?.slice(0, 5) : '')
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)

  async function save() {
    if (!date) { toast.error('Tarih seçiniz'); return }
    setSaving(true)
    const dt = time ? `${date}T${time}:00` : `${date}T09:00:00`
    const { error } = await supabase.from('offers')
      .update({ appointment_date: dt, appointment_note: note.trim() || null })
      .eq('id', offerId)
    if (error) toast.error('Kaydedilemedi')
    else { toast.success('Randevu ayarlandı!'); onSaved(dt, note.trim() || null) }
    setSaving(false)
  }

  return (
    <div className="mt-3 p-3 bg-zinc-800/60 rounded-xl border border-zinc-700/50 space-y-2">
      <p className="text-xs font-semibold text-zinc-400 flex items-center gap-1.5">
        <Calendar className="h-3.5 w-3.5" /> Randevu Planla
      </p>
      <div className="grid grid-cols-2 gap-2">
        <input type="date" value={date} onChange={e => setDate(e.target.value)}
          className="input-base text-sm py-2" />
        <input type="time" value={time} onChange={e => setTime(e.target.value)}
          className="input-base text-sm py-2" />
      </div>
      <input value={note} onChange={e => setNote(e.target.value)} maxLength={200}
        className="input-base text-sm py-2" placeholder="Not (isteğe bağlı)..." />
      <button onClick={save} disabled={saving || !date}
        className="btn-primary w-full flex items-center justify-center gap-1.5 text-sm py-2">
        {saving ? <Spinner size="sm" /> : <><CalendarCheck className="h-3.5 w-3.5" /> Randevuyu Kaydet</>}
      </button>
    </div>
  )
}

export default function OfferCard({ offer: initialOffer, isOwner, onUpdateStatus }) {
  const [updating, setUpdating] = useState(null)
  const [offer, setOffer] = useState(initialOffer)
  const [showAppointmentForm, setShowAppointmentForm] = useState(false)

  async function handleStatus(status) {
    setUpdating(status)
    await onUpdateStatus(offer.id, status)
    setOffer(o => ({ ...o, status }))
    if (status === 'accepted') setShowAppointmentForm(true)
    setUpdating(null)
  }

  function handleAppointmentSaved(dt, note) {
    setOffer(o => ({ ...o, appointment_date: dt, appointment_note: note }))
    setShowAppointmentForm(false)
  }

  const status = STATUS[offer.status] || STATUS.pending
  const hasAppointment = !!offer.appointment_date

  const fmtDate = (dt) => {
    const d = new Date(dt)
    return d.toLocaleString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className={`card transition-all ${offer.status === 'accepted' ? 'border-green-500/20' : offer.status === 'rejected' ? 'opacity-60' : offer.status === 'completed' ? 'border-blue-500/20' : ''}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-xl ${offer.status === 'accepted' || offer.status === 'completed' ? 'bg-green-500/10' : 'bg-brand-500/10'}`}>
            {offer.status === 'completed'
              ? <CheckCircle2 className="h-4 w-4 text-blue-400" />
              : <Wrench className={`h-4 w-4 ${offer.status === 'accepted' ? 'text-green-400' : 'text-brand-400'}`} />
            }
          </div>
          <div>
            <span className="text-white font-bold text-lg">
              ₺{Number(offer.price).toLocaleString('tr-TR')}
            </span>
            <div className="mt-0.5">
              <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${status.cls}`}>
                {status.label}
              </span>
            </div>
          </div>
        </div>
        <div className="text-right shrink-0">
          {offer.profiles?.full_name && (
            <p className="text-xs text-zinc-400 font-medium">{offer.profiles.full_name}</p>
          )}
          <p className="text-[10px] text-zinc-600 mt-0.5">
            {new Date(offer.created_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' })}
          </p>
        </div>
      </div>

      {offer.message && (
        <div className="mt-3 flex items-start gap-2 p-3 bg-zinc-800/50 rounded-xl">
          <MessageSquare className="h-3.5 w-3.5 text-zinc-500 mt-0.5 shrink-0" />
          <p className="text-zinc-300 text-sm leading-relaxed whitespace-pre-wrap">{offer.message}</p>
        </div>
      )}

      {/* Appointment info */}
      {hasAppointment && (
        <div className="mt-3 flex items-start gap-2 p-3 bg-green-500/5 rounded-xl border border-green-500/20">
          <CalendarCheck className="h-3.5 w-3.5 text-green-400 mt-0.5 shrink-0" />
          <div>
            <p className="text-xs font-semibold text-green-400">Randevu: {fmtDate(offer.appointment_date)}</p>
            {offer.appointment_note && (
              <p className="text-xs text-zinc-500 mt-0.5">{offer.appointment_note}</p>
            )}
          </div>
          {isOwner && offer.status === 'accepted' && (
            <button onClick={() => setShowAppointmentForm(s => !s)}
              className="ml-auto text-xs text-zinc-500 hover:text-zinc-300 shrink-0">Düzenle</button>
          )}
        </div>
      )}

      {/* Owner actions for pending */}
      {isOwner && offer.status === 'pending' && onUpdateStatus && (
        <div className="flex gap-2 mt-4 pt-3 border-t border-zinc-800">
          <button onClick={() => handleStatus('accepted')} disabled={!!updating}
            className="flex-1 flex items-center justify-center gap-1.5 bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/30 rounded-xl py-2.5 text-sm font-medium transition-colors disabled:opacity-50">
            {updating === 'accepted' ? <Spinner size="sm" /> : <Check className="h-4 w-4" />}
            Kabul Et
          </button>
          <button onClick={() => handleStatus('rejected')} disabled={!!updating}
            className="flex-1 flex items-center justify-center gap-1.5 bg-zinc-800 hover:bg-red-500/10 text-zinc-400 hover:text-red-400 border border-zinc-700 hover:border-red-500/30 rounded-xl py-2.5 text-sm font-medium transition-colors disabled:opacity-50">
            {updating === 'rejected' ? <Spinner size="sm" /> : <X className="h-4 w-4" />}
            Reddet
          </button>
        </div>
      )}

      {/* Owner actions for accepted */}
      {isOwner && offer.status === 'accepted' && (
        <div className="mt-3 pt-3 border-t border-zinc-800 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs text-zinc-600 flex items-center gap-1">
              <Clock className="h-3 w-3" /> Bu teklifi kabul ettiniz
            </p>
            <div className="flex gap-2">
              {!hasAppointment && (
                <button onClick={() => setShowAppointmentForm(s => !s)}
                  className="text-xs text-brand-400 hover:text-brand-300 flex items-center gap-1 transition-colors">
                  <Calendar className="h-3 w-3" /> Randevu Planla
                </button>
              )}
              <button onClick={() => handleStatus('completed')} disabled={!!updating}
                className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors">
                {updating === 'completed' ? <Spinner size="sm" /> : <CheckCircle2 className="h-3 w-3" />}
                Tamamlandı İşaretle
              </button>
            </div>
          </div>
          {showAppointmentForm && (
            <AppointmentForm offerId={offer.id} current={offer.appointment_date} onSaved={handleAppointmentSaved} />
          )}
        </div>
      )}

      {isOwner && offer.status === 'rejected' && (
        <div className="mt-3 pt-3 border-t border-zinc-800">
          <p className="text-xs text-zinc-600 flex items-center gap-1">
            <Clock className="h-3 w-3" /> Bu teklifi reddettiniz
          </p>
        </div>
      )}

      {isOwner && offer.status === 'completed' && (
        <div className="mt-3 pt-3 border-t border-zinc-800">
          <p className="text-xs text-blue-400 flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" /> İş tamamlandı olarak işaretlendi
          </p>
        </div>
      )}
    </div>
  )
}

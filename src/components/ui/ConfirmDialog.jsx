import { useEffect } from 'react'
import { X, AlertTriangle } from 'lucide-react'

export default function ConfirmDialog({ open, title, message, confirmLabel = 'Evet', cancelLabel = 'İptal', danger = false, onConfirm, onCancel, children }) {
  useEffect(() => {
    if (!open) return
    function onKey(e) { if (e.key === 'Escape') onCancel() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onCancel])

  if (!open) return null

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 9998, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
      onClick={e => { if (e.target === e.currentTarget) onCancel() }}
    >
      <div style={{ background: '#111', border: '1px solid #222', borderRadius: 18, padding: 28, width: '100%', maxWidth: 400, boxShadow: '0 20px 60px rgba(0,0,0,0.7)' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 20 }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: danger ? 'rgba(239,68,68,0.1)' : 'rgba(255,107,0,0.1)', border: `1px solid ${danger ? 'rgba(239,68,68,0.25)' : 'rgba(255,107,0,0.25)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <AlertTriangle size={18} color={danger ? '#ef4444' : '#ff7a00'} />
          </div>
          <div style={{ flex: 1 }}>
            {title && <h3 style={{ fontSize: 15, fontWeight: 700, color: '#f0f0f0', margin: '0 0 6px' }}>{title}</h3>}
            {message && <p style={{ fontSize: 13, color: '#666', margin: 0, lineHeight: 1.6 }}>{message}</p>}
            {children}
          </div>
          <button onClick={onCancel} style={{ background: 'none', border: 'none', color: '#444', cursor: 'pointer', padding: 4, flexShrink: 0 }}>
            <X size={16} />
          </button>
        </div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button onClick={onCancel}
            style={{ padding: '9px 20px', borderRadius: 10, background: '#1a1a1a', border: '1px solid #2a2a2a', color: '#888', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            {cancelLabel}
          </button>
          <button onClick={onConfirm}
            style={{ padding: '9px 20px', borderRadius: 10, background: danger ? 'linear-gradient(135deg,#ef4444,#b91c1c)' : 'linear-gradient(135deg,#ff7a00,#ff5500)', border: 'none', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

import { Link } from 'react-router-dom'
import { CheckCircle2, Circle, ChevronRight } from 'lucide-react'
import { useProfileCompletion } from '../../hooks/useProfileCompletion'

export default function ProfileCompletionCard({ profile }) {
  const { pct, missing, checks } = useProfileCompletion(profile)

  // Don't show if profile is 100% complete
  if (pct >= 100) return null

  const color = pct < 40 ? '#ef4444' : pct < 70 ? '#f59e0b' : '#22c55e'

  return (
    <div style={{
      background: 'linear-gradient(135deg, #0d0d0d, #0b0b0b)',
      border: '1px solid #1a1a1a',
      borderLeft: `3px solid ${color}`,
      borderRadius: 14,
      padding: '18px 20px',
      marginBottom: 20,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div>
          <p style={{ fontFamily: 'monospace', fontSize: 9, color: '#444', textTransform: 'uppercase', letterSpacing: '0.18em', marginBottom: 4 }}>
            // PROFİL TAMAMLAMA
          </p>
          <p style={{ fontSize: 13, color: '#888' }}>
            Profilini tamamla, daha fazla kişiye ulaş
          </p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 28, fontWeight: 900, color, lineHeight: 1 }}>{pct}%</div>
          <div style={{ fontSize: 10, color: '#444', marginTop: 2 }}>tamamlandı</div>
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ height: 6, background: '#1a1a1a', borderRadius: 3, overflow: 'hidden', marginBottom: 14 }}>
        <div style={{
          height: '100%', width: `${pct}%`,
          background: `linear-gradient(90deg, ${color}, ${color}cc)`,
          borderRadius: 3,
          transition: 'width 0.8s ease',
        }} />
      </div>

      {/* Checklist (max 3 items) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14 }}>
        {checks.slice(0, 4).map(c => (
          <div key={c.key} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {c.done
              ? <CheckCircle2 size={13} style={{ color: '#22c55e', flexShrink: 0 }} />
              : <Circle size={13} style={{ color: '#333', flexShrink: 0 }} />
            }
            <span style={{ fontSize: 12, color: c.done ? '#555' : '#888' }}>{c.label}</span>
          </div>
        ))}
      </div>

      <Link
        to={`/profile/${profile?.id}`}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          fontSize: 12, fontWeight: 600, color: '#ff8c33',
          textDecoration: 'none',
        }}
      >
        Profili düzenle <ChevronRight size={13} />
      </Link>
    </div>
  )
}

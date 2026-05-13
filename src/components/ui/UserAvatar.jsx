import { useState } from 'react'
import { getInitials } from '../../lib/avatar'

const SIZES = {
  xs: 'h-6 w-6 text-[10px]',
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-14 w-14 text-lg',
  xl: 'h-20 w-20 text-2xl',
}

export default function UserAvatar({ profile, email, size = 'md', className = '', fill = false, style: customStyle }) {
  const [imgError, setImgError] = useState(false)
  const isOwner = profile?.role === 'owner'
  const ring = isOwner ? 'ring-2 ring-brand-500/40' : 'ring-2 ring-blue-500/40'
  const bg   = isOwner ? 'bg-brand-500/15 text-brand-400' : 'bg-blue-500/15 text-blue-400'

  const sizeClass  = fill ? '' : SIZES[size]
  const fillStyle  = fill ? { width: '100%', height: '100%', display: 'block', ...customStyle } : customStyle
  const avatarUrl  = profile?.avatar_url || profile?.profile_image_url

  if (avatarUrl && !imgError) {
    return (
      <img
        src={avatarUrl}
        alt={profile?.full_name || ''}
        className={`${sizeClass} rounded-full object-cover shrink-0 ${fill ? '' : ring} ${className}`}
        style={fillStyle}
        onError={() => setImgError(true)}
      />
    )
  }

  const initials = getInitials(email || profile?.full_name || '')
  const showSvg = initials === '?'

  return (
    <div
      className={`${sizeClass} rounded-full flex items-center justify-center font-bold shrink-0 ${bg} ${fill ? '' : ring} ${className}`}
      style={fillStyle}
    >
      {showSvg ? (
        <svg viewBox="0 0 40 40" fill="none" style={{ width: '55%', height: '55%' }}>
          <circle cx="20" cy="14" r="7" fill="currentColor" opacity="0.7" />
          <path d="M4 38c0-8.837 7.163-16 16-16s16 7.163 16 16" fill="currentColor" opacity="0.5" />
        </svg>
      ) : initials}
    </div>
  )
}

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
        className={`${sizeClass} rounded-full object-cover ${fill ? '' : ring} ${className}`}
        style={fillStyle}
        onError={() => setImgError(true)}
      />
    )
  }

  return (
    <div
      className={`${sizeClass} rounded-full flex items-center justify-center font-bold shrink-0 ${bg} ${fill ? '' : ring} ${className}`}
      style={fillStyle}
    >
      {getInitials(email || profile?.full_name || '')}
    </div>
  )
}

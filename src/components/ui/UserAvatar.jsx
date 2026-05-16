import { useState } from 'react'

const SIZES = {
  xs: 'h-6 w-6',
  sm: 'h-8 w-8',
  md: 'h-10 w-10',
  lg: 'h-14 w-14',
  xl: 'h-20 w-20',
}

function getDefaultAvatar(profile) {
  if (profile?.role === 'owner') return '/avatars/owner-default.png'
  if (profile?.role === 'pro') return '/avatars/pro-default.png'
  return '/avatars/owner-default.png'
}

export default function UserAvatar({ profile, size = 'md', className = '', fill = false, style: customStyle }) {
  const [imgError, setImgError] = useState(false)
  const [defaultError, setDefaultError] = useState(false)
  const isOwner = profile?.role === 'owner'
  const ring = isOwner ? 'ring-2 ring-brand-500/40' : 'ring-2 ring-blue-500/40'

  const sizeClass = fill ? '' : SIZES[size]
  const fillStyle = fill ? { width: '100%', height: '100%', display: 'block', objectFit: 'cover', ...customStyle } : customStyle

  const uploadedUrl = profile?.avatar_url || profile?.profile_image_url
  const defaultUrl = getDefaultAvatar(profile)

  const src = (uploadedUrl && !imgError) ? uploadedUrl : (!defaultError ? defaultUrl : null)

  if (src) {
    return (
      <img
        src={src}
        alt={profile?.full_name || ''}
        className={`${sizeClass} rounded-full object-cover shrink-0 ${fill ? '' : ring} ${className}`}
        style={fillStyle}
        onError={() => {
          if (uploadedUrl && !imgError) setImgError(true)
          else setDefaultError(true)
        }}
      />
    )
  }

  return (
    <div
      className={`${sizeClass} rounded-full flex items-center justify-center shrink-0 bg-zinc-800 ${fill ? '' : ring} ${className}`}
      style={fillStyle}
    >
      <svg viewBox="0 0 40 40" fill="none" style={{ width: '55%', height: '55%' }}>
        <circle cx="20" cy="14" r="7" fill="currentColor" opacity="0.5" className="text-zinc-500" />
        <path d="M4 38c0-8.837 7.163-16 16-16s16 7.163 16 16" fill="currentColor" opacity="0.4" className="text-zinc-500" />
      </svg>
    </div>
  )
}

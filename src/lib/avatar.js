import { supabase } from './supabase'

async function compressImage(file, maxWidth = 1280, quality = 0.82) {
  return new Promise(resolve => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      const ratio = Math.min(1, maxWidth / img.width)
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(img.width * ratio)
      canvas.height = Math.round(img.height * ratio)
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height)
      canvas.toBlob(
        blob => resolve(new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' })),
        'image/jpeg',
        quality
      )
    }
    img.onerror = () => { URL.revokeObjectURL(url); resolve(file) }
    img.src = url
  })
}

export async function uploadAvatar(userId, file) {
  const compressed = await compressImage(file, 400, 0.85)
  const path = `${userId}/avatar.jpg`
  const { error } = await supabase.storage
    .from('avatars')
    .upload(path, compressed, { upsert: true, contentType: 'image/jpeg' })
  if (error) throw error
  const { data } = supabase.storage.from('avatars').getPublicUrl(path)
  return `${data.publicUrl}?t=${Date.now()}`
}

export async function uploadPostImage(userId, file) {
  const compressed = await compressImage(file, 1280, 0.82)
  const path = `${userId}/${Date.now()}.jpg`
  const { error } = await supabase.storage
    .from('post-images')
    .upload(path, compressed, { upsert: false, contentType: 'image/jpeg' })
  if (error) throw error
  const { data } = supabase.storage.from('post-images').getPublicUrl(path)
  return data.publicUrl
}

export async function uploadPostVideo(userId, file) {
  const ext = file.name.split('.').pop()
  const path = `${userId}/${Date.now()}.${ext}`
  const { error } = await supabase.storage
    .from('post-videos')
    .upload(path, file, { upsert: false })
  if (error) throw error
  const { data } = supabase.storage.from('post-videos').getPublicUrl(path)
  return data.publicUrl
}

export async function uploadListingImage(userId, file) {
  const compressed = await compressImage(file, 3840, 0.96)
  const path = `${userId}/${Date.now()}.jpg`
  const { error } = await supabase.storage
    .from('listing-images')
    .upload(path, compressed, { upsert: false, contentType: 'image/jpeg' })
  if (error) throw error
  const { data } = supabase.storage.from('listing-images').getPublicUrl(path)
  return data.publicUrl
}

export async function uploadVehicleImage(userId, file) {
  const compressed = await compressImage(file, 3840, 0.96)
  const path = `vehicles/${userId}/${Date.now()}.jpg`
  const { error } = await supabase.storage
    .from('listing-images')
    .upload(path, compressed, { upsert: false, contentType: 'image/jpeg' })
  if (error) throw error
  const { data } = supabase.storage.from('listing-images').getPublicUrl(path)
  return data.publicUrl
}

export async function uploadEventImage(userId, file) {
  const compressed = await compressImage(file, 1280, 0.82)
  const path = `events/${userId}/${Date.now()}.jpg`
  const { error } = await supabase.storage
    .from('post-images')
    .upload(path, compressed, { upsert: false, contentType: 'image/jpeg' })
  if (error) throw error
  const { data } = supabase.storage.from('post-images').getPublicUrl(path)
  return data.publicUrl
}

export function getInitials(name = '') {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return '?'
}

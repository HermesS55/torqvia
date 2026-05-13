import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(base64)
  return Uint8Array.from([...raw].map(c => c.charCodeAt(0)))
}

export function usePushNotifications() {
  const { user } = useAuth()
  const [permission, setPermission] = useState(
    typeof Notification !== 'undefined' ? Notification.permission : 'denied'
  )
  const [subscribed, setSubscribed] = useState(false)
  const [loading, setLoading] = useState(false)
  const supported = typeof Notification !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window

  useEffect(() => {
    if (!supported || !user?.id) return
    // Check if already subscribed
    navigator.serviceWorker.ready.then(async reg => {
      const sub = await reg.pushManager.getSubscription()
      if (sub) setSubscribed(true)
    })
  }, [user?.id, supported])

  const subscribe = useCallback(async () => {
    if (!supported || !user?.id) return
    setLoading(true)
    try {
      const perm = await Notification.requestPermission()
      setPermission(perm)
      if (perm !== 'granted') return

      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      })

      const { endpoint, keys } = sub.toJSON()
      await supabase.from('push_subscriptions').upsert({
        user_id: user.id,
        endpoint,
        p256dh: keys.p256dh,
        auth: keys.auth,
      }, { onConflict: 'user_id,endpoint' })

      setSubscribed(true)
    } catch (err) {
      console.error('Push subscription failed:', err)
    } finally {
      setLoading(false)
    }
  }, [supported, user?.id])

  const unsubscribe = useCallback(async () => {
    if (!supported || !user?.id) return
    setLoading(true)
    try {
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.getSubscription()
      if (sub) {
        const { endpoint } = sub.toJSON()
        await sub.unsubscribe()
        await supabase.from('push_subscriptions').delete()
          .eq('user_id', user.id).eq('endpoint', endpoint)
        setSubscribed(false)
      }
    } finally {
      setLoading(false)
    }
  }, [supported, user?.id])

  return { supported, permission, subscribed, loading, subscribe, unsubscribe }
}

import { useMemo } from 'react'
import { useAuth } from '../contexts/AuthContext'

const TRIAL_DAYS = 14
export const FREE_TALEP_UNLOCK_LIMIT = 3

export function useSubscription() {
  const { profile } = useAuth()

  const trialInfo = useMemo(() => {
    const dbPlan = profile?.plan || 'free'
    if (dbPlan !== 'free' || !profile?.trial_start_date) {
      return { isTrialing: false, trialDaysLeft: 0, trialEnded: false }
    }
    const trialEnd = new Date(new Date(profile.trial_start_date).getTime() + TRIAL_DAYS * 86400000)
    const daysLeft = Math.ceil((trialEnd - new Date()) / 86400000)
    return {
      isTrialing: daysLeft > 0,
      trialDaysLeft: Math.max(0, daysLeft),
      trialEnded: daysLeft <= 0,
    }
  }, [profile?.trial_start_date, profile?.plan])

  const effectivePlan = useMemo(() => {
    if (!profile) return 'free'
    const dbPlan = profile.plan || 'free'
    if (dbPlan !== 'free') return dbPlan
    return trialInfo.isTrialing ? 'turbo' : 'free'
  }, [profile?.plan, trialInfo.isTrialing])

  const can = useMemo(() => ({
    talepIletisimGor: effectivePlan !== 'free',
    messaging: effectivePlan !== 'free',
    sendOffer: effectivePlan !== 'free',
    appointments: effectivePlan !== 'free',
    reviewReply: effectivePlan !== 'free',
    unlimitedPhotos: effectivePlan !== 'free',
    viewStats: effectivePlan !== 'free',
    analytics: effectivePlan === 'elite',
    priorityListing: effectivePlan === 'elite',
    verifiedBadge: effectivePlan === 'elite',
  }), [effectivePlan])

  // TODO: DB column is `lifetime_leads_unlocked` on profiles table — keep in sync if column is renamed
  const freeTalepUnlocksLeft = Math.max(0, FREE_TALEP_UNLOCK_LIMIT - (profile?.lifetime_leads_unlocked ?? 0))

  return {
    effectivePlan,
    isTrialing: trialInfo.isTrialing,
    trialDaysLeft: trialInfo.trialDaysLeft,
    trialEnded: trialInfo.trialEnded,
    can,
    freeTalepUnlocksLeft,
    isPro: profile?.role === 'pro',
  }
}

import { Flame, Zap } from 'lucide-react'

const PLANS = {
  turbo: {
    icon: Flame,
    label: 'Turbo',
    pill: 'bg-gradient-to-r from-orange-500/25 to-red-500/20 border-orange-400/50 text-orange-300',
    icon_cls: 'text-orange-400',
    glow: 'shadow-[0_0_8px_rgba(249,115,22,0.35)]',
  },
  elite: {
    icon: Zap,
    label: 'Elite',
    pill: 'bg-gradient-to-r from-violet-500/25 to-amber-500/20 border-violet-400/50 text-violet-200',
    icon_cls: 'text-amber-400',
    glow: 'shadow-[0_0_10px_rgba(167,139,250,0.4)]',
  },
}

/**
 * size: 'xs' | 'sm' | 'md'
 */
export default function PlanBadge({ plan, size = 'sm' }) {
  const cfg = PLANS[plan]
  if (!cfg) return null

  const Icon = cfg.icon
  const sizeMap = {
    xs: { wrap: 'px-1.5 py-0.5 gap-0.5 text-[9px]',  icon: 'h-2 w-2'   },
    sm: { wrap: 'px-2 py-0.5 gap-1 text-[10px]',       icon: 'h-2.5 w-2.5' },
    md: { wrap: 'px-2.5 py-1 gap-1.5 text-xs',         icon: 'h-3 w-3'   },
  }
  const s = sizeMap[size] || sizeMap.sm

  return (
    <span
      className={`inline-flex items-center font-bold rounded-full border ${s.wrap} ${cfg.pill} ${cfg.glow}`}
    >
      <Icon className={`${s.icon} ${cfg.icon_cls} shrink-0`} />
      {cfg.label}
    </span>
  )
}

import type { PlanId } from './types'

export interface Plan {
  id: PlanId
  name: string
  price: number
  interval: string
  tagline: string
  features: string[]
  cta: string
  featured: boolean
  /** Stripe Payment Link URL. Empty = billing not wired yet. */
  paymentLink: string
}

function envLink(key: string): string {
  const v = import.meta.env[key]
  return typeof v === 'string' ? v.trim() : ''
}

export const PLANS: Plan[] = [
  {
    id: 'monthly',
    name: 'Monthly',
    price: 19,
    interval: '/month',
    tagline: 'Flexible, cancel anytime.',
    features: [
      'Unlimited trade logging',
      'Dashboard analytics & equity curve',
      'Session, setup & emotion scoreboards',
      'Per-account daily loss kill switch',
      'Share card generator',
      'Quick Log API (iOS Shortcuts)',
    ],
    cta: 'Start monthly',
    featured: false,
    paymentLink: envLink('VITE_STRIPE_LINK_MONTHLY'),
  },
  {
    id: 'lifetime',
    name: 'Lifetime',
    price: 149,
    interval: 'one-time',
    tagline: 'Pay once, own it forever.',
    features: [
      'Everything in Monthly',
      'One payment, no recurring charges',
      'All future feature updates',
      'Priority support',
    ],
    cta: 'Get lifetime access',
    featured: true,
    paymentLink: envLink('VITE_STRIPE_LINK_LIFETIME'),
  },
]

export function planById(id: PlanId): Plan {
  return PLANS.find((p) => p.id === id) ?? PLANS[0]
}

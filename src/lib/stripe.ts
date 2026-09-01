// Stripe publishable key (public, safe for the bundle).
// Used only for future direct client-side integrations; Payment Links
// (current checkout flow) don't require it.
export function stripePublishableKey(): string {
  return import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY?.trim() ?? ''
}

export function stripeConfigured(): boolean {
  return stripePublishableKey().startsWith('pk_')
}

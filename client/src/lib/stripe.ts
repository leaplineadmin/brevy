// Central helper for Stripe Payment Link URL
// Uses env override if provided, otherwise falls back to known link

export function getPaymentLinkUrl(params?: { draftId?: string | null; returnTo?: string | null }) {
  const base = import.meta.env.VITE_STRIPE_PAYMENT_LINK_URL || 'https://buy.stripe.com/eVq6oJ4C54dEeHJ7Xu43S00';
  const url = new URL(base);
  // Preserve useful context for post-payment handling if your link supports metadata passthrough
  if (params?.draftId) {
    url.searchParams.set('draftId', params.draftId);
  }
  if (params?.returnTo) {
    url.searchParams.set('returnTo', params.returnTo);
  }
  return url.toString();
}



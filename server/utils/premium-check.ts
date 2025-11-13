import { User } from "@shared/schema";

/**
 * Check if a user has active premium access
 * User is considered premium if:
 * - hasActiveSubscription === true AND
 * - (premiumUntil is null OR current time < premiumUntil)
 */
export function hasActivePremiumAccess(user: User | null | undefined): boolean {
  if (!user || !user.hasActiveSubscription) {
    return false;
  }

  // Temporairement, on considère que si hasActiveSubscription est true, l'utilisateur a l'accès premium
  // TODO: Réactiver la logique premiumUntil une fois la colonne ajoutée à la DB
  return true;
}

/**
 * Get the premium access end date for a user
 * Returns null if user has active subscription without end date
 */
export function getPremiumAccessEndDate(user: User | null | undefined): Date | null {
  // Temporairement, on retourne null car premiumUntil n'existe pas encore
  return null;
}

/**
 * Check if user's premium access is expiring soon (within 7 days)
 */
export function isPremiumExpiringSoon(user: User | null | undefined): boolean {
  if (!hasActivePremiumAccess(user)) {
    return false;
  }

  const endDate = getPremiumAccessEndDate(user);
  if (!endDate) {
    return false; // No end date means active subscription
  }

  const now = new Date();
  const daysUntilExpiry = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  
  return daysUntilExpiry <= 7 && daysUntilExpiry > 0;
}

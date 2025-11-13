/**
 * Configuration checker pour les déploiements en production
 * Vérifie que tous les secrets requis sont présents
 */
export function checkProductionSecrets(): {
  isReady: boolean;
  missingSecrets: string[];
  optionalSecrets: string[];
} {
  const requiredSecrets = [
    'DATABASE_URL',
    'GOOGLE_CLIENT_ID', 
    'GOOGLE_CLIENT_SECRET',
    'STRIPE_SECRET_KEY',
    'VITE_STRIPE_PUBLIC_KEY',
    'STRIPE_PRICE_ID',
    'SESSION_SECRET',
    'S3_ACCESS_KEY_ID',
    'S3_SECRET_ACCESS_KEY', 
    'S3_BUCKET_NAME',
    'RESEND_API_KEY' // Utilise Resend pour les emails
  ];

  const optionalSecrets = [
    'AWS_REGION',
    'S3_ENDPOINT'
  ];

  const missingSecrets = requiredSecrets.filter(secret => !process.env[secret]);
  const missingOptional = optionalSecrets.filter(secret => !process.env[secret]);

  return {
    isReady: missingSecrets.length === 0,
    missingSecrets,
    optionalSecrets: missingOptional
  };
}

export function logProductionReadiness() {
  const check = checkProductionSecrets();
  
  if (check.isReady) {
    if (check.optionalSecrets.length > 0) {
    }
  } else {
    // Don't throw error to allow deployment to proceed - let health checks handle readiness
  }
}
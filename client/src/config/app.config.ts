export const APP_CONFIG = {
  // API Configuration
  API_BASE_URL: process.env.NODE_ENV === 'production' 
    ? 'https://www.brevy.me'
    : 'http://localhost:5000',
  
  // File Upload
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  
  // PDF Generation
  PDF_OPTIONS: {
    margin: 0,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { 
      scale: 2,
      useCORS: true,
      logging: false,
      letterRendering: true,
      allowTaint: true,
      width: 794,
      windowWidth: 794
    },
    jsPDF: { 
      unit: 'mm', 
      format: 'a4', 
      orientation: 'portrait' as const,
      compress: true
    }
  },
  
  // UI Configuration
  ANIMATION_DURATION: 300,
  DEBOUNCE_DELAY: 500,
  
  // Validation
  VALIDATION_RULES: {
    EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    PHONE_REGEX: /^[\+]?[1-9][\d]{0,15}$/,
    MIN_PASSWORD_LENGTH: 6,
    MAX_NAME_LENGTH: 50,
    MAX_DESCRIPTION_LENGTH: 1000
  },
  
  // Local Storage Keys
  STORAGE_KEYS: {
    LANGUAGE: 'lang',
    THEME: 'theme',
    USER_PREFERENCES: 'userPreferences'
  },
  
  // Routes
  ROUTES: {
    HOME: '/',
    DASHBOARD: '/dashboard',
    CV_BUILDER: '/cv-builder',
    AUTH: '/auth',
    SUBSCRIPTION: '/subscription'
  }
} as const;

export type AppConfig = typeof APP_CONFIG;

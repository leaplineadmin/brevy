/**
 * Utility for detecting user's country code
 */

// Cache the detected country for the session
let cachedCountry: string | null = null;

/**
 * Detect user's country using multiple fallback strategies
 * @returns ISO2 country code (e.g., 'FR', 'GB', 'US')
 */
export async function detectCountry(): Promise<string> {
  // Return cached value if available
  if (cachedCountry) {
    return cachedCountry;
  }

  try {
    // Strategy 1: Call GeoIP API
    const isProd = typeof window !== 'undefined' && window.location.hostname.endsWith('cvfolio.app');
    const base = isProd ? 'https://cvfolio.onrender.com' : '';
    const response = await fetch(`${base}/api/geoip`);
    if (response.ok) {
      const data = await response.json();
      if (data.country) {
        cachedCountry = data.country;
        return data.country;
      }
    }
  } catch (error) {
  }

  // Strategy 2: Use navigator.language with enhanced mapping (client-side only)
  if (typeof window !== 'undefined' && typeof navigator !== 'undefined' && navigator.language) {
    const lang = navigator.language.toLowerCase();
    
    // Direct locale to country mapping
    const localeToCountry: Record<string, string> = {
      'fr-fr': 'FR',
      'fr-be': 'BE',
      'fr-ch': 'CH',
      'fr-ca': 'CA',
      'fr-lu': 'LU',
      'en-us': 'US',
      'en-gb': 'GB',
      'en-ca': 'CA',
      'en-au': 'AU',
      'en-nz': 'NZ',
      'de-de': 'DE',
      'de-at': 'AT',
      'de-ch': 'CH',
      'it-it': 'IT',
      'es-es': 'ES',
      'es-mx': 'MX',
      'pt-pt': 'PT',
      'pt-br': 'BR',
      'nl-nl': 'NL',
      'nl-be': 'BE',
    };
    
    if (localeToCountry[lang]) {
      cachedCountry = localeToCountry[lang];
      return localeToCountry[lang];
    }
    
    // Extract country from locale (e.g., 'en-US' -> 'US', 'fr-FR' -> 'FR')
    const parts = lang.split('-');
    if (parts.length > 1) {
      const countryCode = parts[1].toUpperCase();
      cachedCountry = countryCode;
      return countryCode;
    }
    
    // Language prefix fallback
    const languageToCountry: Record<string, string> = {
      'fr': 'FR',
      'en': 'US',
      'de': 'DE',
      'it': 'IT',
      'es': 'ES',
      'pt': 'PT',
      'nl': 'NL',
      'ja': 'JP',
      'ko': 'KR',
      'zh': 'CN',
      'ru': 'RU',
      'ar': 'SA',
    };
    
    const langPrefix = parts[0];
    if (languageToCountry[langPrefix]) {
      cachedCountry = languageToCountry[langPrefix];
      return languageToCountry[langPrefix];
    }
  }

  // Strategy 3: Timezone heuristics (client-side only)
  if (typeof window !== 'undefined' && typeof Intl !== 'undefined') {
    try {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      
      // Map common timezones to countries
      const timezoneMap: Record<string, string> = {
        'Europe/London': 'GB',
        'Europe/Paris': 'FR',
        'Europe/Berlin': 'DE',
        'Europe/Madrid': 'ES',
        'Europe/Rome': 'IT',
        'Europe/Brussels': 'BE',
        'Europe/Amsterdam': 'NL',
        'Europe/Zurich': 'CH',
        'Europe/Vienna': 'AT',
        'Europe/Stockholm': 'SE',
        'Europe/Oslo': 'NO',
        'Europe/Copenhagen': 'DK',
        'Europe/Helsinki': 'FI',
        'Europe/Warsaw': 'PL',
        'Europe/Prague': 'CZ',
        'Europe/Budapest': 'HU',
        'Europe/Athens': 'GR',
        'Europe/Lisbon': 'PT',
        'Europe/Dublin': 'IE',
        'Europe/Luxembourg': 'LU',
        'America/New_York': 'US',
        'America/Chicago': 'US',
        'America/Los_Angeles': 'US',
        'America/Toronto': 'CA',
        'America/Montreal': 'CA',
        'America/Vancouver': 'CA',
        'America/Mexico_City': 'MX',
        'America/Sao_Paulo': 'BR',
        'America/Buenos_Aires': 'AR',
        'Asia/Tokyo': 'JP',
        'Asia/Shanghai': 'CN',
        'Asia/Hong_Kong': 'HK',
        'Asia/Singapore': 'SG',
        'Asia/Seoul': 'KR',
        'Asia/Bangkok': 'TH',
        'Asia/Dubai': 'AE',
        'Asia/Kolkata': 'IN',
        'Australia/Sydney': 'AU',
        'Australia/Melbourne': 'AU',
        'Pacific/Auckland': 'NZ',
        'Africa/Cairo': 'EG',
        'Africa/Johannesburg': 'ZA',
        'Africa/Lagos': 'NG',
        'Africa/Nairobi': 'KE',
      };

      if (timezone && timezoneMap[timezone]) {
        cachedCountry = timezoneMap[timezone];
        return timezoneMap[timezone];
      }
    } catch (error) {
    }
  }

  // Default fallback - instead of hardcoding FR, use a more universal default
  const defaultCountry = 'US';
  cachedCountry = defaultCountry;
  return defaultCountry;
}

/**
 * Clear the cached country (useful for testing or when user manually changes location)
 */
export function clearCountryCache(): void {
  cachedCountry = null;
}

// For debugging - log the detection process
export async function debugDetectCountry(): Promise<string> {
  
  // Clear cache for debugging
  cachedCountry = null;
  
  
  try {
    const isProd = typeof window !== 'undefined' && window.location.hostname.endsWith('cvfolio.app');
    const base = isProd ? 'https://cvfolio.onrender.com' : '';
    const geoipUrl = `${base}/api/geoip`;
    
    const response = await fetch(geoipUrl);
    
    if (response.ok) {
      const data = await response.json();
      
      if (data.country) {
        cachedCountry = data.country;
        return data.country;
      } else {
      }
    } else {
    }
  } catch (error) {
  }

  // Strategy 2: Use navigator.language
  if (typeof navigator !== 'undefined' && navigator.language) {
    const lang = navigator.language.toLowerCase();
    
    const localeToCountry: Record<string, string> = {
      'fr-fr': 'FR', 'fr-be': 'BE', 'fr-ch': 'CH', 'fr-ca': 'CA', 'fr-lu': 'LU',
      'en-us': 'US', 'en-gb': 'GB', 'en-ca': 'CA', 'en-au': 'AU', 'en-nz': 'NZ',
      'de-de': 'DE', 'de-at': 'AT', 'de-ch': 'CH', 'it-it': 'IT', 'es-es': 'ES',
      'es-mx': 'MX', 'pt-pt': 'PT', 'pt-br': 'BR', 'nl-nl': 'NL', 'nl-be': 'BE',
    };
    
    if (localeToCountry[lang]) {
      return localeToCountry[lang];
    }
    
    const parts = lang.split('-');
    if (parts.length > 1) {
      const countryCode = parts[1].toUpperCase();
      return countryCode;
    }
    
    const languageToCountry: Record<string, string> = {
      'fr': 'FR', 'en': 'US', 'de': 'DE', 'it': 'IT', 'es': 'ES',
      'pt': 'PT', 'nl': 'NL', 'ja': 'JP', 'ko': 'KR', 'zh': 'CN', 'ru': 'RU', 'ar': 'SA',
    };
    
    const langPrefix = parts[0];
    if (languageToCountry[langPrefix]) {
      return languageToCountry[langPrefix];
    }
    
  }

  // Strategy 3: Timezone heuristics
  if (typeof window !== 'undefined' && typeof Intl !== 'undefined') {
    try {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      
      const timezoneMap: Record<string, string> = {
        'Europe/London': 'GB', 'Europe/Paris': 'FR', 'Europe/Berlin': 'DE', 'Europe/Madrid': 'ES',
        'Europe/Rome': 'IT', 'Europe/Brussels': 'BE', 'Europe/Amsterdam': 'NL', 'Europe/Zurich': 'CH',
        'Europe/Vienna': 'AT', 'Europe/Stockholm': 'SE', 'Europe/Oslo': 'NO', 'Europe/Copenhagen': 'DK',
        'Europe/Helsinki': 'FI', 'Europe/Warsaw': 'PL', 'Europe/Prague': 'CZ', 'Europe/Budapest': 'HU',
        'Europe/Athens': 'GR', 'Europe/Lisbon': 'PT', 'Europe/Dublin': 'IE', 'Europe/Luxembourg': 'LU',
        'America/New_York': 'US', 'America/Chicago': 'US', 'America/Los_Angeles': 'US',
        'America/Toronto': 'CA', 'America/Montreal': 'CA', 'America/Vancouver': 'CA',
        'America/Mexico_City': 'MX', 'America/Sao_Paulo': 'BR', 'America/Buenos_Aires': 'AR',
        'Asia/Tokyo': 'JP', 'Asia/Shanghai': 'CN', 'Asia/Hong_Kong': 'HK', 'Asia/Singapore': 'SG',
        'Asia/Seoul': 'KR', 'Asia/Bangkok': 'TH', 'Asia/Dubai': 'AE', 'Asia/Kolkata': 'IN',
        'Australia/Sydney': 'AU', 'Australia/Melbourne': 'AU', 'Pacific/Auckland': 'NZ',
        'Africa/Cairo': 'EG', 'Africa/Johannesburg': 'ZA', 'Africa/Lagos': 'NG', 'Africa/Nairobi': 'KE',
      };

      if (timezone && timezoneMap[timezone]) {
        return timezoneMap[timezone];
      }
      
    } catch (error) {
    }
  }

  return 'US';
}
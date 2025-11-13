import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import frTranslations from '@/locales/fr.json';
import enTranslations from '@/locales/en.json';

type Language = 'fr' | 'en';
type Translations = typeof frTranslations;

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations: Record<Language, Translations> = {
  fr: frTranslations,
  en: enTranslations,
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children, initialLanguage }: { children: ReactNode; initialLanguage?: Language }) {
  const [language, setLanguageState] = useState<Language>(initialLanguage || 'en');

  // On mount, pick language from localStorage, cookie, or browser/geo
  useEffect(() => {
    // If initialLanguage is provided, use it and don't override
    if (initialLanguage) {
      setLanguageState(initialLanguage);
      return;
    }

    try {
      // 1) localStorage preference (highest priority)
      const stored = typeof window !== 'undefined' ? localStorage.getItem('lang') : null;
      if (stored === 'fr' || stored === 'en') {
        setLanguageState(stored);
        return;
      }

      // 2) cookie preference
      if (typeof document !== 'undefined') {
        const match = document.cookie.match(/(?:^|; )lang=(fr|en)/);
        const cookieLang = match && (match[1] as Language);
        if (cookieLang) {
          setLanguageState(cookieLang);
          return;
        }
      }

      // 3) browser language detection (only if no preference exists)
      const browserLang = (typeof navigator !== 'undefined' ? navigator.language : 'en').toLowerCase();
      const defaultLang: Language = browserLang.startsWith('fr') ? 'fr' : 'en';
      setLanguageState(defaultLang);
      // Don't save browser detection to localStorage/cookie to avoid overriding user choice
    } catch (e) {
      setLanguageState('en');
    }
  }, [initialLanguage]);

  const setLanguage = async (lang: Language) => {
    try {
      setLanguageState(lang);
      if (typeof window !== 'undefined') {
        localStorage.setItem('lang', lang);
      }
      if (typeof document !== 'undefined') {
        document.cookie = `lang=${lang}; max-age=31536000; path=/`;
      }

      // Update server-side cookie to keep SSR/api aligned
      const isProd = typeof window !== 'undefined' && window.location.hostname.endsWith('brevy.me');
      const base = isProd ? 'https://cvfolio.onrender.com' : '';
      await fetch(`${base}/api/set-language`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ language: lang }),
      }).catch(() => {});

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('languageChanged', { detail: { language: lang } }));
      }
    } catch (error) {
      console.error('Failed to set language:', error);
    }
  };

  const t = (key: string): string => {
    const keys = key.split('.');
    let value: any = translations[language];
    
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        console.warn(`Translation key not found: ${key}`);
        return key; // Return the key if translation not found
      }
    }
    
    return typeof value === 'string' ? value : key;
  };

  // Provide context even during loading with default values
  const contextValue = {
    language,
    setLanguage,
    t
  };

  return (
    <LanguageContext.Provider value={contextValue}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    // Return default translations if context is not available (default to English)
    const defaultT = (key: string): string => {
      const keys = key.split('.');
      let value: any = enTranslations;
      
      for (const k of keys) {
        if (value && typeof value === 'object' && k in value) {
          value = value[k];
        } else {
          console.warn(`Translation key not found: ${key}`);
          return key; // Return the key if translation not found
        }
      }
      
      return typeof value === 'string' ? value : key;
    };
    
    return {
      language: 'en' as Language,
      setLanguage: () => {},
      t: defaultT,
    };
  }
  return context;
}
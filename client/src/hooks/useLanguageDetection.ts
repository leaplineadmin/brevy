import { useMemo } from 'react';
import { useLocation } from 'wouter';

export const useLanguageDetection = () => {
  const [location] = useLocation();
  
  const currentLang = useMemo(() => {
    const path = location;
    if (path.startsWith('/fr')) {
      return 'fr';
    }
    return 'en';
  }, [location]);

  return currentLang;
};

import React, { createContext, useContext, useState, useEffect } from 'react';
import { CV } from '@/types/cv';
import { DEFAULT_MAIN_COLOR } from '@/components/cv-builder/shared/color-selector';
import { useLanguage } from '@/contexts/LanguageContext';
import { createDefaultCV } from '@/lib/default-cv-data';

export type PreviewMode = 'desktop' | 'mobile';

interface PreviewContextType {
  previewMode: PreviewMode;
  setPreviewMode: (mode: PreviewMode) => void;
  currentPage: number;
  totalPages: number;
  setCurrentPage: (page: number) => void;
  placeholderData: CV;
  updatePlaceholderWithRealData: (partialData: Partial<CV>) => void;
  mainColor: string;
  setMainColor: (color: string) => void;
  // Options d'affichage
  hidePhoto: boolean;
  setHidePhoto: (value: boolean) => void;
  hideCity: boolean;
  setHideCity: (value: boolean) => void;
  hideSkillLevels: boolean;
  setHideSkillLevels: (value: boolean) => void;
  hideToolLevels: boolean;
  setHideToolLevels: (value: boolean) => void;
  hideLanguageLevels: boolean;
  setHideLanguageLevels: (value: boolean) => void;
  hideLinkedIn: boolean;
  setHideLinkedIn: (value: boolean) => void;
  hideWebsite: boolean;
  setHideWebsite: (value: boolean) => void;
}

// Default CV with empty data for fallback (English by default)
const defaultCV: CV = createDefaultCV('en');

const PreviewContext = createContext<PreviewContextType | undefined>(undefined);

export const PreviewProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { t, language } = useLanguage();
  const [previewMode, setPreviewMode] = useState<PreviewMode>('desktop');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [placeholderData, setPlaceholderData] = useState<CV>(defaultCV);
  const [mainColor, setMainColor] = useState<string>(DEFAULT_MAIN_COLOR);
  
  // États pour les options d'affichage (tous désactivés par défaut)
  const [hidePhoto, setHidePhoto] = useState<boolean>(false);
  const [hideCity, setHideCity] = useState<boolean>(false);
  const [hideSkillLevels, setHideSkillLevels] = useState<boolean>(false);
  const [hideToolLevels, setHideToolLevels] = useState<boolean>(false);
  const [hideLanguageLevels, setHideLanguageLevels] = useState<boolean>(false);
  const [hideLinkedIn, setHideLinkedIn] = useState<boolean>(false);
  const [hideWebsite, setHideWebsite] = useState<boolean>(true);

  // Exposer les préférences d'affichage globalement pour la sauvegarde
  useEffect(() => {
    (window as any).__previewContext = {
      hidePhoto,
      hideCity,
      hideSkillLevels,
      hideToolLevels,
      hideLanguageLevels,
      hideLinkedIn,
      hideWebsite,
    };
  }, [hidePhoto, hideCity, hideSkillLevels, hideToolLevels, hideLanguageLevels, hideLinkedIn, hideWebsite]);

  // Fonction pour restaurer les préférences d'affichage depuis les données sauvegardées
  const restoreDisplaySettings = (settings: any) => {
    if (settings) {
      setHidePhoto(settings.hidePhoto || false);
      setHideCity(settings.hideCity || false);
      setHideSkillLevels(settings.hideSkillLevels || false);
      setHideToolLevels(settings.hideToolLevels || false);
      setHideLanguageLevels(settings.hideLanguageLevels || false);
      setHideLinkedIn(settings.hideLinkedIn || false);
      setHideWebsite(settings.hideWebsite || false);
    }
  };

  // Exposer la fonction de restauration globalement
  useEffect(() => {
    (window as any).__restoreDisplaySettings = restoreDisplaySettings;
  }, []);

  // Mettre à jour les données par défaut quand la langue change
  useEffect(() => {
    setPlaceholderData(createDefaultCV(language));
  }, [language]);

  // Fonction pour mettre à jour les données fictives avec les données réelles
  const updatePlaceholderWithRealData = (partialData: Partial<CV>) => {
    setPlaceholderData(prev => {
      const updated = { ...prev };
      
      // Mettre à jour les informations personnelles
      if (partialData.personalInfo) {
        updated.personalInfo = {
          ...updated.personalInfo,
          ...partialData.personalInfo
        };
      }
      
      // Mettre à jour le summary directement si présent
      if ('summary' in partialData) {
        updated.personalInfo = {
          ...updated.personalInfo,
          summary: partialData.summary || ''
        };
      }
      
      // Mettre à jour les expériences
      if (partialData.experience) {
        updated.experience = partialData.experience;
      }
      
      // Mettre à jour les éducations
      if (partialData.education) {
        updated.education = partialData.education;
      }
      
      // Mettre à jour les compétences
      if (partialData.skills && partialData.skills.length > 0) {
        updated.skills = partialData.skills;
      }
      
      // Mettre à jour les langues
      if (partialData.languages && partialData.languages.length > 0) {
        updated.languages = partialData.languages;
      }
      
      // Mettre à jour les outils
      if ('tools' in partialData) {
        updated.tools = partialData.tools;
      }
      
      // Mettre à jour les certifications
      if ('certifications' in partialData) {
        updated.certifications = partialData.certifications;
      }
      
      // Mettre à jour les hobbies
      if ('hobbies' in partialData) {
        updated.hobbies = partialData.hobbies;
      }
      
      // Mettre à jour le phoneCountryCode au niveau racine
      if ('phoneCountryCode' in partialData) {
        updated.phoneCountryCode = partialData.phoneCountryCode;
      }
      
      // Mettre à jour les styles
      if (partialData.style) {
        updated.style = {
          ...updated.style,
          ...partialData.style
        };
      }
      
      return updated;
    });
  };

  // Nous ne synchronisons plus automatiquement la couleur principale ici
  // car cela crée une boucle d'updates avec le composant PreviewArea

  // Initialiser avec une seule page
  useEffect(() => {
    setTotalPages(1);
    setCurrentPage(1);
  }, []);

  return (
    <PreviewContext.Provider
      value={{
        previewMode,
        setPreviewMode,
        currentPage,
        totalPages,
        setCurrentPage,
        placeholderData,
        updatePlaceholderWithRealData,
        mainColor,
        setMainColor,
        hidePhoto,
        setHidePhoto,
        hideCity,
        setHideCity,
        hideSkillLevels,
        setHideSkillLevels,
        hideToolLevels,
        setHideToolLevels,
        hideLanguageLevels,
        setHideLanguageLevels,
        hideLinkedIn,
        setHideLinkedIn,
        hideWebsite,
        setHideWebsite,
      }}
    >
      {children}
    </PreviewContext.Provider>
  );
};

export const usePreview = () => {
  const context = useContext(PreviewContext);
  if (context === undefined) {
    throw new Error('usePreview must be used within a PreviewProvider');
  }
  return context;
};

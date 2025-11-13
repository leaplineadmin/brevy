import { useMemo } from 'react';
import { CV } from "@/types/cv";
import { useLanguage } from "@/contexts/LanguageContext";
import { getDefaultCVData } from '@/lib/default-cv-data';

/**
 * Hook centralisé pour tous les templates
 * Assure la cohérence des données par défaut et traductions
 */
export const useTemplateData = (data: CV, isPublished: boolean = false) => {
  const { language } = useLanguage();
  
  // Données par défaut selon la langue courante
  const defaultData = useMemo(() => getDefaultCVData(language), [language]);
  
  // Fonction uniforme pour tous les templates
  const getValueWithDefault = useMemo(() => {
    return (value: string | undefined, defaultValue: string): string => {
      // Si c'est un template publié, ne pas injecter d'exemples
      if (isPublished) {
        return value && value.trim() !== '' ? value : '';
      }
      // Dans le builder, afficher un exemple localisé quand le champ est vide
      return value && value.trim() !== '' ? value : defaultValue;
    };
  }, [isPublished]);

  // Fonction pour vérifier si une section est vide (pour les templates publiés)
  const isSectionEmpty = useMemo(() => {
    return (section: any[] | undefined): boolean => {
      if (!isPublished) return false;
      if (!section || section.length === 0) return true;
      return section.every(item => 
        Object.values(item).every(value => 
          typeof value === 'string' ? value.trim() === '' : !value
        )
      );
    };
  }, [isPublished]);

  // Fonction pour vérifier si un champ personnel est vide
  const isPersonalFieldEmpty = useMemo(() => {
    return (value: string | undefined): boolean => {
      if (!isPublished) return false;
      return !value || value.trim() === '';
    };
  }, [isPublished]);

  // Données enrichies avec fallbacks
  const enrichedData = useMemo(() => {
    return {
      ...data,
      // Informations personnelles avec fallbacks
      personalInfo: {
        ...data.personalInfo,
        firstName: getValueWithDefault(data.personalInfo?.firstName, defaultData.personalInfo.firstName),
        lastName: getValueWithDefault(data.personalInfo?.lastName, defaultData.personalInfo.lastName),
        jobTitle: getValueWithDefault(data.personalInfo?.jobTitle || data.personalInfo?.position, defaultData.personalInfo.jobTitle),
        position: getValueWithDefault(data.personalInfo?.position || data.personalInfo?.jobTitle, defaultData.personalInfo.jobTitle),
        city: getValueWithDefault(data.personalInfo?.city, defaultData.personalInfo.city),
        country: getValueWithDefault(data.personalInfo?.country, defaultData.personalInfo.country),
        phone: data.personalInfo?.phone || '',
        summary: getValueWithDefault(data.personalInfo?.summary, defaultData.personalInfo.summary),
        // Utiliser les données originales uniquement (pas d'exemples)
        email: data.personalInfo?.email || '',
        linkedin: data.personalInfo?.linkedin || '',
        website: data.personalInfo?.website || '',
        photoUrl: data.personalInfo?.photoUrl || '',
      },
      // Expérience avec fallbacks
      experience: data.experience?.map((exp, index) => ({
        ...exp,
        company: getValueWithDefault(exp.company, defaultData.experience[index]?.company || defaultData.experience[0]?.company || ''),
        position: getValueWithDefault(exp.position, defaultData.experience[index]?.position || defaultData.experience[0]?.position || ''),
        location: getValueWithDefault(exp.location, defaultData.experience[index]?.location || defaultData.experience[0]?.location || ''),
        summary: getValueWithDefault(exp.summary, defaultData.experience[index]?.description || defaultData.experience[0]?.description || ''),
        from: exp.from || defaultData.experience[index]?.from || '',
        to: exp.to || defaultData.experience[index]?.to || '',
      })) || [],
      // Éducation avec fallbacks
      education: data.education?.map((edu, index) => ({
        ...edu,
        school: getValueWithDefault(edu.school, defaultData.education[index]?.school || defaultData.education[0]?.school || ''),
        diploma: getValueWithDefault(edu.diploma || edu.degree, defaultData.education[index]?.diploma || defaultData.education[0]?.diploma || ''),
        location: getValueWithDefault(edu.location, defaultData.education[index]?.location || defaultData.education[0]?.location || ''),
        description: edu.description || defaultData.education[index]?.description || '',
        from: edu.from || defaultData.education[index]?.from || '',
        to: edu.to || defaultData.education[index]?.to || '',
      })) || [],
      // Compétences avec fallbacks
      skills: data.skills?.map((skill, index) => ({
        ...skill,
        name: getValueWithDefault(skill.name, defaultData.skills[index]?.name || defaultData.skills[0]?.name || ''),
      })) || [],
      // Langues avec fallbacks
      languages: data.languages?.map((lang, index) => ({
        ...lang,
        name: getValueWithDefault(lang.name, defaultData.languages[index]?.name || defaultData.languages[0]?.name || ''),
      })) || [],
      // Outils avec fallbacks
      tools: data.tools?.map((tool, index) => ({
        ...tool,
        name: getValueWithDefault(tool.name, defaultData.tools?.[index]?.name || defaultData.tools?.[0]?.name || ''),
      })) || (isPublished ? [] : defaultData.tools || []),
    };
  }, [data, defaultData, getValueWithDefault, isPublished, language]);

  return {
    data: enrichedData,
    enrichedData,
    defaultData,
    getValueWithDefault,
    isSectionEmpty,
    isPersonalFieldEmpty,
    language
  };
};
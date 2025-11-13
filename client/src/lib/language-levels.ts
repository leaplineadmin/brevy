// Standardisation des niveaux de langue pour une cohérence totale
// entre le formulaire et tous les templates

export const LANGUAGE_LEVELS = {
  beginner: 'Elementary Proficiency',
  intermediate: 'Limited Working Proficiency', 
  advanced: 'Full Professional Proficiency',
  native: 'Native or Bilingual Proficiency'
} as const;

export const LANGUAGE_LEVELS_FR = {
  beginner: 'Notions de base',
  intermediate: 'Compétence professionnelle limitée', 
  advanced: 'Compétence professionnelle complète',
  native: 'Langue maternelle ou bilingue'
} as const;

export type LanguageLevel = keyof typeof LANGUAGE_LEVELS;

// Fonction pour obtenir le libellé standardisé d'un niveau
export function getLanguageLevelLabel(level: LanguageLevel, language: 'en' | 'fr' = 'en'): string {
  return language === 'fr' ? LANGUAGE_LEVELS_FR[level] : LANGUAGE_LEVELS[level];
}

// Fonction pour convertir les anciens formats vers le nouveau standard
export function normalizeLanguageLevel(level: string): LanguageLevel {
  const levelLower = level?.toLowerCase().trim() || '';
  
  // Mapping des variations existantes vers les niveaux standardisés
  if (levelLower.includes('natif') || 
      levelLower.includes('native') || 
      levelLower.includes('maternelle') ||
      levelLower.includes('bilingue')) {
    return 'native';
  }
  
  if (levelLower.includes('c1') || 
      levelLower.includes('c2') || 
      levelLower.includes('advanced') ||
      levelLower.includes('avancé') ||
      levelLower.includes('complète')) {
    return 'advanced';
  }
  
  if (levelLower.includes('b1') || 
      levelLower.includes('b2') || 
      levelLower.includes('inter') ||
      levelLower.includes('limitée')) {
    return 'intermediate';
  }
  
  // Par défaut: notions
  return 'beginner';
}

// Options pour les formulaires
export const LANGUAGE_LEVEL_OPTIONS = [
  { value: 'beginner', label: LANGUAGE_LEVELS.beginner },
  { value: 'intermediate', label: LANGUAGE_LEVELS.intermediate },
  { value: 'advanced', label: LANGUAGE_LEVELS.advanced },
  { value: 'native', label: LANGUAGE_LEVELS.native }
] as const;

export const LANGUAGE_LEVEL_OPTIONS_FR = [
  { value: 'beginner', label: LANGUAGE_LEVELS_FR.beginner },
  { value: 'intermediate', label: LANGUAGE_LEVELS_FR.intermediate },
  { value: 'advanced', label: LANGUAGE_LEVELS_FR.advanced },
  { value: 'native', label: LANGUAGE_LEVELS_FR.native }
] as const;
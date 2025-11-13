import React, { lazy } from 'react';
import type { CV } from '../../types/cv';

// Load Classic template synchronously (most used, no loader)
import { TemplateClassic } from './template-classic';

// Lazy load other templates (loaded in background)
const TemplateBoxes = lazy(() => import('./template-boxes').then(module => ({ default: module.TemplateBoxes })));
const TemplateTechnical = lazy(() => import('./template-technical').then(module => ({ default: module.TemplateTechnical })));
const TemplateBento = lazy(() => import('./template-bento').then(module => ({ default: module.TemplateBento })));
const TemplateDatalover = lazy(() => import('./template-datalover').then(module => ({ default: module.TemplateDatalover })));
const TemplateLanding = lazy(() => import('./template-landing').then(module => ({ default: module.TemplateLanding })));
const TemplateSocial = lazy(() => import('./template-social').then(module => ({ default: module.TemplateSocial })));

// Interface pour les props des templates
export interface TemplateProps {
  data: CV;
  mainColor: string;
  hidePhoto?: boolean;
  hideCity?: boolean;
  hideSkillLevels?: boolean;
  hideToolLevels?: boolean;
  hideLanguageLevels?: boolean;
  hideLinkedIn?: boolean;
  hideWebsite?: boolean;
  showCVfolioLink?: boolean;
  isPreview?: boolean;
  hasSubscription?: boolean;
  isPublished?: boolean;
  isMobile?: boolean;
  // Contact modal handlers (only used in preview mode)
  onContactClick?: (contactType: 'phone' | 'email' | 'linkedin' | 'website') => void;
}

type TemplateMap = {
  [key: string]: React.FC<TemplateProps>;
}

// Export de tous les templates
export const templates: TemplateMap = {
  // Template Classic - Elegant
  'template-classic': TemplateClassic,
  // Template Boxes - Smooth
  'template-boxes': TemplateBoxes,
  // Template Technical - Technical (sombre)
  'template-technical': TemplateTechnical,
  // Template Bento - Bento (layout en cartes)
  'template-bento': TemplateBento,
  // Template Datalover - Waves (animation canvas)
  'template-datalover': TemplateDatalover,
  // Template Landing - Landing
  'template-landing': TemplateLanding,
  // Template Social - Social
  'template-social': TemplateSocial,
};

// Fonction pour obtenir un template en fonction de l'ID
export function getTemplate(templateId: string): React.FC<TemplateProps> | React.LazyExoticComponent<React.FC<TemplateProps>> {
  const template = templates[templateId];
  
  if (!template) {
    // Fallback au premier template si l'ID n'existe pas
    return templates['template-classic'];
  }
  
  return template;
}

// Fonction pour obtenir un template par son ID - pour compatibilité avec l'ancien système
export function getTemplateById(id: string): React.FC<TemplateProps> {
  // Mapping entre les anciens IDs et les nouveaux IDs
  const templateMapping: Record<string, string> = {
    'template-1': 'template-classic',
    'template-2': 'template-boxes',
    'template-3': 'template-technical',
    'template-4': 'template-bento',
    'template-5': 'template-datalover',
    'template-6': 'template-landing',
    'template-digital-1': 'template-classic',
    'template-digital-2': 'template-boxes',
    'template-digital-3': 'template-technical',
    'template-digital-4': 'template-bento',
  };
  
  // Utiliser le mapping ou l'ID directement
  const mappedId = templateMapping[id] || id;
  
  return getTemplate(mappedId);
}
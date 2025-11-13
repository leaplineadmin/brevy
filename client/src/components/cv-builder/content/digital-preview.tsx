import React, { useState } from 'react';
import { usePreview } from '@/context/PreviewContext';
import { useCVData } from '@/hooks/use-cv-data';
import { useAuth } from '@/hooks/useAuth';
import { getTemplate } from '@/lib/cv-templates/index';
import { ContactModal } from '@/components/ui/contact-modal';
import { TemplateWrapper } from '@/components/shared/template-wrapper';
import { hasActivePremiumAccess } from '@/utils/premium-check';

interface DigitalCVPreviewProps {
  isMobile: boolean;
  isPreview?: boolean;
}

export const DigitalCVPreview: React.FC<DigitalCVPreviewProps> = ({ isMobile, isPreview = false }) => {
  const { 
    placeholderData, 
    hidePhoto,
    hideCity,
    hideSkillLevels,
    hideToolLevels,
    hideLanguageLevels,
    hideLinkedIn,
    hideWebsite
  } = usePreview();
  const { templateId, mainColor } = useCVData();
  const { user } = useAuth();
  
  // Check if user has subscription
  const hasSubscription = hasActivePremiumAccess(user);
  
  // State for contact modal (only used in preview mode)
  const [showContactModal, setShowContactModal] = useState(false);
  const [contactType, setContactType] = useState<'phone' | 'email' | 'linkedin' | 'website'>('phone');
  
  // Handler for contact clicks
  const handleContactClick = (contactType: 'phone' | 'email' | 'linkedin' | 'website') => {
    setContactType(contactType);
    setShowContactModal(true);
  };
  
  // Obtenir le composant de template approprié
  const TemplateComponent = getTemplate(templateId);
  
  // Rendu direct du template sans divs supplémentaires
  return (
    <>
      <TemplateWrapper templateId={templateId}>
        <TemplateComponent 
          data={placeholderData} 
          mainColor={mainColor}
          hidePhoto={hidePhoto}
          hideCity={hideCity}
          hideSkillLevels={hideSkillLevels}
          hideToolLevels={hideToolLevels}
          hideLanguageLevels={hideLanguageLevels}
          hideLinkedIn={hideLinkedIn}
          hideWebsite={hideWebsite}
          isPreview={isPreview}
          hasSubscription={hasSubscription}
          onContactClick={handleContactClick}
          isMobile={isMobile}
        />
      </TemplateWrapper>
      
      {/* Contact Modal - only shown in preview mode */}
      <ContactModal
        isOpen={showContactModal}
        onClose={() => setShowContactModal(false)}
        contactType={contactType}
      />
    </>
  );
};
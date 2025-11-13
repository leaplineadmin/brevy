import React from 'react';
import { SectionHeader } from '@/components/shared/section-header';
import { ContactInfo } from '@/components/shared/contact-info';
import { useTemplateData } from '@/lib/hooks/useTemplateData';
import { TemplateProps } from '../../lib/cv-templates';

interface PersonalInfoSectionProps {
  data: any;
  mainColor: string;
  isPublished: boolean;
  hidePhoto?: boolean;
  hideCity?: boolean;
  hideLinkedIn?: boolean;
  hideWebsite?: boolean;
}

export const PersonalInfoSection: React.FC<PersonalInfoSectionProps> = ({
  data,
  mainColor,
  isPublished,
  hidePhoto = false,
  hideCity = false,
  hideLinkedIn = false,
  hideWebsite = false
}) => {
  const { data: enrichedData, getValueWithDefault } = useTemplateData(data, isPublished);

  const firstName = getValueWithDefault('personalInfo.firstName', '');
  const lastName = getValueWithDefault('personalInfo.lastName', '');
  const position = getValueWithDefault('personalInfo.position', '');
  const email = getValueWithDefault('personalInfo.email', '');
  const phone = getValueWithDefault('personalInfo.phone', '');
  const city = getValueWithDefault('personalInfo.city', '');
  const country = getValueWithDefault('personalInfo.country', '');
  const linkedin = getValueWithDefault('personalInfo.linkedin', '');
  const website = getValueWithDefault('personalInfo.website', '');
  const photoUrl = getValueWithDefault('personalInfo.photoUrl', '');

  const location = hideCity ? '' : [city, country].filter(Boolean).join(', ');

  return (
    <div className="personal-info-section mb-8">
      <div className="flex items-start gap-6">
        {!hidePhoto && photoUrl && (
          <div className="flex-shrink-0">
            <img
              src={photoUrl}
              alt={`${firstName} ${lastName}`}
              className="w-24 h-24 rounded-full object-cover border-2"
              style={{ borderColor: mainColor }}
            />
          </div>
        )}
        
        <div className="flex-1">
          <h1 className="text-3xl font-bold mb-2" style={{ color: mainColor }}>
            {firstName} {lastName}
          </h1>
          
          {position && (
            <h2 className="text-xl text-gray-600 mb-4">{position}</h2>
          )}
          
          <ContactInfo
            email={email}
            phone={phone}
            location={location}
            website={hideWebsite ? undefined : website}
            linkedin={hideLinkedIn ? undefined : linkedin}
            className="text-sm"
          />
        </div>
      </div>
    </div>
  );
};

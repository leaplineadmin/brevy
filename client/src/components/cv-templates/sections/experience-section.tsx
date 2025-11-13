import React from 'react';
import { SectionHeader } from '@/components/shared/section-header';
import { DateRange } from '@/components/shared/date-range';
import { useTemplateData } from '@/lib/hooks/useTemplateData';
import { renderHTMLContent } from '@/lib/html-renderer';

interface ExperienceSectionProps {
  data: any;
  mainColor: string;
  isPublished: boolean;
  title: string;
}

export const ExperienceSection: React.FC<ExperienceSectionProps> = ({
  data,
  mainColor,
  isPublished,
  title
}) => {
  const { data: enrichedData, getValueWithDefault, isSectionEmpty } = useTemplateData(data, isPublished);
  
  const experiences = getValueWithDefault('experience', []);
  
  if (isSectionEmpty('experience')) return null;

  return (
    <div className="experience-section mb-8">
      <SectionHeader title={title} mainColor={mainColor} />
      
      <div className="space-y-6">
        {experiences.map((exp: any, index: number) => (
          <div key={exp.id || index} className="experience-item">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h3 className="font-semibold text-lg">{exp.title || exp.position}</h3>
                <p className="text-gray-600">
                  {exp.company}
                  {exp.location && ` • ${exp.location}`}
                </p>
              </div>
              <DateRange
                startDate={exp.from || `${exp.startMonth}/${exp.startYear}`}
                endDate={exp.to || `${exp.endMonth}/${exp.endYear}`}
                isCurrent={exp.current || exp.isCurrent}
                className="text-sm"
              />
            </div>
            
            {exp.description && (
              <div className="text-gray-700 text-sm">
                {renderHTMLContent(exp.description)}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

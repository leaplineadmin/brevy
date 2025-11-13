import { Button } from "@/components/ui/button";
import { DeleteButton } from "@/components/shared/delete-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCVData } from "@/hooks/use-cv-data";
import { useLanguage } from "@/contexts/LanguageContext";
import { Trash2 } from "lucide-react";
import { AddButton } from "./add-button";
import { DateSelector } from "./date-selector";
import { YearSelector } from "./year-selector";
import { RichTextEditor } from "@/components/ui/rich-text-editor";

export default function Education() {
  const { t } = useLanguage();
  const { cvData, addEducation, updateEducation, removeEducation } = useCVData();
  
  const handleInputChange = (id: string, field: string, value: string) => {
    updateEducation(id, { [field]: value });
  };
  
  return (
    <div className="cv-section-content flex flex-col gap-6">
      {cvData.education.length === 0 ? (
        <div className="p-4 border border-lightGrey rounded-md bg-white/50 text-center text-neutral/60">
          <p>{t('cvBuilder.education.noEducation')}</p>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {cvData.education.map((education) => (
            <div key={education.id} className="cv-item-card">
              <div className="cv-item-header">
                <DeleteButton onClick={() => removeEducation(education.id)} />
              </div>
              
              <div className="cv-item-content">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor={`edu-diploma-${education.id}`} className="cv-label">
                      {t('cvBuilder.education.degree')}
                    </Label>
                    <Input
                      id={`edu-diploma-${education.id}`}
                      value={education.diploma || ''}
                      onChange={(e) => handleInputChange(education.id, 'diploma', e.target.value)}
                      className="cv-input"
                      placeholder={t('cvBuilder.education.placeholders.degree')}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor={`edu-school-${education.id}`} className="cv-label">
                      {t('cvBuilder.education.school')}
                    </Label>
                    <Input
                      id={`edu-school-${education.id}`}
                      value={education.school || ''}
                      onChange={(e) => handleInputChange(education.id, 'school', e.target.value)}
                      className="cv-input"
                      placeholder={t('cvBuilder.education.placeholders.school')}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor={`edu-location-${education.id}`} className="cv-label">
                      {t('cvBuilder.education.location')}
                    </Label>
                    <Input
                      id={`edu-location-${education.id}`}
                      value={education.location || ''}
                      onChange={(e) => handleInputChange(education.id, 'location', e.target.value)}
                      className="cv-input"
                      placeholder={t('cvBuilder.education.placeholders.location')}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <YearSelector
                      label={t('cvBuilder.education.from')}
                      id={`edu-start-year-${education.id}`}
                      value={education.from || ''}
                      onChange={(year) => handleInputChange(education.id, 'from', year)}
                      placeholder="yyyy"
                    />
                    
                    <YearSelector
                      label={t('cvBuilder.education.to')}
                      id={`edu-end-year-${education.id}`}
                      value={education.to || ''}
                      onChange={(year) => handleInputChange(education.id, 'to', year)}
                      placeholder="yyyy"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor={`edu-description-${education.id}`} className="cv-label">
                      {t('cvBuilder.education.description')}
                    </Label>
                    <RichTextEditor
                      id={`edu-description-${education.id}`}
                      value={education.description || ''}
                      onChange={(value) => handleInputChange(education.id, 'description', value)}
                      placeholder={t('cvBuilder.education.placeholders.description')}
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      <AddButton onClick={addEducation}>
        {t('cvBuilder.education.add')}
      </AddButton>
    </div>
  );
}

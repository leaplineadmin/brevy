import { Button } from "@/components/ui/button";
import { DeleteButton } from "@/components/shared/delete-button";
import { Input } from "@/components/ui/input";
import { useCVData } from "@/hooks/use-cv-data";
import { Trash2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { usePreview } from "@/context/PreviewContext";
import { AddButton } from "./add-button";
import { useLanguage } from "@/contexts/LanguageContext";

export default function Skills() {
  const { cvData, updateCvData, updateSkill, removeSkill, addSkill } = useCVData();
  const { hideSkillLevels, setHideSkillLevels } = usePreview();
  const { t } = useLanguage();
  
  const handleInputChange = (id: string, name: string) => {
    updateSkill(id, { name });
  };
  
  const handleLevelChange = (id: string, level: string) => {
    const validLevel = level as "beginner" | "medium" | "advanced" | "expert";
    updateSkill(id, { level: validLevel });
  };
  
  const handleShowLevelChange = (id: string, checked: boolean) => {
    updateSkill(id, { showLevel: checked });
  };
  
  const handleGlobalShowLevelsChange = (checked: boolean) => {
    setHideSkillLevels(checked);
    // Appliquer le changement à toutes les compétences
    cvData.skills.forEach(skill => {
      updateSkill(skill.id, { showLevel: !checked });
    });
  };

  // Niveaux de compétence avec valeurs textuelles
  const skillLevels = [
    { value: "beginner", label: t("templates.skills.novice") },
    { value: "medium", label: t("templates.skills.intermediate") },
    { value: "advanced", label: t("templates.skills.proficient") },
    { value: "expert", label: t("templates.skills.expert") },
  ];
  
  const getLevelLabel = (value: string): string => {
    const level = skillLevels.find(level => level.value === value);
    return level ? level.label : 'Intermediate';
  };
  
  const getSelectedLevel = (value: string): number => {
    const levelIndex = skillLevels.findIndex(level => level.value === value);
    return levelIndex >= 0 ? levelIndex : 1; // Default to "medium" (index 1)
  };
  
  return (
    <div className="cv-section-content flex flex-col gap-6">
      <div className="flex items-center space-x-2">
        <Switch
          id="global-show-skill-levels"
          checked={hideSkillLevels}
          onCheckedChange={handleGlobalShowLevelsChange}
        />
        <label htmlFor="global-show-skill-levels" className="text-sm text-gray-500">
          {t("cvBuilder.controls.hideSkillLevels")}
        </label>
      </div>
      
      {cvData.skills.length === 0 ? (
        <div className="p-4 border border-lightGrey rounded-md bg-white/50 text-center text-neutral/60">
          <p>{t('cvBuilder.skills.noSkills')}</p>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {cvData.skills.map((skill) => (
            <div key={skill.id} className="cv-item-card">
              <div className="cv-item-header">
                <DeleteButton onClick={() => removeSkill(skill.id)} />
              </div>
              
              <div className="cv-item-content">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor={`skill-name-${skill.id}`} className="cv-label">
                      {t("templates.skills.skill")}
                    </Label>
                    <Input
                      id={`skill-name-${skill.id}`}
                      value={skill.name || ''}
                      onChange={(e) => handleInputChange(skill.id, e.target.value)}
                      className="cv-input"
                      placeholder="Project management"
                    />
                  </div>
                  
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label className="text-neutral text-sm">
                        {t("templates.skills.skillLevel")}: <span className="font-medium text-primary">{getLevelLabel(skill.level || '60')}</span>
                      </Label>
                    </div>
                    
                    <div className="mb-1 text-xs text-grey flex justify-between">
                      <span>{t("templates.skills.novice")}</span>
                      <span>{t("templates.skills.expert")}</span>
                    </div>
                    
                    <div className="relative w-full h-8 bg-slate-100 rounded-md overflow-hidden flex mb-3">
                      {skillLevels.map((levelOption, index) => (
                        <div 
                          key={levelOption.value}
                          onClick={() => handleLevelChange(skill.id, levelOption.value)}
                          className={`
                            relative flex-1 h-full cursor-pointer transition-all duration-150
                            ${index === 0 ? 'rounded-l-md' : ''}
                            ${index === skillLevels.length - 1 ? 'rounded-r-md' : ''}
                            ${getSelectedLevel(skill.level || 'medium') >= index ? 'bg-brand-primary hover:bg-brand-primary/90' : 'bg-transparent hover:bg-slate-200'}
                          `}
                        >
                          {/* Séparateur vertical */}
                          {index < skillLevels.length - 1 && (
                            <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-px h-5 bg-slate-300"></div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      <AddButton onClick={addSkill}>
        {t("cvBuilder.sections.addSkill")}
      </AddButton>
    </div>
  );
}
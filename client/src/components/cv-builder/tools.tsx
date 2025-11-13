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

export default function Tools() {
  const { cvData, updateTool, removeTool, addTool, removeToolSection } = useCVData();
  const { hideToolLevels, setHideToolLevels } = usePreview();
  const { t } = useLanguage();
  
  const handleInputChange = (id: string, name: string) => {
    updateTool(id, { name });
  };
  
  const handleLevelChange = (id: string, level: string) => {
    const validLevel = level as "beginner" | "medium" | "advanced" | "expert";
    updateTool(id, { level: validLevel });
  };
  
  const handleShowLevelChange = (id: string, checked: boolean) => {
    updateTool(id, { showLevel: checked });
  };
  
  const handleGlobalShowLevelsChange = (checked: boolean) => {
    setHideToolLevels(checked);
    // Appliquer le changement à tous les outils
    if (cvData.tools) {
      cvData.tools.forEach(tool => {
        updateTool(tool.id, { showLevel: !checked });
      });
    }
  };

  // Niveaux d'outil avec valeurs textuelles
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
      {/* Titre de section avec bouton de suppression */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Tools</h3>
        <DeleteButton 
          onClick={removeToolSection}
          className="h-8 w-8"
        />
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="hide-tool-levels"
          checked={hideToolLevels}
          onCheckedChange={handleGlobalShowLevelsChange}
        />
        <Label htmlFor="hide-tool-levels" className="text-neutral text-sm">
          {t("cvBuilder.controls.hideSkillLevels")}
        </Label>
      </div>

      <div className="flex flex-col gap-6">
        {cvData.tools?.map((tool) => (
          <div key={tool.id} className="cv-item-card">
            <div className="cv-item-header">
              <DeleteButton onClick={() => removeTool(tool.id)} />
            </div>
            
            <div className="cv-item-content">
              <div className="space-y-4">
                <div>
                  <Label htmlFor={`tool-name-${tool.id}`} className="cv-label">
                    Tool
                  </Label>
                  <Input
                    id={`tool-name-${tool.id}`}
                    value={tool.name || ''}
                    onChange={(e) => handleInputChange(tool.id, e.target.value)}
                    className="cv-input"
                    placeholder="Adobe suite"
                  />
                </div>
                
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-neutral text-sm">
                      {t("templates.skills.skillLevel")}: <span className="font-medium text-primary">{getLevelLabel(tool.level || '60')}</span>
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
                        onClick={() => handleLevelChange(tool.id, levelOption.value)}
                        className={`
                          relative flex-1 h-full cursor-pointer transition-all duration-150
                          ${index === 0 ? 'rounded-l-md' : ''}
                          ${index === skillLevels.length - 1 ? 'rounded-r-md' : ''}
                          ${getSelectedLevel(tool.level || 'medium') >= index ? 'bg-brand-primary hover:bg-brand-primary/90' : 'bg-transparent hover:bg-slate-200'}
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

        <AddButton onClick={addTool}>
          {t('cvBuilder.tools.add')}
        </AddButton>
      </div>
    </div>
  );
}

import { Button } from "@/components/ui/button";
import { DeleteButton } from "@/components/shared/delete-button";
import { Input } from "@/components/ui/input";
import { useCVData } from "@/hooks/use-cv-data";
import { Label } from "@/components/ui/label";
import { Trash2 } from "lucide-react";
import { AddButton } from "./add-button";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LANGUAGE_LEVEL_OPTIONS, LANGUAGE_LEVEL_OPTIONS_FR } from "@/lib/language-levels";
import { useLanguage } from "@/contexts/LanguageContext";

export default function Languages() {
  const { cvData, addLanguage, updateLanguage, removeLanguage } = useCVData();
  const { t, language } = useLanguage();
  
  const languageOptions = language === 'fr' ? LANGUAGE_LEVEL_OPTIONS_FR : LANGUAGE_LEVEL_OPTIONS;
  
  const handleInputChange = (id: string, name: string) => {
    updateLanguage(id, { name });
  };
  
  const handleLevelChange = (id: string, level: string) => {
    updateLanguage(id, { level });
  };
  
  return (
    <div className="cv-section-content flex flex-col gap-6">
      {cvData.languages.length === 0 ? (
        <div className="p-4 border border-lightGrey rounded-md bg-white/50 text-center text-neutral/60">
          <p>No languages added. Click on "Add" to include your language skills.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {cvData.languages.map((language) => (
            <div key={language.id} className="cv-item-card">
              <div className="cv-item-header">
                <DeleteButton onClick={() => removeLanguage(language.id)} />
              </div>
              
              <div className="cv-item-content">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor={`language-name-${language.id}`} className="cv-label">
                      {t("templates.form.language")}
                    </Label>
                    <Input
                      id={`language-name-${language.id}`}
                      value={language.name || ''}
                      onChange={(e) => handleInputChange(language.id, e.target.value)}
                      className="cv-input"
                      placeholder="English"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor={`language-level-${language.id}`} className="cv-label">
                      {t("templates.form.proficiency")}
                    </Label>
                    <Select
                      value={language.level || "native"}
                      onValueChange={(value) => handleLevelChange(language.id, value)}
                    >
                      <SelectTrigger 
                        id={`language-level-${language.id}`}
                        className="w-full border border-lightGrey bg-white rounded-md"
                        style={{ height: 'var(--input-height)' }}
                      >
                        <SelectValue placeholder="Native or Bilingual Proficiency" />
                      </SelectTrigger>
                      <SelectContent>
                        {languageOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      <AddButton onClick={addLanguage}>
        {t("templates.form.addLanguage")}
      </AddButton>
    </div>
  );
}

import { Button } from "@/components/ui/button";
import { DeleteButton } from "@/components/shared/delete-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCVData } from "@/hooks/use-cv-data";
import { useLanguage } from "@/contexts/LanguageContext";
import { Trash2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { AddButton } from "./add-button";
import { DateSelector } from "./date-selector";
import { RichTextEditor } from "@/components/ui/rich-text-editor";

export default function Experience() {
  const { t } = useLanguage();
  const { cvData, addExperience, updateExperience, removeExperience } =
    useCVData();

  const handleInputChange = (
    id: string,
    field: string,
    value: string | boolean,
  ) => {
    updateExperience(id, { [field]: value });
  };

  return (
    <div className="cv-section-content flex flex-col gap-6">
      {cvData.experience.length === 0 ? (
        <div className="p-4 border border-lightGrey rounded-md bg-white/50 text-center text-neutral/60">
          <p>
            {t('cvBuilder.experience.noExperience')}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {cvData.experience.map((experience) => (
            <div key={experience.id} className="cv-item-card">
              <div className="cv-item-header">
                <DeleteButton onClick={() => removeExperience(experience.id)} />
              </div>

              <div className="cv-item-content">
                <div className="space-y-4">
                  <div>
                    <Label
                      htmlFor={`exp-title-${experience.id}`}
                      className="cv-label"
                    >
                      {t('cvBuilder.experience.position')}
                    </Label>
                    <Input
                      id={`exp-title-${experience.id}`}
                      value={experience.position || ""}
                      onChange={(e) =>
                        handleInputChange(
                          experience.id,
                          "position",
                          e.target.value,
                        )
                      }
                      className="cv-input"
                      placeholder={t('cvBuilder.experience.placeholders.position')}
                    />
                  </div>

                  <div>
                    <Label
                      htmlFor={`exp-company-${experience.id}`}
                      className="cv-label"
                    >
                      {t('cvBuilder.experience.company')}
                    </Label>
                    <Input
                      id={`exp-company-${experience.id}`}
                      value={experience.company || ""}
                      onChange={(e) =>
                        handleInputChange(
                          experience.id,
                          "company",
                          e.target.value,
                        )
                      }
                      className="cv-input"
                      placeholder={t('cvBuilder.experience.placeholders.company')}
                    />
                  </div>

                  <div>
                    <Label
                      htmlFor={`exp-location-${experience.id}`}
                      className="cv-label"
                    >
                      {t('cvBuilder.experience.location')}
                    </Label>
                    <Input
                      id={`exp-location-${experience.id}`}
                      value={experience.location || ""}
                      onChange={(e) =>
                        handleInputChange(
                          experience.id,
                          "location",
                          e.target.value,
                        )
                      }
                      className="cv-input"
                      placeholder={t('cvBuilder.experience.placeholders.location')}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <DateSelector
                      label={t('cvBuilder.experience.from')}
                      id={`exp-start-date-${experience.id}`}
                      value={{
                        month: experience.startMonth || "",
                        year: experience.startYear || "",
                      }}
                      onChange={(month, year) => {
                        handleInputChange(experience.id, "startMonth", month);
                        handleInputChange(experience.id, "startYear", year);
                      }}
                      placeholder="mm/yyyy"
                    />

                    <DateSelector
                      label={t('cvBuilder.experience.to')}
                      id={`exp-end-date-${experience.id}`}
                      value={{
                        month: experience.endMonth || "",
                        year: experience.endYear || "",
                      }}
                      onChange={(month, year) => {
                        handleInputChange(experience.id, "endMonth", month);
                        handleInputChange(experience.id, "endYear", year);
                      }}
                      placeholder="mm/yyyy"
                      disabled={experience.isCurrent}
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id={`current-position-${experience.id}`}
                      checked={experience.isCurrent || false}
                      onCheckedChange={(checked) =>
                        handleInputChange(experience.id, "isCurrent", checked)
                      }
                    />
                    <Label
                      htmlFor={`current-position-${experience.id}`}
                      className="text-sm text-gray-500 cursor-pointer"
                    >
                      {t('cvBuilder.experience.current')}
                    </Label>
                  </div>

                  <div>
                    <Label
                      htmlFor={`exp-description-${experience.id}`}
                      className="cv-label"
                    >
                      {t('cvBuilder.experience.description')}
                    </Label>
                    <RichTextEditor
                      id={`exp-description-${experience.id}`}
                      value={experience.description || ""}
                      onChange={(value) =>
                        handleInputChange(
                          experience.id,
                          "description",
                          value,
                        )
                      }
                      placeholder={t('cvBuilder.experience.placeholders.description')}
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <AddButton onClick={addExperience}>{t('cvBuilder.experience.add')}</AddButton>
    </div>
  );
}

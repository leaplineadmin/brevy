import React from "react";
import { getTemplate } from "@/lib/cv-templates";
import { CVData } from "@shared/schema";

interface CVPreviewThumbnailProps {
  templateId: string;
  cvData: CVData;
  mainColor: string;
}

export const CVPreviewThumbnail: React.FC<CVPreviewThumbnailProps> = ({
  templateId,
  cvData,
  mainColor,
}) => {
  const TemplateComponent = getTemplate(templateId);

  if (!TemplateComponent) {
    return (
      <div className="w-full h-32 bg-gray-200 rounded border-2 border-gray-300 flex items-center justify-center">
        <span className="text-gray-500 text-sm">Template non trouvé</span>
      </div>
    );
  }

  return (
    <div className="w-full h-full overflow-hidden relative" style={{ backgroundColor: "var(--lightGrey)" }}>
      <div 
        className="w-full h-full"
        style={{
          transform: "scale(0.2)",
          transformOrigin: "top left",
          width: "500%",
          height: "500%",
        }}
      >
        <div className="mobile-preview" style={{ width: "100%", minHeight: "400px" }}>
          <TemplateComponent
            data={cvData}
            mainColor={mainColor}
            hidePhoto={false}
            hideCity={false}
            hideSkillLevels={false}
            hideToolLevels={false}
            hideLanguageLevels={false}
            hideLinkedIn={false}
            hideWebsite={false}
          />
        </div>
      </div>
    </div>
  );
};
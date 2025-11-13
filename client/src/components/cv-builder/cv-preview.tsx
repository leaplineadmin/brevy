import { useCVData } from "@/hooks/use-cv-data";
import { getTemplate } from "@/lib/cv-templates/index";
import { Button } from "@/components/ui/button";
import { Maximize } from "lucide-react";
import { useState } from "react";
import ZoomPreview from "./zoom-preview";
import { TemplateWrapper } from "@/components/shared/template-wrapper";

import { logger } from "@shared/logger";

export default function CVPreview() {
  const { cvData, templateId, mainColor } = useCVData();
  const [isZoomOpen, setIsZoomOpen] = useState(false);
  
  // Utiliser getTemplate de la même façon que dans digital-preview.tsx
  logger.debug(`cv-preview - templateId: ${templateId}`, 'component');
  const TemplateComponent = getTemplate(templateId);
  
  return (
    <div className="sticky top-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-grotesque text-xl font-bold text-neutral">Preview</h3>
          <Button 
            variant="ghost" 
            size="sm"
            className="text-primary hover:text-primary/90 font-teachers flex items-center gap-1"
            onClick={() => setIsZoomOpen(true)}
          >
            <Maximize className="h-5 w-5 mr-1" />
            Zoom
          </Button>
        </div>
        
        <div className="a4-page cv-preview">
          <TemplateWrapper templateId={templateId}>
            <TemplateComponent data={{...cvData, style: { mainColor, template: templateId }}} mainColor={mainColor} />
          </TemplateWrapper>
        </div>
      </div>
      
      {isZoomOpen && (
        <ZoomPreview 
          isOpen={isZoomOpen} 
          onClose={() => setIsZoomOpen(false)} 
        />
      )}
    </div>
  );
}

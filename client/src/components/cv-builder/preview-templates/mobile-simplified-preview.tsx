import React from "react";
import { ColorSelector } from "../shared/color-selector";
import { TemplateSelector } from "../template-selector";

interface MobileSimplifiedPreviewProps {
  children: React.ReactNode;
  mainColor: string;
  setMainColor: (color: string) => void;
  templateId: string;
  setTemplateId: (id: string) => void;
}

export const MobileSimplifiedPreview: React.FC<
  MobileSimplifiedPreviewProps
> = ({ children, mainColor, setMainColor, templateId, setTemplateId }) => {
  // Fonction pour rendre le contenu directement sans mockup
  const renderDirectView = () => (
    <div
      className="normal-preview"
      style={{
        width: "100%",
        height: "auto",
        minHeight: "100%",
        overflow: "visible",
        display: "flex",
        flexDirection: "column",
        paddingBottom: "80px",
      }}
    >
      <div
        style={{
          flex: "1 1 0%",
          height: "100%",
        }}
      >
        {children}
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex flex-col">
      {/* Barre d'outils supérieure */}
      <div className="bg-white border-b p-4 flex items-center justify-between z-10 flex-shrink-0">
        <div className="flex items-center space-x-6">
          {/* Template Selector en mode drawer pour écrans sous 1280px */}
          <div className="desktop:hidden">
            <TemplateSelector
              selectedTemplate={templateId}
              onTemplateSelect={setTemplateId}
              displayMode="drawer"
            />
          </div>

          {/* Sélecteur de couleur */}
          <ColorSelector
            mainColor={mainColor}
            setMainColor={setMainColor}
            variant="compact"
            showLabel={true}
          />
        </div>
      </div>

      {/* Layout principal avec grid */}
      <div className="grid grid-cols-12 h-[calc(100vh-65px)]">
        {/* Zone de preview - 10 colonnes sur desktop, 12 sur tablette/mobile */}
        <div className="col-span-12 desktop:col-span-10 bg-gray-50 overflow-auto">
          {renderDirectView()}
        </div>

        {/* Template Selector sidebar - 2 colonnes, visible uniquement sur desktop (1280px+) */}
        <div className="hidden desktop:block desktop:col-span-2 bg-white border-l border-gray-200 overflow-y-auto p-6">
          <TemplateSelector
            selectedTemplate={templateId}
            onTemplateSelect={setTemplateId}
            displayMode="sidebar"
          />
        </div>
      </div>
    </div>
  );
};

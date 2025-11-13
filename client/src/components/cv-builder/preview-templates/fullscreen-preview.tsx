import React, { useState, useEffect, useRef } from "react";
import { XCircle } from "lucide-react";
import { PreviewMode } from "@/context/PreviewContext";
import { ColorSelector } from "../shared/color-selector";
import { PreviewModeSelector } from "../shared/preview-mode-selector";
import { MobileMockup } from "../shared/mobile-mockup";
import { TemplateSelector } from "../template-selector";

interface FullscreenPreviewProps {
  children: React.ReactNode;
  isOpen: boolean;
  onClose: () => void;
  previewMode: PreviewMode;
  setPreviewMode: (mode: PreviewMode) => void;
  mainColor: string;
  setMainColor: (color: string) => void;
  templateId: string;
  setTemplateId: (id: string) => void;
}

// Dimensions de référence pour le template desktop
const DESKTOP_TARGET_WIDTH = 1280;
const DESKTOP_TARGET_HEIGHT = 832;
const MOCKUP_ASPECT_RATIO = 16 / 10;

export const FullscreenPreview: React.FC<FullscreenPreviewProps> = ({
  children,
  isOpen,
  onClose,
  previewMode,
  setPreviewMode,
  mainColor,
  setMainColor,
  templateId,
  setTemplateId,
}) => {
  if (!isOpen) return null;

  // Pour le scaling en mode desktop
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [dimensions, setDimensions] = useState({
    width: DESKTOP_TARGET_WIDTH,
    height: DESKTOP_TARGET_HEIGHT,
  });

  // Effect pour gérer le scaling en mode desktop
  useEffect(() => {
    if (previewMode !== "desktop" || !containerRef.current) return;

    const container = containerRef.current;

    const updateScaling = () => {
      const containerWidth = container.clientWidth;
      const containerHeight = container.clientHeight;

      // Calculer les dimensions en préservant le ratio 16:10
      let width = containerWidth;
      let height = width / MOCKUP_ASPECT_RATIO;

      // Ajuster si la hauteur dépasse l'espace disponible
      if (height > containerHeight) {
        height = containerHeight;
        width = height * MOCKUP_ASPECT_RATIO;
      }

      // Calculer l'échelle
      const newScale =
        width >= DESKTOP_TARGET_WIDTH ? 1 : width / DESKTOP_TARGET_WIDTH;

      setDimensions({ width, height });
      setScale(newScale);
    };

    // Observer les changements de taille
    const resizeObserver = new ResizeObserver(() => {
      requestAnimationFrame(updateScaling);
    });

    resizeObserver.observe(container);

    // Calcul initial
    updateScaling();

    return () => resizeObserver.disconnect();
  }, [previewMode]);

  // Fonction pour rendre le contenu en mode desktop
  const renderDesktopView = () => (
    <div
      ref={containerRef}
      className="normal-preview"
      style={{
        width: "100%",
        height: "100%",
        minHeight: "100%",
        overflow: "visible",
        display: "flex",
        flexDirection: "column",
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

  // Fonction pour rendre le contenu en mode mobile
  const renderMobileView = () => (
    <div
      className="p-8 flex-1 flex items-center justify-center"
      style={{
        maxHeight: "calc(100% - 16px)",
        overflow: "hidden",
        boxSizing: "border-box",
      }}
    >
      <MobileMockup resetScrollKey={templateId}>
        {children}
      </MobileMockup>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex flex-col fullscreen-preview">
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

          <PreviewModeSelector
            previewMode={previewMode}
            setPreviewMode={setPreviewMode}
            variant="compact"
          />

          {/* Sélecteur de couleur */}
          <ColorSelector
            mainColor={mainColor}
            setMainColor={setMainColor}
            variant="compact"
            showLabel={true}
          />
        </div>

        {/* Bouton de fermeture */}
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700 transition-colors"
          aria-label="Fermer l'aperçu plein écran"
        >
          <XCircle size={24} />
        </button>
      </div>
      
      {/* Layout principal avec grid */}
      <div className="grid grid-cols-12 h-[calc(100vh-65px)]">
        {/* Zone de preview - 10 colonnes sur desktop, 12 sur tablette/mobile */}
        <div className="col-span-12 desktop:col-span-10 bg-gray-50 overflow-auto">
          {previewMode === "desktop" ? renderDesktopView() : renderMobileView()}
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
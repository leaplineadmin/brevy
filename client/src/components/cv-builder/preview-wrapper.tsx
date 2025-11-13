import React, { useRef, useState, useEffect } from "react";
import { MobileMockup } from "./shared/mobile-mockup";
import { CVFooter } from "../shared/cv-footer";
import { usePreview } from "@/context/PreviewContext";

interface PreviewWrapperProps {
  children: React.ReactNode;
  mode: "desktop" | "mobile";
  templateId: string;
  mainColor?: string;
}

export const PreviewWrapper: React.FC<PreviewWrapperProps> = ({
  children,
  mode,
  templateId,
  mainColor,
}) => {
  const { placeholderData } = usePreview();
  // Mode Desktop - Structure simplifiée selon vos spécifications
  if (mode === "desktop") {
    const containerRef = useRef<HTMLDivElement>(null);
    const parentRef = useRef<HTMLDivElement>(null);
    const browserBarRef = useRef<HTMLDivElement>(null);
    const [scale, setScale] = useState(1);
    const [dimensions, setDimensions] = useState({ width: 1280, height: 800, contentHeight: 756 });
    const [browserBarHeight, setBrowserBarHeight] = useState(44); // hauteur approximative par défaut

    useEffect(() => {
      const container = containerRef.current;
      const parent = parentRef.current;
      const browserBar = browserBarRef.current;
      if (!container || !parent) return;

      const updateScaling = () => {
        // Mesurer la hauteur de la barre de navigateur
        let barHeight = 44; // valeur par défaut
        if (browserBar) {
          barHeight = browserBar.getBoundingClientRect().height;
          setBrowserBarHeight(barHeight);
        }
        
        // Get the parent container dimensions (the one with p-8 padding)
        const parentRect = parent.getBoundingClientRect();
        
        // Target dimensions for the mockup content
        const targetWidth = 1280;
        const targetHeight = 800;
        const aspectRatio = targetWidth / targetHeight; // 16:10 = 1.6
        
        // Available space inside the parent container
        const availableWidth = parentRect.width;
        const availableHeight = parentRect.height;
        
        // Calculate what the dimensions should be based on available space
        let mockupWidth = availableWidth;
        let mockupHeight = mockupWidth / aspectRatio;
        
        // If the calculated height exceeds available space, constrain by height
        if (mockupHeight > availableHeight) {
          mockupHeight = availableHeight;
          mockupWidth = mockupHeight * aspectRatio;
        }
        
        // Calculate scale based on the target width
        const newScale = mockupWidth >= targetWidth ? 1 : mockupWidth / targetWidth;
        
        // Calculate available content height (mockup height minus browser bar)
        const availableContentHeight = mockupHeight - barHeight;
        
        setScale(newScale);
        setDimensions({ 
          width: mockupWidth, 
          height: mockupHeight,
          contentHeight: availableContentHeight
        });
      };

      const resizeObserver = new ResizeObserver(() => {
        requestAnimationFrame(updateScaling);
      });

      resizeObserver.observe(parent);
      updateScaling();
      return () => resizeObserver.disconnect();
    }, []);

    return (
      <div 
        ref={parentRef}
        className="w-full h-full flex items-center justify-center"
      >
        <div 
          className="rounded-lg overflow-hidden flex flex-col shadow-[0px_0px_30px_0px_rgba(0,_0,_0,_0.2)]"
          style={{
            width: `${dimensions.width}px`,
            height: `${dimensions.height}px`,
          }}
        >
          {/* Fausse top bar du navigateur - proportionnelle */}
          <div ref={browserBarRef} className="bg-gray-100 border-b border-gray-200 px-4 py-2 flex items-center rounded-t-lg z-10 flex-shrink-0">
            <div className="flex space-x-2 mr-4">
              <div className="w-3 h-3 rounded-full bg-gray-300"></div>
              <div className="w-3 h-3 rounded-full bg-gray-300"></div>
              <div className="w-3 h-3 rounded-full bg-gray-300"></div>
            </div>
            <div className="flex-1 bg-white border border-gray-200 rounded-md px-3 py-1 text-xs text-gray-500 truncate">
              brevy.me/preview
            </div>
          </div>

          {/* Faux écran 16:10 - se comporte comme un vrai écran avec scroll */}
          <div
            ref={containerRef}
            className="flex-1 bg-gray-100 border border-gray-200 border-t-0 rounded-b-lg"
            style={{
              overflow: "hidden", // Empêcher le scroll externe
              position: "relative",
            }}
          >
            {/* Template content */}
            <div
              className="normal-preview"
              style={{
                width: scale < 1 ? "1280px" : "100%",
                height: scale < 1 ? `${dimensions.contentHeight / scale}px` : "100%",
                minHeight: scale < 1 ? `${dimensions.contentHeight / scale}px` : "100%",
                maxHeight: "none",
                transform: scale < 1 ? `scale(${scale})` : "none",
                transformOrigin: "top left",
                overflow: "auto",
              }}
            >
              {children}
            </div>
            
            {/* CVFooter fixe en bas de l'écran de prévisualisation - adapté au scale */}
            <div 
              className="cv-footer-wrapper-overlay"
              style={{
                position: "absolute",
                bottom: "16px",
                right: "16px",
                zIndex: 50,
                transform: scale < 1 ? `scale(${scale})` : "none",
                transformOrigin: "bottom right",
              }}
            >
              <CVFooter
                cvData={placeholderData}
                templateId={templateId}
                mainColor={mainColor || "#008BC7"}
                showBrevyLink={true}
                isPreview={true}
                className="cv-footer-wrapper"
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Mode Mobile
  if (mode === "mobile") {
    return (
      <MobileMockup>
        {children}
      </MobileMockup>
    );
  }

  return <div>Mode de prévisualisation non supporté</div>;
};
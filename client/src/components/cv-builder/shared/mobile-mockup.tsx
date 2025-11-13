import React, { useRef, useEffect } from "react";

interface MobileMockupProps {
  children: React.ReactNode;
  width?: number;
  height?: number;
  resetScrollKey?: string; // Clé pour forcer la réinitialisation du scroll
}

export function MobileMockup({ 
  children, 
  width = 294, 
  height = 600,
  resetScrollKey
}: MobileMockupProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Réinitialise le scroll quand resetScrollKey change
  useEffect(() => {
    if (scrollContainerRef.current && resetScrollKey) {
      scrollContainerRef.current.scrollTop = 0;
    }
  }, [resetScrollKey]);
  
  return (
    <div
      className="relative"
      style={{
        width: `${width}px`,
        height: `${height}px`,
        borderRadius: "24px",
        background: "#1a1a1a",
        boxShadow: "0px 0px 30px 0px rgba(0, 0, 0, 0.2)",
        overflow: "hidden",
        padding: "8px",
      }}
    >

      {/* Barre de statut iPhone 14 */}
      <div className="flex justify-between items-center px-4 py-1 text-xs text-white bg-black rounded-t-2xl h-6 relative z-10">
        <span style={{ margin: "4px" }}>9:41</span>
        <div className="flex items-center space-x-2" style={{ margin: "4px" }}>
          <div className="w-4 h-2 bg-white rounded-sm opacity-60"></div>
          <div className="w-6 h-3 border border-white rounded-sm opacity-60">
            <div className="w-3 h-1.5 bg-white rounded-xs opacity-80 m-0.5"></div>
          </div>
        </div>
      </div>

      {/* Container iframe simulé */}
      <div
        style={{
          width: "100%",
          height: `calc(100% - 24px)`,
          overflow: "hidden",
          position: "relative",
          borderRadius: "0 0 1rem 1rem"
        }}
      >
        {/* Viewport mobile simulé avec scale */}
        <div
          ref={scrollContainerRef}
          className="mobile-viewport-no-hover mobile-preview-container"
          style={{
            width: "100%",
            height: "100%",
            overflow: "auto",
            position: "absolute",
          }}
        >
          <div
            className="template-container"
            style={{
              containerType: "inline-size",
              containerName: "template",
              width: "100%",
              minHeight: "100vh",
              overflow: "visible",
            }}
          >
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
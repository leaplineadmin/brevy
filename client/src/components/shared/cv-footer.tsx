import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Download } from "lucide-react";
import { generatePDFWithText } from "@/lib/pdf-generator-text";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";

interface CVFooterProps {
  cvData: any;
  templateId: string;
  mainColor: string;
  showBrevyLink?: boolean;
  isPreview?: boolean;
  className?: string;
  hasSubscription?: boolean;
  isPublished?: boolean; // New prop to indicate if this is a published CV
  subdomain?: string; // Subdomain for the published CV URL
}

const CVFooter = ({
  cvData,
  templateId,
  mainColor,
  showBrevyLink = true,
  isPreview = false,
  className = "",
  hasSubscription = false,
  isPublished = false,
  subdomain,
}: CVFooterProps) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [mockupContainer, setMockupContainer] = useState<HTMLElement | null>(
    null,
  );
  const footerRef = useRef<HTMLDivElement>(null);
  const { user, isLoading: isLoadingAuth } = useAuth();
  const { toast } = useToast();
  const languageContext = useLanguage();
  const { language, t } = languageContext || { 
    language: 'en', 
    t: (key: string) => {
      // Fallback translations when context is not available
      const fallbacks: Record<string, string> = {
        'toasts.authenticationRequired': 'Authentication required',
        'toasts.signInToDownload': 'Sign in or create an account to download the PDF file'
      };
      return fallbacks[key] || key;
    }
  };

  // Cherche le container du mockup mobile pour utiliser un positionnement spécial
  useEffect(() => {
    const findMockupContainer = () => {
      if (!footerRef.current) return;

      let parent = footerRef.current.parentElement;
      while (parent) {
        if (parent.classList.contains("mobile-viewport-no-hover")) {
          // Utilise le container iframe simulé (parent de mobile-viewport-no-hover)
          let mockupViewport = parent.parentElement;
          if (mockupViewport) {
            setMockupContainer(mockupViewport);
            return;
          }
        }
        parent = parent.parentElement;
      }
      setMockupContainer(null);
    };

    findMockupContainer();
    const timeout = setTimeout(findMockupContainer, 100);
    return () => clearTimeout(timeout);
  }, []);

  const handlePDFDownload = async () => {
    // Check authentication only for non-published CVs (CV builder preview)
    if (!user && !isPublished) {
      toast({
        title: t('toasts.authenticationRequired'),
        description: t('toasts.signInToDownload'),
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    try {
      // Get subdomain from prop, cvData, or URL
      let cvSubdomain = subdomain;
      if (!cvSubdomain && cvData?.subdomain) {
        cvSubdomain = cvData.subdomain;
      }
      // If on a shared CV page, try to get subdomain from URL
      if (!cvSubdomain && typeof window !== 'undefined') {
        const pathMatch = window.location.pathname.match(/\/shared\/([^/]+)/);
        if (pathMatch) {
          cvSubdomain = pathMatch[1];
        }
      }
      
      // Ensure we pass the correct data structure to PDF generator
      await generatePDFWithText(cvData, templateId, mainColor, language, cvSubdomain);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      toast({
        title: "PDF Generation Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const footerContent = (
    <div
      className={`bg-black/80 backdrop-blur-sm text-white rounded-2xl text-s flex flex-row items-center shadow-lg whitespace-nowrap ${!isPreview ? "gap-6" : ""}`}
      style={{
        padding:
          isPreview || hasSubscription
            ? "0.25rem"
            : "0.25rem 0.25rem 0.25rem 1.5rem",
      }}
    >
      {/* Lien Brevy - masqué en preview et pour les utilisateurs Premium */}
      {!isPreview && showBrevyLink && !hasSubscription && (
        <a
          href="https://brevy.me"
          className="text-white hover:text-white transition-colors hover:underline hover:underline-offset-2"
          style={
            {
              "--tw-underline-color": "white",
              textDecorationColor: "white",
            } as React.CSSProperties
          }
          target="_blank"
          rel="noopener noreferrer"
        >
          Created with <b>Brevy</b>
        </a>
      )}

      {/* Bouton PDF */}
      <button
        onClick={handlePDFDownload}
        disabled={isGenerating}
        className="group relative flex items-center gap-1.5 text-s rounded-xl text-white border-none shadow-none disabled:opacity-50 transition-all duration-200 hover:scale-105"
        style={{
          backgroundColor: mainColor,
          padding: "0.5rem",
          transition: "all 0.3s ease-in-out",
        }}
        title="Download as PDF"
      >
        {/* Icône PDF personnalisée */}
        <svg
          width="32"
          height="32"
          viewBox="0 0 32 32"
          fill="white"
          xmlns="http://www.w3.org/2000/svg"
          className="flex-shrink-0"
        >
          <g>
            <path d="M11.1,13.2c-.3-.2-.7-.2-1.1-.2h-2.3v5.7h1.4v-1.8h.9c.4,0,.8,0,1.1-.2.3-.2.6-.4.7-.7.2-.3.3-.6.3-1s0-.7-.3-1c-.2-.3-.4-.5-.7-.7ZM10.6,15.4c0,.1-.2.2-.3.3-.1,0-.3.1-.5.1h-.7v-1.7h.7c.2,0,.4,0,.5.1s.2.2.3.3c0,.1.1.3.1.5s0,.3-.1.5Z" />
            <path d="M16.6,13.3c-.4-.2-.9-.3-1.5-.3h-2.1v5.7h2.1c.6,0,1.1-.1,1.5-.3.4-.2.7-.6,1-1,.2-.4.3-.9.3-1.5s-.1-1.1-.3-1.5c-.2-.4-.5-.7-1-1ZM16.3,16.8c-.1.2-.3.4-.5.5-.2.1-.5.2-.8.2h-.7v-3.3h.7c.3,0,.6,0,.8.2.2.1.4.3.5.5.1.2.2.6.2,1s0,.7-.2,1Z" />
            <polygon points="18.9 18.7 20.2 18.7 20.2 16.4 22.5 16.4 22.5 15.3 20.2 15.3 20.2 14.1 22.7 14.1 22.7 13 18.9 13 18.9 18.7" />
            <path d="M27,20.4v-10.3c0-.2,0-.4-.2-.5l-7.2-7.2c-.1-.1-.3-.2-.5-.2h-7.5C4.6,2.2,3,3.9,3,10.8v9.4c0,6.9,1.7,8.5,8.5,8.5h8.3c1,1,2.3,1.6,3.8,1.6,3,0,5.5-2.5,5.5-5.5s-.9-3.4-2.2-4.4ZM18.9,3.9l5.3,5.3h-5.3V3.9ZM18.1,24.8c0,.9.2,1.7.6,2.4h-7.2c-6,0-7-1-7-7v-9.4c0-6,1-7,7-7h5.9v6.2c0,.4.3.8.8.8h7.3v8.9c-.6-.2-1.2-.3-1.8-.3-3,0-5.5,2.5-5.5,5.5ZM26.8,25.3l-3.1,3.1-3.1-3.1c-.3-.3-.3-.8,0-1.1s.8-.3,1.1,0l1.3,1.3v-3.7c0-.4.3-.8.8-.8s.8.3.8.8v3.8l1.3-1.3c.3-.3.8-.3,1.1,0s.3.8,0,1.1Z" />
          </g>
        </svg>

        {/* Texte seulement lors de la génération */}
        {isGenerating && <span className="text-xs">Generating...</span>}
      </button>
    </div>
  );

  // Si on est dans un mockup mobile, utilise un portal pour positionner par rapport au viewport du mockup
  if (mockupContainer) {
    return (
      <>
        <div ref={footerRef} style={{ display: "none" }}></div>
        {createPortal(
          <div
            className="absolute bottom-4 right-4 z-50 print:hidden"
            style={{
              position: "absolute",
              bottom: "16px",
              right: "16px",
              zIndex: 50,
            }}
          >
            {footerContent}
          </div>,
          mockupContainer,
        )}
      </>
    );
  }

  // Sinon, comportement normal
  return (
    <div
      ref={footerRef}
      className={`fixed bottom-4 right-4 z-50 print:hidden ${className}`}
    >
      {footerContent}
    </div>
  );
};

export { CVFooter };
export default CVFooter;

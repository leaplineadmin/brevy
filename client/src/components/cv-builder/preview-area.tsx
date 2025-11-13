import React, { useState, useEffect } from "react";
import { usePreview } from "@/context/PreviewContext";
import { useCVData } from "@/hooks/use-cv-data";
import { CV } from "@/types/cv";
import { useIsMobile } from "@/hooks/use-mobile";
// Import the new unified preview wrapper
import { PreviewWrapper } from "./preview-wrapper";
import { FullscreenPreview } from "./preview-templates/fullscreen-preview";
import { MobileSimplifiedPreview } from "./preview-templates/mobile-simplified-preview";
import { DigitalCVPreview } from "./content/digital-preview";
import { Maximize2, Crown, Sparkles } from "lucide-react";
import { TemplateSelector, templates } from "./template-selector";
import { ColorSelector } from "./shared/color-selector";
import { PreviewModeSelector } from "./shared/preview-mode-selector";
import { useLanguage } from "@/contexts/LanguageContext";
import { getDefaultCVData } from "@/lib/default-cv-data";
import { useAuth } from "@/hooks/useAuth";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  CustomAlert,
  CustomAlertDescription,
} from "@/components/ui/custom-alert";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { ValidationModal } from "@/components/cv-builder/validation-modal";

// Import image preloader
import { imagePreloader } from "@/lib/image-preloader";

interface PreviewAreaProps {
  templateId: string;
  setTemplateId: (id: string) => void;
}

export const PreviewArea: React.FC<PreviewAreaProps> = ({
  templateId,
  setTemplateId,
}) => {
  const { t, language } = useLanguage();
  const { 
    previewMode, 
    setPreviewMode, 
    updatePlaceholderWithRealData,
    hidePhoto,
    hideCity,
    hideSkillLevels,
    hideToolLevels,
    hideLanguageLevels,
    hideLinkedIn,
    hideWebsite
  } = usePreview();
  const { cvData, mainColor, setMainColor } = useCVData();
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMobileViewport, setIsMobileViewport] = useState(false);
  const [previewData, setPreviewData] = useState<Partial<CV>>({});
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Check if selected template is premium
  const selectedTemplate = templates.find((t) => t.id === templateId);
  const isPremiumTemplate = selectedTemplate?.isPremium || false;
  const hasSubscription = (user as any)?.hasActiveSubscription || false;

  // CV validation function (unified with navbar - shorter validation)
  const validateCV = (): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];

    // Check both nested and flat structure (schema supports both)
    const firstName = cvData.personalInfo?.firstName || cvData.firstName;
    const lastName = cvData.personalInfo?.lastName || cvData.lastName;
    const email = cvData.personalInfo?.email || cvData.email;
    const phone = cvData.personalInfo?.phone || cvData.phone;
    const position = cvData.personalInfo?.position || cvData.personalInfo?.jobTitle || cvData.position;
    
    // 1. Basic profile information (group all profile fields into one message)
    const missingProfileFields = [];
    if (!firstName?.trim()) missingProfileFields.push("first name");
    if (!lastName?.trim()) missingProfileFields.push("last name");
    if (!email?.trim()) missingProfileFields.push("email address");
    if (!phone?.trim()) missingProfileFields.push("phone number");
    if (!position?.trim()) missingProfileFields.push("job title");
    
    if (missingProfileFields.length > 0) {
      errors.push("Basic profile informations are required (first name, last name, email address, phone number, job title)");
    }

    // 2. At least one experience
    if (!cvData.experience || cvData.experience.length === 0 || 
        !cvData.experience.some(exp => exp.company?.trim() && exp.position?.trim())) {
      errors.push("At least one experience is required");
    }

    // 3. At least one education
    if (!cvData.education || cvData.education.length === 0 ||
        !cvData.education.some(edu => edu.school?.trim())) {
      errors.push("At least one education is required");
    }

    // 4. At least one skill
    if (!cvData.skills || cvData.skills.length === 0 ||
        !cvData.skills.some(skill => skill.name?.trim())) {
      errors.push("At least one skill is required");
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  };

  const handleSubscribeToPremium = async (e: React.MouseEvent) => {
    e.preventDefault();
    
    
    // CRITICAL FIX: No validation for premium subscription
    // Users should be able to subscribe with completely empty templates
    // They can fill the data later after subscribing

    // Clean CV data to remove default/example values before saving
    const cleanCVData = (data: any) => {
      // Handle completely empty or missing data
      if (!data) {
        return {
          personalInfo: {},
          experience: [],
          education: [],
          skills: [],
          languages: []
        };
      }
      
      // Simple cleaning function to remove placeholder data
      const cleaned = { ...data };
      
      // Ensure basic structure exists
      if (!cleaned.personalInfo) cleaned.personalInfo = {};
      if (!cleaned.experience) cleaned.experience = [];
      if (!cleaned.education) cleaned.education = [];
      if (!cleaned.skills) cleaned.skills = [];
      if (!cleaned.languages) cleaned.languages = [];
      
      // Remove placeholder data from personal info but keep user-entered data
      if (cleaned.personalInfo.firstName === 'John') cleaned.personalInfo.firstName = '';
      if (cleaned.personalInfo.lastName === 'Doe') cleaned.personalInfo.lastName = '';
      if (cleaned.personalInfo.email === 'john.doe@example.com') cleaned.personalInfo.email = '';
      if (cleaned.personalInfo.phone === '+33 1 23 45 67 89') cleaned.personalInfo.phone = '';
      if (cleaned.personalInfo.city === 'New York') cleaned.personalInfo.city = '';
      if (cleaned.personalInfo.jobTitle === 'Full Stack Developer') cleaned.personalInfo.jobTitle = '';
      
      
      return cleaned;
    };

    const cleanedCVData = cleanCVData(cvData);

    // CRITICAL: Create draft payload - handle empty templates gracefully
    const draftPayload = {
      title: cleanedCVData.personalInfo?.firstName ? 
             `${cleanedCVData.personalInfo.firstName}'s CV` : 
             'My Premium Template',
      templateId: templateId || 'template-classic',
      templateType: 'digital',
      mainColor: mainColor || '#0076d1',
      cvData: cleanedCVData,
      displaySettings: {
        hidePhoto: hidePhoto || false,
        hideCity: hideCity || false,
        hideSkillLevels: hideSkillLevels || false,
        hideToolLevels: hideToolLevels || false,
        hideLanguageLevels: hideLanguageLevels || false,
        hideLinkedIn: hideLinkedIn || false,
        hideWebsite: hideWebsite || false
      },
      language: language // Add current language to saved data
    };


    try {
      // Step 1: Create draft on server
      const isProd = typeof window !== 'undefined' && window.location.hostname.endsWith('cvfolio.app');
      const base = isProd ? 'https://cvfolio.onrender.com' : '';
      const draftResponse = await fetch(`${base}/api/cv-drafts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(draftPayload)
      });

      if (!draftResponse.ok) {
        throw new Error(`Draft creation failed: ${draftResponse.status}`);
      }

      const { draftId } = await draftResponse.json();

      // Step 2: Store draftId in localStorage for recovery
      localStorage.setItem('pending-cv-id', draftId);
      
      // CRITICAL FIX: Also save CV data to localStorage as backup
      const cvState = {
        cvData: cleanedCVData,
        templateType: 'digital',
        templateId: templateId || 'template-classic',
        mainColor: mainColor || '#0076d1',
        title: cleanedCVData.personalInfo?.firstName ? 
               `${cleanedCVData.personalInfo.firstName}'s CV` : 
               'My Premium Template',
        displaySettings: {
          hidePhoto: hidePhoto || false,
          hideCity: hideCity || false,
          hideSkillLevels: hideSkillLevels || false,
          hideToolLevels: hideToolLevels || false,
          hideLanguageLevels: hideLanguageLevels || false,
          hideLinkedIn: hideLinkedIn || false,
          hideWebsite: hideWebsite || false
        },
        draftId: draftId,
        savedAt: new Date().toISOString()
      };
      
      localStorage.setItem('pending-cv-save', JSON.stringify(cvState));
      console.log('✅ [PREVIEW] CV data saved to localStorage as backup');

      // Step 3: Route based on authentication status  
      
      if (isAuthenticated) {
        // Authenticated user → go to integrated checkout
        const { getPaymentLinkUrl } = await import('../../lib/stripe');
        window.location.href = getPaymentLinkUrl({ returnTo: 'cv-builder' });
      } else {
        // Non-authenticated user → go to auth with premium redirect and draftId
        const authUrl = `/auth?redirect=premium&draftId=${encodeURIComponent(draftId)}`;
        window.location.href = authUrl;
      }

    } catch (error) {
      
      // Fallback to legacy system if draft creation fails
      toast({
        title: "Error",
        description: "Failed to save CV data. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleIgnoreAndProceedToCheckout = async () => {
    setShowValidationModal(false);
    if (isAuthenticated) {
      const { getPaymentLinkUrl } = await import('../../lib/stripe');
      window.location.href = getPaymentLinkUrl({ returnTo: 'cv-builder' });
    } else {
      window.location.href = "/auth?mode=signin&redirect=premium";
    }
  };

  // Détecter le viewport mobile (sous 800px)
  useEffect(() => {
    const checkViewport = () => {
      setIsMobileViewport(window.innerWidth < 800);
    };

    checkViewport();
    window.addEventListener("resize", checkViewport);
    return () => window.removeEventListener("resize", checkViewport);
  }, []);

  useEffect(() => {
  }, [templateId]);


  const formatYearMonth = (year?: string, month?: string): string => {
    return `${year || "2020"}-${month?.padStart(2, "0") || "01"}`;
  };

  // Données par défaut Alex Martin selon la langue
  const defaultData = getDefaultCVData(language);

  const defaultExperiences = defaultData.experience.map((exp, index) => ({
    id: String(index + 1),
    company: exp.company,
    position: exp.position,
    location: exp.location,
    from: exp.from
      ? exp.from.includes(" ")
        ? `${exp.from.split(" ")[1]}-${exp.from.split(" ")[0] === "Jan" ? "01" : "06"}`
        : exp.from
      : "2020-01",
    to:
      exp.to === "Present"
        ? "Present"
        : exp.to
          ? `${exp.to.split(" ")[1]}-${exp.to.split(" ")[0] === "Dec" ? "12" : "06"}`
          : "2019-12",
    summary: exp.description,
    current: exp.to === "Present",
  }));

  const defaultEducation = defaultData.education.map((edu, index) => ({
    id: String(index + 1),
    school: edu.school,
    diploma: edu.diploma,
    location: edu.location,
    from: edu.from
      ? edu.from.includes(" ")
        ? `${edu.from.split(" ")[1]}-${edu.from.split(" ")[0] === "Sep" ? "09" : "01"}`
        : edu.from
      : "2016-09",
    to: edu.to
      ? edu.to.includes(" ")
        ? `${edu.to.split(" ")[1]}-${edu.to.split(" ")[0] === "Jun" ? "06" : "12"}`
        : edu.to
      : "2018-06",
    description: edu.description || "",
  }));

  useEffect(() => {

    // Déterminer si nous utilisons les données par défaut ou réelles
    let experienceData = defaultExperiences;
    let educationData = defaultEducation;

    // Si cvData a des expériences valides, les utiliser
    if (
      cvData.experience?.length > 0 &&
      cvData.experience.some(
        (exp) => exp.company || exp.position || exp.description,
      )
    ) {
      experienceData = cvData.experience.map((exp) => ({
        id: exp.id,
        company: exp.company || "",
        position: exp.position || "",
        location: exp.location || "",
        from: formatYearMonth(exp.startYear, exp.startMonth),
        to: exp.isCurrent
          ? "Present"
          : formatYearMonth(exp.endYear, exp.endMonth),
        summary: exp.description || "",
        current: exp.isCurrent || false,
      }));
    } else {
    }

    // Si cvData a des éducations valides, les utiliser - et supprimer les données d'exemple
    if (
      cvData.education?.length > 0 &&
      cvData.education.some(
        (edu) =>
          edu.school ||
          edu.diploma ||
          edu.degree ||
          edu.description ||
          edu.location ||
          edu.from ||
          edu.to,
      )
    ) {
      // Utiliser uniquement les données réelles, sans fallbacks vers les exemples
      educationData = cvData.education
        .filter(
          (edu) =>
            edu.school ||
            edu.diploma ||
            edu.degree ||
            edu.description ||
            edu.location ||
            edu.from ||
            edu.to,
        )
        .map((edu) => ({
          id: edu.id,
          school: edu.school || "",
          diploma: edu.diploma || edu.degree || "",
          location: edu.location || "",
          from: edu.from || formatYearMonth(edu.startYear, edu.startMonth),
          to: edu.to || formatYearMonth(edu.endYear, edu.endMonth),
          description: edu.description || "",
        }));
    } else {
    }

    // Get the appropriate placeholder image based on template
    const getPlaceholderImage = (templateId: string) => {
      return imagePreloader.getImageSrc(templateId);
    };

    // Simplified data mapping for clarity - avec données Alex Martin traduites
    const previewData: Partial<CV> = {
      personalInfo: {
        firstName: cvData.firstName || defaultData.personalInfo.firstName,
        lastName: cvData.lastName || defaultData.personalInfo.lastName,
        jobTitle: cvData.position || defaultData.personalInfo.jobTitle,
        photo: cvData.photoUrl || getPlaceholderImage(templateId),
        email: cvData.email || "",
        phone: cvData.phone || defaultData.personalInfo.phone,
        city: cvData.city || defaultData.personalInfo.city,
        country: cvData.country || defaultData.personalInfo.country,
        linkedin: cvData.linkedin || "",
        website: cvData.website || "",
        summary: cvData.summary || defaultData.personalInfo.summary,
      },
      experience: experienceData,
      education: educationData,
      skills:
        cvData.skills?.length > 0 &&
        cvData.skills.some((skill) => skill.name?.trim())
          ? cvData.skills.map((skill) => ({
              id: skill.id,
              name: skill.name || "",
              level:
                (skill.level as
                  | "beginner"
                  | "medium"
                  | "advanced"
                  | "expert") || "medium",
              showLevel: skill.showLevel !== false,
            }))
          : defaultData.skills.map((skill, index) => ({
              id: String(index + 1),
              name: skill.name,
              level:
                index === 0
                  ? ("expert" as "expert")
                  : ("advanced" as "advanced"),
              showLevel: true,
            })),
      tools:
        cvData.tools &&
        cvData.tools.length > 0 &&
        cvData.tools.some((tool) => tool.name?.trim())
          ? cvData.tools.map((tool) => ({
              id: tool.id,
              name: tool.name || "",
              level:
                (tool.level as "beginner" | "medium" | "advanced" | "expert") ||
                "medium",
              showLevel: tool.showLevel !== false,
            }))
          : cvData.tools && cvData.tools.length > 0
            ? defaultData.tools.map((tool, index) => ({
                id: `default-${index + 1}`,
                name: tool.name,
                level: "medium" as "medium",
                showLevel: true,
              }))
            : [],
      languages:
        cvData.languages?.length > 0 &&
        cvData.languages.some((lang) => lang.name?.trim())
          ? cvData.languages.map((lang) => ({
              id: lang.id,
              name: lang.name || "",
              level: convertLanguageLevel(lang.level || "B2"),
              showLevel: true,
            }))
          : defaultData.languages.map((lang, index) => ({
              id: String(index + 1),
              name: lang.name,
              level: index === 0 ? "native" : "intermediate",
              showLevel: true,
            })),
      certifications:
        cvData.certifications && cvData.certifications.length > 0
          ? cvData.certifications.map((cert) => ({
              id: cert.id,
              name: cert.name || "",
              issuer: cert.issuer || "",
              date: cert.date || "",
            }))
          : [],
      hobbies:
        cvData.hobbies && cvData.hobbies.length > 0
          ? cvData.hobbies.map((hobby) => ({
              id: hobby.id,
              name: hobby.name || "",
            }))
          : [],
      phoneCountryCode: cvData.phoneCountryCode || "+33",
      style: {
        mainColor: mainColor,
        template: templateId,
      },
    };
    updatePlaceholderWithRealData(previewData);
    setPreviewData(previewData); // Stocker les données pour utilisation en dehors du useEffect
    // Nous utilisons un ref pour éviter les boucles infinies avec mainColor
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cvData, templateId]);

  function convertSkillLevel(
    level: string,
  ): "very-beginner" | "beginner" | "medium" | "advanced" | "expert" {
    const numLevel = parseInt(level || "0", 10);

    // Conversion en fonction du pourcentage
    if (numLevel <= 20) return "very-beginner"; // Connaissance Basique - 20%
    if (numLevel <= 40) return "beginner"; // Novice - 40%
    if (numLevel <= 60) return "medium"; // Intermédiaire - 60%
    if (numLevel <= 80) return "advanced"; // Avancé - 80%
    return "expert"; // Expert - 100%
  }

  function convertLanguageLevel(
    level: string,
  ): "beginner" | "intermediate" | "advanced" | "native" {
    const levelLower = level?.toLowerCase() || "";
    if (levelLower.includes("natif") || levelLower.includes("native"))
      return "native";
    if (
      levelLower.includes("c1") ||
      levelLower.includes("c2") ||
      levelLower.includes("advanced")
    )
      return "advanced";
    if (
      levelLower.includes("b1") ||
      levelLower.includes("b2") ||
      levelLower.includes("inter")
    )
      return "intermediate";
    return "beginner";
  }

  // Définition du contenu du CV qui sera passé au PreviewWrapper
  const cvContent = (
    <DigitalCVPreview isMobile={previewMode === "mobile"} isPreview={true} />
  );

  // Préparer les données pour le bouton PDF en utilisant directement cvData
  const cvDataForPDF = {
    personalInfo: {
      firstName: cvData.firstName || "",
      lastName: cvData.lastName || "",
      position: cvData.position || "",
      email: cvData.email || "",
      phone: cvData.phone || "",
      city: cvData.city || "",
      linkedin: cvData.linkedin || "",
      website: cvData.website || "",
      photoUrl: cvData.photoUrl || "",
    },
    experience: cvData.experience || [],
    education: cvData.education || [],
    skills: cvData.skills || [],
    languages: cvData.languages || [],
    tools: cvData.tools || [],
    certifications: cvData.certifications || [],
    hobbies: cvData.hobbies || [],
    summary: cvData.summary || "",
  };

  // État local pour suivre le dernier état de previewMode/templateId
  const [lastTemplateState, setLastTemplateState] = useState<{
    previewMode: "desktop" | "mobile";
    templateId: string;
  }>({ previewMode, templateId: templateId || "template-classic" });

  // Mettre à jour l'état local lorsque templateId ou previewMode change
  useEffect(() => {
    setLastTemplateState((prevState) => ({
      ...prevState,
      templateId: templateId || "template-classic",
      previewMode,
    }));
  }, [templateId, previewMode]);

  const renderPreview = () => {
    // Ensure templateId is passed correctly from lastTemplateState
    if (!lastTemplateState.templateId) {
      return <div>Erreur: ID de template manquant.</div>; // Or a loading state
    }


    return (
      <PreviewWrapper
        mode={lastTemplateState.previewMode}
        templateId={lastTemplateState.templateId}
        mainColor={mainColor}
        key={`${lastTemplateState.previewMode}-${lastTemplateState.templateId}`}
      >
        {cvContent}
      </PreviewWrapper>
    );
  };

  // Si on est en viewport mobile (sous 800px), utiliser le composant simplifié
  if (isMobileViewport) {
    return (
      <>
        {isPremiumTemplate && !hasSubscription && (
          <Alert
            className="mb-4 border-yellow-200 bg-gradient-to-r from-yellow-50 to-orange-50 
                           [&>svg]:static [&>svg]:inline [&>svg]:mr-2 [&>svg]:translate-y-0 
                           [&>svg~*]:pl-0"
          >
            <Crown className="h-4 w-4 text-yellow-600 inline mr-2" />
            <AlertDescription>
              <span className="text-sm">
                {t('premium.banner.saveEditMessage')}
              </span>
            </AlertDescription>
          </Alert>
        )}
        <MobileSimplifiedPreview
          mainColor={mainColor}
          setMainColor={setMainColor}
          templateId={templateId}
          setTemplateId={setTemplateId}
        >
          {cvContent}
        </MobileSimplifiedPreview>
      </>
    );
  }

  return (
    // Main container for the entire preview section including controls
    <div className="w-full h-full flex flex-col overflow-hidden">
      {/* ================================== */}
      {/*  Barre de Contrôle (Segmented Control, Couleurs, Plein Écran) */}
      {/* ================================== */}
      <div className="p-4 border-b border-gray-200 bg-white shadow-sm flex-shrink-0">
        <div className="flex flex-wrap justify-between gap-4">
          {/* Left side controls - Template drawer (only on smaller screens) */}
          <div className="flex items-center gap-4">
            {/* Template Selector - en mode drawer sur petit écran */}
            <div className="2xl:hidden">
              <TemplateSelector
                selectedTemplate={templateId}
                onTemplateSelect={setTemplateId}
                displayMode="drawer"
              />
            </div>

            {/* Segmented control */}
            <PreviewModeSelector
              previewMode={previewMode}
              setPreviewMode={setPreviewMode}
              variant="compact"
            />
          </div>

          {/* Color Selector et bouton d'agrandissement - aligné à droite */}
          <div className="flex-shrink-0 flex items-center space-x-4 justify-end">
            {/* Sélecteur de couleur */}
            <ColorSelector
              mainColor={mainColor}
              setMainColor={setMainColor}
              variant="compact"
              showLabel={true}
            />

            {/* Bouton d'agrandissement */}
            <button
              className="flex items-center px-3 h-10 text-sm font-medium rounded-md border border-gray-200 bg-white hover:bg-gray-50"
              onClick={() => setIsFullscreen(true)}
              aria-label={t("cvBuilder.previewControls.fullscreen")}
              title={t("cvBuilder.previewControls.fullscreen")}
            >
              <Maximize2 className="w-4 h-4 mr-1" />
              <span className="text-sm font-medium">
                {t("cvBuilder.previewControls.fullscreen")}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Premium Alert for Desktop - avec composant personnalisé */}
      {isPremiumTemplate && !hasSubscription && (
        <div>
          <CustomAlert
            variant="warning"
            className="bg-gradient-to-r from-yellow-50 to-orange-50 border-none rounded-none"
          >
            <Crown className="h-4 w-4 text-yellow-600 flex-shrink-0" />
            <CustomAlertDescription>
              <span className="text-sm">
                {t('premium.banner.saveEditMessage')}
              </span>
            </CustomAlertDescription>
          </CustomAlert>
        </div>
      )}

      {/* ================================== */}
      {/*  Zone de Prévisualisation (Wrapper) - SIMPLIFIÉE */}
      {/* ================================== */}
      <div
        className="flex-1 w-full h-full p-8 flex items-center justify-center relative"
        style={{ overflow: "hidden" }}
      >
        {/* Rendu direct du preview sans div imbriquée supplémentaire */}
        {renderPreview()}
      </div>

      {/* Modal plein écran */}
      <FullscreenPreview
        isOpen={isFullscreen}
        onClose={() => setIsFullscreen(false)}
        previewMode={previewMode}
        setPreviewMode={setPreviewMode}
        mainColor={mainColor}
        setMainColor={setMainColor}
        templateId={lastTemplateState.templateId}
        setTemplateId={setTemplateId}
      >
        {cvContent}
      </FullscreenPreview>

      {/* Validation Modal */}
      <ValidationModal
        isOpen={showValidationModal}
        onClose={() => setShowValidationModal(false)}
        errors={validationErrors}
        onIgnoreAndProceed={handleIgnoreAndProceedToCheckout}
      />
    </div>
  );
};

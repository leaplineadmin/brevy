import { useEffect, useState } from "react";
import { useLocation, useRoute } from "wouter";
import { LoaderCircle } from "lucide-react";
import { getTemplate } from "@/lib/cv-templates";
import { LanguageProvider } from "@/contexts/LanguageContext";
import "@/styles/shared-preview.css";
import { hasActivePremiumAccess } from "@/utils/premium-check";

interface CVData {
  id: string;
  title: string;
  templateId: string;
  mainColor: string;
  data: any;
  language?: string;
  publishedLanguage?: string; // Language of the published CV
  displaySettings?: {
    hidePhoto?: boolean;
    hideCity?: boolean;
    hideSkillLevels?: boolean;
    hideToolLevels?: boolean;
    hideLanguageLevels?: boolean;
    hideLinkedIn?: boolean;
    hideWebsite?: boolean;
  };
  user?: {
    firstName: string;
    lastName: string;
    profileImageUrl?: string;
  };
}

export function SharedCV() {
  const [, setLocation] = useLocation();
  const [match, params] = useRoute('/cv/:subdomain');
  const [cv, setCv] = useState<CVData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSharedCV = async () => {
      const subdomain = params?.subdomain;
      

      
      if (!subdomain) {
        setError("URL non valide pour un CV partagé.");
        setLoading(false);
        return;
      }
        
      try {

        const response = await fetch(`/api/view-cv/${subdomain}`);

        
        if (response.ok) {
          const cvData = await response.json();
          setCv(cvData);
        } else if (response.status === 404) {

          setError("Ce CV n'existe pas ou n'est plus disponible.");
        } else {

          setError("Erreur lors du chargement du CV.");
        }
      } catch (err) {

        setError("Erreur de connexion. Veuillez réessayer.");
      }
      
      setLoading(false);
    };

    fetchSharedCV();
  }, [params?.subdomain]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <LoaderCircle className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Chargement du CV...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md mx-auto p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">CV non trouvé</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => setLocation('/')}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Retour à l'accueil
          </button>
        </div>
      </div>
    );
  }

  if (!cv) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-600">Aucun CV trouvé.</p>
        </div>
      </div>
    );
  }

  // Extraire les bonnes données selon la structure
  let cvDataToUse, displaySettings;
  
  // Parse JSON data if it's a string
  if (typeof cv.data === 'string') {
    try {
      const parsedData = JSON.parse(cv.data);
      cvDataToUse = parsedData.cvData || parsedData;
      displaySettings = parsedData.displaySettings || {};
    } catch (e) {
      console.error('Error parsing CV data:', e);
      cvDataToUse = {};
      displaySettings = {};
    }
  } else {
    cvDataToUse = cv.data?.cvData || cv.data || {};
    displaySettings = cv.data?.displaySettings || cv.displaySettings || {};
  }

  // Obtenir le composant de template réel
  const renderCV = () => {
    const TemplateComponent = getTemplate(cv.templateId);
    
    if (!TemplateComponent) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Template non supporté</h2>
            <p className="text-gray-600">Le template "{cv.templateId}" n'est pas disponible.</p>
          </div>
        </div>
      );
    }
    
    // Ensure personalInfo is properly structured
    if (!cvDataToUse.personalInfo && (cvDataToUse.firstName || cvDataToUse.lastName)) {
      cvDataToUse.personalInfo = {
        firstName: cvDataToUse.firstName,
        lastName: cvDataToUse.lastName,
        email: cvDataToUse.email,
        phone: cvDataToUse.phone,
        phoneCountryCode: cvDataToUse.phoneCountryCode,
        city: cvDataToUse.city,
        country: cvDataToUse.country,
        linkedin: cvDataToUse.linkedin,
        website: cvDataToUse.website,
        position: cvDataToUse.position,
        jobTitle: cvDataToUse.jobTitle || cvDataToUse.position,
        summary: cvDataToUse.summary,
        photoUrl: cvDataToUse.photoUrl || cv.user?.profileImageUrl
      };
    }
    
    // Ensure country and city are properly mapped even if personalInfo exists
    if (cvDataToUse.personalInfo) {
      if (!cvDataToUse.personalInfo.country && cvDataToUse.country) {
        cvDataToUse.personalInfo.country = cvDataToUse.country;
      }
      if (!cvDataToUse.personalInfo.city && cvDataToUse.city) {
        cvDataToUse.personalInfo.city = cvDataToUse.city;
      }
      if (!cvDataToUse.personalInfo.phoneCountryCode && cvDataToUse.phoneCountryCode) {
        cvDataToUse.personalInfo.phoneCountryCode = cvDataToUse.phoneCountryCode;
      }
      if (!cvDataToUse.personalInfo.jobTitle && (cvDataToUse.jobTitle || cvDataToUse.position)) {
        cvDataToUse.personalInfo.jobTitle = cvDataToUse.jobTitle || cvDataToUse.position;
      }
    }
    
    // Fix experience data format if using startYear/endYear instead of from/to
    if (cvDataToUse.experience && Array.isArray(cvDataToUse.experience)) {
      cvDataToUse.experience = cvDataToUse.experience.map((exp: any) => ({
        ...exp,
        from: exp.from || (exp.startMonth && exp.startYear ? `${exp.startMonth}/${exp.startYear}` : exp.startYear),
        to: exp.to || (exp.endMonth && exp.endYear ? `${exp.endMonth}/${exp.endYear}` : exp.endYear),
        summary: exp.summary || exp.description
      }));
    }
    
    // Fix education data format if using startYear/endYear instead of from/to
    if (cvDataToUse.education && Array.isArray(cvDataToUse.education)) {
      cvDataToUse.education = cvDataToUse.education.map((edu: any) => ({
        ...edu,
        from: edu.from || (edu.startMonth && edu.startYear ? `${edu.startMonth}/${edu.startYear}` : edu.startYear),
        to: edu.to || (edu.endMonth && edu.endYear ? `${edu.endMonth}/${edu.endYear}` : edu.endYear),
        diploma: edu.diploma || edu.degree
      }));
    }
    
    // Ensure tools are properly set if missing
    if (!cvDataToUse.tools) {
      cvDataToUse.tools = [];
    }
    


    return (
      <div 
        className="w-full relative template-container" 
        style={{ 
          '--mainColor': cv.mainColor,
          '--dot-bg': `color-mix(in srgb, ${cv.mainColor} 5%, #fff)`,
          '--dot-color': cv.mainColor 
        } as React.CSSProperties}
      >
        <TemplateComponent
          data={cvDataToUse}
          mainColor={cv.mainColor}
          hidePhoto={displaySettings.hidePhoto || false}
          hideCity={displaySettings.hideCity || false}
          hideSkillLevels={displaySettings.hideSkillLevels || false}
          hideToolLevels={displaySettings.hideToolLevels || false}
          hideLanguageLevels={displaySettings.hideLanguageLevels || false}
          hideLinkedIn={displaySettings.hideLinkedIn || false}
          hideWebsite={displaySettings.hideWebsite || false}
          hasSubscription={hasActivePremiumAccess(cv.user)}
          isPublished={true}
        />
        

      </div>
    );
  };

  // Create a wrapper component that sets the language context
  const SharedCVWithLanguage = () => {
    const savedLanguage = cv?.publishedLanguage || cv?.language || 'en';
    
    return (
      <LanguageProvider initialLanguage={savedLanguage as 'en' | 'fr'}>
        <div className="min-h-screen bg-white">
          {/* Rendu direct du template sans wrapper, comme en mode fullscreen */}
          <div className="shared-preview relative">
            {renderCV()}
          </div>
        </div>
      </LanguageProvider>
    );
  };

  return <SharedCVWithLanguage />;
}
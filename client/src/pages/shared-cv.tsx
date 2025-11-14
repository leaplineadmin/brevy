import { useRoute } from "wouter";
import { LoaderCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
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
  const [match, params] = useRoute('/cv/:subdomain');
  const subdomain = params?.subdomain;

  // Utiliser React Query pour optimiser le chargement avec cache
  const { data: cv, isLoading: loading, error: queryError } = useQuery<CVData>({
    queryKey: [`/api/view-cv/${subdomain}`],
    queryFn: async () => {
      if (!subdomain) {
        throw new Error("URL non valide pour un CV partagé.");
      }
      
      // Optimisation : requête avec cache et timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000); // Timeout de 8s
      
      try {
        const response = await fetch(`/api/view-cv/${subdomain}`, {
          signal: controller.signal,
          headers: {
            'Accept': 'application/json',
          },
          cache: 'default', // Utiliser le cache du navigateur
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error("Ce CV n'existe pas ou n'est plus disponible.");
          }
          throw new Error("Erreur lors du chargement du CV.");
        }
        
        return response.json();
      } catch (err: any) {
        clearTimeout(timeoutId);
        if (err.name === 'AbortError') {
          throw new Error("Le chargement a pris trop de temps.");
        }
        throw err;
      }
    },
    enabled: !!subdomain,
    staleTime: 10 * 60 * 1000, // Cache pendant 10 minutes
    gcTime: 30 * 60 * 1000, // Garder en cache 30 minutes
    retry: 1, // Une seule tentative en cas d'erreur
    refetchOnWindowFocus: false, // Ne pas recharger au focus
    refetchOnMount: false, // Ne pas recharger si déjà en cache
  });

  // Afficher un loader minimal et rapide pendant le chargement initial
  if (loading && !cv) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <LoaderCircle className="w-6 h-6 animate-spin text-blue-600" />
      </div>
    );
  }

  if (queryError || !cv) {
    const errorMessage = queryError instanceof Error 
      ? queryError.message 
      : "Ce CV n'existe pas ou n'est plus disponible.";
    
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md mx-auto p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">CV non trouvé</h1>
          <p className="text-gray-600 mb-6">{errorMessage}</p>
          <a
            href="/"
            className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Retour à l'accueil
          </a>
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
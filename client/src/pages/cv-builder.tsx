import React, { useState, useEffect, lazy, Suspense } from "react";
import { useCVData } from "@/hooks/use-cv-data";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { Helmet } from "react-helmet-async";
import Navbar from "@/components/layout/navbar";
import PersonalInfo from "@/components/cv-builder/personal-info";
import Summary from "@/components/cv-builder/summary";
import Experience from "@/components/cv-builder/experience";
import Education from "@/components/cv-builder/education";
import Skills from "@/components/cv-builder/skills";
import Languages from "@/components/cv-builder/languages";
import Tools from "@/components/cv-builder/tools";
import Certifications from "@/components/cv-builder/certifications";
import Hobbies from "@/components/cv-builder/hobbies";


import { Pen, Plus, ChevronDown, ChevronUp, Check, Edit, Eye } from "lucide-react";
import { PreviewArea } from "@/components/cv-builder/preview-area";
import { PreviewProvider } from "@/context/PreviewContext";
import { TemplateSelector } from "@/components/cv-builder/template-selector";
import { CVUploader } from "@/components/CVUploader";

// Import image preloader
import { imagePreloader } from "@/lib/image-preloader";
import { useAuth } from "@/hooks/useAuth";
import { v4 as uuidv4 } from "uuid";

// Fonction pour mapper les données parsées par OpenAI vers le format de l'application
const mapParsedDataToCVData = (parsedData: any) => {
  const mappedData = {
    // Informations personnelles
    firstName: parsedData.personalInfo?.firstName || '',
    lastName: parsedData.personalInfo?.lastName || '',
    position: parsedData.personalInfo?.jobTitle || '',
    email: parsedData.personalInfo?.email || '',
    phone: parsedData.personalInfo?.phone || '',
    city: parsedData.personalInfo?.city || '',
    country: parsedData.personalInfo?.country || '',
    linkedin: parsedData.personalInfo?.linkedin || '',
    website: parsedData.personalInfo?.website || '',
    summary: parsedData.summary || '',
    
    // Expérience professionnelle
    experience: (parsedData.experience || []).map((exp: any) => ({
      id: uuidv4(),
      position: exp.position || '',
      company: exp.company || '',
      location: exp.location || '',
      from: exp.startDate || '',
      to: exp.endDate === 'Present' ? '' : (exp.endDate || ''),
      current: exp.endDate === 'Present',
      isCurrent: exp.endDate === 'Present',
      description: exp.description || '',
    })),
    
    // Formation
    education: (parsedData.education || []).map((edu: any) => ({
      id: uuidv4(),
      degree: edu.degree || '',
      school: edu.school || '',
      location: edu.location || '',
      from: edu.startDate || '',
      to: edu.endDate || '',
      description: edu.description || '',
    })),
    
    // Compétences
    skills: (parsedData.skills || []).map((skill: any) => ({
      id: uuidv4(),
      name: skill.name || '',
      level: mapSkillLevel(skill.level),
      showLevel: true,
    })),
    
    // Langues
    languages: (parsedData.languages || []).map((lang: any) => ({
      id: uuidv4(),
      name: lang.name || '',
      level: lang.proficiency || '',
    })),
  };
  
  return mappedData;
};

// Fonction pour mapper les niveaux de compétences
const mapSkillLevel = (level: number) => {
  if (level <= 1) return 'beginner';
  if (level <= 2) return 'medium';
  if (level <= 4) return 'advanced';
  return 'expert';
};

export default function CVBuilder() {
  const { t } = useLanguage();
  const { user } = useAuth();
  
  // Preload all placeholder images on component mount
  useEffect(() => {
    imagePreloader.preloadAllImages().catch(() => {});
  }, []);

  const { 
    cvData, 
    templateType, 
    setTemplateType, 
    mainColor, 
    templateId, 
    setTemplateId: originalSetTemplateId, 
    title,
    setTitle,
    addExperience,
    addEducation,
    addSkill,
    addLanguage,
    addTool,
    addCertification,
    addHobby,
    setInitialData,
    resetData
  } = useCVData();
  
  // Wrapper autour de setTemplateId pour enregistrer l'appel
  const setTemplateId = (id: string) => {
    // Allow users to try any template - they can preview but not save premium ones
    originalSetTemplateId(id);
  };
  const { toast } = useToast();
  const [showDesktopPreview, setShowDesktopPreview] = useState(true);
  const [mobileActiveTab, setMobileActiveTab] = useState<'form' | 'preview'>('form');
  const [isUpdateMode, setIsUpdateMode] = useState(false);
  const [editingCvId, setEditingCvId] = useState<string | null>(null);
  const [sectionStates, setSectionStates] = useState({
    personal: true,
    summary: true, // Ajout de la section résumé
    experience: true,
    education: true,
    skills: true,
    languages: true,
    categories: true
  });

  const toggleSection = (section: keyof typeof sectionStates) => {
    setSectionStates(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Fonction pour gérer les données parsées du CV
  const handleCVDataParsed = (parsedData: any) => {
    
    // Mapper les données parsées vers le format de l'application
    const mappedData = mapParsedDataToCVData(parsedData);
    
    // Mettre à jour les données du CV
    setInitialData({
      cvData: mappedData,
      templateType: templateType,
      templateId: templateId,
      mainColor: mainColor,
      title: title,
    });
    
    // Afficher un message de succès
    toast({
      title: t('cvBuilder.cvUploader.successMessage'),
      description: t('cvBuilder.cvUploader.description'),
    });
  };

  const handleSaveAndSend = () => {
    // Basic validation
    if (!cvData.firstName || !cvData.lastName) {
      toast({
        title: "Information manquante",
        description: "Veuillez ajouter au moins votre prénom et nom de famille",
        variant: "destructive",
      });
      return;
    }
    
    // Show a notification that this functionality will be implemented later
    toast({
      title: "Fonctionnalité à venir",
      description: "La fonction de sauvegarde sera disponible prochainement!",
    });
  };
  
  // Reset scroll position on mount to prevent inheritance from previous page
  useEffect(() => {
    // Force scroll to top on mount
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, []);

  // Set default template type to digital and default template to "Elegant" (template-1)
  // Cet effet s'exécute uniquement au montage initial du composant
  useEffect(() => {
    
    // Vérifier s'il y a un CV à restaurer depuis l'URL
    const urlParams = new URLSearchParams(window.location.search);
    const cvId = urlParams.get('cv');
    
    if (cvId) {
      // Prevent default initialization if restoring a CV
      
      // Load from API
      loadCVFromAPI(cvId);
      return;
    }
    
    // FIX: Complètement remettre à zéro pour un nouveau CV (évite template premium persistant)
    resetData(); // Reset complet des données vers template-classic
    
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Dépendances vides pour exécuter uniquement au montage

  // Fonction pour restaurer les données CV
  const restoreCVData = (cvToRestore: any) => {
    
    // Marquer en mode édition
    setIsUpdateMode(true);
    setEditingCvId(cvToRestore.id);
    
    // Restaurer immédiatement pour éviter le flash du template par défaut
    setInitialData({
      cvData: cvToRestore.cvData || {},
      templateType: cvToRestore.templateType || 'digital',
      templateId: cvToRestore.templateId || 'template-classic',
      mainColor: cvToRestore.mainColor || '#0076d1',
      title: cvToRestore.title || t("cvBuilder.title.untitled"),
      displaySettings: cvToRestore.displaySettings || {}
    });
    
    // Restaurer les préférences d'affichage après un court délai
    setTimeout(() => {
      if (cvToRestore.displaySettings && (window as any).__restoreDisplaySettings) {
        (window as any).__restoreDisplaySettings(cvToRestore.displaySettings);
      }
    }, 50);
    
  };

  // Fonction pour charger un CV depuis l'API
  const loadCVFromAPI = async (cvId: string) => {
    try {
      const isProd = typeof window !== 'undefined' && window.location.hostname.endsWith('brevy.me');
      const base = isProd ? 'https://cvfolio.onrender.com' : '';
      const response = await fetch(`${base}/api/cvs/${cvId}`, {
        credentials: 'include' // Important pour les cookies de session
      });
      
      if (response.ok) {
        const cv = await response.json();
        
        // Parse JSON data if needed
        let cvData = {};
        let displaySettings = {};
        
        
        if (typeof cv.data === 'string') {
          try {
            const parsedData = JSON.parse(cv.data);
            cvData = parsedData.cvData || parsedData || {};
            displaySettings = parsedData.displaySettings || {};
            
            // Ensure phoneCountryCode is preserved
            if (parsedData.phoneCountryCode && !cvData.phoneCountryCode) {
              cvData.phoneCountryCode = parsedData.phoneCountryCode;
            }
          } catch (e) {
            cvData = {};
          }
        } else if (cv.data && typeof cv.data === 'object') {
          cvData = cv.data.cvData || cv.data || {};
          displaySettings = cv.data.displaySettings || {};
          
          // Ensure phoneCountryCode is preserved
          if (cv.data.phoneCountryCode && !cvData.phoneCountryCode) {
            cvData.phoneCountryCode = cv.data.phoneCountryCode;
          }
        }
        
        
        // Construire l'objet CV à restaurer
        const cvToRestore = {
          id: cv.id,
          title: cv.title || t("cvBuilder.title.untitled"),
          templateType: cv.type || 'digital',
          templateId: cv.templateId || 'template-classic',
          mainColor: cv.mainColor || '#0076d1',
          cvData,
          displaySettings
        };
        
        restoreCVData(cvToRestore);
      } else if (response.status === 401) {
        toast({
          variant: "destructive",
          title: "Session expired",
          description: "Please log in again to access your CVs.",
        });
        // Redirect to login
        window.location.href = "/auth";
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Unable to load the requested CV.",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Connection error while loading CV.",
      });
    }
  };

  return (
    <>
      <Helmet>
        {/* Google tag (gtag.js) */}
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-RZK3DRL6LH"></script>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-RZK3DRL6LH');
            `,
          }}
        />
      </Helmet>
      <div 
        className="flex flex-col h-screen overflow-hidden max-h-screen cv-builder-page" 
        style={{ 
          backgroundColor: 'var(--lightGrey)',
          // Force le conteneur à rester dans le viewport même avec le clavier
        height: '100vh',
        maxHeight: '100vh',
        overflow: 'hidden',
        // Sur mobile, empêcher le scroll du body quand le clavier apparaît
        position: 'relative'
      }}
    >
      {/* Navbar - Fixed at top for mobile keyboard compatibility */}
      <div className="fixed top-0 left-0 right-0 z-50 flex-shrink-0 bg-white">
        <Navbar />
      </div>
      
      {/* Main Content - Grid layout with responsive columns */}
      <PreviewProvider>
        <div className="grid grid-cols-12 flex-1 overflow-hidden max-h-full cv-builder-grid pt-16">
        {/* Colonne 1: CV Form - Responsive selon spécifications */}
        <div className={`
          col-span-12
          tablet:col-span-5
          desktop:col-span-4
          2xl:col-span-3
          form-column
          ${mobileActiveTab === 'form' ? '' : 'hidden'} 
          tablet:block
          overflow-y-auto
          p-8 pb-24 tablet:pb-8
        `} style={{ backgroundColor: "var(--white)", borderRight: "1px solid var(--lightGrey)" }}>
          {/* Global CV title */}
          <div className="mb-8 border-b pb-4" style={{ borderColor: 'var(--lightGrey)' }}>
            <div className="flex items-center gap-2">
              <div className="text-xl font-medium w-full">
                {title || t('cvBuilder.title.untitled')}
              </div>
              <button 
                className="p-1 rounded-sm bg-brand-primaryLight text-brand-primary hover:bg-brand-primaryLightHover"
                onClick={() => {
                  const newTitle = prompt(t('cvBuilder.title.prompt'), title);
                  if (newTitle !== null) {
                    setTitle(newTitle);
                  }
                }}
              >
                <Pen className="h-5 w-5" />
              </button>
            </div>
          </div>
          
          {/* CV Uploader - Upload your existing resume */}
          <CVUploader onDataParsed={handleCVDataParsed} />
          
          {/* Section 1: Personal Info */}
          <div className="cv-section flex flex-col gap-6" style={{ borderRadius: '16px' }}>
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">{t('cvBuilder.sections.contactInfo')}</h3>
              <button 
                className="p-1 rounded-sm bg-brand-primaryLight text-brand-primary hover:bg-brand-primaryLightHover"
                onClick={() => toggleSection('personal')}
              >
                {sectionStates.personal ? (
                  <ChevronUp className="h-5 w-5" />
                ) : (
                  <ChevronDown className="h-5 w-5" />
                )}
              </button>
            </div>
            
            {sectionStates.personal && <PersonalInfo />}
          </div>
          
          {/* Section: Résumé professionnel */}
          <div className="cv-section flex flex-col gap-6" style={{ borderRadius: '16px' }}>
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">{t('cvBuilder.sections.summary')}</h3>
              <button 
                className="p-1 rounded-sm bg-brand-primaryLight text-brand-primary hover:bg-brand-primaryLightHover"
                onClick={() => toggleSection('summary')}
              >
                {sectionStates.summary ? (
                  <ChevronUp className="h-5 w-5" />
                ) : (
                  <ChevronDown className="h-5 w-5" />
                )}
              </button>
            </div>
            
            {sectionStates.summary && <Summary />}
          </div>
          
          {/* Section 2: Experience */}
          <div className="cv-section flex flex-col gap-6" style={{ borderRadius: '16px' }}>
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">{t('cvBuilder.sections.experience')}</h3>
              <button 
                className="p-1 rounded-sm bg-brand-primaryLight text-brand-primary hover:bg-brand-primaryLightHover"
                onClick={() => toggleSection('experience')}
              >
                {sectionStates.experience ? (
                  <ChevronUp className="h-5 w-5" />
                ) : (
                  <ChevronDown className="h-5 w-5" />
                )}
              </button>
            </div>
            {sectionStates.experience && <Experience />}
          </div>
          
          {/* Section 3: Education */}
          <div className="cv-section flex flex-col gap-6" style={{ borderRadius: '16px' }}>
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">{t('cvBuilder.sections.education')}</h3>
              <button 
                className="p-1 rounded-sm bg-brand-primaryLight text-brand-primary hover:bg-brand-primaryLightHover"
                onClick={() => toggleSection('education')}
              >
                {sectionStates.education ? (
                  <ChevronUp className="h-5 w-5" />
                ) : (
                  <ChevronDown className="h-5 w-5" />
                )}
              </button>
            </div>
            {sectionStates.education && <Education />}
          </div>
          
          {/* Section 4: Skills */}
          <div className="cv-section flex flex-col gap-6" style={{ borderRadius: '16px' }}>
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">{t('cvBuilder.sections.skills')}</h3>
              <button 
                className="p-1 rounded-sm bg-brand-primaryLight text-brand-primary hover:bg-brand-primaryLightHover"
                onClick={() => toggleSection('skills')}
              >
                {sectionStates.skills ? (
                  <ChevronUp className="h-5 w-5" />
                ) : (
                  <ChevronDown className="h-5 w-5" />
                )}
              </button>
            </div>
            {sectionStates.skills && <Skills />}
          </div>
          
          {/* Section 5: Languages */}
          <div className="cv-section flex flex-col gap-6" style={{ borderRadius: '16px' }}>
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">{t('cvBuilder.sections.languages')}</h3>
              <button 
                className="p-1 rounded-sm bg-brand-primaryLight text-brand-primary hover:bg-brand-primaryLightHover"
                onClick={() => toggleSection('languages')}
              >
                {sectionStates.languages ? (
                  <ChevronUp className="h-5 w-5" />
                ) : (
                  <ChevronDown className="h-5 w-5" />
                )}
              </button>
            </div>
            {sectionStates.languages && <Languages />}
          </div>

          {/* Section Optionnelle: Outils */}
          {cvData.tools && (
            <div className="cv-section" style={{ borderRadius: '16px' }}>
              <Tools />
            </div>
          )}

          {/* Section Optionnelle: Certifications */}
          {cvData.certifications && (
            <div className="cv-section" style={{ borderRadius: '16px' }}>
              <Certifications />
            </div>
          )}
          
          {/* Section Optionnelle: Centres d'intérêt */}
          {cvData.hobbies && (
            <div className="cv-section" style={{ borderRadius: '16px' }}>
              <Hobbies />
            </div>
          )}
          
          {/* Section 6: Add Categories */}
          <div style={{ borderRadius: '16px' }}>
            <div className="mb-4">
              <h3 className="text-lg font-medium">{t('cvBuilder.sections.addCategory')}</h3>
            </div>
            {sectionStates.categories && (
              <div className="flex flex-wrap gap-2">
                {!cvData.tools && (
                  <Button 
                    variant="primaryLight" 
                    className="text-sm"
                    onClick={() => {
                      addTool();
                    }}
                  >
                    <span className="flex items-center">
                      <Plus className="h-3 w-3 mr-1" />
                      {t('cvBuilder.sections.tools')}
                    </span>
                  </Button>
                )}

                {!cvData.certifications && (
                  <Button 
                    variant="primaryLight" 
                    className="text-sm"
                    onClick={() => {
                      addCertification();
                    }}
                  >
                    <span className="flex items-center">
                      <Plus className="h-3 w-3 mr-1" />
                      {t('cvBuilder.sections.certifications')}
                    </span>
                  </Button>
                )}

                {!cvData.hobbies && (
                  <Button 
                    variant="primaryLight" 
                    className="text-sm"
                    onClick={() => {
                      addHobby();
                    }}
                  >
                    <span className="flex items-center">
                      <Plus className="h-3 w-3 mr-1" />
                      {t('cvBuilder.sections.hobbies')}
                    </span>
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
        
        {/* Colonne 2: Preview and Controls - Responsive selon spécifications */}
        <div className={`
          col-span-12
          tablet:col-span-7  
          desktop:col-span-8
          2xl:col-span-7
          ${mobileActiveTab === 'preview' ? '' : 'hidden'} 
          tablet:block
          overflow-hidden h-full max-h-full cv-builder-preview-column
        `} style={{ backgroundColor: 'var(--light)', borderRight: '1px solid var(--lightGrey)' }}>
          <PreviewArea templateId={templateId} setTemplateId={setTemplateId} />
        </div>
        
        {/* Colonne 3: Template Selector - 2fr, caché sur petits écrans, visible sur 2xl */}
        <div className="hidden 2xl:block 2xl:col-span-2 overflow-y-auto h-full p-6 template-column" style={{ backgroundColor: "var(--white)", borderLeft: "1px solid var(--light-grey)" }}>
          <TemplateSelector
            selectedTemplate={templateId}
            onTemplateSelect={setTemplateId}
            displayMode="sidebar"
          />
        </div>
        </div>

        {/* Segmented Control Mobile - Sticky en bas - visible uniquement sous 800px */}
        <div className="fixed bottom-0 left-0 right-0 z-50 tablet:hidden bg-white border-t border-lightGrey p-4">
          <div className="flex rounded-lg bg-gray-100 p-1 max-w-md mx-auto">
            <button
              onClick={() => setMobileActiveTab('form')}
              className={`
                flex-1 flex items-center justify-center px-4 py-2 rounded-md text-sm font-medium transition-all
                ${mobileActiveTab === 'form' 
                  ? 'bg-white text-brand-primary shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
                }
              `}
            >
              <Edit className="h-4 w-4 mr-2" />
              {t('cvBuilder.mobile.myInfo')}
            </button>
            <button
              onClick={() => setMobileActiveTab('preview')}
              className={`
                flex-1 flex items-center justify-center px-4 py-2 rounded-md text-sm font-medium transition-all
                ${mobileActiveTab === 'preview' 
                  ? 'bg-white text-brand-primary shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
                }
              `}
            >
              <Eye className="h-4 w-4 mr-2" />
              {t('cvBuilder.mobile.preview')}
            </button>
          </div>
        </div>
        
      </PreviewProvider>
    </div>
    </>
  );
}

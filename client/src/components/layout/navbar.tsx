import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useCVData } from "@/hooks/use-cv-data";
import { useAuth } from "@/hooks/useAuth";
import { useState, useRef, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { templates } from "@/components/cv-builder/template-selector";
import { useToast } from "@/hooks/use-toast";
// Utilisation du logo statique
import { ValidationModal } from "@/components/cv-builder/validation-modal";

import { logger } from "@shared/logger";
import { cleanCVData } from "@/lib/default-cv-data";
import { hasActivePremiumAccess } from "@/utils/premium-check";
import logoBrevy from "@/assets/logo-brevy.svg";

export default function Navbar() {
  const [location] = useLocation();
  const isBuilderPage = location === "/cv-builder";
  const { cvData, templateType, templateId, mainColor, title } = useCVData();
  const { user, isAuthenticated, clearAllSessions } = useAuth();
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const languageDropdownRef = useRef<HTMLDivElement>(null);
  const { t, language, setLanguage } = useLanguage();
  const { toast } = useToast();

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowUserDropdown(false);
      }
      if (languageDropdownRef.current && !languageDropdownRef.current.contains(event.target as Node)) {
        setShowLanguageDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLanguageChange = (newLanguage: 'fr' | 'en') => {
    setLanguage(newLanguage);
    setShowLanguageDropdown(false);
  };
  
  // L'utilisateur actuel doit SEULEMENT provenir de useAuth (authentifié) ou du localStorage (mode test)
  const testUser = typeof window !== 'undefined' && localStorage.getItem('test-user') 
    ? JSON.parse(localStorage.getItem('test-user') || '{}') 
    : null;
  const currentUser = user || testUser;

  // Vérifier si on est en mode édition (paramètre cv dans l'URL)
  const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams();
  const isEditMode = urlParams.get('cv') !== null;
  const editingCvId = urlParams.get('cv');

  // Simplified validation with only 4 core requirements
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

    return {
      isValid: errors.length === 0,
      errors
    };
  };

  // Check if current template is premium and user doesn't have subscription
  const selectedTemplate = templates.find(t => t.id === templateId);
  const isPremiumTemplate = selectedTemplate?.isPremium || false;
  const hasSubscription = hasActivePremiumAccess(user);
  // CRITICAL FIX: Never disable Save button - let performSave handle routing
  // This allows all users (auth/non-auth, premium/free) to create drafts and get proper redirects
  const isButtonDisabled = false;

  const handleSaveCV = async () => {
    // CRITICAL FIX: Allow non-authenticated users to proceed with Save & Subscribe
    // Only block authenticated users without subscription from saving premium templates directly
    if (user && isPremiumTemplate && !hasSubscription) {
      // Authenticated user without subscription trying to save premium template
      // Should redirect to checkout instead of blocking
      // Don't block, let performSave handle the redirect to checkout
    }
    
    // Valider le CV avant sauvegarde
    const validation = validateCV();
    
    if (!validation.isValid) {
      setValidationErrors(validation.errors);
      setShowValidationModal(true);
      return;
    }

    // Procéder à la sauvegarde si validation OK
    await performSave();
  };

  const handleIgnoreAndSave = async () => {
    setShowValidationModal(false);
    await performSave();
  };

  // NEW: Draft-based save system (per brief specification)
  const performSave = async () => {
    
    // Récupérer les préférences d'affichage depuis le PreviewContext s'il est disponible
    let displaySettings = {
      hidePhoto: false,
      hideCity: false,
      hideSkillLevels: false,
      hideToolLevels: false,
      hideLanguageLevels: false,
      hideLinkedIn: false,
      hideWebsite: false,
    };

    // Essayer de récupérer les préférences depuis le PreviewContext
    try {
      const previewContext = (window as any).__previewContext;
      if (previewContext) {
        displaySettings = {
          hidePhoto: previewContext.hidePhoto || false,
          hideCity: previewContext.hideCity || false,
          hideSkillLevels: previewContext.hideSkillLevels || false,
          hideToolLevels: previewContext.hideToolLevels || false,
          hideLanguageLevels: previewContext.hideLanguageLevels || false,
          hideLinkedIn: previewContext.hideLinkedIn || false,
          hideWebsite: previewContext.hideWebsite || false,
        };
      }
    } catch (error) {
      logger.debug('PreviewContext non disponible, utilisation des valeurs par défaut', 'component');
    }

    // Clean CV data to remove default/example values before saving
    const cleanedCVData = cleanCVData(cvData);

    // NEW: Create draft payload according to brief specification  
    const draftPayload = {
      title: title || (cleanedCVData.personalInfo?.firstName ? `${cleanedCVData.personalInfo.firstName}'s CV` : 'My CV'),
      templateId: templateId || 'template-classic',
      templateType: templateType || 'digital',
      mainColor: mainColor || '#0076d1',
      cvData: cleanedCVData, // Use cleaned data instead of raw cvData
      displaySettings: displaySettings,
      language: language // Add current language to saved data
    };


    // CRITICAL FIX: Remove test user detection to force normal draft system
    // Clean up any old test user flags that interfere with normal operation
    if (typeof window !== 'undefined' && localStorage.getItem('test-user')) {
      localStorage.removeItem('test-user');
      localStorage.removeItem('test-user-cvs');
    }

    // CRITICAL FIX: In edit mode, update existing CV directly instead of creating draft
    if (isEditMode && editingCvId && user && !localStorage.getItem('test-user')) {
      const cvState = {
        cvData: cleanedCVData,
        templateType,
        templateId,
        mainColor,
        title,
        displaySettings,
        savedAt: new Date().toISOString(),
        isUpdate: true,
        cvId: editingCvId
      };
      
      await handleSaveToDatabase(cvState);
      return;
    }

    try {
      // Step 1: Create draft on server (per brief specification)
      const isProd = typeof window !== 'undefined' && window.location.hostname.endsWith('brevy.me');
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

      // Step 2: Store draftId in localStorage for recovery (per brief)
      localStorage.setItem('pending-cv-id', draftId);
      
      // CRITICAL FIX: Also save CV data to localStorage as backup
      const cvState = {
        cvData: cleanedCVData,
        templateType,
        templateId,
        mainColor,
        title,
        displaySettings,
        draftId: draftId,
        savedAt: new Date().toISOString()
      };
      
      localStorage.setItem('pending-cv-save', JSON.stringify(cvState));
      console.log('✅ [NAVBAR] CV data saved to localStorage as backup');

      // Step 3: Simplified routing - everyone goes to dashboard after auth
      if (typeof window !== 'undefined') {
        if (user && !localStorage.getItem('test-user')) {
          // Authenticated user - always go to dashboard (premium blocking handled there)
          window.location.href = `/dashboard?draftId=${encodeURIComponent(draftId)}`;
        } else {
          // Non-authenticated user - redirect to auth, then dashboard
          window.location.href = `/auth?draftId=${encodeURIComponent(draftId)}`;
        }
      }

    } catch (error) {
      
      // Fallback to legacy system if draft creation fails
      const cvState = {
        cvData,
        templateType,
        templateId,
        mainColor,
        title,
        displaySettings,
        savedAt: new Date().toISOString(),
        isUpdate: isEditMode,
        cvId: editingCvId
      };
      
      if (user && !localStorage.getItem('test-user')) {
        // Use cleaned data in fallback too
        const cleanedCvState = { ...cvState, cvData: cleanedCVData };
        handleSaveToDatabase(cleanedCvState);
      } else {
        // Use cleaned data in localStorage fallback too
        const cleanedCvState = { ...cvState, cvData: cleanedCVData };
        localStorage.setItem('pending-cv-save', JSON.stringify(cleanedCvState));
        window.location.href = '/auth';
      }
    }
  };

  const handleUpdateCV = (cvState: any) => {
    if (typeof window === 'undefined') return;
    
    try {
      const savedCVs = JSON.parse(localStorage.getItem('test-user-cvs') || '[]');
      const cvIndex = savedCVs.findIndex((cv: any) => cv.id === editingCvId);
      
      if (cvIndex !== -1) {
        // Mettre à jour le CV existant
        savedCVs[cvIndex] = {
          ...savedCVs[cvIndex],
          title: cvState.title,
          templateId: cvState.templateId,
          templateType: cvState.templateType,
          mainColor: cvState.mainColor,
          cvData: cvState.cvData,
          displaySettings: cvState.displaySettings,
          updatedAt: new Date().toISOString()
        };
        
        localStorage.setItem('test-user-cvs', JSON.stringify(savedCVs));
        logger.info('CV mis à jour avec succès', 'component');
        
        // Redirection instantanée vers le dashboard
        window.location.href = '/dashboard';
      }
    } catch (error) {
    }
  };

  const handleCreateCV = (cvState: any) => {
    if (typeof window === 'undefined') return;
    
    try {
      const existingCVs = JSON.parse(localStorage.getItem('test-user-cvs') || '[]');
      const newCV = {
        id: `cv-${Date.now()}`,
        userId: 'test-user-id',
        title: cvState.title || 'Mon CV',
        templateId: cvState.templateId,
        templateType: cvState.templateType,
        mainColor: cvState.mainColor,
        cvData: cvState.cvData,
        displaySettings: cvState.displaySettings,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      existingCVs.push(newCV);
      localStorage.setItem('test-user-cvs', JSON.stringify(existingCVs));
      
      // Redirection instantanée vers le dashboard
      window.location.href = '/dashboard';
    } catch (error) {
    }
  };

  const handleLogout = async () => {
    if (typeof window === 'undefined') return;
    
    const isTestUser = localStorage.getItem('test-user');
    
    if (isTestUser) {
      // Déconnexion utilisateur test
      localStorage.removeItem('test-user');
      localStorage.removeItem('test-user-cvs');
    } else {
      // Déconnexion utilisateur réel
      try {
        const isProd = typeof window !== 'undefined' && window.location.hostname.endsWith('brevy.me');
        const base = isProd ? 'https://cvfolio.onrender.com' : '';
        await fetch(`${base}/api/logout`, { 
          method: 'POST',
          credentials: 'include'
        });
        
        // Clear all sessions and local data to prevent mix-up
        await clearAllSessions();
      } catch (error) {
        console.error('❌ [NAVBAR] Logout error:', error);
        // Even if logout fails, clear local data
        await clearAllSessions();
      }
    }
    window.location.href = '/';
  };

  const handleSaveToDatabase = async (cvState: any) => {
    try {
      const isProd = typeof window !== 'undefined' && window.location.hostname.endsWith('brevy.me');
      const base = isProd ? 'https://cvfolio.onrender.com' : '';
      
      
      const endpoint = isEditMode ? `${base}/api/cvs/${editingCvId}` : `${base}/api/cvs`;
      const method = isEditMode ? 'PUT' : 'POST';
      
      
      
      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // CRITICAL FIX: Include authentication cookies
        body: JSON.stringify({
          title: cvState.title || 'Mon CV',
          templateId: cvState.templateId,
          templateType: cvState.templateType,
          mainColor: cvState.mainColor,
          cvData: cvState.cvData,
          displaySettings: cvState.displaySettings,
          language: cvState.language || language,
        }),
      });

      if (response.ok) {
        const savedCV = await response.json();
        if (typeof window !== 'undefined') {
          window.location.href = '/dashboard';
        }
      } else {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
        
        if (response.status === 401) {
          if (typeof window !== 'undefined') {
            window.location.href = '/auth';
          }
        } else if (response.status === 403) {
          // Authorization error - show validation modal with error message
          setValidationErrors([`Access denied: ${errorData.message || 'You are not authorized to update this CV'}`]);
          setShowValidationModal(true);
        } else {
          // Other errors - show validation modal with error message
          setValidationErrors([`Save failed: ${errorData.message || 'Unknown error occurred'}`]);
          setShowValidationModal(true);
        }
      }
    } catch (error) {
      console.error('❌ [NAVBAR] Save error:', error);
      setValidationErrors([`Save failed: ${error instanceof Error ? error.message : 'Network error'}`]);
      setShowValidationModal(true);
    }
  };

  return (
    <header className="bg-white border-b border-gray-200 w-full">
      <div className="w-full py-4" style={{ paddingLeft: '1.5rem', paddingRight: '1.5rem' }}>
        <div className="flex justify-between items-center">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center hover:opacity-80 transition-opacity min-h-[44px] min-w-[44px] justify-center">
              <img src={logoBrevy} alt="Brevy" className="h-8 w-auto" />
            </Link>
          </div>
          
          {/* Navigation Actions */}
          <div className="flex items-center gap-3">
            {/* Language Switch - shown for all users */}
            <div className="relative" ref={languageDropdownRef}>
              <button
                onClick={() => setShowLanguageDropdown(!showLanguageDropdown)}
                className="flex items-center gap-1 px-3 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors text-sm min-h-[44px] min-w-[44px]"
                aria-label="Select language"
              >
                <span className="text-sm font-medium">{language === 'fr' ? 'FR' : 'ENG'}</span>
                {/* Down/Up arrow */}
                <svg 
                  width="12" 
                  height="12" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  xmlns="http://www.w3.org/2000/svg"
                  className={`transition-transform ${showLanguageDropdown ? 'rotate-180' : ''}`}
                >
                  <path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>

              {/* Language Dropdown */}
              {showLanguageDropdown && (
                <div className="absolute right-0 top-full mt-1 w-20 bg-white border border-gray-200 rounded-md shadow-lg z-50">
                  <div className="py-1">
                    <button
                      onClick={() => handleLanguageChange('en')}
                      className={`w-full text-left px-3 py-2 text-xs hover:bg-gray-50 flex items-center justify-between ${
                        language === 'en' ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                      }`}
                    >
                      <span>ENG</span>
                      {language === 'en' && (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                    </button>
                    <button
                      onClick={() => handleLanguageChange('fr')}
                      className={`w-full text-left px-3 py-2 text-xs hover:bg-gray-50 flex items-center justify-between ${
                        language === 'fr' ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                      }`}
                    >
                      <span>FR</span>
                      {language === 'fr' && (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
            {currentUser ? (
              <>
                {/* Action Buttons */}
                {!isBuilderPage ? (
                  <Link href="/cv-builder">
                    <Button size="lg" variant="default">
                      <span className="text-sm">{t('navbar.createCv')}</span>
                    </Button>
                  </Link>
                ) : (
                  <>
                    {/* Authenticated users - Save button with premium template detection */}
                    <Button 
                      onClick={handleSaveCV}
                      size="lg"
                      variant="default"
                      data-navbar-save="true"
                      disabled={isButtonDisabled}
                      className={isButtonDisabled ? 'bg-gray-400 text-gray-300 cursor-not-allowed hover:bg-gray-400' : ''}
                    >
                      <span className="text-sm">{isButtonDisabled ? t('navbar.subscribersOnly') : (isEditMode ? t('navbar.updateCv') : t('navbar.saveCv'))}</span>
                    </Button>
                  </>
                )}

                {/* User Profile Dropdown */}
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setShowUserDropdown(!showUserDropdown)}
                    className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center hover:bg-gray-700 transition-colors"
                  >
                    <span className="text-sm font-medium text-white">
                      {(currentUser?.firstName || 'U').charAt(0)}
                    </span>
                  </button>

                  {/* Dropdown Menu */}
                  {showUserDropdown && (
                    <div className="absolute right-0 top-full mt-2 w-60 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                      <div className="p-4">
                        {/* User Email */}
                        <div className="text-sm text-gray-600 mb-3">
                          {currentUser?.email || 'user@example.com'}
                        </div>
                        
                        {/* Divider */}
                        <div className="border-t border-gray-100 mb-3"></div>
                        
                        {/* Dashboard Link */}
                        <Link href="/dashboard" onClick={() => setShowUserDropdown(false)}>
                          <div className="flex items-center gap-3 py-2 px-2 hover:bg-gray-50 rounded-md cursor-pointer">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M19 10.75H17C14.58 10.75 13.25 9.42 13.25 7V5C13.25 2.58 14.58 1.25 17 1.25H19C21.42 1.25 22.75 2.58 22.75 5V7C22.75 9.42 21.42 10.75 19 10.75ZM17 2.75C15.42 2.75 14.75 3.42 14.75 5V7C14.75 8.58 15.42 9.25 17 9.25H19C20.58 9.25 21.25 8.58 21.25 7V5C21.25 3.42 20.58 2.75 19 2.75H17Z" fill="currentColor"/>
                              <path d="M7 22.75H5C2.58 22.75 1.25 21.42 1.25 19V17C1.25 14.58 2.58 13.25 5 13.25H7C9.42 13.25 10.75 14.58 10.75 17V19C10.75 21.42 9.42 22.75 7 22.75ZM5 14.75C3.42 14.75 2.75 15.42 2.75 17V19C2.75 20.58 3.42 21.25 5 21.25H7C8.58 21.25 9.25 20.58 9.25 19V17C9.25 15.42 8.58 14.75 7 14.75H5Z" fill="currentColor"/>
                              <path d="M6 10.75C3.38 10.75 1.25 8.62 1.25 6C1.25 3.38 3.38 1.25 6 1.25C8.62 1.25 10.75 3.38 10.75 6C10.75 8.62 8.62 10.75 6 10.75ZM6 2.75C4.21 2.75 2.75 4.21 2.75 6C2.75 7.79 4.21 9.25 6 9.25C7.79 9.25 9.25 7.79 9.25 6C9.25 4.21 7.79 2.75 6 2.75Z" fill="currentColor"/>
                              <path d="M18 22.75C15.38 22.75 13.25 20.62 13.25 18C13.25 15.38 15.38 13.25 18 13.25C20.62 13.25 22.75 15.38 22.75 18C22.75 20.62 20.62 22.75 18 22.75ZM18 14.75C16.21 14.75 14.75 16.21 14.75 18C14.75 19.79 16.21 21.25 18 21.25C19.79 21.25 21.25 19.79 21.25 18C21.25 16.21 19.79 14.75 18 14.75Z" fill="currentColor"/>
                            </svg>
                          <span className="text-sm text-gray-700">{t('navbar.dashboard')}</span>
                          </div>
                        </Link>
                        
                        {/* Sign Out Link */}
                        <div 
                          onClick={() => {
                            setShowUserDropdown(false);
                            handleLogout();
                          }}
                          className="flex items-center gap-3 py-2 px-2 hover:bg-gray-50 rounded-md cursor-pointer"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M9 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M16 17L21 12L16 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M21 12H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                          <span className="text-sm text-gray-700">{t('navbar.logout')}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                {/* Non-authenticated User - CHECK PREMIUM TEMPLATE HERE TOO */}
                <Link href="/auth?mode=signin">
                  <Button size="lg" variant="secondary" className="flex items-center gap-2 min-h-[44px]">
                    {/* Icône utilisateur personnalisée */}
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0">
                      <path d="M12 12.75C8.83 12.75 6.25 10.17 6.25 7C6.25 3.83 8.83 1.25 12 1.25C15.17 1.25 17.75 3.83 17.75 7C17.75 10.17 15.17 12.75 12 12.75ZM12 2.75C9.66 2.75 7.75 4.66 7.75 7C7.75 9.34 9.66 11.25 12 11.25C14.34 11.25 16.25 9.34 16.25 7C16.25 4.66 14.34 2.75 12 2.75Z" fill="currentColor"/>
                      <path d="M20.5901 22.75C20.1801 22.75 19.8401 22.41 19.8401 22C19.8401 18.55 16.3202 15.75 12.0002 15.75C7.68015 15.75 4.16016 18.55 4.16016 22C4.16016 22.41 3.82016 22.75 3.41016 22.75C3.00016 22.75 2.66016 22.41 2.66016 22C2.66016 17.73 6.85015 14.25 12.0002 14.25C17.1502 14.25 21.3401 17.73 21.3401 22C21.3401 22.41 21.0001 22.75 20.5901 22.75Z" fill="currentColor"/>
                    </svg>
                    {/* Texte - caché sur mobile (< 768px) */}
                    <span className="text-sm hidden md:inline">{t('navbar.signIn')}</span>
                  </Button>
                </Link>
                {!isBuilderPage ? (
                  <Link href="/cv-builder">
                    <Button size="lg" variant="default">
                      <span className="text-sm">{t('navbar.createCv')}</span>
                    </Button>
                  </Link>
                ) : (
                  <>
                    {/* Non-authenticated users - Save button with premium template detection */}
                    <Button 
                      onClick={handleSaveCV}
                      size="lg"
                      variant="default"
                      data-navbar-save="true"
                      disabled={isButtonDisabled}
                      className={isButtonDisabled ? 'bg-gray-400 text-gray-300 cursor-not-allowed hover:bg-gray-400' : ''}
                    >
                      <span className="text-sm">{isButtonDisabled ? t('navbar.subscribersOnly') : t('navbar.saveCv')}</span>
                    </Button>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Validation Modal */}
      <ValidationModal
        isOpen={showValidationModal}
        onClose={() => setShowValidationModal(false)}
        errors={validationErrors}
        onIgnoreAndProceed={handleIgnoreAndSave}
      />
    </header>
  );
}

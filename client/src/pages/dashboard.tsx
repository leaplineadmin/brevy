import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "wouter";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useLanguage } from "@/contexts/LanguageContext";
import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { useCorrelationId } from "@/hooks/useCorrelationId";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Edit,
  ExternalLink,
  Plus,
  LogOut as LogOutIcon,
  Trash2,
  Crown,
  Sparkles,
  LayoutDashboard,
  Settings as SettingsIcon,
  HelpCircle,
  Mail,
  Languages,
  ChevronDown,
} from "lucide-react";
import { DeleteButton } from "@/components/shared/delete-button";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { hasActivePremiumAccess, getDaysUntilPremiumExpiry, isPremiumExpiringSoon } from "@/utils/premium-check";
import { PublishButton } from "@/components/dashboard/publish-button";
import logoBrevy from "@/assets/logo-brevy.svg";
import { performLogout } from "@/lib/logout";
import { cn } from "@/lib/utils";

// Import thumbnails
import template1Thumb from "@/assets/template1-thumb.png";
import template2Thumb from "@/assets/template2-thumb.png";
import template3Thumb from "@/assets/template3-thumb.png";
import template4Thumb from "@/assets/template4-thumb.png";
import template5Thumb from "@/assets/template5-thumb.png";
import template6Thumb from "@/assets/template6-thumb.png";

// Component to display template thumbnail
const CVTemplateImage = ({ templateId }: { templateId: string }) => {
  const getTemplateImage = (id: string) => {
    switch (id) {
      case 'template-classic':
      case 'template-1': return template1Thumb;
      case 'template-boxes':
      case 'template-2': return template2Thumb;
      case 'template-technical':
      case 'template-3': return template3Thumb;
      case 'template-bento':
      case 'template-4': return template4Thumb;
      case 'template-datalover':
      case 'template-5': return template5Thumb;
      case 'template-landing':
      case 'template-6': return template6Thumb;
      default: return template1Thumb;
    }
  };

  return (
    <img 
      src={getTemplateImage(templateId)} 
      alt={`Template ${templateId}`}
      className="w-full h-full object-cover rounded"
    />
  );
};

interface DashboardCV {
  id: string;
  title: string;
  templateId: string;
  templateType: string;
  mainColor: string;
  createdAt: string;
  updatedAt: string;
  isPublished?: boolean | undefined;
  subdomain?: string | undefined;
  publishedAt?: string | undefined;
  publishedLanguage?: string | undefined;
  isPremiumLocked?: boolean | undefined;
  requiresPremium?: boolean | undefined;
}

export default function Dashboard() {
  const { user, isLoading, refreshUser, clearAllSessions } = useAuth();
  const { toast } = useToast();
  const { t, language, setLanguage } = useLanguage();
  const correlationId = useCorrelationId();
  const queryClient = useQueryClient();
  const [location, setLocation] = useLocation();
  const getSectionFromSearch = () => {
    if (typeof window === 'undefined') return 'resumes';
    const params = new URLSearchParams(window.location.search);
    return params.get('section') === 'settings' ? 'settings' : 'resumes';
  };
  const getSelectedCvIdFromSearch = () => {
    if (typeof window === 'undefined') return null;
    const params = new URLSearchParams(window.location.search);
    return params.get('cv') || null;
  };
  const [activeSection, setActiveSection] = useState<'resumes' | 'settings'>(getSectionFromSearch);
  const [selectedCvId, setSelectedCvId] = useState<string | null>(getSelectedCvIdFromSearch);
  const [expandedResumes] = useState<boolean>(true); // Always expanded, no setter needed
  const [localCvs, setLocalCvs] = useState<DashboardCV[]>([]);
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false);
  const [showUnsubscribeModal, setShowUnsubscribeModal] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [isUnsubscribing, setIsUnsubscribing] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const hasConverted = useRef(false); // Protection anti-double conversion
  const pollingRef = useRef<{ isPolling: boolean; timeoutId?: NodeJS.Timeout }>({ isPolling: false }); // Track polling state

  // Premium status calculations
  const hasPremiumAccess = hasActivePremiumAccess(user);
  const daysUntilExpiry = getDaysUntilPremiumExpiry(user);
  const isExpiringSoon = isPremiumExpiringSoon(user);

  const { data: cvs, isLoading: isCvLoading } = useQuery({
    queryKey: ["/api/cvs"],
    enabled: !!user,
  });

  // Initialize CVs from API
  useEffect(() => {
    if (cvs) {
      setLocalCvs(cvs as DashboardCV[]);
    }
  }, [cvs]);

  useEffect(() => {
    setActiveSection(getSectionFromSearch());
    setSelectedCvId(getSelectedCvIdFromSearch());
  }, [location]);

  // Payment polling logic - runs only once when payment params are detected
  useEffect(() => {
    // Only run if we have payment parameters and user is loaded, and not already polling
    const urlParams = new URLSearchParams(window.location.search);
    const fromPayment = urlParams.get('payment_intent') || urlParams.get('setup_intent');
    
    if (!fromPayment || !user || pollingRef.current.isPolling) {
      return;
    }

    pollingRef.current.isPolling = true;
    
    let pollCount = 0;
    const maxPolls = 10; // Reduced to 30 seconds total (10 polls × 3 seconds)
    let currentTimeoutId: NodeJS.Timeout | undefined;
    
    const cleanupPolling = () => {
      pollingRef.current.isPolling = false;
      if (currentTimeoutId) {
        clearTimeout(currentTimeoutId);
        currentTimeoutId = undefined;
      }
    };

    const pollForPremium = async () => {
      try {
        if (!pollingRef.current.isPolling) {
          return;
        }

        const freshUser = await refreshUser();
        
        
        if (freshUser.data && hasActivePremiumAccess(freshUser.data)) {
          cleanupPolling();
          
          toast({
            title: t('premium.toasts.welcome'),
            description: t('premium.toasts.welcomeDescription'),
          });
          
          // Clean up URL parameters
          const url = new URL(window.location.href);
          url.searchParams.delete('payment_intent');
          url.searchParams.delete('setup_intent');
          window.history.replaceState({}, '', url.toString());
          
          return;
        }
        
        pollCount++;
        if (pollCount < maxPolls && pollingRef.current.isPolling) {
          currentTimeoutId = setTimeout(pollForPremium, 3000);
        } else {
          cleanupPolling();
          
          toast({
            title: "Activation in progress...",
            description: "Your subscription is being activated. Please refresh the page in a few moments.",
            variant: "default",
          });
        }
      } catch (error) {
        pollCount++;
        if (pollCount < maxPolls && pollingRef.current.isPolling) {
          currentTimeoutId = setTimeout(pollForPremium, 3000);
        } else {
          cleanupPolling();
        }
      }
    };
    
    // Start polling after initial delay
    currentTimeoutId = setTimeout(pollForPremium, 1000);
    
    // Cleanup function
    return cleanupPolling;
  }, []); // Empty dependencies - only run once on mount

  // Check if user is not authenticated (but allow a brief grace period after payment)
  useEffect(() => {
    if (!user && !isLoading) {
      const urlParams = new URLSearchParams(window.location.search);
      const fromPaymentParams = urlParams.get('payment_intent') || urlParams.get('setup_intent') || urlParams.get('from') === 'paid';
      const onPaymentSuccessPage = window.location.pathname === '/payment-success';
      let skipAuthRedirect = false;
      try {
        const ts = sessionStorage.getItem('post-payment-skip-auth-redirect');
        // Skip redirect for 20 seconds after payment success sets the flag
        if (ts && Date.now() - Number(ts) < 20000) skipAuthRedirect = true;
      } catch {}

      if (fromPaymentParams || onPaymentSuccessPage || skipAuthRedirect) {
        // Try one quick refresh before deciding to redirect
        (async () => {
          try {
            const refreshResult = await refreshUser();
            // If user is now authenticated after refresh, don't redirect
            if (refreshResult.data) {
              return;
            }
          } catch {}
          // After a longer delay to allow payment processing, check again
          setTimeout(async () => {
            try {
              const ts2 = sessionStorage.getItem('post-payment-skip-auth-redirect');
              // If flag is still valid, try refreshing one more time
              if (ts2 && Date.now() - Number(ts2) < 20000) {
                const retryResult = await refreshUser();
                // If user is now authenticated, don't redirect
                if (retryResult.data) {
                  return;
                }
              }
              // Only redirect if flag expired or user still not authenticated
              if (!ts2 || Date.now() - Number(ts2) >= 20000) {
                // Check user one more time before redirecting
                const finalCheck = await refreshUser();
                if (!finalCheck.data) {
                  // Clean URL param if present
                  const url = new URL(window.location.href);
                  url.searchParams.delete('from');
                  window.history.replaceState({}, '', url.toString());
                  window.location.href = '/auth';
                }
              }
            } catch {
              // Only redirect if we can't check user status
              const finalCheck = await refreshUser();
              if (!finalCheck.data) {
                window.location.href = '/auth';
              }
            }
          }, 2000);
        })();
        return;
      }

      window.location.href = '/auth';
    }
  }, [user, isLoading, refreshUser]);

  useEffect(() => {
    if (user && !isCvLoading && !hasConverted.current) {
      const handleDraftConversion = async () => {
        // Étape 1: Extraire draftId (priorité : URL → localStorage pending-cv-id)
        const urlParams = new URLSearchParams(window.location.search);
        let draftId = urlParams.get('draftId');
        
        if (!draftId) {
          // Fallback to localStorage for backward compatibility
          draftId = localStorage.getItem('pending-cv-id');
        }
        
        // CRITICAL FIX: Check for pending CV data in localStorage as backup
        const pendingCVData = localStorage.getItem('pending-cv-save');
        if (!draftId && pendingCVData) {
          try {
            const cvState = JSON.parse(pendingCVData);
            if (cvState.draftId) {
              draftId = cvState.draftId;
            }
          } catch (error) {
          }
        }
        
        if (!draftId) {
          return; // No draft to convert
        }

        setIsConverting(true);
        hasConverted.current = true; // Protection anti-double
        
        // Show neutral message during conversion
        toast({
          title: "Finishing setup…",
          description: "Please wait while we set up your resume.",
        });

        try {
          // CRITICAL FIX: Add error handling and retry logic for cross-platform compatibility
          
          // Étape 2: Appeler POST /api/cv-drafts/:id/convert (avec correlation ID)
          const isProd = typeof window !== 'undefined' && window.location.hostname.endsWith('brevy.me');
          const base = isProd ? 'https://cvfolio.onrender.com' : '';
          const response = await fetch(`${base}/api/cv-drafts/${draftId}/convert`, {
            method: 'POST',
            credentials: 'include',
            headers: {
              'X-CID': correlationId
            }
          });


          if (response.ok) {
            const result = await response.json();
            
            // Étape 3: Invalider cache CVs et attendre refetch
            await queryClient.invalidateQueries({ queryKey: ["/api/cvs"] });
            
            // Étape 4: Attendre que la liste soit mise à jour et contienne le nouveau CV
            const maxAttempts = 10;
            let attempts = 0;
            let newCvFound = false;
            
            while (attempts < maxAttempts && !newCvFound) {
              await new Promise(resolve => setTimeout(resolve, 200)); // 200ms entre chaque tentative
              const currentCvs = queryClient.getQueryData(["/api/cvs"]) as DashboardCV[] || [];
              newCvFound = currentCvs.some(cv => cv.id === result.cvId);
              attempts++;
            }
            
            // Étape 5: Clean up SEULEMENT après succès confirmé
            localStorage.removeItem('pending-cv-id');
            
            // Étape 6: Redirect to CV detail page if conversion successful
            if (newCvFound && result.cvId) {
              // Redirect to the CV detail page
              const newUrl = `/dashboard?cv=${encodeURIComponent(result.cvId)}`;
              window.history.replaceState({}, '', newUrl);
              setSelectedCvId(result.cvId);
              setActiveSection('resumes');
              
              toast({
                title: "Resume saved!",
                description: "Your resume has been saved to your dashboard.",
              });
            } else {
              // Clean up URL params if CV not found
              if (urlParams.has('draftId')) {
                urlParams.delete('draftId');
                const newUrl = window.location.pathname + (urlParams.toString() ? '?' + urlParams.toString() : '');
                window.history.replaceState({}, '', newUrl);
              }
              
              toast({
                title: "Setup complete",
                description: "Your resume should appear shortly. Please refresh if needed.",
              });
            }
            
          } else if (response.status === 404) {
            // Clean up stale references
            localStorage.removeItem('pending-cv-id');
            if (urlParams.has('draftId')) {
              urlParams.delete('draftId');
              const newUrl = window.location.pathname + (urlParams.toString() ? '?' + urlParams.toString() : '');
              window.history.replaceState({}, '', newUrl);
            }
          } else if (response.status === 403) {
            const errorData = await response.json();
            // Clean up and continue - no checkout redirect per simplified workflow
            localStorage.removeItem('pending-cv-id');
            if (urlParams.has('draftId')) {
              urlParams.delete('draftId');
              const newUrl = window.location.pathname + (urlParams.toString() ? '?' + urlParams.toString() : '');
              window.history.replaceState({}, '', newUrl);
            }
          } else if (response.status === 422) {
            const errorData = await response.json();
            toast({
              title: "Save failed",
              description: "There was an issue saving your resume. Please try again.",
              variant: "destructive"
            });
            // Keep draftId for retry, don't clean up
          } else {
            // Keep draftId for retry, don't clean up
          }
          
        } catch (error) {
          // Keep draftId for retry, don't clean up
        }
      };

      handleDraftConversion();
    }
  }, [user, isCvLoading, toast]); // Depend on user auth and CV loading state

  // Handle OAuth CV data recovery, premium intent check, and cleanup
  useEffect(() => {
    if (user) {
      const handleOAuthCVRecovery = async () => {
        
        // Check for premium intent first (highest priority)
        const shouldCheckPremiumIntent = document.cookie.includes('checkPremiumIntent=true');
        
        if (shouldCheckPremiumIntent) {
          // Get OAuth token to check for stored premium context
          const cookies = document.cookie.split('; ');
          const oauthTokenCookie = cookies.find(row => row.startsWith('oauthToken='));
          const oauthTokenPart = oauthTokenCookie?.split('=')[1];
          const oauthToken = oauthTokenPart ? decodeURIComponent(oauthTokenPart) : '';
          
          if (oauthToken) {
            const pendingDataRaw = localStorage.getItem(`cv_pending_${oauthToken}`);
            
            if (pendingDataRaw) {
              try {
                const pendingData = JSON.parse(pendingDataRaw);
                
                // CRITICAL FIX: Check for new premium flow with redirect=premium and draftId
                if (pendingData.redirect === 'premium' || pendingData.premiumContext) {
                  // Clear the premium intent cookie
                  document.cookie = 'checkPremiumIntent=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; sameSite=lax';
                  
                  // Restore premium context to localStorage for checkout page (legacy support)
                  if (pendingData.premiumContext) {
                    localStorage.setItem('premium-subscription-context', pendingData.premiumContext);
                  }
                  
                  // Restore draftId to localStorage for checkout
                  if (pendingData.draftId) {
                    localStorage.setItem('pending-cv-id', pendingData.draftId);
                  }
                  
                  // Also restore CV data if exists
                  if (pendingData.cvData) {
                    localStorage.setItem('pending-cv-save', pendingData.cvData);
                  }
                  
                  // Clean up OAuth data
                  localStorage.removeItem(`cv_pending_${oauthToken}`);
                  document.cookie = 'oauthToken=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; sameSite=lax';
                  document.cookie = 'recoverCVData=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; sameSite=lax';
                  
                  // Redirect to Stripe payment link
                  const { getPaymentLinkUrl } = await import('../lib/stripe');
                  window.location.href = getPaymentLinkUrl({ draftId: pendingData.draftId || null, returnTo: 'dashboard' });
                  return;
                }
              } catch (error) {
              }
            }
          }
          
          // Clear premium intent flag if no premium context found
          document.cookie = 'checkPremiumIntent=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; sameSite=lax';
        }
        
        // Continue with regular CV recovery if no premium intent
        const cookies = document.cookie.split('; ');
        
        const oauthTokenCookie = cookies.find(row => row.startsWith('oauthToken='));
        const oauthTokenPart = oauthTokenCookie?.split('=')[1];
        const oauthToken = oauthTokenPart ? decodeURIComponent(oauthTokenPart) : '';
          
        const shouldRecover = document.cookie.includes('recoverCVData=true');
        
        if (oauthToken && shouldRecover) {
          
          // Get CV data using the OAuth token
          const pendingDataRaw = localStorage.getItem(`cv_pending_${oauthToken}`);
          
          if (pendingDataRaw) {
            
            try {
              const pendingData = JSON.parse(pendingDataRaw);
              
              // Handle both old format (direct CV data) and new format (with cvData property)
              let cvState;
              if (pendingData.cvData) {
                // New format: { cvData: "...", premiumContext: "..." }
                cvState = JSON.parse(pendingData.cvData);
              } else {
                // Old format: direct CV data
                cvState = pendingData;
              }
              
              
              const cvPayload = {
                title: cvState.title || 'My Resume',
                templateId: cvState.templateId || 'template-classic',
                templateType: cvState.templateType || 'digital',
                mainColor: cvState.mainColor || '#0076d1',
                cvData: cvState.cvData || {},
                displaySettings: cvState.displaySettings || {},
              };
              
              
              // Try to save CV with retry logic for 401 errors
              let retryCount = 0;
              const maxRetries = 3;
              let success = false;
              
              while (retryCount < maxRetries && !success) {
                try {
                  const isProd = typeof window !== 'undefined' && window.location.hostname.endsWith('brevy.me');
                  const base = isProd ? 'https://cvfolio.onrender.com' : '';
                  const response = await fetch(`${base}/api/cvs`, {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    credentials: 'include',
                    body: JSON.stringify(cvPayload),
                  });

                  if (response.ok) {
                    const savedCV = await response.json();
                    toast({
                      title: "CV saved!",
                      description: "Your CV has been automatically saved to your dashboard.",
                    });
                    success = true;
                    
                    // Redirect to CV detail page
                    if (savedCV?.id) {
                      window.location.href = `/dashboard?cv=${encodeURIComponent(savedCV.id)}`;
                    } else {
                      window.location.reload();
                    }
                  } else if (response.status === 403) {
                    // Handle premium template restriction
                    const errorData = await response.json();
                    
                    if (errorData.message?.includes('Pro subscription') || errorData.message?.includes('Premium subscription')) {
                      // Try to save with a free template instead
                      const freeTemplate = 'template-classic';
                      const fallbackPayload = {
                        ...cvPayload,
                        templateId: freeTemplate,
                        title: `${cvPayload.title} (Free Template)`
                      };
                      
                      
                      const isProd = typeof window !== 'undefined' && window.location.hostname.endsWith('brevy.me');
                      const base = isProd ? 'https://cvfolio.onrender.com' : '';
                      const fallbackResponse = await fetch(`${base}/api/cvs`, {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(fallbackPayload),
                      });
                      
                      if (fallbackResponse.ok) {
                        const savedCV = await fallbackResponse.json();
                        toast({
                          title: "CV saved with free template!",
                          description: "Your CV was saved using the Classic template. Upgrade to Pro to access all templates.",
                        });
                        success = true;
                        // Redirect to CV detail page
                        if (savedCV?.id) {
                          window.location.href = `/dashboard?cv=${encodeURIComponent(savedCV.id)}`;
                        } else {
                          window.location.reload();
                        }
                      } else {
                        break;
                      }
                    } else {
                      break;
                    }
                  } else if (response.status === 401 && retryCount < maxRetries - 1) {
                    retryCount++;
                    await new Promise(resolve => setTimeout(resolve, retryCount * 1000));
                    continue;
                  } else {
                    break;
                  }
                } catch (fetchError) {
                  retryCount++;
                  if (retryCount < maxRetries) {
                    await new Promise(resolve => setTimeout(resolve, retryCount * 1000));
                  }
                }
              }
              
              if (!success) {
                toast({
                  title: "CV save failed",
                  description: "Unable to save your CV automatically. Please create a new CV from the dashboard.",
                  variant: "destructive",
                });
              }
            } catch (error) {
              toast({
                title: "CV save failed",
                description: "Unable to save your CV automatically. Please try creating it manually.",
                variant: "destructive",
              });
            }
          } else {
          }
        }
        
        // After attempting recovery, check for post-checkout CV recovery FIRST
        const cvProcessedByCheckout = await handlePostCheckoutCVRecovery();
        
        // Then clean up all pending data
        
        // Clean up regular pending data (only if not processed by post-checkout recovery)
        if (!cvProcessedByCheckout) {
          const pendingCVData = localStorage.getItem('pending-cv-save');
          if (pendingCVData) {
            localStorage.removeItem('pending-cv-save');
          }
        }
        
        // Clean up OAuth-related data
        if (oauthToken) {
          localStorage.removeItem(`cv_pending_${oauthToken}`);
        }
        
        // Clear OAuth cookies with proper settings
        document.cookie = 'oauthToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        document.cookie = 'recoverCVData=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      };
      
      // Handle CV recovery after successful premium checkout
      const handlePostCheckoutCVRecovery = async (): Promise<boolean> => {
        
        // Only proceed if user has premium subscription (indicating successful checkout)
        // AND there's pending CV data but NO premium context (indicating checkout completed)
        const pendingCVData = localStorage.getItem('pending-cv-save');
        const premiumContext = localStorage.getItem('premium-subscription-context');
        const hasSubscription = hasActivePremiumAccess(user);
        
        // This indicates user just completed premium checkout: 
        // - Has pending CV data
        // - No premium context (was cleared by checkout)
        // - Now has active subscription
        if (pendingCVData && !premiumContext && hasSubscription && user) {
          try {
            const cvState = JSON.parse(pendingCVData);
            
            const cvPayload = {
              title: cvState.title || 'My Premium Resume',
              templateId: cvState.templateId || 'template-classic',
              templateType: cvState.templateType || 'digital',
              mainColor: cvState.mainColor || '#0076d1',
              cvData: cvState.cvData || {},
              displaySettings: cvState.displaySettings || {},
            };
            
            
            const isProd = typeof window !== 'undefined' && window.location.hostname.endsWith('brevy.me');
            const base = isProd ? 'https://cvfolio.onrender.com' : '';
            const response = await fetch(`${base}/api/cvs`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(cvPayload),
            });

            if (response.ok) {
              const savedCV = await response.json();
              localStorage.removeItem('pending-cv-save');
              
              toast({
                title: t('premium.toasts.welcomeCvSaved'),
                description: t('premium.toasts.welcomeCvSavedDescription'),
              });
              
              // Redirect to CV detail page
              if (savedCV?.id) {
                setTimeout(() => {
                  window.location.href = `/dashboard?cv=${encodeURIComponent(savedCV.id)}`;
                }, 1000);
              } else {
                setTimeout(() => {
                  window.location.reload();
                }, 1000);
              }
              
              return true; // Indicate CV data was processed
            } else {
              const errorData = await response.json();
              return false;
            }
          } catch (error) {
            return false;
          }
        } else {
          return false;
        }
      };
      
      handleOAuthCVRecovery();
    }
  }, [user, toast]);

  // Sort CVs by creation date descending (most recent first)
  const displayCvs: DashboardCV[] = localCvs.sort((a, b) => {
    const dateA = new Date(a.updatedAt || a.createdAt);
    const dateB = new Date(b.updatedAt || b.createdAt);
    return dateB.getTime() - dateA.getTime();
  });

  // Function to handle publication changes
  const handlePublishChange = (cvId: string, published: boolean, subdomain?: string, language?: string) => {
    setLocalCvs(prevCvs => 
      prevCvs.map(cv => 
        cv.id === cvId 
          ? { 
              ...cv, 
              isPublished: published, 
              subdomain: published ? subdomain : undefined,
              publishedLanguage: language || cv.publishedLanguage,
              publishedAt: published ? new Date().toISOString() : undefined
            }
          : cv
      )
    );
  };

  // Function to unsubscribe from premium
  const handleUnsubscribe = async () => {
    setIsUnsubscribing(true);

    try {
      const isProd = typeof window !== 'undefined' && window.location.hostname.endsWith('brevy.me');
      const base = isProd ? 'https://cvfolio.onrender.com' : '';
      const response = await fetch(`${base}/api/unsubscribe`, {
        method: 'POST',
        credentials: 'include',
      });

      const data = await response.json();

      if (response.ok) {
        // Close modal first
        setShowUnsubscribeModal(false);
        toast({
          title: t('premium.toasts.subscriptionScheduled'),
          description: t('premium.toasts.subscriptionScheduledDescription'),
        });
        // Refresh user data to reflect changes
        await refreshUser();
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: data.error || "Failed to unsubscribe",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Connection error while unsubscribing",
      });
    } finally {
      setIsUnsubscribing(false);
    }
  };

  // Function to check payment status and activate Premium if needed
  const [isCheckingPremium, setIsCheckingPremium] = useState(false);

  const handleFallbackPremiumActivation = async () => {
    if (isCheckingPremium) {
      return;
    }

    try {
      setIsCheckingPremium(true);
      const isProd = typeof window !== 'undefined' && window.location.hostname.endsWith('brevy.me');
      const base = isProd ? 'https://cvfolio.onrender.com' : '';
      
      const response = await fetch(`${base}/api/fallback-premium-activation`, {
        method: 'POST',
        credentials: 'include',
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast({
          title: t('premium.toasts.premiumActivated'),
          description: t('premium.toasts.premiumActivatedDescription'),
        });
        
        // Force a complete refresh of user data
        await refreshUser();
        
        // Force a page reload to ensure all UI updates (badge, banner, links)
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        toast({
          title: t('premium.toasts.noActiveSubscription'),
          description: data.message || t('premium.toasts.noActiveSubscriptionDescription'),
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to check payment status. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCheckingPremium(false);
    }
  };

  // Function to delete user account
  const handleDeleteAccount = async () => {
    setIsDeletingAccount(true);

    // Show immediate feedback toast
    toast({
      title: "Account deletion in progress",
      description: "Your account is being deleted. This may take a few seconds. You will receive a confirmation email shortly.",
    });

    try {
      const isProd = typeof window !== 'undefined' && window.location.hostname.endsWith('brevy.me');
      const base = isProd ? 'https://cvfolio.onrender.com' : '';
      const url = `${base}/api/account`;

      const response = await fetch(url, {
        method: 'DELETE',
        credentials: 'include',
      });

      const data = await response.json();

      if (response.ok) {
        // Show success toast before redirect
        toast({
          title: "Account deleted successfully",
          description: "Your account has been permanently deleted. You will be redirected to the homepage.",
        });
        
        // Small delay to show the success toast before redirect
        setTimeout(() => {
          window.location.href = '/';
        }, 1500);
      } else {
        toast({
          title: "Error deleting account",
          description: data.message || "An error occurred while deleting your account. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Connection error",
        description: "Unable to delete account due to connection issues. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDeletingAccount(false);
    }
  };

  // Function to delete a CV with smooth animation
  const handleDeleteCV = async (cvId: string) => {
    try {
      const isProd = typeof window !== 'undefined' && window.location.hostname.endsWith('brevy.me');
      const base = isProd ? 'https://cvfolio.onrender.com' : '';
      const response = await fetch(`${base}/api/cvs/${cvId}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      
      if (response.ok) {

        // Update local state immediately
        setLocalCvs(prev => prev.filter(cv => cv.id !== cvId));
        toast({
          title: "CV deleted",
          description: "The CV has been deleted successfully.",
        });
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Unable to delete the CV.",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Connection error while deleting.",
      });
    }
  };

  // Function to format display date
  const formatDisplayDate = (createdAt: string, updatedAt: string) => {
    const created = new Date(createdAt);
    const updated = new Date(updatedAt);
    
    // If modification date is different from creation, show "Modified on"
    if (updated.getTime() !== created.getTime()) {
      return `${t('dashboard.modifiedOn')}: ${updated.toLocaleDateString('en-US')} at ${updated.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
    } else {
      return `${t('dashboard.createdOn')}: ${created.toLocaleDateString('en-US')} at ${created.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
    }
  };

  const handleSectionChange = (section: 'resumes' | 'settings') => {
    setActiveSection(section);
    setSelectedCvId(null);
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (section === 'settings') {
        params.set('section', 'settings');
        params.delete('cv');
      } else {
        params.delete('section');
        params.delete('cv');
      }
      const newSearch = params.toString();
      const newPath = `${window.location.pathname}${newSearch ? `?${newSearch}` : ''}`;
      setLocation(newPath, { replace: true });
    }
  };

  const handleCvClick = (cvId: string) => {
    setSelectedCvId(cvId);
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      params.set('cv', cvId);
      params.delete('section');
      const newSearch = params.toString();
      const newPath = `${window.location.pathname}?${newSearch}`;
      setLocation(newPath, { replace: true });
    }
  };

  const handleUpgradeClick = async () => {
    try {
      const { getPaymentLinkUrl } = await import('../lib/stripe');
      window.location.href = getPaymentLinkUrl({ returnTo: 'dashboard' });
    } catch (error) {
      toast({
        title: "Error",
        description: "Unable to open checkout. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleLogout = async () => {
    await performLogout(clearAllSessions);
  };

  const sidebarItems = [
    { id: 'resumes' as const, label: t('dashboard.sidebar.myResumes'), icon: LayoutDashboard },
    { id: 'settings' as const, label: t('dashboard.sidebar.settings'), icon: SettingsIcon },
  ];

  const userDisplayName = user
    ? [user.firstName, user.lastName].filter(Boolean).join(' ').trim() || user.email || 'User'
    : 'User';

  const userInitials = user
    ? `${(user.firstName || user.email || 'U')[0] || 'U'}${user.lastName?.[0] || ''}`
    : 'U';

  const isFreeUserWithCv = !hasPremiumAccess && localCvs.length > 0;
  const canCreateNewCv = !isFreeUserWithCv;
  const isSettingsView = activeSection === 'settings';

  const renderProUpsellCard = () => {
    if (hasPremiumAccess) {
      return null;
    }
    return (
      <div className="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 p-4 text-left">
        <p className="text-sm font-semibold text-amber-900">{t('dashboard.sidebar.proTitle')}</p>
        <p className="mt-1 text-sm text-amber-800">{t('dashboard.sidebar.proDescription')}</p>
        <Button
          onClick={handleUpgradeClick}
          className="mt-4 w-full bg-[#8b4a25] hover:bg-[#6f3719]"
        >
          <Sparkles className="h-4 w-4" />
          {t('dashboard.sidebar.proButton')}
        </Button>
      </div>
    );
  };

  const renderHelpCard = () => (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 text-left">
      <div className="flex items-start gap-3">
        <div className="rounded-full bg-blue-50 p-2 text-blue-600">
          <HelpCircle className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-900">{t('dashboard.sidebar.helpTitle')}</p>
          <p className="text-sm text-gray-500">{t('dashboard.sidebar.helpDescription')}</p>
          <a
            href="mailto:contact@brevy.me"
            className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:underline"
          >
            <Mail className="h-4 w-4" />
            {t('dashboard.sidebar.helpCta')}
          </a>
        </div>
      </div>
    </div>
  );

  const renderLogoutButton = () => (
    <button
      onClick={handleLogout}
      className="flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
    >
      <LogOutIcon className="h-4 w-4" />
      {t('dashboard.sidebar.logout')}
    </button>
  );

  // Check authentication - redirect if not logged in
  const isAuthenticated = !!user;

  // Access protection: redirect to auth if not logged in
  if (!isLoading && !isAuthenticated) {
    window.location.href = '/auth';
    return null;
  }

  // Show loader during auth verification
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Verifying...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>
          {selectedCvId
            ? `${displayCvs.find(cv => cv.id === selectedCvId)?.title || t("cvBuilder.title.untitled")} | Brevy`
            : 'Dashboard | Brevy'}
        </title>
        <meta name="robots" content="noindex, nofollow" />
        <link rel="canonical" href="https://brevy.me/dashboard" />
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
      <div className="h-screen bg-gray-50 flex flex-col overflow-hidden">
        <div className="flex flex-1 overflow-hidden">
          <aside className="hidden w-64 flex-col border-r border-gray-200 bg-white md:flex fixed left-0 top-0 bottom-0 overflow-y-auto">
            <div className="px-6 pt-6">
              <Link href="/" className="inline-flex items-center gap-2">
                <img src={logoBrevy} alt="Brevy" className="h-8 w-auto" />
              </Link>
            </div>
            <nav className="mt-8 flex-1 space-y-2 px-4 overflow-y-auto">
              {sidebarItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeSection === item.id;
                const isResumes = item.id === 'resumes';
                const showResumes = isResumes && expandedResumes;
                
                return (
                  <div key={item.id} className="space-y-1">
                    <button
                      onClick={() => {
                        if (isResumes) {
                          // Always navigate to main resumes page when clicking "My Resumes"
                          setSelectedCvId(null);
                          handleSectionChange('resumes');
                        } else {
                          handleSectionChange(item.id);
                        }
                      }}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition",
                        isActive ? "bg-blue-50 text-blue-600" : "text-gray-600 hover:bg-gray-50"
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      {item.label}
                    </button>
                    {isResumes && showResumes && (
                      <div className="ml-4 space-y-1">
                        {displayCvs.map((cv) => (
                          <button
                            key={cv.id}
                            onClick={() => handleCvClick(cv.id)}
                            className={cn(
                              "flex w-full items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium transition",
                              selectedCvId === cv.id
                                ? "bg-blue-100 text-blue-700"
                                : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"
                            )}
                          >
                            <div className="w-8 h-8 flex-shrink-0">
                              <CVTemplateImage templateId={cv.templateId} />
                            </div>
                            <span className="truncate">{cv.title || t("cvBuilder.title.untitled")}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </nav>
            <div className="space-y-4 px-4 py-6">
              {renderProUpsellCard()}
              {renderHelpCard()}
              {renderLogoutButton()}
            </div>
          </aside>

          <div className="flex flex-1 flex-col ml-0 md:ml-64 overflow-hidden">
            <header className="sticky top-0 z-10 flex items-center justify-end border-b border-gray-200 bg-white px-4 py-4 sm:px-8">
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-900">{userDisplayName}</p>
                  {hasPremiumAccess && (
                    <Badge className="mt-1 inline-flex items-center gap-1 border-0 bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                      <Crown className="h-3 w-3" />
                      {t('premium.dashboard.premiumBadge')}
                    </Badge>
                  )}
                </div>
                <Avatar className="h-10 w-10">
                  <AvatarImage src={user?.profileImageUrl || ''} alt={userDisplayName} />
                  <AvatarFallback>{userInitials.toUpperCase()}</AvatarFallback>
                </Avatar>
              </div>
            </header>

            <div className="border-b border-gray-200 bg-white px-4 py-3 md:hidden">
              <div className="flex flex-wrap gap-2">
                {sidebarItems.map((item) => {
                  const isActive = activeSection === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleSectionChange(item.id)}
                      className={cn(
                        "flex-1 rounded-full px-3 py-2 text-sm font-medium",
                        isActive ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600"
                      )}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-4 border-b border-gray-200 bg-gray-50 px-4 py-4 md:hidden">
              {renderProUpsellCard()}
              {renderHelpCard()}
              {renderLogoutButton()}
            </div>

            <div className="flex-1 overflow-y-auto min-h-0">
              <main className="px-4 py-8 sm:px-8">
              {isSettingsView ? (
                <div className="space-y-8">
                  <div className="space-y-2">
                    <h1 className="text-3xl font-bold text-gray-900">{t('dashboard.settings.title')}</h1>
                    <p className="text-gray-500">{t('dashboard.settings.subtitle')}</p>
                  </div>

                  <Card>
                    <CardHeader>
                      <CardTitle>{t('dashboard.settings.subscription.title')}</CardTitle>
                      <CardDescription>{t('dashboard.settings.subscription.description')}</CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                      <div className="space-y-2">
                        <p className="text-lg font-semibold text-gray-900">
                          {hasPremiumAccess
                            ? t('dashboard.settings.subscription.proPlan')
                            : t('dashboard.settings.subscription.freePlan')}
                        </p>
                        <p className="text-sm text-gray-500">
                          {hasPremiumAccess
                            ? t('dashboard.settings.subscription.proPlanDescription')
                            : t('dashboard.settings.subscription.freePlanDescription')}
                        </p>
                        {hasPremiumAccess && isExpiringSoon && (
                          <p className="text-sm font-medium text-orange-600">
                            {t('dashboard.settings.subscription.expiringSoon', { days: daysUntilExpiry })}
                          </p>
                        )}
                      </div>
                      <div className="flex w-full flex-col gap-2 md:w-64">
                        {hasPremiumAccess ? (
                          <>
                            <Button
                              variant="default"
                              onClick={() => setShowUnsubscribeModal(true)}
                              className="bg-gray-900 text-white hover:bg-gray-800"
                            >
                              {t('dashboard.settings.subscription.manageCta')}
                            </Button>
                            <Button
                              variant="outline"
                              onClick={handleFallbackPremiumActivation}
                              disabled={isCheckingPremium}
                            >
                              {isCheckingPremium
                                ? t('dashboard.settings.subscription.refreshLoading')
                                : t('dashboard.settings.subscription.refreshCta')}
                            </Button>
                          </>
                        ) : (
                          <Button
                            className="bg-[#8b4a25] hover:bg-[#6f3719]"
                            onClick={handleUpgradeClick}
                          >
                            <Sparkles className="h-4 w-4" />
                            {t('dashboard.settings.subscription.upgradeCta')}
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Languages className="h-4 w-4 text-gray-400" />
                        {t('dashboard.settings.language.title')}
                      </CardTitle>
                      <CardDescription>{t('dashboard.settings.language.description')}</CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-wrap gap-2">
                      {(['en', 'fr'] as const).map((code) => (
                        <Button
                          key={code}
                          variant={language === code ? 'default' : 'outline'}
                          onClick={() => setLanguage(code)}
                          className={cn(
                            language === code
                              ? 'bg-gray-900 text-white hover:bg-gray-800'
                              : 'text-gray-600'
                          )}
                        >
                          {code === 'en' ? 'ENG' : 'FR'}
                        </Button>
                      ))}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>{t('dashboard.settings.data.title')}</CardTitle>
                      <CardDescription>{t('dashboard.settings.data.description')}</CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <p className="text-sm text-gray-500">
                        {t('dashboard.settings.data.helper')}
                      </p>
                      <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
                        <Link href="/data-management">
                          <Button variant="outline" className="w-full sm:w-auto">
                            {t('dashboard.settings.data.openData')}
                          </Button>
                        </Link>
                        <Button
                          variant="destructive"
                          className="w-full sm:w-auto"
                          onClick={() => setShowDeleteAccountModal(true)}
                        >
                          {t('dashboard.settings.data.delete')}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ) : selectedCvId ? (
                    // CV Detail View
                    (() => {
                      const selectedCv = displayCvs.find(cv => cv.id === selectedCvId);
                      if (!selectedCv) {
                        return (
                          <div className="text-center py-12">
                            <p className="text-gray-500">Resume not found</p>
                            <Button onClick={() => handleSectionChange('resumes')} className="mt-4">
                              Back to My Resumes
                            </Button>
                          </div>
                        );
                      }
                      return (
                        <div className="space-y-8">
                          <div className="space-y-2">
                            <h1 className="text-3xl font-bold text-gray-900">
                              {selectedCv.title || t("cvBuilder.title.untitled")}
                            </h1>
                          </div>

                          <Card>
                            <CardContent className="p-6">
                              <div className="flex items-start gap-4">
                                <div className="h-24 w-24 overflow-hidden rounded-lg bg-gray-100 flex-shrink-0">
                                  <CVTemplateImage templateId={selectedCv.templateId} />
                                </div>
                                <div className="flex-1">
                                  <div className="flex flex-wrap items-center gap-2 mb-2">
                                    <h3 className="text-xl font-semibold text-gray-900">
                                      {selectedCv.title || t("cvBuilder.title.untitled")}
                                    </h3>
                                    <Badge
                                      variant="outline"
                                      className={cn(
                                        "border-0 px-2 py-0.5 text-xs",
                                        selectedCv.isPublished
                                          ? "bg-green-100 text-green-700"
                                          : "bg-gray-100 text-gray-600"
                                      )}
                                    >
                                      {selectedCv.isPublished ? t('dashboard.card.published') : t('dashboard.card.draft')}
                                    </Badge>
                                  </div>
                                  <p className="text-sm text-gray-500 mb-4">
                                    {formatDisplayDate(selectedCv.createdAt, selectedCv.updatedAt)}
                                  </p>

                                  <div className="flex flex-col gap-3">
                                    <Link href={`/cv-builder?cv=${selectedCv.id}`}>
                                      <Button
                                        variant="outline"
                                        className="w-full sm:w-auto justify-start border-gray-200 text-blue-600 hover:bg-blue-50"
                                        data-testid={`button-edit-${selectedCv.id}`}
                                      >
                                        <Edit className="h-4 w-4 mr-2" />
                                        {t('dashboard.editAndPreview')}
                                      </Button>
                                    </Link>

                                    <PublishButton
                                      cvId={selectedCv.id}
                                      isPublished={selectedCv.isPublished || false}
                                      subdomain={selectedCv.subdomain || ''}
                                      publishedLanguage={selectedCv.publishedLanguage || language}
                                      isLocked={selectedCv.isPremiumLocked || false}
                                      onPublishChange={(published, subdomain, lang) =>
                                        handlePublishChange(selectedCv.id, published, subdomain, lang)
                                      }
                                    />

                                    <AlertDialog>
                                      <AlertDialogTrigger asChild>
                                        <Button
                                          variant="destructive"
                                          className="w-full sm:w-auto justify-start"
                                        >
                                          <Trash2 className="h-4 w-4 mr-2" />
                                          {t('dashboard.deleteResume')}
                                        </Button>
                                      </AlertDialogTrigger>
                                      <AlertDialogContent>
                                        <AlertDialogHeader>
                                          <AlertDialogTitle>
                                            Are you sure you want to delete "{selectedCv.title || "This resume"}"?
                                          </AlertDialogTitle>
                                          <AlertDialogDescription>
                                            This action cannot be undone. This resume will be permanently deleted from your dashboard.
                                          </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                          <AlertDialogCancel>{t('ui.cancel')}</AlertDialogCancel>
                                          <AlertDialogAction
                                            onClick={() => {
                                              handleDeleteCV(selectedCv.id);
                                              setSelectedCvId(null);
                                              handleSectionChange('resumes');
                                            }}
                                            className="bg-red-600 hover:bg-red-700"
                                          >
                                            {t('ui.delete')}
                                          </AlertDialogAction>
                                        </AlertDialogFooter>
                                      </AlertDialogContent>
                                    </AlertDialog>
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                      );
                    })()
                  ) : (
                    // CV List View
                    <div className="space-y-8">
                      <div className="space-y-2">
                        <h1 className="text-3xl font-bold text-gray-900">{t('dashboard.title')}</h1>
                        <p className="text-gray-500">{t('dashboard.subtitle')}</p>
                      </div>

                      {!hasPremiumAccess ? (
                    <div className="rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 p-6">
                      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div>
                          <p className="text-base font-semibold text-amber-900">{t('dashboard.resumesUpgradeTitle')}</p>
                          <p className="text-sm text-amber-800">{t('dashboard.resumesUpgradeDescription')}</p>
                        </div>
                        <Button className="bg-[#8b4a25] hover:bg-[#6f3719]" onClick={handleUpgradeClick}>
                          <Sparkles className="h-4 w-4" />
                          {t('dashboard.resumesUpgradeButton')}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    hasPremiumAccess && isExpiringSoon && (
                      <div className="rounded-2xl border border-orange-200 bg-orange-50 p-6">
                        <div className="flex items-center gap-2">
                          <Crown className="h-5 w-5 text-orange-600" />
                          <p className="text-sm font-semibold text-orange-900">
                            {t('dashboard.settings.subscription.expiringSoon', { days: daysUntilExpiry })}
                          </p>
                        </div>
                        <p className="mt-2 text-sm text-gray-600">
                          {t('dashboard.settings.subscription.expiringDescription')}
                        </p>
                      </div>
                    )
                  )}

                  {displayCvs.length === 0 ? (
                    <Card className="border border-dashed border-gray-200 bg-white">
                      <CardContent className="flex flex-col items-center gap-4 p-10 text-center">
                        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                          <LayoutDashboard className="h-8 w-8" />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900">
                          {t('dashboard.resumesEmptyTitle')}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {t('dashboard.resumesEmptyDescription')}
                        </p>
                        {canCreateNewCv && (
                          <Link href="/cv-builder">
                            <Button className="w-full">
                              <Plus className="h-4 w-4" />
                              {t('dashboard.createNewResume')}
                            </Button>
                          </Link>
                        )}
                      </CardContent>
                    </Card>
                  ) : (
                    // CV List View
                    <div className="grid gap-6 xl:grid-cols-2">
                      {displayCvs.map((cv: DashboardCV) => (
                        <Card
                          key={cv.id}
                          className="cursor-pointer border border-gray-200 bg-white shadow-sm transition hover:shadow-md"
                          onClick={() => handleCvClick(cv.id)}
                        >
                          <CardContent className="p-5">
                            <div className="flex items-start gap-4">
                              <div className="h-16 w-16 overflow-hidden rounded-lg bg-gray-100 flex-shrink-0">
                                <CVTemplateImage templateId={cv.templateId} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex flex-wrap items-center gap-2 mb-2">
                                  <h3 className="text-lg font-semibold text-gray-900 truncate">
                                    {cv.title || t("cvBuilder.title.untitled")}
                                  </h3>
                                  <Badge
                                    variant="outline"
                                    className={cn(
                                      "border-0 px-2 py-0.5 text-xs flex-shrink-0",
                                      cv.isPublished
                                        ? "bg-green-100 text-green-700"
                                        : "bg-gray-100 text-gray-600"
                                    )}
                                  >
                                    {cv.isPublished ? t('dashboard.card.published') : t('dashboard.card.draft')}
                                  </Badge>
                                </div>
                                <p className="text-sm text-gray-500">
                                  {formatDisplayDate(cv.createdAt, cv.updatedAt)}
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}

                      <Card
                        className={cn(
                          "border-2 border-dashed bg-transparent cursor-pointer transition hover:shadow-md",
                          canCreateNewCv ? "border-gray-300" : "border-gray-200 bg-gray-50"
                        )}
                      >
                        <CardContent className="p-5">
                          {canCreateNewCv ? (
                            <Link href="/cv-builder" className="flex items-start gap-4">
                              <div className="h-16 w-16 flex items-center justify-center rounded-lg bg-blue-600 flex-shrink-0">
                                <Plus className="h-6 w-6 text-white" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                  {t('dashboard.createNewResume')}
                                </h3>
                                <p className="text-sm text-gray-500">
                                  {t('dashboard.newResumeDescription')}
                                </p>
                              </div>
                            </Link>
                          ) : (
                            <div className="flex items-start gap-4">
                              <div className="h-16 w-16 flex items-center justify-center rounded-lg bg-gray-200 flex-shrink-0">
                                <Crown className="h-5 w-5 text-gray-600" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                  {t('dashboard.resumesUpgradeTitle')}
                                </h3>
                                <p className="text-sm text-gray-500 mb-3">
                                  {t('dashboard.resumesUpgradeDescription')}
                                </p>
                                <Button
                                  className="bg-[#8b4a25] hover:bg-[#6f3719]"
                                  onClick={handleUpgradeClick}
                                >
                                  <Sparkles className="h-4 w-4" />
                                  {t('dashboard.resumesUpgradeButton')}
                                </Button>
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </div>
                  )}
                </div>
              )}
              </main>

              {/* Footer */}
              <footer className="border-t border-gray-200 bg-gray-50">
              <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                  <div className="col-span-1 md:col-span-2">
                    <div className="flex items-center">
                      <img src={logoBrevy} alt="Brevy" className="h-8 w-auto" />
                    </div>
                    <p className="mt-2 text-gray-600">
                      Create professional resumes in minutes with our modern and customizable templates.
                    </p>
                    <p className="mt-2 text-sm text-gray-500">
                      Need help? Please contact contact@brevy.me
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Product</h4>
                    <ul className="mt-4 space-y-4">
                      <li>
                        <a href="/cv-builder" className="text-base text-gray-500 hover:text-gray-900">
                          Resume Creator
                        </a>
                      </li>
                      <li>
                        <a href="/dashboard" className="text-base text-gray-500 hover:text-gray-900">
                          My Resumes
                        </a>
                      </li>
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Legal</h4>
                    <ul className="mt-4 space-y-4">
                      <li>
                        <a href="/privacy-policy" className="text-base text-gray-500 hover:text-gray-900">
                          {t('gdpr.cookies.banner.privacyPolicyLink') || 'Privacy Policy'}
                        </a>
                      </li>
                      <li>
                        <a href="/terms-of-service" className="text-base text-gray-500 hover:text-gray-900">
                          {t('gdpr.auth.termsOfService') || 'Terms of Service'}
                        </a>
                      </li>
                      <li>
                        <button
                          onClick={() => {
                            if ((window as any).openCookiePanel) {
                              (window as any).openCookiePanel();
                            }
                          }}
                          className="text-base text-gray-500 hover:text-gray-700 text-left"
                        >
                          {t('gdpr.cookies.banner.manageCookies') || 'Manage cookies'}
                        </button>
                      </li>
                      <li>
                        <a href="/legal-notice" className="text-base text-gray-500 hover:text-gray-900">
                          Legal Notice
                        </a>
                      </li>
                    </ul>
                  </div>
                </div>
                
                <div className="mt-8 border-t border-gray-200 pt-8">
                  <p className="text-base text-gray-400 text-center">
                    © 2025 Brevy. All rights reserved.
                  </p>
                </div>
              </div>
              </footer>
            </div>
          </div>
        </div>
      </div>

      {/* Unsubscribe Confirmation Modal */}
      <AlertDialog open={showUnsubscribeModal} onOpenChange={setShowUnsubscribeModal}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('premium.dashboard.cancelSubscriptionTitle')}</AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p>
                {t('premium.dashboard.cancelSubscriptionDescription')}
              </p>
              <div className="bg-red-50 p-4 rounded-lg">
                <p className="font-medium text-red-900">
                  ⚠️ You will lose access to Pro features immediately
                </p>
                <p className="text-sm text-red-700 mt-1">
                  Your account will switch to the free plan right after unsubscribing.
                </p>
              </div>
              <p className="text-sm text-gray-600">
                You can resubscribe anytime if you change your mind.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('premium.dashboard.keepPremium')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleUnsubscribe}
              disabled={isUnsubscribing}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-500"
            >
              {isUnsubscribing ? "Cancelling..." : "Cancel subscription"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Account Modal */}
      <AlertDialog open={showDeleteAccountModal} onOpenChange={setShowDeleteAccountModal}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Permanently delete your account</AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p>
                This action is irreversible. All your data, including your resumes and profile photo, will be permanently deleted.
              </p>
              {user?.hasActiveSubscription && (
                <p className="text-orange-600 font-medium">
                  Your Pro subscription will also be cancelled and you will not be charged again.
                </p>
              )}
              <p>
                If you are sure you want to delete your account, click the button below.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAccount}
              disabled={isDeletingAccount}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-500"
            >
              {isDeletingAccount ? "Deleting..." : "Delete permanently"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
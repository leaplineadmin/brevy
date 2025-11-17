import { useState, useEffect, useRef } from "react";
// Use static logo
import { Link, useLocation } from "wouter";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useLanguage } from "@/contexts/LanguageContext";
import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { useCorrelationId } from "@/hooks/useCorrelationId";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import { Edit, ExternalLink, Plus, LogOut, Trash2, Crown, Sparkles } from "lucide-react";
import { DeleteButton } from "@/components/shared/delete-button";
import { CVPreviewThumbnail } from "@/components/dashboard/cv-preview-thumbnail";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { hasActivePremiumAccess, getDaysUntilPremiumExpiry, isPremiumExpiringSoon } from "@/utils/premium-check";
import Navbar from "@/components/layout/navbar";
import { PublishButton } from "@/components/dashboard/publish-button";
import logoBrevy from "@/assets/logo-brevy.svg";

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
  const { user, isLoading, refreshUser } = useAuth();
  const { toast } = useToast();
  const { t, language } = useLanguage();
  const correlationId = useCorrelationId();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
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
            if (urlParams.has('draftId')) {
              urlParams.delete('draftId');
              const newUrl = window.location.pathname + (urlParams.toString() ? '?' + urlParams.toString() : '');
              window.history.replaceState({}, '', newUrl);
            }
            
            // Étape 6: Toast de succès SEULEMENT si le CV est présent dans le state
            if (newCvFound) {
              toast({
                title: "Resume saved!",
                description: "Your resume has been saved to your dashboard.",
              });
            } else {
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
                    toast({
                      title: "CV saved!",
                      description: "Your CV has been automatically saved to your dashboard.",
                    });
                    success = true;
                    
                    // Refresh the CV list to show the new CV
                    window.location.reload();
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
                        toast({
                          title: "CV saved with free template!",
                          description: "Your CV was saved using the Classic template. Upgrade to Premium to access all templates.",
                        });
                        success = true;
                        window.location.reload();
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
              localStorage.removeItem('pending-cv-save');
              
              toast({
                title: t('premium.toasts.welcomeCvSaved'),
                description: t('premium.toasts.welcomeCvSavedDescription'),
              });
              
              // Refresh to show the new CV
              setTimeout(() => {
                window.location.reload();
              }, 1000);
              
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

  const handleSubscribe = () => {
    setShowSubscriptionModal(true);
  };



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
        <title>Dashboard | Brevy</title>
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
      <div className="min-h-screen bg-gray-50">
        {/* Use global navbar */}
        <Navbar />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" style={{ minHeight: '70vh' }}>
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-3xl font-bold text-gray-900">{t('dashboard.title')}</h1>
            <div className="flex items-center gap-2">
              {user && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">
                    {user?.firstName || 'User'}
                  </span>
                  {hasPremiumAccess ? (
                    <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 text-white shadow-md border border-yellow-300">
                      <Crown className="w-3 h-3 inline mr-1" />
                      {t('premium.dashboard.premiumBadge')}
                    </span>
                  ) : (
                    <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-200 text-gray-700">
                      Free
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
          <p className="text-gray-600">
{t('dashboard.subtitle')}
          </p>
        </div>

        {/* Premium Expiration Banner for users with expiring access */}
        {user && hasPremiumAccess && isExpiringSoon && (
          <div className="mb-8">
            <div className="bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-lg p-4 flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <Crown className="h-5 w-5 text-orange-600" />
                <span className="text-gray-800 font-medium">
                  Your Pro access expires in {daysUntilExpiry} days
                </span>
              </div>
              <div className="text-sm text-gray-600">
                You'll keep access until then, but consider renewing to continue using Pro features.
              </div>
            </div>
          </div>
        )}

        {/* Premium Banner for free users */}
        {user && !hasPremiumAccess && (
          <div className="mb-8">
            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg p-4 flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <Crown className="h-5 w-5 text-yellow-600" />
                <span className="text-gray-800">
                  {t('premium.banner.unlockMessage')}
                </span>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={async () => {
                    const { getPaymentLinkUrl } = await import('../lib/stripe');
                    window.location.href = getPaymentLinkUrl({ returnTo: 'dashboard' });
                  }}
                  className="bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white"
                >
                  <Sparkles className="w-4 h-4 mr-1" />
                  {t('premium.banner.subscribeButton')}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* CV Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Existing CVs */}
          {displayCvs.map((cv: DashboardCV) => (
            <Card key={cv.id} className="relative group hover:shadow-lg transition-all duration-300 ease-in-out border border-gray-200 hover:border-gray-300">
              {/* Delete icon in top right - uses same DeleteButton as CV builder */}
              <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <div>
                      <DeleteButton onClick={() => {}} />
                    </div>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you sure you want to delete "{cv.title || "This resume"}"?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This resume will be permanently deleted from your dashboard.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleDeleteCV(cv.id)}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>

              <CardContent className="p-3">
                {/* Header with thumbnail and title/date */}
                <div className="flex items-start gap-3 mb-3">
                  {/* CV Preview Thumbnail */}
                  <div className="w-16 h-16 flex-shrink-0">
                    <CVTemplateImage templateId={cv.templateId} />
                  </div>
                  
                  {/* Title and Date */}
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-1">
                      {cv.title || t("cvBuilder.title.untitled")}
                    </h3>
                    <p className="text-xs text-gray-500">
                      {formatDisplayDate(cv.createdAt, cv.updatedAt)}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="space-y-1">
                  <Link href={`/cv-builder?cv=${cv.id}`}>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full justify-start text-blue-600 border-blue-200 hover:bg-blue-50 h-8"
                      data-testid={`button-edit-${cv.id}`}
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      {t('dashboard.editAndPreview')}
                    </Button>
                  </Link>
                  
                  <PublishButton
                    cvId={cv.id}
                    isPublished={cv.isPublished || false}
                    subdomain={cv.subdomain || ''}
                    publishedLanguage={cv.publishedLanguage || language}
                    isLocked={cv.isPremiumLocked || false}
                    onPublishChange={(published, subdomain, language) => handlePublishChange(cv.id, published, subdomain, language)}
                  />
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Create New CV Card */}
          {(() => {
            const isFreeUserWithCV = !hasPremiumAccess && localCvs.length > 0;
            const isDisabled = isFreeUserWithCV;
            
            return (
              <Card className={`border-2 border-dashed transition-colors ${
                isDisabled 
                  ? 'border-gray-200 bg-gray-50 cursor-not-allowed' 
                  : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'
              }`}>
                <CardContent className="p-6 h-full flex flex-col items-center justify-center text-center">
                  {isDisabled ? (
                    <div className="w-full h-full flex flex-col items-center justify-center">
                      <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center mb-4">
                        <Crown className="w-6 h-6 text-gray-500" />
                      </div>
                      <h3 className="font-semibold text-gray-500 mb-2">{t('dashboard.premiumFeature')}</h3>
                      <p className="text-sm text-gray-400">
                        {t('dashboard.premiumFeatureDescription')}
                      </p>
                    </div>
                  ) : (
                    <Link href="/cv-builder" className="w-full h-full flex flex-col items-center justify-center">
                      <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center mb-4">
                        <Plus className="w-6 h-6 text-white" />
                      </div>
                      <h3 className="font-semibold text-gray-900 mb-2">{t('dashboard.createNewResume')}</h3>
                      <p className="text-sm text-gray-600">
                        {t('dashboard.newResumeDescription')}
                      </p>
                    </Link>
                  )}
                </CardContent>
              </Card>
            );
          })()}
        </div>

      </main>

      {/* Footer */}
      <footer className="bg-gray-50 border-t border-gray-200 mt-16">
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
                {user?.hasActiveSubscription && (
                  <li>
                    <button
                      onClick={() => setShowUnsubscribeModal(true)}
                      className="text-base text-gray-500 hover:text-gray-700 text-left"
                    >
                      {t('premium.dashboard.unsubscribeButton')}
                    </button>
                  </li>
                )}
                <li>
                  <button
                    onClick={() => setShowDeleteAccountModal(true)}
                    className="text-base text-gray-500 hover:text-gray-700 text-left"
                  >
                    {user?.hasActiveSubscription ? 'Unsubscribe & Delete my account' : 'Delete my account'}
                  </button>
                </li>
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
                <li>
                  <a href="mailto:contact@brevy.me" className="text-base text-gray-500 hover:text-gray-900">
                    Contact
                  </a>
                </li>
                <li>
                  <a href="/data-management" className="text-base text-gray-500 hover:text-gray-900">
                    {t('gdpr.dataManagement.title') || 'My Personal Data'}
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
      </div>
    </>
  );
}
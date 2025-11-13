import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/hooks/useAuth";
import logoBrevy from "@/assets/logo-brevy.svg";

export default function AuthPage() {
  // Unified auth mode - no separate signup/signin
  const [isSignUp] = useState(false);
  const [, setLocation] = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [forgotPasswordMessage, setForgotPasswordMessage] = useState("");
  const [isSendingForgotPassword, setIsSendingForgotPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const { toast } = useToast();
  const { t, language } = useLanguage();
  const { user, isLoading: authLoading } = useAuth();

  // Redirect authenticated users to dashboard
  useEffect(() => {
    if (user && !authLoading) {
      setLocation('/dashboard');
    }
  }, [user, authLoading, setLocation]);

  // Handle Google OAuth token consumption
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    
    if (token) {
      setIsLoading(true);
      
      // Consume the token to establish session
      fetch(`/api/session/consume?token=${encodeURIComponent(token)}`, {
        method: 'GET',
        credentials: 'include'
      })
      .then(response => {
        if (response.ok) {
          // Wait a moment for auth context to update, then redirect
          setTimeout(() => {
            setLocation('/dashboard');
          }, 500);
        } else if (response.status === 410) {
          setError('Authentication session expired. Please try again.');
          // Clear URL params and show login form
          window.history.replaceState({}, document.title, window.location.pathname);
        } else {
          setError('Authentication failed. Please try again.');
        }
      })
      .catch(error => {
        setError('Authentication failed. Please try again.');
      })
      .finally(() => {
        setIsLoading(false);
      });
    }
  }, []);

  // Function to fetch draft data and pre-fill form
  const fetchDraftData = async (draftId: string) => {
    try {
      const isProd = typeof window !== 'undefined' && window.location.hostname.endsWith('cvfolio.app');
      const base = isProd ? 'https://cvfolio.onrender.com' : '';
      
      const response = await fetch(`${base}/api/cv-drafts/${draftId}`, {
        method: 'GET',
        credentials: 'include',
      });

      if (response.ok) {
        const draftData = await response.json();
        
        if (draftData.cvData) {
          // Handle both nested (personalInfo) and flat structure
          const email = draftData.cvData.personalInfo?.email || draftData.cvData.email || "";
          
          if (email) {
            setEmail(email);
            // Email pré-rempli depuis le draft
          } else {
          }
          
          // CRITICAL FIX: Save draft data to localStorage for recovery after registration
          const cvState = {
            cvData: draftData.cvData,
            templateType: draftData.templateType || 'digital',
            templateId: draftData.templateId || 'template-classic',
            mainColor: draftData.mainColor || '#0076d1',
            title: draftData.title || 'My Resume',
            displaySettings: draftData.displaySettings || {},
            draftId: draftId,
            savedAt: new Date().toISOString()
          };
          
          localStorage.setItem('pending-cv-save', JSON.stringify(cvState));
        } else {
          
        }
      } else {
        
      }
    } catch (error) {
      
    }
  };
  
  // Modal mot de passe oublié
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState("");
  const [isSendingReset, setIsSendingReset] = useState(false);

  // Pré-remplir avec les données du CV builder si disponibles
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const draftIdFromUrl = urlParams.get('draftId');
    
    // Priority 1: Check URL parameter for draftId (most recent flow)
    if (draftIdFromUrl) {
      fetchDraftData(draftIdFromUrl);
      return; // Exit early if we found draftId in URL
    }
    
    // Priority 2: Check for fallback data (pending-cv-save)
    const pendingCVData = localStorage.getItem('pending-cv-save');
    if (pendingCVData) {
      try {
        const cvState = JSON.parse(pendingCVData);
        
        if (cvState.cvData) {
          // Handle both nested (personalInfo) and flat structure
          const email = cvState.cvData.personalInfo?.email || cvState.cvData.email || "";
          
          if (email) {
            setEmail(email);
          }
        }
      } catch (error) {
        // Ignore parsing errors
      }
    }
    
    // Priority 3: Check localStorage for draftId (legacy fallback)
    const draftId = localStorage.getItem('pending-cv-id');
    if (draftId && !pendingCVData) {
      // If we have a draft ID but no fallback data, try to fetch the draft data
      fetchDraftData(draftId);
    }
    
    // Priority 4: Check for URL parameters that might contain CV data (legacy)
    const cvDataParam = urlParams.get('cvData');
    if (cvDataParam) {
      try {
        const urlCvData = JSON.parse(decodeURIComponent(cvDataParam));
        
        const email = urlCvData.personalInfo?.email || urlCvData.email || "";
        
        if (email) setEmail(email);
      } catch (error) {
        // Ignore parsing errors
      }
    }
  }, []);

  // Handle Google OAuth token on page load
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const error = urlParams.get('error');
    
    if (error === 'google_auth_failed') {
      setError("Google authentication failed. Please try again.");
      return;
    }
    
    if (token) {
      handleGoogleOAuthTokenFromURL(token);
    }
  }, []);

  const handleGoogleOAuthTokenFromURL = async (token: string) => {
    try {
      // Consume the token to establish session
      const response = await fetch(`https://cvfolio.onrender.com/api/session/consume?token=${encodeURIComponent(token)}`, {
        method: 'GET',
        credentials: 'include'
      });
      
      if (response.ok) {
        // Use React Router navigation to avoid page reload
        setLocation("/dashboard");
        return;
      } else {
        setError("Failed to establish session. Please try again.");
      }
    } catch (error) {
      setError("Connection error. Please try again.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validation côté client
    if (!email || !password) {
      setError(t('auth.validation.emailPasswordRequired') || "Email et mot de passe requis");
      return;
    }

    // Check if user is trying to register (login failed) - validate terms acceptance
    // We'll check this after the login attempt fails
    setIsLoading(true);

    try {
      // Try login first
      const loginResponse = await fetch("https://cvfolio.onrender.com/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          username: email,
          password,
        }),
      });

      if (loginResponse.ok) {
        const user = await loginResponse.json();
        
        toast({
          title: "Sign in successful",
          description: `Welcome back ${user.firstName || user.username || ''}!`,
        });

        // Use React Router navigation to avoid page reload
        setTimeout(() => {
          setLocation("/dashboard");
        }, 500);
        return;
      } else {
        const errorData = await loginResponse.json();
        
        // Special handling for Google OAuth users
        if (errorData.message && errorData.message.includes("Google")) {
          setError("This account was created with Google. Please use 'Continue with Google' to sign in.");
          return;
        }
        
        // If login failed, try registration (user doesn't exist)
        // Validate terms acceptance before registration
        if (!acceptTerms) {
          setError(t('gdpr.auth.mustAccept') || "You must accept the Terms of Service to create an account");
          setIsLoading(false);
          return;
        }

        const registerResponse = await fetch("https://cvfolio.onrender.com/api/register", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            username: email,
            email,
            password,
            firstName: "", // Empty for now, will be filled later
            lastName: "", // Empty for now, will be filled later
            language: language, // Include current language preference
            acceptedTerms: true, // Record that user accepted terms
            acceptedPrivacy: true, // Record that user accepted privacy policy (always true for new registrations)
            termsAcceptedAt: new Date().toISOString(), // Timestamp of acceptance
          }),
        });

        if (registerResponse.ok) {
          const user = await registerResponse.json();
          
          toast({
            title: "Account created successfully",
            description: "Welcome! You are now signed in.",
          });
          
          // Use React Router navigation to avoid page reload
          setTimeout(() => {
            setLocation("/dashboard");
          }, 500);
        } else {
          const registerErrorData = await registerResponse.json();
          
        // If registration fails because user exists, show password error with forgot password option
        if (registerResponse.status === 409 || (registerErrorData.message && registerErrorData.message.includes("already exists"))) {
          setError("Wrong password");
        } else {
          setError(registerErrorData.message || "Error creating account");
        }
        }
      }
    } catch (error) {
      setError(t('auth.errors.connectionError') || "Erreur de connexion. Veuillez réessayer.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleOAuthToken = async () => {
    
    // Check for premium subscription context FIRST (before CV save)
    const premiumContext = localStorage.getItem('premium-subscription-context');
    
    if (premiumContext) {
      try {
        const context = JSON.parse(premiumContext);
        if (context.intent === 'premium-subscription') {
          localStorage.removeItem('premium-subscription-context');
          const { getPaymentLinkUrl } = await import('../lib/stripe');
          window.location.href = getPaymentLinkUrl({ returnTo: 'auth' });
          return;
        }
      } catch (error) {
        // Ignore parsing errors
      }
    }
    
    // Check URL parameters for redirect
    const urlParams = new URLSearchParams(window.location.search);
    const redirect = urlParams.get('redirect');
    
    if (redirect === 'premium') {
      const { getPaymentLinkUrl } = await import('../lib/stripe');
      window.location.href = getPaymentLinkUrl({ returnTo: 'auth' });
      return;
    }
    
    // Handle pending CV save
    await handlePendingCVSave();
    
    // Redirect to dashboard
    window.location.href = "/dashboard";
  };

  const handlePendingCVSave = async () => {
    // OAuth CV recovery is now handled in the dashboard
    // This function only handles regular pending CV data for non-OAuth scenarios
    
    const pendingCVData = localStorage.getItem('pending-cv-save');
    
    if (pendingCVData) {
      try {
        const cvState = JSON.parse(pendingCVData);
        
        const cvPayload = {
          title: cvState.title || 'Mon CV',
          templateId: cvState.templateId || 'template-classic',
          templateType: cvState.templateType || 'digital',
          mainColor: cvState.mainColor || '#0076d1',
          cvData: cvState.cvData || {},
          displaySettings: cvState.displaySettings || {},
        };
        
        const response = await fetch('/api/cvs', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(cvPayload),
        });

        if (response.ok) {
          localStorage.removeItem('pending-cv-save');
          
          toast({
            title: "CV saved!",
            description: "Your CV has been automatically saved to your dashboard.",
          });
        } else {
          
          toast({
            title: "CV save failed",
            description: "Unable to save your CV. Please try again from the dashboard.",
            variant: "destructive",
          });
        }
      } catch (error) {
        toast({
          title: "CV save failed",
          description: "Unable to save your CV. Please try again from the dashboard.",
          variant: "destructive",
        });
      }
    } else {
      // No pending CV data
    }
  };


  const handleForgotPassword = async () => {
    if (!forgotPasswordEmail) {
      toast({
        variant: "destructive",
        title: t('auth.errors.error') || "Erreur",
        description: t('auth.errors.emailRequired') || "Veuillez entrer votre adresse email.",
      });
      return;
    }

    setIsSendingReset(true);

    try {
      const response = await fetch('https://cvfolio.onrender.com/api/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: forgotPasswordEmail,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Email envoyé",
          description: data.message,
        });
        setShowForgotPasswordModal(false);
      } else {
        toast({
          variant: "destructive",
          title: "Erreur",
          description: data.message || "Erreur lors de l'envoi de l'email.",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Erreur de connexion. Veuillez réessayer.",
      });
    } finally {
      setIsSendingReset(false);
    }
  };

  const handleForgotPasswordInline = async () => {
    if (!email) {
      setError("Please enter your email address first");
      return;
    }

    setIsSendingForgotPassword(true);
    setForgotPasswordMessage("");

    try {
      const response = await fetch('https://cvfolio.onrender.com/api/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setForgotPasswordMessage("Email sent. Please check your inbox");
        setError(""); // Clear any existing error
      } else {
        setError(data.message || "Error sending reset email");
      }
    } catch (error) {
      setError("Error sending reset email. Please try again.");
    } finally {
      setIsSendingForgotPassword(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Logo */}
      <div className="fixed top-8 left-8 z-10">
        <Link href="/" className="hover:opacity-80 transition-opacity">
          <img src={logoBrevy} alt="Brevy" className="h-8 w-auto" />
        </Link>
      </div>

      {/* Left side - Information */}
      <div className="hidden lg:flex lg:w-1/2 bg-white p-12 flex-col justify-center">
        <div className="max-w-md">
          <Link href="/cv-builder" className="inline-flex items-center text-gray-600 hover:text-gray-800 mb-8">
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t('auth.ui.back')}
          </Link>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            {t('auth.ui.saveYourCV')}
          </h1>
          
          <div className="space-y-4">
            <div className="flex items-start">
              <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mr-3 mt-0.5">
                <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <p className="text-gray-700">{t('auth.ui.editAndShare')}</p>
            </div>
            
            <div className="flex items-start">
              <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mr-3 mt-0.5">
                <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <p className="text-gray-700">{t('auth.ui.createUnlimited')}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Auth form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Mobile back button */}
          <div className="lg:hidden mt-8">
            <Link href="/cv-builder" className="inline-flex items-center text-gray-600 hover:text-gray-800">
              <ArrowLeft className="w-4 h-4 mr-2" />
              {t('auth.ui.back')}
            </Link>
          </div>

          {/* Logo */}
          <div className="text-center mb-8 lg:hidden">
            <h1 className="text-2xl font-bold text-gray-900">
              {t('auth.ui.saveYourCV')}
            </h1>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-8">
            <h1 className="text-3xl font-bold text-center text-gray-900 mb-2">
              Sign In / Sign Up
            </h1>
            <p className="text-center text-gray-600 mb-8">
              {t('authPage.enterEmailPassword')}
            </p>
            
            {error && error !== "Wrong password" && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {forgotPasswordMessage && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md transition-opacity duration-300">
                <div className="flex items-center">
                  <svg className="w-4 h-4 text-green-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <p className="text-sm text-green-600">{forgotPasswordMessage}</p>
                </div>
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                  {t('auth.login.email')}
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t('auth.login.email')}
                  className="mt-1"
                  required
                />
              </div>

              <div>
                <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                  {t('auth.login.password')}
                </Label>
                <div className="relative mt-1">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    title={showPassword ? t('auth.ui.hidePassword') : t('auth.ui.showPassword')}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                </div>
                {error === "Wrong password" && (
                  <div className="mt-2 text-sm text-red-600">
                    Wrong password —{' '}
                    <button
                      type="button"
                      onClick={handleForgotPasswordInline}
                      disabled={isSendingForgotPassword}
                      className="text-blue-600 hover:text-blue-800 underline"
                    >
                      {isSendingForgotPassword ? 'Sending...' : 'Forgot your password? Send me an email'}
                    </button>
                  </div>
                )}
              </div>

              {/* Terms Checkbox - shown only when trying to register */}
              <div className="space-y-3">
                <div className="flex items-start space-x-2">
                  <Checkbox
                    id="acceptTerms"
                    checked={acceptTerms}
                    onCheckedChange={(checked) => setAcceptTerms(!!checked)}
                    className="mt-1"
                  />
                  <Label htmlFor="acceptTerms" className="text-sm text-gray-700 cursor-pointer">
                    {t('gdpr.auth.acceptTerms')}{" "}
                    <Link href="/terms-of-service" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline">
                      {t('gdpr.auth.termsOfService')}
                    </Link>
                    .
                  </Label>
                </div>
              </div>

              <Button
                type="submit"
                disabled={isLoading || !acceptTerms}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? "Processing..." : "Sign In / Sign Up"}
              </Button>

              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">{t('auth.ui.or')}</span>
                </div>
              </div>

              {/* Google OAuth Button */}
              <Button
                type="button"
                onClick={() => {
                  // Simple, reliable Google OAuth redirect
                  window.location.href = '/api/google';
                }}
                disabled={!acceptTerms}
                className="w-full bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                </svg>
{t('auth.ui.continueWithGoogle')}
              </Button>

              <div className="text-center text-sm text-gray-600">
                {t('authPage.continueWithGoogleDescription')}
              </div>
              <p className="text-xs text-gray-500 text-center mt-2">
                {t('gdpr.auth.googleAcceptText')}{" "}
                <Link href="/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline">
                  {t('gdpr.auth.privacyPolicy')}
                </Link>
              </p>
            </form>
          </div>
        </div>
      </div>

      {/* Modal Mot de passe oublié */}
      <Dialog open={showForgotPasswordModal} onOpenChange={setShowForgotPasswordModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('auth.forgotPassword.title')}</DialogTitle>
            <DialogDescription>
              {t('auth.forgotPassword.description')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="forgotEmail" className="text-sm font-medium">
                {t('auth.login.email')}
              </Label>
              <Input
                id="forgotEmail"
                type="email"
                value={forgotPasswordEmail}
                onChange={(e) => setForgotPasswordEmail(e.target.value)}
                placeholder={t('auth.forgotPassword.emailPlaceholder')}
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowForgotPasswordModal(false)}
            >
              {t('auth.forgotPassword.cancel')}
            </Button>
            <Button
              onClick={handleForgotPassword}
              disabled={isSendingReset}
            >
              {isSendingReset ? t('auth.ui.loading') : t('auth.forgotPassword.send')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
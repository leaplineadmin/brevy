import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { HelmetProvider } from "react-helmet-async";
import { useEffect, Suspense, lazy } from "react";
import { LoadingSpinner } from "@/components/shared/loading-spinner";

// Import critical pages synchronously (no loader)
import HomePage from "@/pages/home-page";
import CVBuilder from "@/pages/cv-builder";
import AuthPage from "@/pages/auth-page";
import Dashboard from "@/pages/dashboard";

// Lazy load less critical pages
const NotFound = lazy(() => import("@/pages/not-found"));
const Landing = lazy(() => import("@/pages/landing"));
const MentionsLegales = lazy(() => import("@/pages/mentions-legales"));
const PrivacyPolicy = lazy(() => import("@/pages/privacy-policy"));
const TermsOfService = lazy(() => import("@/pages/terms-of-service"));
const DataManagement = lazy(() => import("@/pages/data-management"));
const ResetPassword = lazy(() => import("@/pages/reset-password"));
const PasswordResetConfirmation = lazy(() => import("@/pages/password-reset-confirmation"));
const SharedCV = lazy(() => import("@/pages/shared-cv").then(module => ({ default: module.SharedCV })));
const SharedNotFound = lazy(() => import("@/pages/shared-not-found"));
const SubscriptionPage = lazy(() => import("@/pages/subscription-page"));
const Checkout = lazy(() => import("@/pages/checkout"));
const PaymentSuccess = lazy(() => import("@/pages/payment-success"));
const Blog = lazy(() => import("@/pages/blog"));
const BlogArticle = lazy(() => import("@/pages/blog-article"));

import { CVProvider } from "@/hooks/use-cv-data";
import { AuthProvider } from "@/hooks/use-auth";
import { useAuth } from "@/hooks/useAuth";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { CookieBanner } from "@/components/gdpr/cookie-banner";
import { GoogleAnalytics } from "@/components/shared/google-analytics";

function Router() {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  // Detect Stripe Payment Link redirect and route to Payment Success page
  // Example: ?redirect_status=paid or ?redirect_status=succeeded
  // Preserve draftId if present for post-payment CV recovery
  if (typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search);
    const redirectStatus = params.get('redirect_status');
    const isOnPaymentSuccess = window.location.pathname === '/payment-success';
    if (!isOnPaymentSuccess && redirectStatus && (redirectStatus === 'paid' || redirectStatus === 'succeeded')) {
      const draftId = params.get('draftId');
      const target = draftId ? `/payment-success?from=paid&draftId=${encodeURIComponent(draftId)}` : '/payment-success?from=paid';
      setLocation(target);
    }
  }

  // Déterminer quelle page afficher selon l'état d'authentification
  const isAuthenticated = !!user;

  return (
    <Switch>
      {/* Critical pages - no loader */}
      <Route path="/" component={HomePage} />
      <Route path="/fr" component={HomePage} />
      <Route path="/fr/" component={HomePage} />
      <Route path="/homepage" component={HomePage} />
      <Route path="/home" component={HomePage} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/cv-builder" component={CVBuilder} />
      <Route path="/auth" component={AuthPage} />
      
      {/* Lazy loaded pages - with loader */}
      <Route path="/reset-password">
        <Suspense fallback={<LoadingSpinner size="lg" text="Loading..." className="min-h-screen" />}>
          <ResetPassword />
        </Suspense>
      </Route>
      <Route path="/password-reset-confirmation">
        <Suspense fallback={<LoadingSpinner size="lg" text="Loading..." className="min-h-screen" />}>
          <PasswordResetConfirmation />
        </Suspense>
      </Route>
      <Route path="/landing">
        <Suspense fallback={<LoadingSpinner size="lg" text="Loading..." className="min-h-screen" />}>
          <Landing />
        </Suspense>
      </Route>
      <Route path="/mentions-legales">
        <Suspense fallback={<LoadingSpinner size="lg" text="Loading..." className="min-h-screen" />}>
          <MentionsLegales />
        </Suspense>
      </Route>
      <Route path="/legal-notice">
        <Suspense fallback={<LoadingSpinner size="lg" text="Loading..." className="min-h-screen" />}>
          <MentionsLegales />
        </Suspense>
      </Route>
      <Route path="/privacy-policy">
        <Suspense fallback={<LoadingSpinner size="lg" text="Loading..." className="min-h-screen" />}>
          <PrivacyPolicy />
        </Suspense>
      </Route>
      <Route path="/terms-of-service">
        <Suspense fallback={<LoadingSpinner size="lg" text="Loading..." className="min-h-screen" />}>
          <TermsOfService />
        </Suspense>
      </Route>
      <Route path="/terms">
        <Suspense fallback={<LoadingSpinner size="lg" text="Loading..." className="min-h-screen" />}>
          <TermsOfService />
        </Suspense>
      </Route>
      <Route path="/data-management">
        <Suspense fallback={<LoadingSpinner size="lg" text="Loading..." className="min-h-screen" />}>
          <DataManagement />
        </Suspense>
      </Route>
      <Route path="/subscription">
        <Suspense fallback={<LoadingSpinner size="lg" text="Loading..." className="min-h-screen" />}>
          <SubscriptionPage />
        </Suspense>
      </Route>
      <Route path="/checkout">
        <Suspense fallback={<LoadingSpinner size="lg" text="Loading..." className="min-h-screen" />}>
          <Checkout />
        </Suspense>
      </Route>
      <Route path="/payment-success">
        <Suspense fallback={<LoadingSpinner size="lg" text="Loading..." className="min-h-screen" />}>
          <PaymentSuccess />
        </Suspense>
      </Route>
      <Route path="/cv/:subdomain">
        <Suspense fallback={<LoadingSpinner size="lg" text="Loading..." className="min-h-screen" />}>
          <SharedCV />
        </Suspense>
      </Route>
      <Route path="/cv/not-found">
        <Suspense fallback={<LoadingSpinner size="lg" text="Loading..." className="min-h-screen" />}>
          <SharedNotFound />
        </Suspense>
      </Route>
      <Route path="/blog/:slug">
        <Suspense fallback={<LoadingSpinner size="lg" text="Loading..." className="min-h-screen" />}>
          <BlogArticle />
        </Suspense>
      </Route>
      <Route path="/blog">
        <Suspense fallback={<LoadingSpinner size="lg" text="Loading..." className="min-h-screen" />}>
          <Blog />
        </Suspense>
      </Route>
      <Route>
        <Suspense fallback={<LoadingSpinner size="lg" text="Loading..." className="min-h-screen" />}>
          <NotFound />
        </Suspense>
      </Route>
    </Switch>
  );
}

function App() {
  useEffect(() => {
    // Signal à Prerender.io que le rendu est terminé
    // Utilise plusieurs méthodes pour s'assurer que le contenu est complètement chargé
    
    let prerenderReadySet = false;
    const setPrerenderReady = () => {
      if (!prerenderReadySet && window.prerenderReady !== undefined) {
        window.prerenderReady = true;
        prerenderReadySet = true;
        console.log('[Prerender] Page ready for pre-rendering');
      }
    };

    // Méthode 1: Attendre que le DOM soit complètement chargé
    if (document.readyState === 'complete') {
      // Le DOM est déjà chargé
      setTimeout(setPrerenderReady, 100);
    } else {
      window.addEventListener('load', () => {
        setTimeout(setPrerenderReady, 500);
      });
    }

    // Méthode 2: Attendre que toutes les images soient chargées
    const images = document.querySelectorAll('img');
    if (images.length === 0) {
      // Pas d'images, on peut signaler plus tôt
      setTimeout(setPrerenderReady, 300);
    } else {
      let loadedImages = 0;
      const checkImagesLoaded = () => {
        loadedImages++;
        if (loadedImages === images.length) {
          setTimeout(setPrerenderReady, 200);
        }
      };
      
      images.forEach((img) => {
        if ((img as HTMLImageElement).complete) {
          checkImagesLoaded();
        } else {
          img.addEventListener('load', checkImagesLoaded);
          img.addEventListener('error', checkImagesLoaded); // Compter les erreurs aussi
        }
      });
    }

    // Méthode 3: Utiliser MutationObserver pour détecter quand le contenu principal est rendu
    const rootElement = document.getElementById('root');
    if (rootElement) {
      const observer = new MutationObserver(() => {
        // Vérifier si le contenu principal est présent
        const hasContent = rootElement.querySelector('h1, h2, [role="main"], main, article') !== null;
        if (hasContent) {
          setTimeout(setPrerenderReady, 500);
          observer.disconnect();
        }
      });
      
      observer.observe(rootElement, {
        childList: true,
        subtree: true,
      });
    }

    // Méthode 4: Timeout de sécurité (maximum 3 secondes)
    const safetyTimer = setTimeout(() => {
      setPrerenderReady();
    }, 3000);

    return () => {
      clearTimeout(safetyTimer);
    };
  }, []);

  return (
    <HelmetProvider>
      <GoogleAnalytics />
      <QueryClientProvider client={queryClient}>
        <LanguageProvider>
          <AuthProvider>
            <CVProvider>
              <Router />
              <Toaster />
              <CookieBanner />
            </CVProvider>
          </AuthProvider>
        </LanguageProvider>
      </QueryClientProvider>
    </HelmetProvider>
  );
}

export default App;

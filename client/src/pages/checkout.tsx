import { useStripe, Elements, PaymentElement, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useEffect, useState } from 'react';
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

// Make sure to call `loadStripe` outside of a component's render to avoid
// recreating the `Stripe` object on every render.
if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
}
const stripePromise = import.meta.env.VITE_STRIPE_PUBLIC_KEY 
  ? loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY) 
  : null;

const CheckoutForm = () => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const { refreshUser } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleCancel = () => {
    // Check if user came from premium subscription flow
    const premiumContext = localStorage.getItem('premium-subscription-context');
    if (premiumContext) {
      try {
        const context = JSON.parse(premiumContext);
        if (context.intent === 'premium-subscription' && context.returnTo === 'cv-builder') {
          // Clear premium context but keep pending CV save for restore
          localStorage.removeItem('premium-subscription-context');
          // Return to CV builder with their work preserved
          window.location.href = '/cv-builder';
          return;
        }
      } catch (error) {

      }
    }
    
    // Build cancel URL with draftId if available (preserve draft on cancel)
    const draftId = localStorage.getItem('checkout-draft-id') || 
                   new URLSearchParams(window.location.search).get('draftId') ||
                   localStorage.getItem('pending-cv-id');
    
    let cancelUrl = '/dashboard';
    if (draftId) {
      cancelUrl += `?draftId=${encodeURIComponent(draftId)}`;
    }
    
    window.location.href = cancelUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);

    // Build return URL to explicit Payment Success page (restores previous working flow)
    const draftId = localStorage.getItem('checkout-draft-id') || 
                   new URLSearchParams(window.location.search).get('draftId') ||
                   localStorage.getItem('pending-cv-id');
    
    // Always go through the payment success page so we can refresh user status before dashboard
    let returnUrl = window.location.origin + '/payment-success?from=paid';
    if (draftId) {
      returnUrl += `&draftId=${encodeURIComponent(draftId)}`;
    }

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: returnUrl,
      },
    });

    if (error) {
      setErrorMessage(error.message || "Payment failed");
      toast({
        title: "Payment Failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      // Payment successful - clean up all draft-related localStorage
      localStorage.removeItem('premium-subscription-context');
      localStorage.removeItem('pending-cv-id');
      localStorage.removeItem('checkout-draft-id');
      localStorage.removeItem('pending-cv-save');
      
      // Refresh user status to get updated subscription info
      try {
        console.log('🔄 [CHECKOUT] Refreshing user status after payment...');
        await refreshUser();
        
        // Wait a bit for webhook to process, then refresh again
        setTimeout(async () => {
          console.log('🔄 [CHECKOUT] Second refresh after webhook processing...');
          await refreshUser();
        }, 2000);
        
        // Final refresh after a longer delay to ensure webhook completed
        setTimeout(async () => {
          console.log('🔄 [CHECKOUT] Final refresh to ensure Premium status...');
          await refreshUser();
        }, 5000);
        
      } catch (error) {
        console.error('Failed to refresh user status:', error);
      }
      
      toast({
        title: t('premium.toasts.welcome'),
        description: t('premium.toasts.welcomeDescription'),
      });
    }
    
    setIsProcessing(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-gray-50 p-6 rounded-lg">
        <h3 className="text-lg font-semibold mb-2">{t('premium.checkout.title')}</h3>
        <p className="text-gray-600 mb-4">{t('premium.checkout.price')}</p>
        <ul className="space-y-2 text-sm text-gray-600">
          <li className="flex items-start gap-2">
            <svg className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>Access to all 6 professional templates</span>
          </li>
          <li className="flex items-start gap-2">
            <svg className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>Unlimited CV saves and exports</span>
          </li>
          <li className="flex items-start gap-2">
            <svg className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>Priority support</span>
          </li>
        </ul>
      </div>

      <PaymentElement />
      
      {errorMessage && (
        <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">
          {errorMessage}
        </div>
      )}
      
      <div className="flex flex-col gap-3">
        <Button
          type="submit"
          disabled={!stripe || isProcessing}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white"
        >
          {isProcessing ? (
            <>
              <svg className="animate-spin h-4 w-4 mr-2" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Processing...
            </>
          ) : (
            "Subscribe for €3.90/month"
          )}
        </Button>
        
        <button
          type="button"
          onClick={handleCancel}
          className="text-sm text-gray-500 hover:text-gray-700 underline transition-colors"
        >
          ← Return to templates
        </button>
      </div>
    </form>
  );
};

export default function Checkout() {
  const [clientSecret, setClientSecret] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Get draftId from URL params or localStorage for Stripe integration
    const urlParams = new URLSearchParams(window.location.search);
    const draftId = urlParams.get('draftId') || localStorage.getItem('pending-cv-id');
    
    
    // Create subscription with draftId
    const requestBody = draftId ? { draftId } : {};
    apiRequest("POST", "/api/create-subscription", requestBody)
      .then((res) => res.json())
      .then((data) => {
        if (data.clientSecret) {
          setClientSecret(data.clientSecret);
          
          // Store draftId for use in payment form if provided by server
          if (data.draftId) {
            localStorage.setItem('checkout-draft-id', data.draftId);
          }
        } else if (data.status === 'active') {
          // User already has active subscription - check if they came from CV builder
          const premiumContext = localStorage.getItem('premium-subscription-context');
          if (premiumContext) {
            try {
              const context = JSON.parse(premiumContext);
              if (context.returnTo === 'cv-builder') {
                localStorage.removeItem('premium-subscription-context');
                toast({
                  title: t('premium.toasts.alreadySubscribed'),
                  description: t('premium.toasts.alreadySubscribedDescription'),
                });
                setTimeout(() => window.location.href = "/cv-builder", 1000);
                return;
              }
            } catch (error) {
      
            }
          }
          
          toast({
            title: t('premium.toasts.alreadySubscribed'),
            description: t('premium.toasts.alreadySubscribedDescription'),
          });
          window.location.href = '/dashboard';
        } else {
          throw new Error(data.message || "Failed to create subscription");
        }
      })
      .catch((err) => {
        setError(err.message || "Failed to load checkout");
        toast({
          title: "Error",
          description: "Failed to load checkout. Please try again.",
          variant: "destructive",
        });
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [toast]);

  if (!stripePromise) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full p-8 bg-white rounded-lg shadow-lg text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Configuration Error</h2>
          <p className="text-gray-600">Stripe is not configured. Please contact support.</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" aria-label="Loading"/>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full p-8 bg-white rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <div className="flex gap-3">
            <Link href="/cv-builder" className="flex-1">
              <Button className="w-full" variant="outline">Back to CV Builder</Button>
            </Link>
            <Button onClick={() => window.location.reload()} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white">
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!clientSecret) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full p-8 bg-white rounded-lg shadow-lg">
          <p className="text-gray-600">Unable to load checkout. Please try again.</p>
        </div>
      </div>
    );
  }

  // Make SURE to wrap the form in <Elements> which provides the stripe context.
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-bold mb-6">Complete Your Subscription</h2>
          <Elements stripe={stripePromise} options={{ clientSecret }}>
            <CheckoutForm />
          </Elements>
        </div>
      </div>
    </div>
  );
}
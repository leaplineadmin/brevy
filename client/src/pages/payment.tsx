import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/layout/navbar";
import { Loader2, Check, X } from "lucide-react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { apiRequest } from "@/lib/queryClient";

// Initialize Stripe
if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
  throw new Error('Missing required Stripe key: VITE_STRIPE_PUBLIC_KEY');
}
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

// Payment form using Stripe Elements
function PaymentForm() {
  const stripe = useStripe();
  const elements = useElements();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { toast } = useToast();
  const [_, setLocation] = useLocation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/dashboard`,
        },
      });

      if (error) {
        setErrorMessage(error.message || "An error occurred during payment.");
        toast({
          title: "Payment Failed",
          description: error.message,
          variant: "destructive",
        });
      } else {
        // Payment succeeded, but we won't reach here because of the redirect
        toast({
          title: "Payment Successful",
          description: "Thank you for subscribing!",
        });
        setLocation("/dashboard");
      }
    } catch (error: any) {
      setErrorMessage(error.message || "An unexpected error occurred.");
      toast({
        title: "Payment Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <PaymentElement className="mb-8" />
      
      {errorMessage && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-6 flex items-start">
          <X className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
          <p>{errorMessage}</p>
        </div>
      )}
      
      <Button 
        type="submit" 
        disabled={!stripe || isLoading}
        className="w-full"
      >
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Processing...
          </>
        ) : (
          'Subscribe Now (3.90€/month)'
        )}
      </Button>
    </form>
  );
}

export default function Payment() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [clientSecret, setClientSecret] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [_, setLocation] = useLocation();

  useEffect(() => {
    const getPaymentIntent = async () => {
      try {
        const res = await apiRequest("POST", "/api/get-or-create-subscription");
        const data = await res.json();
        
        setClientSecret(data.clientSecret);
      } catch (error: any) {
        console.error("Error creating subscription:", error);
        setError(error.message || "Failed to set up payment. Please try again.");
        toast({
          title: "Payment Setup Failed",
          description: error.message || "There was a problem setting up the payment.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      getPaymentIntent();
    }
  }, [user, toast]);

  // Redirect if user already has an active subscription
  useEffect(() => {
    if (user?.hasActiveSubscription) {
      toast({
        title: "Already Subscribed",
        description: "You already have an active subscription.",
      });
      setLocation("/dashboard");
    }
  }, [user, setLocation, toast]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-lightGrey">
        <Navbar />
        <div className="container mx-auto px-4 py-16 flex justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-lightGrey">
        <Navbar />
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-lg mx-auto bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-6">
              <X className="h-8 w-8" style={{ color: 'var(--danger)' }} />
            </div>
            <h2 className="font-grotesque text-2xl font-bold text-neutral mb-4">Payment Setup Failed</h2>
            <p className="mb-6 text-neutral/70">{error}</p>
            <Button onClick={() => window.location.reload()}>Try Again</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-lightGrey">
      <Navbar />
      
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
            <div className="md:col-span-3 bg-white rounded-lg shadow-lg p-8">
              <h1 className="font-grotesque text-2xl font-bold text-neutral mb-6">
                Subscribe to CV<span className="text-primary">Builder</span>
              </h1>
              
              {clientSecret ? (
                <Elements stripe={stripePromise} options={{ clientSecret }}>
                  <PaymentForm />
                </Elements>
              ) : (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              )}
            </div>
            
            <div className="md:col-span-2 bg-primary/5 rounded-lg shadow-lg p-8">
              <h2 className="font-grotesque text-xl font-bold text-neutral mb-4">
                Premium Subscription
              </h2>
              
              <div className="mb-6">
                <div className="flex items-baseline mb-2">
                  <span className="text-3xl font-bold text-primary">3.90€</span>
                  <span className="text-neutral/70 ml-1">/month</span>
                </div>
                <p className="text-sm text-neutral/70">
                  Cancel anytime. No long-term commitment.
                </p>
              </div>
              
              <h3 className="font-teachers font-semibold mb-3 text-neutral">
                What you get:
              </h3>
              
              <ul className="space-y-3 mb-6">
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-primary mr-2 mt-0.5" />
                  <span>Unlimited CV creations</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-primary mr-2 mt-0.5" />
                  <span>PDF downloads for A4 format CVs</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-primary mr-2 mt-0.5" />
                  <span>Custom URL for digital format CVs</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-primary mr-2 mt-0.5" />
                  <span>Access to all templates and designs</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-primary mr-2 mt-0.5" />
                  <span>Priority support</span>
                </li>
              </ul>
              
              <div className="bg-white p-4 rounded-md text-sm">
                <p className="font-semibold mb-1">100% Secure Payment</p>
                <p className="text-neutral/70">
                  Your payment information is processed securely. We do not store credit card details.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

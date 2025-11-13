import React, { useState } from "react";
import { useLocation, Link } from "wouter";
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { Button } from "@/components/ui/button";
import { ArrowLeft, Shield, Lock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";

// Initialize Stripe
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY || '');

function CheckoutForm({ clientSecret }: { clientSecret: string }) {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [, setLocation] = useLocation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/dashboard`,
      },
    });

    if (error) {
      toast({
        title: "Payment Failed",
        description: error.message,
        variant: "destructive",
      });
      setIsProcessing(false);
    } else {
      toast({
        title: t('premium.toasts.subscriptionSuccessful'),
        description: t('premium.toasts.subscriptionSuccessfulDescription'),
      });
      setTimeout(() => {
        setLocation("/dashboard");
      }, 2000);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      <Button 
        type="submit" 
        disabled={!stripe || isProcessing}
        className="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700"
      >
        {isProcessing ? t('premium.checkout.processing') : t('premium.checkout.subscribeButton')}
      </Button>
      <div className="flex items-center justify-center gap-4 text-xs text-gray-500">
        <span className="flex items-center gap-1">
          <Lock className="w-3 h-3" />
          Secure payment
        </span>
        <span className="flex items-center gap-1">
          <Shield className="w-3 h-3" />
          SSL encrypted
        </span>
      </div>
    </form>
  );
}

export default function SubscriptionPage() {
  const [clientSecret, setClientSecret] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  // Auto-initialize subscription when page loads
  React.useEffect(() => {
    initializeSubscription();
  }, [user]);

  // Auto-start subscription creation when component loads
  const initializeSubscription = async () => {
    if (!user) {
        toast({
          title: t('premium.toasts.authenticationRequired'),
          description: t('premium.toasts.authenticationRequiredDescription'),
          variant: "destructive",
        });
      setLocation("/auth?mode=signin");
      return;
    }

    setIsLoading(true);

    try {
      const response = await apiRequest("POST", "/api/create-subscription");
      const data = await response.json();
      
      if (data.clientSecret) {
        setClientSecret(data.clientSecret);
      } else {
        throw new Error("Failed to create subscription");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to start subscription process",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <Link href="/cv-builder" className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-4">
            <ArrowLeft className="w-4 h-4" />
            Back to Resume Builder
          </Link>
          <h1 className="text-3xl font-bold mb-4">{t('premium.subscription.title')}</h1>
          <p className="text-gray-600">
            {t('premium.subscription.description')}
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Premium Plan Details */}
          <div className="mb-6 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border border-yellow-200">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-gray-800">{t('premium.subscription.planTitle')}</h3>
              <span className="text-2xl font-bold text-gray-900">{t('premium.subscription.planPrice')}</span>
            </div>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• All 6 professional templates</li>
              <li>• Remove "Created with CVfolio" watermark</li>
              <li>• Advanced color customization</li>
              <li>• Priority support</li>
              <li>• Unlimited PDF downloads</li>
            </ul>
          </div>

          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Setting up your subscription...</p>
            </div>
          ) : clientSecret ? (
            <Elements stripe={stripePromise} options={{ clientSecret }}>
              <CheckoutForm clientSecret={clientSecret} />
            </Elements>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-600">Something went wrong. Please try again.</p>
              <Button
                onClick={initializeSubscription}
                className="mt-4 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white"
              >
                Retry
              </Button>
            </div>
          )}
        </div>

        <div className="mt-6 text-center text-sm text-gray-500">
          <p>Cancel anytime • No hidden fees • Instant access</p>
        </div>
      </div>
    </div>
  );
}
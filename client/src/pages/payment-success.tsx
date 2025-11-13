import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { CheckCircle, Loader2 } from 'lucide-react';

export default function PaymentSuccess() {
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();
  const { t } = useLanguage();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkPaymentStatus = async () => {
      try {
        
        // First, try to activate Premium immediately
        const isProd = typeof window !== 'undefined' && window.location.hostname.endsWith('brevy.me');
        const base = isProd ? 'https://cvfolio.onrender.com' : '';
        
        const response = await fetch(`${base}/api/fallback-premium-activation`, {
          method: 'POST',
          credentials: 'include',
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            // No toaster here to avoid double notifications; the page itself confirms success
            
            // Force refresh user data and wait for it to complete
            const refreshResult = await refreshUser();
            
            // Verify user is authenticated before redirecting
            if (refreshResult.data) {
              // Mark payment flow to prevent immediate auth redirect
              sessionStorage.setItem('post-payment-skip-auth-redirect', String(Date.now()));
              // Redirect to dashboard immediately since user is authenticated
              window.location.href = '/dashboard?from=paid';
            } else {
              // If user is not authenticated, wait a bit and try again
              setTimeout(async () => {
                try {
                  const retryResult = await refreshUser();
                  if (retryResult.data) {
                    sessionStorage.setItem('post-payment-skip-auth-redirect', String(Date.now()));
                    window.location.href = '/dashboard?from=paid';
                  } else {
                    // Still not authenticated, show error but don't redirect to auth yet
                    setIsChecking(false);
                  }
                } catch {}
              }, 2000);
            }
            return;
          }
        }
        
        // If fallback didn't work, wait for webhook and try again
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Try fallback again
        const retryResponse = await fetch(`${base}/api/fallback-premium-activation`, {
          method: 'POST',
          credentials: 'include',
        });

        if (retryResponse.ok) {
          const retryData = await retryResponse.json();
          if (retryData.success) {
            // No toaster; rely on page confirmation
            
            const refreshResult = await refreshUser();
            
            // Verify user is authenticated before redirecting
            if (refreshResult.data) {
              sessionStorage.setItem('post-payment-skip-auth-redirect', String(Date.now()));
              window.location.href = '/dashboard?from=paid';
            } else {
              // If user is not authenticated, wait a bit and try again
              setTimeout(async () => {
                try {
                  const retryResult = await refreshUser();
                  if (retryResult.data) {
                    sessionStorage.setItem('post-payment-skip-auth-redirect', String(Date.now()));
                    window.location.href = '/dashboard?from=paid';
                  } else {
                    setIsChecking(false);
                  }
                } catch {}
              }, 2000);
            }
            return;
          }
        }
        
        // If still not Premium, force-activate as a last safety net
        try {
          const forceResponse = await fetch(`${base}/api/force-activate-premium`, {
            method: 'POST',
            credentials: 'include',
          });
          if (forceResponse.ok) {
            const data = await forceResponse.json();
            if (data.success) {
              const refreshResult = await refreshUser();
              
              // Verify user is authenticated before redirecting
              if (refreshResult.data) {
                sessionStorage.setItem('post-payment-skip-auth-redirect', String(Date.now()));
                window.location.href = '/dashboard?from=paid';
              } else {
                // If user is not authenticated, wait a bit and try again
                setTimeout(async () => {
                  try {
                    const retryResult = await refreshUser();
                    if (retryResult.data) {
                      sessionStorage.setItem('post-payment-skip-auth-redirect', String(Date.now()));
                      window.location.href = '/dashboard?from=paid';
                    } else {
                      setIsChecking(false);
                    }
                  } catch {}
                }, 1500);
              }
              return;
            }
          }
        } catch {}
        
      } catch (error) {
        console.error('❌ [PAYMENT SUCCESS] Error checking payment status:', error);
        // Keep page visible without extra toasts
      } finally {
        setIsChecking(false);
      }
    };

    checkPaymentStatus();
  }, [refreshUser, toast]);


  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full p-8 bg-white rounded-lg shadow-lg text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Processing Payment</h2>
          <p className="text-gray-600">Please wait while we verify your subscription...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full p-8 bg-white rounded-lg shadow-lg text-center">
        <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-800 mb-2">{t('premium.toasts.paymentSuccessful')}</h2>
        <p className="text-gray-600 mb-6">{t('premium.toasts.paymentSuccessfulDescription')}</p>
        <Button 
          onClick={async () => {
            try {
              const refreshResult = await refreshUser();
              if (refreshResult.data) {
                sessionStorage.setItem('post-payment-skip-auth-redirect', String(Date.now()));
                window.location.href = '/dashboard?from=paid';
              } else {
                // If still not authenticated, try one more time
                const retryResult = await refreshUser();
                if (retryResult.data) {
                  sessionStorage.setItem('post-payment-skip-auth-redirect', String(Date.now()));
                  window.location.href = '/dashboard?from=paid';
                } else {
                  toast({
                    title: "Authentication Error",
                    description: "Please try logging in again.",
                    variant: "destructive",
                  });
                }
              }
            } catch (error) {
              toast({
                title: "Error",
                description: "Failed to refresh user data. Please try again.",
                variant: "destructive",
              });
            }
          }}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white"
        >
          Go to Dashboard
        </Button>
      </div>
    </div>
  );
}

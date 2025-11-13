import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useLanguage } from "@/contexts/LanguageContext";
import { X } from "lucide-react";

interface CookiePreferences {
  essential: boolean;
  analytics: boolean;
  advertising: boolean;
}

const CONSENT_STORAGE_KEY = "cookie-consent";
const CONSENT_EXPIRY_DAYS = 180; // 6 months

export function CookieBanner() {
  const { t } = useLanguage();
  const [showBanner, setShowBanner] = useState(false);
  const [showPanel, setShowPanel] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>({
    essential: true,
    analytics: false,
    advertising: false,
  });

  useEffect(() => {
    // Check if consent has been given
    const consentData = localStorage.getItem(CONSENT_STORAGE_KEY);
    if (!consentData) {
      setShowBanner(true);
      return;
    }

    try {
      const parsed = JSON.parse(consentData);
      const expiryDate = new Date(parsed.expiryDate);
      
      // If consent has expired, show banner again
      if (expiryDate < new Date()) {
        setShowBanner(true);
        return;
      }

      // Load saved preferences
      setPreferences(parsed.preferences || {
        essential: true,
        analytics: false,
        advertising: false,
      });

      // Apply cookie preferences
      applyCookiePreferences(parsed.preferences || {
        essential: true,
        analytics: false,
        advertising: false,
      });
    } catch (error) {
      console.error("Error parsing cookie consent:", error);
      setShowBanner(true);
    }
  }, []);

  const applyCookiePreferences = (prefs: CookiePreferences) => {
    // Essential cookies are always enabled
    // This is where you would initialize analytics, advertising scripts, etc.
    // For now, we just store the preferences
    if (prefs.analytics) {
      // Initialize analytics (e.g., Google Analytics)
      // window.gtag?.('consent', 'update', { analytics_storage: 'granted' });
    }
    if (prefs.advertising) {
      // Initialize advertising cookies
      // window.gtag?.('consent', 'update', { ad_storage: 'granted' });
    }
  };

  const saveConsent = (prefs: CookiePreferences) => {
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + CONSENT_EXPIRY_DAYS);

    const consentData = {
      preferences: prefs,
      expiryDate: expiryDate.toISOString(),
      timestamp: new Date().toISOString(),
    };

    localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(consentData));
    applyCookiePreferences(prefs);
    setShowBanner(false);
    setShowPanel(false);
  };

  const handleAcceptAll = () => {
    const allAccepted: CookiePreferences = {
      essential: true,
      analytics: true,
      advertising: true,
    };
    saveConsent(allAccepted);
  };

  const handleRejectAll = () => {
    const onlyEssential: CookiePreferences = {
      essential: true,
      analytics: false,
      advertising: false,
    };
    saveConsent(onlyEssential);
  };

  const handleCustomize = () => {
    setShowPanel(true);
  };

  const handleSavePreferences = () => {
    saveConsent(preferences);
  };

  // Expose function globally for footer link
  useEffect(() => {
    (window as any).openCookiePanel = () => {
      setShowPanel(true);
      setShowBanner(false); // Hide banner if showing panel from footer
    };
    
    return () => {
      delete (window as any).openCookiePanel;
    };
  }, []);

  if (!showBanner && !showPanel) {
    return null;
  }

  return (
    <>
      {/* Cookie Banner */}
      {showBanner && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-lg p-4 md:p-6">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {t("gdpr.cookies.banner.title")}
              </h3>
              <p className="text-sm text-gray-600 mb-2">
                {t("gdpr.cookies.banner.description")}{" "}
                <Link href="/privacy-policy" className="text-blue-600 hover:text-blue-800 underline">
                  {t("gdpr.cookies.banner.privacyPolicyLink")}
                </Link>
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
              <Button
                onClick={handleRejectAll}
                variant="outline"
                className="w-full md:w-auto"
              >
                {t("gdpr.cookies.banner.rejectAll")}
              </Button>
              <Button
                onClick={handleCustomize}
                variant="outline"
                className="w-full md:w-auto"
              >
                {t("gdpr.cookies.banner.customize")}
              </Button>
              <Button
                onClick={handleAcceptAll}
                className="w-full md:w-auto bg-blue-600 hover:bg-blue-700"
              >
                {t("gdpr.cookies.banner.acceptAll")}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Cookie Preferences Panel */}
      <Dialog open={showPanel} onOpenChange={setShowPanel}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t("gdpr.cookies.panel.title")}</DialogTitle>
            <DialogDescription>
              {t("gdpr.cookies.panel.description")}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Essential Cookies */}
            <div className="space-y-2">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Label className="text-base font-semibold">
                    {t("gdpr.cookies.panel.essential.title")}
                  </Label>
                  <span className="text-sm text-blue-600 font-medium">
                    {t("gdpr.cookies.panel.essential.alwaysActive")}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  {t("gdpr.cookies.panel.essential.description")}
                </p>
              </div>
              <Checkbox checked={true} disabled className="mt-2" />
            </div>

            {/* Analytics Cookies */}
            <div className="space-y-2">
              <div>
                <Label className="text-base font-semibold">
                  {t("gdpr.cookies.panel.analytics.title")}
                </Label>
                <p className="text-sm text-gray-600 mt-1">
                  {t("gdpr.cookies.panel.analytics.description")}
                </p>
              </div>
              <div className="flex items-center space-x-2 mt-2">
                <Checkbox
                  id="analytics"
                  checked={preferences.analytics}
                  onCheckedChange={(checked) =>
                    setPreferences({ ...preferences, analytics: !!checked })
                  }
                />
                <Label htmlFor="analytics" className="text-sm">
                  {t("gdpr.cookies.panel.analytics.title")}
                </Label>
              </div>
            </div>

            {/* Advertising Cookies */}
            <div className="space-y-2">
              <div>
                <Label className="text-base font-semibold">
                  {t("gdpr.cookies.panel.advertising.title")}
                </Label>
                <p className="text-sm text-gray-600 mt-1">
                  {t("gdpr.cookies.panel.advertising.description")}
                </p>
              </div>
              <div className="flex items-center space-x-2 mt-2">
                <Checkbox
                  id="advertising"
                  checked={preferences.advertising}
                  onCheckedChange={(checked) =>
                    setPreferences({ ...preferences, advertising: !!checked })
                  }
                />
                <Label htmlFor="advertising" className="text-sm">
                  {t("gdpr.cookies.panel.advertising.title")}
                </Label>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={() => setShowPanel(false)}>
              {t("gdpr.cookies.panel.cancel")}
            </Button>
            <Button onClick={handleSavePreferences}>
              {t("gdpr.cookies.panel.save")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

// Export function to open cookie panel from footer
export const openCookiePanel = () => {
  if ((window as any).openCookiePanel) {
    (window as any).openCookiePanel();
  }
};


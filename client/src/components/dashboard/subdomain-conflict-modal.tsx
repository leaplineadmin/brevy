import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useLanguage } from '@/contexts/LanguageContext';
import { AlertCircle, CheckCircle, XCircle } from 'lucide-react';

interface SubdomainConflictModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (customSubdomain: string) => void;
  suggestedSubdomain: string;
  baseSubdomain: string;
  cvId: string;
}

export function SubdomainConflictModal({
  isOpen,
  onClose,
  onConfirm,
  suggestedSubdomain,
  baseSubdomain,
  cvId
}: SubdomainConflictModalProps) {
  const { t } = useLanguage();
  const [customSubdomain, setCustomSubdomain] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [error, setError] = useState('');

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setCustomSubdomain(suggestedSubdomain);
      setIsAvailable(null);
      setError('');
    }
  }, [isOpen, suggestedSubdomain]);

  const checkAvailability = async (subdomain: string) => {
    if (!subdomain || subdomain === baseSubdomain) {
      setIsAvailable(null);
      return;
    }

    setIsChecking(true);
    setError('');

    try {
      const isProd = typeof window !== 'undefined' && window.location.hostname.endsWith('brevy.me');
      const base = isProd ? 'https://cvfolio.onrender.com' : '';
      
      const response = await fetch(`${base}/api/check-subdomain`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ subdomain }),
      });

      const data = await response.json();
      
      if (response.ok) {
        setIsAvailable(data.available);
        if (!data.available) {
          setError(t('dashboard.subdomainConflict.notAvailable'));
        }
      } else {
        setError(data.message || t('dashboard.subdomainConflict.checkError'));
        setIsAvailable(false);
      }
    } catch (error) {
      setError(t('dashboard.subdomainConflict.checkError'));
      setIsAvailable(false);
    } finally {
      setIsChecking(false);
    }
  };

  const handleSubdomainChange = (value: string) => {
    // Clean the input (remove spaces, special chars, convert to lowercase)
    const cleaned = value
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '')
      .replace(/--+/g, '-')
      .replace(/^-|-$/g, '');
    
    setCustomSubdomain(cleaned);
    
    // Debounce the availability check
    const timeoutId = setTimeout(() => {
      if (cleaned && cleaned !== baseSubdomain) {
        checkAvailability(cleaned);
      } else {
        setIsAvailable(null);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  };

  const handleConfirm = () => {
    if (customSubdomain && isAvailable) {
      onConfirm(customSubdomain);
    }
  };

  const handleUseSuggested = () => {
    onConfirm(suggestedSubdomain);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-orange-500" />
            {t('dashboard.subdomainConflict.title')}
          </DialogTitle>
          <DialogDescription>
            {t('dashboard.subdomainConflict.description')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Suggested subdomain */}
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-900">
                  {t('dashboard.subdomainConflict.suggested')}
                </p>
                <p className="text-sm text-blue-700">
                  {suggestedSubdomain}.brevy.me
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleUseSuggested}
                className="text-blue-600 border-blue-300 hover:bg-blue-100"
              >
                {t('dashboard.subdomainConflict.useSuggested')}
              </Button>
            </div>
          </div>

          {/* Custom subdomain input */}
          <div className="space-y-2">
            <Label htmlFor="customSubdomain">
              {t('dashboard.subdomainConflict.customLabel')}
            </Label>
            <div className="flex items-center gap-2">
              <Input
                id="customSubdomain"
                value={customSubdomain}
                onChange={(e) => handleSubdomainChange(e.target.value)}
                placeholder={t('dashboard.subdomainConflict.placeholder')}
                className="flex-1"
              />
              <div className="w-6 h-6 flex items-center justify-center">
                {isChecking && (
                  <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
                )}
                {!isChecking && isAvailable === true && (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                )}
                {!isChecking && isAvailable === false && (
                  <XCircle className="w-4 h-4 text-red-500" />
                )}
              </div>
            </div>
            
            {/* Status messages */}
            {isAvailable === true && (
              <p className="text-sm text-green-600 flex items-center gap-1">
                <CheckCircle className="w-3 h-3" />
                {t('dashboard.subdomainConflict.available')}
              </p>
            )}
            {isAvailable === false && (
              <p className="text-sm text-red-600 flex items-center gap-1">
                <XCircle className="w-3 h-3" />
                {error || t('dashboard.subdomainConflict.notAvailable')}
              </p>
            )}
            
            <p className="text-xs text-gray-500">
              {t('dashboard.subdomainConflict.rules')}
            </p>
          </div>
        </div>

        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={onClose}>
            {t('dashboard.subdomainConflict.cancel')}
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!customSubdomain || !isAvailable || isChecking}
          >
            {t('dashboard.subdomainConflict.confirm')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

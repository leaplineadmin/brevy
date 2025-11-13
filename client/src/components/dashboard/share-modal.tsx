import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Check, Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  cvId: string;
  defaultSubdomain?: string;
}

export function ShareModal({ isOpen, onClose, cvId, defaultSubdomain = "" }: ShareModalProps) {
  const [subdomain, setSubdomain] = useState(defaultSubdomain);
  const [isValidating, setIsValidating] = useState(false);
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [validationError, setValidationError] = useState("");
  const { toast } = useToast();

  // Valider le format du sous-domaine
  const validateSubdomain = (value: string) => {
    if (!value) return "Le sous-domaine ne peut pas être vide";
    if (value.length < 3) return "Le sous-domaine doit contenir au moins 3 caractères";
    if (value.length > 30) return "Le sous-domaine doit contenir moins de 30 caractères";
    return null;
  };

  // Vérifier la disponibilité du sous-domaine
  const checkAvailability = async (value: string) => {
    const error = validateSubdomain(value);
    if (error) {
      setValidationError(error);
      setIsAvailable(false);
      return;
    }

    setIsValidating(true);
    setValidationError("");
    
    try {
      const isProd = typeof window !== 'undefined' && window.location.hostname.endsWith('cvfolio.app');
      const base = isProd ? 'https://cvfolio.onrender.com' : '';
      const response = await fetch(`${base}/api/check-subdomain`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ subdomain: value }),
      });

      const data = await response.json();
      
      if (response.ok) {
        setIsAvailable(data.available);
        if (!data.available) {
          setValidationError(data.message);
        }
        // Update subdomain if it was cleaned
        if (data.cleanedSubdomain && data.cleanedSubdomain !== value) {
          setSubdomain(data.cleanedSubdomain);
        }
      } else {
        setValidationError(data.message || "Erreur lors de la vérification");
        setIsAvailable(false);
      }
    } catch (error) {
      setValidationError("Erreur lors de la vérification");
      setIsAvailable(false);
    } finally {
      setIsValidating(false);
    }
  };

  // Debounce la validation
  useEffect(() => {
    if (!subdomain) {
      setIsAvailable(null);
      setValidationError("");
      return;
    }

    const timer = setTimeout(() => {
      checkAvailability(subdomain);
    }, 500);

    return () => clearTimeout(timer);
  }, [subdomain]);

  // Définir le sous-domaine et copier le lien
  const handleShare = async () => {
    if (!isAvailable || !subdomain) return;
    
    try {
      const isProd = typeof window !== 'undefined' && window.location.hostname.endsWith('cvfolio.app');
      const base = isProd ? 'https://cvfolio.onrender.com' : '';
      const response = await fetch(`${base}/api/set-subdomain`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ cvId, subdomain }),
      });

      const data = await response.json();
      
      if (response.ok) {
        const url = data.shareUrl || `https://${subdomain}.cvfolio.app`;
        
        await navigator.clipboard.writeText(url);
        toast({
          title: "Lien créé et copié !",
          description: "Le lien de partage a été configuré et copié dans le presse-papiers",
        });
        
        onClose();
      } else {
        if (response.status === 400 && data.existingCVTitle) {
          toast({
            title: "Limite atteinte",
            description: data.message,
            variant: "destructive",
          });
        } else {
          toast({
            title: "Erreur",
            description: data.message || "Impossible de créer le lien de partage",
            variant: "destructive", 
          });
        }
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de créer le lien de partage",
        variant: "destructive",
      });
    }
  };

  const handleSubdomainChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSubdomain(value);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">Lien de partage</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* URL Input */}
          <div className="space-y-2">
            <div className="flex items-center border border-gray-300 rounded-md focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500">
              <Input
                value={subdomain}
                onChange={handleSubdomainChange}
                placeholder="jeandupont"
                className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 rounded-r-none"
              />
              <div className="px-3 py-2 bg-gray-50 border-l text-sm text-gray-600 rounded-r-md">
                .cvfolio.app
              </div>
            </div>
            
            {/* Validation Status */}
            <div className="flex items-center space-x-2 text-sm">
              {isValidating ? (
                <div className="flex items-center space-x-1 text-gray-500">
                  <div className="w-3 h-3 border border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                  <span>Vérification...</span>
                </div>
              ) : validationError ? (
                <div className="flex items-center space-x-1 text-red-500">
                  <span>⚠</span>
                  <span>{validationError}</span>
                </div>
              ) : isAvailable === true ? (
                <div className="flex items-center space-x-1 text-green-600">
                  <Check className="w-3 h-3" />
                  <span>Cette url est disponible</span>
                </div>
              ) : null}
            </div>
          </div>

          {/* Share Button */}
          <Button
            onClick={handleShare}
            disabled={!isAvailable || isValidating}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center space-x-2"
          >
            <Copy className="w-4 h-4" />
            <span>Créer et copier le lien</span>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
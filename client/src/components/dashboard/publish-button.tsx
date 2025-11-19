import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Globe, Copy, Power, ExternalLink, ChevronDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { SubdomainConflictModal } from './subdomain-conflict-modal';

interface PublishButtonProps {
  cvId: string;
  isPublished?: boolean;
  subdomain?: string;
  publishedLanguage?: string;
  isLocked?: boolean;
  onPublishChange?: (published: boolean, subdomain?: string, language?: string) => void;
}

export function PublishButton({ 
  cvId, 
  isPublished = false, 
  subdomain = "", 
  publishedLanguage = "en",
  isLocked = false,
  onPublishChange 
}: PublishButtonProps) {
  const [loading, setLoading] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState(publishedLanguage);
  const [showConflictModal, setShowConflictModal] = useState(false);
  const [conflictData, setConflictData] = useState<{
    suggestedSubdomain: string;
    baseSubdomain: string;
  } | null>(null);
  const { toast } = useToast();
  const { t, language } = useLanguage();

  const handlePublish = async () => {
    if (isLocked) return;
    setLoading(true);
    
    try {
      const isProd = typeof window !== 'undefined' && window.location.hostname.endsWith('brevy.me');
      const base = isProd ? 'https://cvfolio.onrender.com' : '';
      const response = await fetch(`${base}/api/publish-cv`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ cvId, language: selectedLanguage }),
      });

      const data = await response.json();
      
      if (response.ok) {
        toast({
          title: "Resume published!",
          description: data.message,
        });
        
        onPublishChange?.(true, data.subdomain);
      } else if (response.status === 409 && data.conflict) {
        // Handle subdomain conflict
        setConflictData({
          suggestedSubdomain: data.suggestedSubdomain,
          baseSubdomain: data.baseSubdomain
        });
        setShowConflictModal(true);
      } else {
        toast({
          title: "Error",
          description: data.message || "Unable to publish resume",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Unable to publish resume",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleConflictConfirm = async (customSubdomain: string) => {
    setLoading(true);
    setShowConflictModal(false);
    
    try {
      const isProd = typeof window !== 'undefined' && window.location.hostname.endsWith('brevy.me');
      const base = isProd ? 'https://cvfolio.onrender.com' : '';
      
      // Publish with custom subdomain
      const response = await fetch(`${base}/api/publish-cv-custom`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ 
          cvId, 
          language: selectedLanguage,
          subdomain: customSubdomain 
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        toast({
          title: "Resume published!",
          description: data.message,
        });
        
        onPublishChange?.(true, data.subdomain);
      } else {
        toast({
          title: "Error",
          description: data.message || "Unable to publish resume",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Unable to publish resume",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleConflictClose = () => {
    setShowConflictModal(false);
    setConflictData(null);
  };

  const handleUnpublish = async () => {
    if (isLocked) return;
    setLoading(true);
    
    try {
      const isProd = typeof window !== 'undefined' && window.location.hostname.endsWith('brevy.me');
      const base = isProd ? 'https://cvfolio.onrender.com' : '';
      const response = await fetch(`${base}/api/unpublish-cv`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ cvId }),
      });

      const data = await response.json();
      
      if (response.ok) {
        toast({
          title: "Resume unpublished",
          description: data.message,
        });
        
        onPublishChange?.(false);
      } else {
        toast({
          title: "Error",
          description: data.message || "Unable to unpublish resume",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Unable to unpublish resume",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const copyUrl = async () => {
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const baseUrl = isLocalhost ? 'http://localhost:10000' : 'https://brevy.me';
    const url = `${baseUrl}/cv/${subdomain}`;
    
    try {
      await navigator.clipboard.writeText(url);
      toast({
        title: "Link copied!",
        description: "URL has been copied to clipboard",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Unable to copy URL",
        variant: "destructive",
      });
    }
  };

  const openCV = () => {
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const url = isLocalhost 
      ? `/dev/${subdomain}`
      : `/cv/${subdomain}`;
    
    window.open(url, '_blank');
  };

  const handleLanguageChange = async (newLanguage: string) => {
    setSelectedLanguage(newLanguage);
    
    try {
      const isProd = typeof window !== 'undefined' && window.location.hostname.endsWith('brevy.me');
      const base = isProd ? 'https://cvfolio.onrender.com' : '';
      const response = await fetch(`${base}/api/update-cv-language`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ cvId, language: newLanguage }),
      });

      if (response.ok) {
        onPublishChange?.(true, subdomain, newLanguage);
        toast({
          title: "Language updated",
          description: "CV language has been updated",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Unable to update language",
        variant: "destructive",
      });
    }
  };

  if (isPublished && subdomain) {
    return (
      <div className="w-full p-3 bg-green-50 border border-green-200 rounded-lg overflow-hidden">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0"></div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-green-800">{t('dashboard.publishedAt')}</p>
              <Select value={selectedLanguage} onValueChange={handleLanguageChange}>
                <SelectTrigger className="w-auto h-6 text-xs border-gray-300 px-2 py-1 gap-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">ENG</SelectItem>
                  <SelectItem value="fr">FR</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        
        <div className="flex gap-1 mb-2 bg-white border border-green-300 rounded-lg p-1">
          <Input 
            value={`brevy.me/cv/${subdomain}`}
            readOnly
            className="text-xs h-8 bg-transparent border-0 flex-1"
          />
          <Button
            size="sm"
            variant="outline"
            onClick={openCV}
            className="h-8 text-xs px-2"
            data-testid={`button-view-${cvId}`}
          >
            <ExternalLink className="w-3 h-3 mr-1" />
            <span>{t('dashboard.viewOnlinePage')}</span>
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={copyUrl}
            className="h-8 text-xs px-2"
            data-testid={`button-copy-${cvId}`}
          >
            <Copy className="w-3 h-3 mr-1" />
            <span>{t('dashboard.copyUrl')}</span>
          </Button>
        </div>
        
        <Button
          size="sm"
          variant="outline"
          onClick={handleUnpublish}
          disabled={loading || isLocked}
          className={`w-full h-8 text-xs px-2 ${isLocked ? 'opacity-50 cursor-not-allowed' : ''}`}
          style={{ color: isLocked ? 'var(--muted)' : 'var(--danger)' }}
          data-testid={isLocked ? `button-unpublish-locked-${cvId}` : `button-unpublish-${cvId}`}
          title={isLocked ? 'Premium subscription required' : ''}
        >
          <Power className="w-3 h-3 mr-2 flex-shrink-0" />
          <span>{isLocked ? 'Publish available with Premium' : t('dashboard.unpublish')}</span>
        </Button>
      </div>
    );
  }

  return (
    <>
      <Button
        onClick={handlePublish}
        disabled={loading || isLocked}
        variant="secondary"
        className={`w-full flex items-center justify-start ${isLocked ? 'opacity-50 cursor-not-allowed' : ''}`}
        data-testid={isLocked ? `button-publish-locked-${cvId}` : `button-publish-${cvId}`}
        title={isLocked ? 'Premium subscription required' : ''}
      >
        <Globe className="w-4 h-4 mr-2 flex-shrink-0" />
        <span>{isLocked ? 'Publish available with Premium' : (loading ? "Publishing..." : t('dashboard.publish'))}</span>
      </Button>

      {/* Subdomain Conflict Modal */}
      {conflictData && (
        <SubdomainConflictModal
          isOpen={showConflictModal}
          onClose={handleConflictClose}
          onConfirm={handleConflictConfirm}
          suggestedSubdomain={conflictData.suggestedSubdomain}
          baseSubdomain={conflictData.baseSubdomain}
          cvId={cvId}
        />
      )}
    </>
  );
}
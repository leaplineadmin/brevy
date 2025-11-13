import { useCVData } from "@/hooks/use-cv-data";
import { getTemplateById } from "@/lib/cv-templates";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { generatePDF } from "@/lib/cv-helpers";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

interface ZoomPreviewProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ZoomPreview({ isOpen, onClose }: ZoomPreviewProps) {
  const { cvData, templateId, mainColor, title, templateType } = useCVData();
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();
  
  const TemplateComponent = getTemplateById(templateId);
  
  const handleCloseClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };
  
  const handleDownload = async () => {
    // Check if user is authenticated
    if (!isAuthenticated) {
      toast({
        title: "Authentication Required",
        description: "Sign in or create an account to download the PDF file",
        variant: "destructive",
      });
      return;
    }
    
    try {
      // Show a coming soon message instead of actual download
      toast({
        title: "Coming Soon",
        description: "PDF download will be available soon!",
      });
    } catch (error) {
      toast({
        title: "Download Failed",
        description: "There was a problem generating your PDF.",
        variant: "destructive",
      });
    }
  };
  
  const handleShareCV = () => {
    // Show a coming soon message for sharing functionality
    toast({
      title: "Coming Soon",
      description: "Digital CV sharing will be available soon.",
    });
  };
  
  if (!isOpen) return null;
  
  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50"
      onClick={handleCloseClick}
    >
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-auto">
        <div className="flex justify-between items-center p-4 border-b border-lightGrey">
          <h3 className="font-grotesque text-xl font-bold text-neutral">CV Preview</h3>
          <Button
            variant="ghost"
            size="sm"
            className="text-neutral hover:text-primary"
            onClick={onClose}
          >
            <X className="h-6 w-6" />
          </Button>
        </div>
        
        <div className="p-4 flex flex-col items-center">
          <div className="w-[595px]" id="zoom-cv-content">
            <div className="a4-page shadow-lg">
              <TemplateComponent data={cvData} mainColor={mainColor} />
            </div>
          </div>
          
          <div className="mt-6 flex justify-center gap-4">
            {templateType === 'A4' ? (
              <Button 
                variant="default" 
                className="bg-primary text-white" 
                onClick={handleDownload}
              >
                Download PDF
              </Button>
            ) : (
              <Button 
                variant="default" 
                className="bg-primary text-white" 
                onClick={handleShareCV}
              >
                Share Digital CV
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

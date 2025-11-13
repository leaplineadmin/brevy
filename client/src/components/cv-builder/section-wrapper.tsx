import { useState } from "react";
import { Plus, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";

interface SectionWrapperProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  isOptional?: boolean;
  exists?: boolean;
  onAdd?: () => void;
  className?: string;
}

export function SectionWrapper({ 
  title, 
  icon, 
  children, 
  isOptional = false,
  exists = true,
  onAdd,
  className = ""
}: SectionWrapperProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const { t } = useLanguage();

  // Si c'est une section optionnelle qui n'existe pas encore
  if (isOptional && !exists && onAdd) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="flex items-center justify-between">
          <h3 className="text-base font-medium text-gray-900 flex items-center gap-2">
            {icon}
            {title}
          </h3>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={onAdd}
          className="w-full text-gray-600 border-gray-200 hover:bg-gray-50"
        >
          <Plus className="h-4 w-4 mr-2" />
          {t('cvBuilder.sections.addSection', { title })}
        </Button>
      </div>
    );
  }

  // Section normale avec contenu
  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex justify-between items-center mb-4">
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2"
        >
          <h3 className="subheading-small text-neutral">
            {title}
          </h3>
        </button>
        <button 
          className="p-2 rounded-full bg-brand-primaryLight text-brand-primary hover:bg-brand-primaryLightHover"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? (
            <ChevronUp className="h-5 w-5" />
          ) : (
            <ChevronDown className="h-5 w-5" />
          )}
        </button>
      </div>
      
      {isExpanded && children}
    </div>
  );
}
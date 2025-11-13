import { Label } from "@/components/ui/label";
import { useCVData } from "@/hooks/use-cv-data";
import { useLanguage } from "@/contexts/LanguageContext";
import { useState, useEffect } from "react";
import { RichTextEditor } from "@/components/ui/rich-text-editor";

export default function Summary() {
  const { t } = useLanguage();
  const { cvData, updateCvData } = useCVData();
  const [charCount, setCharCount] = useState(0);
  const maxChars = 350;
  
  useEffect(() => {
    // Initialisation du compteur de caractères - strip HTML tags
    const textContent = (cvData.summary || '').replace(/<[^>]*>/g, '');
    setCharCount(textContent.length);
  }, [cvData.summary]);
  
  const handleSummaryChange = (value: string) => {
    // Strip HTML tags for character count
    const textContent = value.replace(/<[^>]*>/g, '');
    
    // Always update the character count to show current length
    setCharCount(textContent.length);
    
    // Only save to CV data if within limit
    if (textContent.length <= maxChars) {
      updateCvData('summary', value);
    }
  };
  
  return (
    <div>
      <div className="space-y-2">
        <Label htmlFor="summary" className="block font-teachers text-sm font-medium text-neutral mb-1">
          {t('cvBuilder.personalInfo.summary')}
        </Label>
        <RichTextEditor
          id="summary"
          placeholder={t('cvBuilder.personalInfo.placeholders.summary')}
          className="font-teachers"
          value={cvData.summary || ''}
          onChange={handleSummaryChange}
        />
        <div className={`text-xs text-right ${charCount > maxChars ? 'text-red-500 font-medium' : 'text-gray-500'}`}>
          {charCount}/{maxChars} max.
        </div>
      </div>
    </div>
  );
}

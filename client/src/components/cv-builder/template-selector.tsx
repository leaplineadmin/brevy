import React from "react";
import { TemplateCard, TemplateCardList, TemplateItem } from "./template-card";
import { Layout } from "lucide-react";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { useLanguage } from "@/contexts/LanguageContext";

// Import thumbnails
import template1Thumb from "@/assets/template1-thumb.png";
import template2Thumb from "@/assets/template2-thumb.png";
import template3Thumb from "@/assets/template3-thumb.png";
import template4Thumb from "@/assets/template4-thumb.png";
import template5Thumb from "@/assets/template5-thumb.png";
import template6Thumb from "@/assets/template6-thumb.png";
import templateSocialThumb from "@/assets/template1-thumb.png"; // Placeholder temporaire

// Templates data - centralisé pour être réutilisé partout
export const templates: TemplateItem[] = [
  {
    id: "template-classic",
    name: "Classic",
    description: "",
    thumbnail: template1Thumb,
    isPremium: false,
  },
  {
    id: "template-boxes",
    name: "Boxes",
    description: "",
    thumbnail: template2Thumb,
    isPremium: true,
  },
  {
    id: "template-technical",
    name: "Technical",
    description: "",
    thumbnail: template3Thumb,
    isPremium: true,
  },
  {
    id: "template-bento",
    name: "Bento",
    description: "",
    thumbnail: template4Thumb,
    isPremium: false,
  },
  {
    id: "template-landing",
    name: "Landing",
    description: "",
    thumbnail: template6Thumb,
    isPremium: true,
  },
  {
    id: "template-datalover",
    name: "Datalover",
    description: "",
    thumbnail: template5Thumb,
    isPremium: true,
  },
  {
    id: "template-social",
    name: "Social",
    description: "",
    thumbnail: templateSocialThumb,
    isPremium: false,
  },
];

interface TemplateSelectorProps {
  selectedTemplate: string;
  onTemplateSelect: (templateId: string) => void;
  displayMode?: "drawer" | "sidebar";
}

// Composant de sélection de template unifié
export function TemplateSelector({
  selectedTemplate,
  onTemplateSelect,
  displayMode = "sidebar",
}: TemplateSelectorProps) {
  const { t } = useLanguage();
  // Pour le mode Drawer
  const [open, setOpen] = React.useState(false);

  const handleTemplateSelect = (templateId: string) => {
    onTemplateSelect(templateId);
    if (displayMode === "drawer") {
      setOpen(false); // Fermer le drawer après la sélection
    }
  };

  // Contenu commun des templates
  const templateListContent = (
    <TemplateCardList
      templates={templates}
      selectedTemplate={selectedTemplate}
      onTemplateSelect={handleTemplateSelect}
    />
  );

  // Rendu conditionnel selon le mode
  if (displayMode === "drawer") {
    return (
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerTrigger asChild>
          <button className="flex items-center px-3 h-10 text-sm font-medium rounded-md border border-gray-200 bg-white hover:bg-gray-50">
            <Layout className="w-4 h-4 mr-2" />
            {t('cvBuilder.templateSelector.title')}
          </button>
        </DrawerTrigger>
        <DrawerContent className="bg-white flex flex-col h-full">
          <DrawerHeader className="px-4 py-4 border-b flex-shrink-0">
            <DrawerTitle>{t('cvBuilder.templateSelector.drawerTitle')}</DrawerTitle>
            <DrawerDescription>
              {t('cvBuilder.templateSelector.drawerDescription')}
            </DrawerDescription>
          </DrawerHeader>

          <div className="flex-1 overflow-y-auto px-4 py-4">{templateListContent}</div>
        </DrawerContent>
      </Drawer>
    );
  }

  // Mode sidebar (défaut)
  return (
    <div>
      <h3 className="text-lg font-medium mb-2">{t('cvBuilder.templateSelector.title')}</h3>
      <p className="text-sm text-gray-500 mb-4">
        {t('cvBuilder.templateSelector.description')}
      </p>
      {templateListContent}
    </div>
  );
}

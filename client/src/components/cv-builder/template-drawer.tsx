import React from 'react';
import { Layout } from 'lucide-react';
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { TemplateCardList, TemplateItem } from './template-card';

interface TemplateDrawerProps {
  selectedTemplate: string;
  onTemplateSelect: (templateId: string) => void;
}

// Template data - exactement les mêmes que dans template-selector.tsx
const templates: TemplateItem[] = [
  {
    id: 'template-classic',
    name: 'Classic',
    description: 'Design épuré et professionnel, parfait pour tous les secteurs',
    isPremium: false,
  },
  {
    id: 'template-boxes',
    name: 'Boxes',
    description: 'Style simple et élégant pour mettre en avant vos compétences',
    isPremium: true,
  },
  {
    id: 'template-technical',
    name: 'Technical',
    description: 'Design marquant pour se démarquer de la concurrence',
    isPremium: true,
  },
  {
    id: 'template-bento',
    name: 'Bento',
    description: 'Pour les profils créatifs et innovants',
    isPremium: false,
  },
  {
    id: 'template-datalover',
    name: 'Datalover',
    description: 'Template moderne avec visualisation de données',
    isPremium: true,
  },
  {
    id: 'template-landing',
    name: 'Landing',
    description: 'Template avec en-tête visuel impactant',
    isPremium: true,
  },
  {
    id: 'template-social',
    name: 'Social',
    description: 'Design moderne et coloré',
    isPremium: false,
  },
];

export function TemplateDrawer({ selectedTemplate, onTemplateSelect }: TemplateDrawerProps) {
  const [open, setOpen] = React.useState(false);

  const handleTemplateSelect = (templateId: string) => {
    onTemplateSelect(templateId);
    setOpen(false); // Close drawer after selection
  };

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <button className="flex items-center px-3 h-10 text-sm font-medium rounded-md border border-gray-200 bg-white hover:bg-gray-50">
          <Layout className="w-4 h-4 mr-2" />
          Modèles de CV
        </button>
      </DrawerTrigger>
      <DrawerContent className="bg-white p-4">
        <DrawerHeader className="px-0">
          <DrawerTitle>Choisissez un modèle</DrawerTitle>
          <DrawerDescription>
            Sélectionnez le modèle qui convient le mieux à votre profil
          </DrawerDescription>
        </DrawerHeader>
        
        <div className="mt-4">
          <TemplateCardList 
            templates={templates}
            selectedTemplate={selectedTemplate}
            onTemplateSelect={handleTemplateSelect}
          />
        </div>
      </DrawerContent>
    </Drawer>
  );
}
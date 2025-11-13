import React from "react";
import { useAuth } from "@/hooks/useAuth";
import { Check, Crown } from "lucide-react";

export interface TemplateItem {
  id: string;
  name: string;
  description: string;
  thumbnail?: string;
  isPremium?: boolean;
}

interface TemplateCardProps {
  template: TemplateItem;
  isSelected: boolean;
  onSelect: (templateId: string) => void;
}

export function TemplateCard({
  template,
  isSelected,
  onSelect,
}: TemplateCardProps) {
  const { user } = useAuth();
  return (
    <div
      className={`relative cursor-pointer border rounded-md overflow-hidden transition-all ${
        isSelected
          ? "border-brand-primary ring-1 ring-brand-primary"
          : "border-gray-200 hover:border-gray-300"
      }`}
      onClick={() => onSelect(template.id)}
    >
      <div className="flex">
        {/* Vignette du template */}
        <div
          className="h-24 w-24 flex-shrink-0 border-r border-lightGrey overflow-hidden"
          style={{ backgroundColor: "var(--lightGrey)" }}
        >
          {template.thumbnail ? (
            <img 
              src={template.thumbnail} 
              alt={`Aperçu ${template.name}`}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-500">
              <span>Aperçu</span>
            </div>
          )}
        </div>

        {/* Informations du template */}
        <div className="p-3 flex-1 content-center">
          <h5 className="font-medium">{template.name}</h5>
          {!user?.hasActiveSubscription && (
            <div className="mt-2">
              {template.isPremium ? (
                <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full bg-gradient-to-r from-yellow-100 to-orange-100 text-yellow-700 border border-yellow-300">
                  <Crown className="w-3 h-3" />
                  Premium
                </span>
              ) : (
                <span className="inline-flex items-center text-xs font-semibold px-2 py-1 rounded-full bg-blue-50 text-blue-600 border border-blue-200">
                  Free
                </span>
              )}
            </div>
          )}
        </div>

        {/* Indicateur de sélection - position absolue */}
        {isSelected && (
          <div className="absolute top-1 right-1">
            <div className="rounded-xl flex-shrink-0 w-5 h-5 flex items-center justify-center bg-brand-primary text-white">
              <Check className="w-4 h-4" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function TemplateCardList({
  templates,
  selectedTemplate,
  onTemplateSelect,
}: {
  templates: TemplateItem[];
  selectedTemplate: string;
  onTemplateSelect: (templateId: string) => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      {templates.map((template) => (
        <TemplateCard
          key={template.id}
          template={template}
          isSelected={selectedTemplate === template.id}
          onSelect={onTemplateSelect}
        />
      ))}
    </div>
  );
}

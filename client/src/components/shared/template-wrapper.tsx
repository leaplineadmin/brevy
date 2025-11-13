import React, { Suspense, useEffect } from 'react';
import { LoadingSpinner } from './loading-spinner';

interface TemplateWrapperProps {
  templateId: string;
  children: React.ReactNode;
}

export const TemplateWrapper: React.FC<TemplateWrapperProps> = ({ templateId, children }) => {
  // Preload other templates in background when CV builder loads
  useEffect(() => {
    if (templateId === 'template-classic') {
      // Preload other templates in background
      const preloadTemplates = async () => {
        const templates = [
          'template-boxes',
          'template-technical', 
          'template-bento',
          'template-datalover',
          'template-landing',
          'template-social'
        ];
        
        // Load templates with low priority
        templates.forEach(template => {
          const templateName = template.split('-')[1];
          import(`@/lib/cv-templates/template-${templateName}.tsx`).catch(() => {
            // Ignore errors, just preload
          });
        });
      };
      
      // Delay preloading to not interfere with initial render
      setTimeout(preloadTemplates, 1000);
    }
  }, [templateId]);

  // If it's Classic template, render directly (no Suspense needed)
  if (templateId === 'template-classic') {
    return <>{children}</>;
  }

  // For other templates, use Suspense
  return (
    <Suspense fallback={<LoadingSpinner size="sm" text="Loading template..." className="min-h-[200px]" />}>
      {children}
    </Suspense>
  );
};

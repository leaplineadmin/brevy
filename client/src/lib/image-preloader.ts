// Advanced image preloader with cache validation
import placeholderClassic from "@/assets/placeholer-templateClassic.webp";
import placeholderBoxes from "@/assets/placeholer-templateBoxes.webp";
import placeholderTechnical from "@/assets/placeholer-templateTechnical.webp";
import placeholderBento from "@/assets/placeholer-templateBento.webp";
import placeholderDatalover from "@/assets/placeholer-templateDatalover.webp";
import placeholderLanding from "@/assets/placeholer-templateLanding.webp";

// Background images for templates
import headerBackground from "@/assets/imgHeader-cvfolio.webp";
import templateLandingBackground from "@/assets/templatelandingbackgroundLanding.webp";
import templateSocialBackground from "@/assets/templatebackgroundSocial.webp";

export const placeholderImages = {
  "template-classic": placeholderClassic,
  "template-boxes": placeholderBoxes,
  "template-technical": placeholderTechnical,
  "template-bento": placeholderBento,
  "template-datalover": placeholderDatalover,
  "template-landing": placeholderLanding,
  // Keep numbered references for backward compatibility
  "1": placeholderClassic,
  "2": placeholderBoxes,
  "3": placeholderTechnical,
  "4": placeholderBento,
  "5": placeholderDatalover,
  "6": placeholderLanding,
};

export const backgroundImages = {
  "template-landing": templateLandingBackground,
  "template-social": templateSocialBackground,
};

class ImagePreloader {
  private loadedImages = new Set<string>();
  private imageElements = new Map<string, HTMLImageElement>();

  async preloadAllImages(): Promise<void> {
    const placeholderPromises = Object.entries(placeholderImages).map(([templateId, src]) => 
      this.preloadImage(`placeholder-${templateId}`, src)
    );
    
    const backgroundPromises = Object.entries(backgroundImages).map(([templateId, src]) => 
      this.preloadImage(`background-${templateId}`, src)
    );
    
    await Promise.all([...placeholderPromises, ...backgroundPromises]);
  }

  private preloadImage(templateId: string, src: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.loadedImages.has(templateId)) {
        resolve();
        return;
      }

      const img = new Image();
      
      img.onload = () => {
        this.loadedImages.add(templateId);
        this.imageElements.set(templateId, img);
        resolve();
      };
      
      img.onerror = () => {
        console.warn(`Failed to preload image for template ${templateId}`);
        reject(new Error(`Failed to load image: ${src}`));
      };
      
      // Force immediate loading
      img.loading = 'eager';
      img.decoding = 'sync';
      img.src = src;
    });
  }

  getImageSrc(templateId: string): string {
    return placeholderImages[templateId as keyof typeof placeholderImages] || placeholderClassic;
  }

  isImageLoaded(templateId: string): boolean {
    return this.loadedImages.has(templateId);
  }
}

export const imagePreloader = new ImagePreloader();
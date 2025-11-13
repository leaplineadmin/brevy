import React, { useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2, Upload, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface FileUploadProps {
  currentImage?: string;
  onImageUpload: (imagePath: string) => void;
  onCircularImageUpload?: (circularImagePath: string) => void; // New prop for circular image
  className?: string;
  showAsLink?: boolean;
  linkText?: string;
}

export function FileUpload({ currentImage, onImageUpload, onCircularImageUpload, className = '', showAsLink = false, linkText = "Télécharger une photo" }: FileUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [preview, setPreview] = useState<string | undefined>(currentImage);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const placeholderImage = "/assets/placeholder.png";

  // Function to create circular image
  const createCircularImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        reject(new Error('Canvas context not available'));
        return;
      }

      img.onload = () => {
        // Set canvas size (use the larger dimension for quality)
        const size = Math.max(img.width, img.height);
        canvas.width = size;
        canvas.height = size;
        
        // Create circular clipping path
        ctx.beginPath();
        ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
        ctx.clip();
        
        // Draw image centered
        const x = (size - img.width) / 2;
        const y = (size - img.height) / 2;
        ctx.drawImage(img, x, y, img.width, img.height);
        
        // Convert to PNG with transparency
        const dataURL = canvas.toDataURL('image/png');
        resolve(dataURL);
      };
      
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(file);
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.match('image/jpeg|image/png|image/gif')) {
      toast({
        title: 'Invalid file type',
        description: 'Please upload a JPEG, PNG, or GIF image.',
        variant: 'destructive',
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Image size should not exceed 5MB.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsUploading(true);

      // Create a temporary preview
      const objectUrl = URL.createObjectURL(file);
      setPreview(objectUrl);

      // Upload the original file
      const formData = new FormData();
      formData.append('photo', file);

      const isProd = typeof window !== 'undefined' && window.location.hostname.endsWith('cvfolio.app');
      const base = isProd ? 'https://cvfolio.onrender.com' : '';
      const response = await fetch(`${base}/api/upload-photo`, {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Upload failed (${response.status}): ${errorText}`);
      }

      const data = await response.json();
      onImageUpload(data.filePath);

      // Create and upload circular image if callback provided
      if (onCircularImageUpload) {
        try {
          const circularImageDataURL = await createCircularImage(file);
          
          // Convert dataURL to blob for upload
          const response = await fetch(circularImageDataURL);
          const blob = await response.blob();
          
          // Create a new file from the blob
          const circularFile = new File([blob], 'circular-' + file.name, { type: 'image/png' });
          
          // Upload circular image
          const circularFormData = new FormData();
          circularFormData.append('photo', circularFile);
          
          const circularResponse = await fetch(`${base}/api/upload-photo`, {
            method: 'POST',
            body: circularFormData,
            credentials: 'include',
          });
          
          if (circularResponse.ok) {
            const circularData = await circularResponse.json();
            onCircularImageUpload(circularData.filePath);
            console.log('✅ Circular image uploaded:', circularData.filePath);
          }
        } catch (circularError) {
          console.error('❌ Failed to create/upload circular image:', circularError);
          // Don't fail the whole upload if circular image fails
        }
      }
      
      toast({
        title: 'Image ajoutée',
        description: 'Votre photo de profil a été correctement ajoutée',
      });
    } catch (error) {
      toast({
        title: 'Upload failed',
        description: 'There was a problem uploading your image.',
        variant: 'destructive',
      });
      // Revert to previous image if available
      setPreview(currentImage);
    } finally {
      setIsUploading(false);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const removeImage = () => {
    setPreview(undefined);
    onImageUpload('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  if (showAsLink) {
    return (
      <>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          accept="image/jpeg, image/png, image/gif"
        />
        <Button 
          variant="link"
          size="sm"
          type="button"
          onClick={triggerFileInput}
          disabled={isUploading}
          className="text-sm text-brand-primary p-0 h-auto font-normal hover:text-primaryHover"
        >
          {isUploading ? (
            <>
              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
              Uploading...
            </>
          ) : (
            linkText
          )}
        </Button>
      </>
    );
  }

  return (
    <div className={`flex items-start gap-4 ${className}`}>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept="image/jpeg, image/png, image/gif"
      />
      
      {/* Photo placeholder on the left */}
      <div className="w-20 h-20 bg-light-grey rounded-full overflow-hidden flex items-center justify-center relative">
        {preview ? (
          <>
            <img src={preview} alt="Profile" className="w-full h-full object-cover" />
            <button 
              className="absolute top-0 right-0 bg-white/80 rounded-full p-1 hover:bg-white"
              onClick={removeImage}
              disabled={isUploading}
              type="button"
            >
              <X className="h-3 w-3 text-neutral" />
            </button>
          </>
        ) : (
          <img src={placeholderImage} alt="Profile" className="w-full h-full object-cover" />
        )}
      </div>
      
      {/* Upload controls on the right */}
      <div className="flex flex-col justify-center gap-1">
        <p className="text-sm text-neutral">Photo de profil</p>
        <Button 
          variant="link"
          size="sm"
          type="button"
          onClick={triggerFileInput}
          disabled={isUploading}
          className="text-sm text-brand-primary p-0 h-auto font-normal"
        >
          {isUploading ? (
            <>
              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              {preview ? 'Changer la photo' : 'Télécharger une photo'}
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

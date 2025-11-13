import { FileUpload } from "@/components/ui/file-upload";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { usePreview } from "@/context/PreviewContext";
import { useCVData } from "@/hooks/use-cv-data";
import { useLanguage } from "@/contexts/LanguageContext";
import { useState } from "react";
import { PhoneInput } from "./phone-input";

export default function PersonalInfo() {
  const { t } = useLanguage();
  const { cvData, updateCvData } = useCVData();
  const { 
    hidePhoto, 
    setHidePhoto, 
    hideCity, 
    setHideCity,
    hideLinkedIn,
    setHideLinkedIn,
    hideWebsite,
    setHideWebsite
  } = usePreview();
  
  // Validation des URLs et emails
  const isValidUrl = (url: string, type: 'linkedin' | 'website'): boolean => {
    if (!url || url.trim() === '') return true; // URLs vides sont valides
    
    try {
      if (type === 'linkedin') {
        // Validation plus stricte pour LinkedIn - doit commencer par https://www.linkedin.com/in/
        if (url.startsWith('https://www.linkedin.com/in/')) {
          return true;
        }
        // Rejeter tout ce qui ne commence pas par l'URL LinkedIn complète
        return false;
      } else {
        // Pour le site web, accepter avec ou sans protocole
        const urlPattern = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/i;
        return urlPattern.test(url);
      }
    } catch {
      return false;
    }
  };

  const isValidEmail = (email: string): boolean => {
    if (!email || email.trim() === '') return true; // Emails vides sont valides
    
    const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailPattern.test(email);
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    updateCvData(name as keyof typeof cvData, value);
  };
  
  const handleProfilePhotoUpload = (imagePath: string) => {
    updateCvData('photoUrl', imagePath);
  };

  const handleCircularPhotoUpload = (circularImagePath: string) => {
    updateCvData('circularPhotoUrl', circularImagePath);
  };
  
  return (
    <form autoComplete="off">
      {/* Faux champs password pour tromper les gestionnaires */}
      <input type="password" name="fake1" style={{display:'none'}} value="a" readOnly />
      <input type="password" name="fake2" style={{display:'none'}} value="b" readOnly />
      <input type="password" name="fake3" style={{display:'none'}} value="c" readOnly />
      
      <div className="cv-section-content flex flex-col gap-4">
        {/* Profile Photo Upload */}
        <div className="flex gap-4">
          <div className="w-[72px] h-[72px] rounded-full overflow-hidden border border-lightGrey bg-gray-100 flex-shrink-0">
            {cvData.photoUrl ? (
              <img 
                src={cvData.photoUrl} 
                alt={t('cvBuilder.personalInfo.profilePhoto')} 
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
              </div>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <Label className="cv-label">{t('cvBuilder.personalInfo.profilePhoto')}</Label>
            <div className="text-left">
              <FileUpload
                currentImage={cvData.photoUrl}
                onImageUpload={handleProfilePhotoUpload}
                onCircularImageUpload={handleCircularPhotoUpload}
                showAsLink={true}
                linkText={t('cvBuilder.personalInfo.addPhoto')}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch 
                id="showPhoto"
                checked={hidePhoto}
                onCheckedChange={(checked) => setHidePhoto(checked)}
              />
              <label htmlFor="showPhoto" className="text-sm text-gray-500">
                {t('cvBuilder.personalInfo.hidePhoto')}
              </label>
            </div>
          </div>
        </div>
          
        <div>
          <Label htmlFor="firstName" className="cv-label">
            {t('cvBuilder.personalInfo.firstName')}
          </Label>
          <Input
            id="firstName"
            name="firstName"
            className="cv-input"
            value={cvData.firstName || ''}
            placeholder={t('cvBuilder.personalInfo.placeholders.firstName')}
            onChange={handleInputChange}
            autoComplete="given-name"
            data-1p-ignore
            data-lpignore="true"
            data-form-type="other"
            data-bwignore
          />
        </div>
          
        <div>
          <Label htmlFor="lastName" className="cv-label">
            {t('cvBuilder.personalInfo.lastName')}
          </Label>
          <Input
            id="lastName"
            name="lastName"
            className="cv-input"
            value={cvData.lastName || ''}
            placeholder={t('cvBuilder.personalInfo.placeholders.lastName')}
            onChange={handleInputChange}
            autoComplete="family-name"
            data-1p-ignore
            data-lpignore="true"
            data-form-type="other"
            data-bwignore
          />
        </div>
          
        <div>
          <Label htmlFor="position" className="cv-label">
            {t('cvBuilder.personalInfo.jobTitle')}
          </Label>
          <Input
            id="position"
            name="position"
            className="cv-input"
            value={cvData.position || ''}
            placeholder={t('cvBuilder.personalInfo.placeholders.jobTitle')}
            onChange={handleInputChange}
            autoComplete="organization-title"
            data-1p-ignore
            data-lpignore="true"
            data-form-type="other"
            data-bwignore
          />
        </div>
          
        <div>
          <Label htmlFor="country" className="cv-label">
            {t('cvBuilder.personalInfo.country')}
          </Label>
          <Input
            id="country"
            name="country"
            className="cv-input"
            value={cvData.country || ''}
            placeholder={t('cvBuilder.personalInfo.placeholders.country')}
            onChange={handleInputChange}
            autoComplete="country-name"
            data-1p-ignore
            data-lpignore="true"
            data-form-type="other"
            data-bwignore
          />
        </div>
          
        <div>
          <Label htmlFor="city" className="cv-label">
            {t('cvBuilder.personalInfo.city')}
          </Label>
          <Input
            id="city"
            name="city"
            className="cv-input"
            value={cvData.city || ''}
            placeholder={t('cvBuilder.personalInfo.placeholders.city')}
            onChange={handleInputChange}
            autoComplete="address-level2"
            data-1p-ignore
            data-lpignore="true"
            data-form-type="other"
            data-bwignore
          />
          <div className="mt-2 flex items-center space-x-2">
            <Switch 
              id="showCity"
              checked={hideCity}
              onCheckedChange={(checked) => setHideCity(checked)}
            />
            <label htmlFor="showCity" className="text-sm text-gray-500">
              {t('cvBuilder.personalInfo.hideCity')}
            </label>
          </div>
        </div>

        <div>
          <Label htmlFor="email" className="cv-label">
            {t('cvBuilder.personalInfo.email')}
          </Label>
          <Input
            id="email"
            name="email"
            type="email"
            className={`cv-input`}
            style={cvData.email && !isValidEmail(cvData.email) ? { borderColor: 'var(--danger)' } : {}}
            value={cvData.email || ''}
            placeholder={t('cvBuilder.personalInfo.placeholders.email')}
            onChange={handleInputChange}
            autoComplete="email"
            data-1p-ignore
            data-lpignore="true"
            data-form-type="other"
            data-bwignore
          />
          {cvData.email && !isValidEmail(cvData.email) && (
            <div className="text-xs mt-1" style={{ color: 'var(--danger)' }}>
              {t('validation.invalidEmail')}
            </div>
          )}
        </div>
          
        <div>
          <Label htmlFor="phone" className="cv-label">
            {t('cvBuilder.personalInfo.phone')}
          </Label>
          <PhoneInput
            value={cvData.phone || ''}
            countryCode={cvData.phoneCountryCode || '+33'}
            onPhoneChange={(phone) => updateCvData('phone', phone)}
            onCountryChange={(countryCode) => updateCvData('phoneCountryCode', countryCode)}
          />
        </div>
          
        <div>
          <Label htmlFor="linkedin" className="cv-label">
            {t('cvBuilder.personalInfo.linkedin')}
          </Label>
          <Input
            id="linkedin"
            name="linkedin"
            className={`cv-input`}
            style={cvData.linkedin && !isValidUrl(cvData.linkedin, 'linkedin') ? { borderColor: 'var(--danger)' } : {}}
            value={cvData.linkedin || ''}
            placeholder={t('cvBuilder.personalInfo.placeholders.linkedin')}
            onChange={handleInputChange}
            autoComplete="url"
            data-1p-ignore
            data-lpignore="true"
            data-form-type="other"
            data-bwignore
          />
          {cvData.linkedin && !isValidUrl(cvData.linkedin, 'linkedin') && (
            <div className="text-xs mt-1" style={{ color: 'var(--danger)' }}>
              {t('validation.invalidUrl')}
            </div>
          )}
          <div className="mt-2 flex items-center space-x-2">
            <Switch 
              id="hideLinkedIn"
              checked={hideLinkedIn}
              onCheckedChange={(checked) => setHideLinkedIn(checked)}
            />
            <label htmlFor="hideLinkedIn" className="text-sm text-gray-500">
              {t('cvBuilder.personalInfo.hideLinkedIn')}
            </label>
          </div>
        </div>

        <div>
          <Label htmlFor="website" className="cv-label">
            {t('cvBuilder.personalInfo.website')}
          </Label>
          <Input
            id="website"
            name="website"
            className={`cv-input`}
            style={cvData.website && !isValidUrl(cvData.website, 'website') ? { borderColor: 'var(--danger)' } : {}}
            value={cvData.website || ''}
            placeholder={t('cvBuilder.personalInfo.placeholders.website')}
            onChange={handleInputChange}
            autoComplete="url"
            data-1p-ignore
            data-lpignore="true"
            data-form-type="other"
            data-bwignore
          />
          {cvData.website && !isValidUrl(cvData.website, 'website') && (
            <div className="text-xs mt-1" style={{ color: 'var(--danger)' }}>
              {t('validation.invalidUrl')}
            </div>
          )}
          <div className="mt-2 flex items-center space-x-2">
            <Switch 
              id="hideWebsite"
              checked={hideWebsite}
              onCheckedChange={(checked) => setHideWebsite(checked)}
            />
            <label htmlFor="hideWebsite" className="text-sm text-gray-500">
              {t('cvBuilder.personalInfo.hideWebsite')}
            </label>
          </div>
        </div>
      </div>
    </form>
  );
}
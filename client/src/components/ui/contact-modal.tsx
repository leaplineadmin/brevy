import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Info } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface ContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  contactType: 'phone' | 'email' | 'linkedin' | 'website';
}

export const ContactModal = ({ isOpen, onClose, contactType }: ContactModalProps) => {
  const { t } = useLanguage();
  
  const getMessage = () => {
    switch (contactType) {
      case 'phone':
        return t('modals.contactPhoneMessage');
      case 'email':
        return t('modals.contactEmailMessage');
      case 'linkedin':
        return t('modals.contactLinkedinMessage');
      case 'website':
        return t('modals.contactWebsiteMessage');
      default:
        return t('modals.contactDefaultMessage');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md w-full mx-4">
        <DialogHeader>
          <DialogTitle className="text-left">{t('modals.contactInfoRequired')}</DialogTitle>
        </DialogHeader>
        <div className="mt-4">
          <div className="flex items-start text-sm text-blue-600">
            <Info className="w-4 h-4 mr-2 flex-shrink-0 mt-0.5" />
            <span className="break-words">{getMessage()}</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

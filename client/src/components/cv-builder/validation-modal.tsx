import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Info } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface ValidationModalProps {
  isOpen: boolean;
  onClose: () => void;
  errors: string[];
  onIgnoreAndProceed: () => void;
}

export const ValidationModal = ({
  isOpen,
  onClose,
  errors,
  onIgnoreAndProceed,
}: ValidationModalProps) => {
  const { t } = useLanguage();
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md w-full mx-4">
        <DialogHeader>
          <DialogTitle className="text-left">{t('modals.missingInfo')}</DialogTitle>
        </DialogHeader>
        <div className="mt-4">
          <div className="flex items-start text-sm text-blue-600">
            <Info className="w-4 h-4 mr-2 flex-shrink-0 mt-0.5" />
            <span className="break-words">{t('modals.missingInfoDescription')}</span>
          </div>
        </div>
        <DialogFooter className="mt-6 flex flex-col sm:flex-row gap-3 sm:gap-4 w-full">
          <Button
            onClick={onIgnoreAndProceed}
            className="bg-blue-600 hover:bg-blue-700 text-white flex-1 min-w-0 max-w-full text-center"
          >
            <span className="truncate block w-full">{t('modals.ignoreAndSave')}</span>
          </Button>
          <Button
            onClick={onClose}
            variant="outline"
            className="flex-1 min-w-0 max-w-full text-gray-700 text-center"
          >
            <span className="truncate block w-full">{t('modals.gotItComplete')}</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

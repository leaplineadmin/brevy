import { Monitor, Smartphone } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

export type PreviewMode = "desktop" | "mobile";

interface PreviewModeSelectorProps {
  previewMode: PreviewMode;
  setPreviewMode: (mode: PreviewMode) => void;
  variant?: "default" | "compact";
}

export function PreviewModeSelector({
  previewMode,
  setPreviewMode,
  variant = "default",
}: PreviewModeSelectorProps) {
  const { t } = useLanguage();
  const isCompact = variant === "compact";

  return (
    <div
      className={`inline-flex rounded-md border ${isCompact ? "border-gray-300" : "border-input"} ${isCompact ? "bg-lightGrey" : "bg-background"}`}
      style={{ height: "40px", boxSizing: "border-box" }}
    >
      <button
        onClick={() => setPreviewMode("desktop")}
        className={`flex items-center space-x-2 px-3 h-full rounded transition-all text-sm font-medium ${
          previewMode === "desktop"
            ? isCompact
              ? "bg-white text-gray-900 shadow-sm"
              : "bg-brand-primary text-primary-foreground shadow-sm"
            : isCompact
              ? "text-gray-600 hover:text-gray-900"
              : "text-gray-600 hover:text-gray-900 hover:bg-muted"
        }`}
      >
        <Monitor className="w-4 h-4" />
        <span>{t('cvBuilder.previewControls.desktop')}</span>
      </button>
      <button
        onClick={() => setPreviewMode("mobile")}
        className={`flex items-center space-x-2 px-3 h-full rounded transition-all text-sm font-medium ${
          previewMode === "mobile"
            ? isCompact
              ? "bg-white text-gray-900 shadow-sm"
              : "bg-brand-primary text-primary-foreground shadow-sm"
            : isCompact
              ? "text-gray-600 hover:text-gray-900"
              : "text-gray-600 hover:text-gray-900 hover:bg-muted"
        }`}
      >
        <Smartphone className="w-4 h-4" />
        <span>{t('cvBuilder.previewControls.mobile')}</span>
      </button>
    </div>
  );
}

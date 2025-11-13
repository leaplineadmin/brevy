import { Check, Palette, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { useState, useRef, useEffect } from "react";

export const CV_COLORS = [
  { id: "blue", name: "Blue", value: "#0076d1" },
  { id: "teal", name: "Teal", value: "#29A0A8" },
  { id: "green", name: "Green", value: "#6F941E" },
  { id: "gold", name: "Gold", value: "#9A7613" },
  { id: "orange", name: "Orange", value: "#D17000" },
  { id: "red", name: "Red", value: "#9D6281" },
  { id: "purple", name: "Purple", value: "#7E69C9" },
  { id: "neutral", name: "Neutral", value: "#7A82AD" },
];

// Couleur par défaut - toujours la première couleur (bleu)
export const DEFAULT_MAIN_COLOR = CV_COLORS[0].value;

interface ColorSelectorProps {
  mainColor: string;
  setMainColor: (color: string) => void;
  variant?: "default" | "compact";
  showLabel?: boolean;
}

export function ColorSelector({
  mainColor,
  setMainColor,
  variant = "default",
  showLabel = true,
}: ColorSelectorProps) {
  const { t } = useLanguage();
  const isCompact = variant === "compact";
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Fermer le dropdown quand on clique à l'extérieur
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const colorSize = "w-5 h-5"; // Réduit de moitié (w-10 h-10 -> w-5 h-5)
  const iconSize = "w-3 h-3"; // Réduit proportionnellement

  return (
    <div>
      {/* Version mobile avec dropdown - sans label pour éviter répétition */}
      <div className="block md:hidden relative" ref={dropdownRef}>
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="flex items-center justify-between w-full px-3 py-2 text-sm border border-gray-300 rounded-md bg-white hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Palette className="w-4 h-4" />
            <span>{t("cvBuilder.controls.mainColor")}</span>
          </div>
          <ChevronDown className={`w-4 h-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
        </button>
        
        {/* Dropdown des couleurs - mobile seulement */}
        {isDropdownOpen && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-md shadow-lg z-10">
            <div className="p-4">
              <div className="grid grid-cols-3 gap-3">
                {CV_COLORS.map((color) => (
                  <button
                    key={color.id}
                    className="w-6 h-6 rounded-full border transition-all duration-200 mx-auto"
                    style={{ 
                      backgroundColor: color.value,
                      borderColor: color.value === mainColor ? color.value : 'transparent',
                      transform: color.value === mainColor ? 'scale(1.1)' : 'scale(1)',
                      boxShadow: color.value === mainColor ? '0 0 0 2px white, 0 0 0 4px ' + color.value : 'none'
                    }}
                    onClick={() => {
                      setMainColor(color.value);
                      // Ne pas fermer le dropdown - laisser l'utilisateur choisir plusieurs couleurs
                    }}
                    title={color.name}
                    aria-label={`Select ${color.name} as main color`}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Version desktop avec pastilles en ligne */}
      <div className="hidden md:flex md:items-center md:gap-4">
        {showLabel && (
          <span className="text-neutral text-sm font-medium">
            {t("cvBuilder.controls.mainColor")}:
          </span>
        )}
        <div className="flex flex-wrap gap-2">
          {CV_COLORS.map((color) => (
            <Button
              key={color.id}
              type="button"
              variant="ghost"
              className={`${colorSize} rounded-full p-0 relative transition-all`}
              style={{
                backgroundColor: color.value,
                borderColor: "transparent",
                transform: "scale(1)",
                boxShadow: "none",
              }}
              onClick={() => setMainColor(color.value)}
              title={color.name}
              aria-label={`Select color ${color.name}`}
            >
              {mainColor === color.value && (
                <div className="absolute inset-0 flex items-center justify-center rounded-full">
                  <Check className={`text-white ${iconSize}`} />
                </div>
              )}
              {mainColor === color.value && (
                <div className="absolute -inset-1 rounded-full border-2 border-brand-primary"></div>
              )}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}

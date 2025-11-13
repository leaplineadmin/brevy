import React, { useEffect, useState, useRef } from 'react';
import { usePreview } from '../../context/PreviewContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { Monitor, Smartphone, FileText, ChevronLeft, ChevronRight, Palette, ChevronDown } from 'lucide-react';
import { CV_COLORS, DEFAULT_MAIN_COLOR } from './shared/color-selector';
import './preview-styles.css';

export const PreviewControls: React.FC = () => {
  const { previewMode, setPreviewMode, currentPage, totalPages, setCurrentPage, mainColor, setMainColor } = usePreview();
  const { t } = useLanguage();
  const [isColorDropdownOpen, setIsColorDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // S'assurer que la couleur par défaut est définie au premier chargement
  useEffect(() => {
    if (!mainColor) {
      setMainColor(DEFAULT_MAIN_COLOR);
    }
  }, []);

  // Fermer le dropdown quand on clique à l'extérieur
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsColorDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="mb-4">
      <div className="flex justify-between items-center mb-4">
        <div className="text-sm font-medium">Format de prévisualisation</div>
        <div className="flex space-x-1 border rounded-md overflow-hidden">
          <button
            className={`px-3 py-1.5 text-xs ${
              previewMode === 'desktop' 
                ? 'bg-brand-primary text-white' 
                : 'bg-white text-neutral'
            }`}
            onClick={() => setPreviewMode('desktop')}
          >
            <span className="flex items-center">
              <Monitor className="w-4 h-4 mr-1" />
              Desktop
            </span>
          </button>
          <button
            className={`px-3 py-1.5 text-xs ${
              previewMode === 'mobile' 
                ? 'bg-brand-primary text-white' 
                : 'bg-white text-neutral'
            }`}
            onClick={() => setPreviewMode('mobile')}
          >
            <span className="flex items-center">
              <Smartphone className="w-4 h-4 mr-1" />
              Mobile
            </span>
          </button>
          <button
            className={`px-3 py-1.5 text-xs ${
              previewMode === 'document' 
                ? 'bg-brand-primary text-white' 
                : 'bg-white text-neutral'
            }`}
            onClick={() => setPreviewMode('document')}
          >
            <span className="flex items-center">
              <FileText className="w-4 h-4 mr-1" />
              A4 PDF
            </span>
          </button>
        </div>
      </div>

      {/* Contrôles de couleur principaux pour le CV */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <div className="text-sm font-medium">Couleur principale</div>
        </div>
        
        {/* Bouton Main color avec dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsColorDropdownOpen(!isColorDropdownOpen)}
            className="flex items-center justify-between w-full px-3 py-2 text-sm border border-gray-300 rounded-md bg-white hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Palette className="w-4 h-4" />
              <span>{t("cvBuilder.controls.mainColor")}</span>
            </div>
            <ChevronDown className={`w-4 h-4 transition-transform ${isColorDropdownOpen ? 'rotate-180' : ''}`} />
          </button>
          
          {/* Dropdown des couleurs */}
          {isColorDropdownOpen && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-md shadow-lg z-10">
              <div className="p-3">
                <div className="grid grid-cols-4 gap-2">
                  {CV_COLORS.map((color) => (
                    <button
                      key={color.id}
                      className="w-8 h-8 rounded-full border transition-all duration-200 mx-auto"
                      style={{ 
                        backgroundColor: color.value,
                        borderColor: color.value === mainColor ? color.value : 'transparent',
                        transform: color.value === mainColor ? 'scale(1.1)' : 'scale(1)',
                        boxShadow: color.value === mainColor ? '0 0 0 2px white, 0 0 0 4px ' + color.value : 'none'
                      }}
                      onClick={() => {
                        setMainColor(color.value);
                        setIsColorDropdownOpen(false);
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
      </div>

      {/* Pagination pour le mode document */}
      {previewMode === 'document' && totalPages > 1 && (
        <div className="flex justify-center items-center mt-4 space-x-3 pagination-controls">
          <button 
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className={`pagination-button ${currentPage > 1 ? 'bg-brand-primary text-white' : 'bg-lightGrey text-midGrey'}`}
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="pagination-indicator text-sm font-medium">
            Page {currentPage} sur {totalPages}
          </span>
          <button 
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className={`pagination-button ${currentPage < totalPages ? 'bg-brand-primary text-white' : 'bg-lightGrey text-midGrey'}`}
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
};
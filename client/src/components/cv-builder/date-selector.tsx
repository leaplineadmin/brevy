import React, { useState, useRef, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLanguage } from "@/contexts/LanguageContext";

interface DateSelectorProps {
  label: string;
  id: string;
  value: { month: string; year: string };
  onChange: (month: string, year: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

const getMonths = (t: any) => [
  { value: "01", label: t("templates.months.jan") },
  { value: "02", label: t("templates.months.feb") },
  { value: "03", label: t("templates.months.mar") },
  { value: "04", label: t("templates.months.apr") },
  { value: "05", label: t("templates.months.may") },
  { value: "06", label: t("templates.months.jun") },
  { value: "07", label: t("templates.months.jul") },
  { value: "08", label: t("templates.months.aug") },
  { value: "09", label: t("templates.months.sep") },
  { value: "10", label: t("templates.months.oct") },
  { value: "11", label: t("templates.months.nov") },
  { value: "12", label: t("templates.months.dec") },
];

const currentYear = new Date().getFullYear();
const currentMonth = new Date().getMonth() + 1; // getMonth() returns 0-11, we need 1-12

const YEARS = Array.from({ length: 30 }, (_, i) => {
  const year = currentYear - i;
  return year.toString();
});

export function DateSelector({ label, id, value, onChange, disabled = false, placeholder = "mm/yyyy" }: DateSelectorProps) {
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedYear, setSelectedYear] = useState(value.year || YEARS[0]);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const MONTHS = getMonths(t);

  const displayValue = value.month && value.year 
    ? `${value.month}/${value.year}` 
    : '';

  const updateDropdownPosition = () => {
    if (inputRef.current) {
      const rect = inputRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + 4,
        left: rect.left
      });
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node) &&
          inputRef.current && !inputRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleScroll = () => {
      if (isOpen) {
        updateDropdownPosition();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('scroll', handleScroll, true);
    window.addEventListener('resize', handleScroll);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('resize', handleScroll);
    };
  }, [isOpen]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    // Format: mm/yyyy
    const regex = /^(\d{0,2})\/?(\d{0,4})$/;
    const match = inputValue.match(regex);
    
    if (match) {
      let [, month, year] = match;
      
      // Formater le mois avec un zéro initial si nécessaire
      if (month.length === 1 && parseInt(month) > 1) {
        month = '0' + month;
      }
      if (month.length === 2 && parseInt(month) > 12) {
        month = month.substring(0, 1);
      }
      
      // Mettre à jour seulement si valide
      if (month.length === 2 && year.length === 4) {
        onChange(month, year);
        setSelectedYear(year);
      } else if (month.length <= 2 && year.length <= 4) {
        // Permettre la saisie en cours
        onChange(month, year);
        if (year.length === 4) setSelectedYear(year);
      }
    }
  };

  const handleMonthSelect = (month: string) => {
    onChange(month, selectedYear);
    setIsOpen(false);
  };

  const isMonthDisabled = (monthValue: string) => {
    // Si l'année sélectionnée est l'année courante, désactiver les mois futurs
    if (parseInt(selectedYear) === currentYear) {
      return parseInt(monthValue) > currentMonth;
    }
    return false;
  };

  const handleYearSelect = (year: string) => {
    setSelectedYear(year);
    if (value.month) {
      onChange(value.month, year);
      setIsOpen(false);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <Label htmlFor={id} className="cv-label">
        {label}
      </Label>
      <Input
        ref={inputRef}
        id={id}
        type="text"
        value={displayValue}
        onChange={handleInputChange}
        onFocus={() => {
          updateDropdownPosition();
          setIsOpen(true);
        }}
        className="cv-input"
        placeholder={placeholder}
        disabled={disabled}
        maxLength={7}
      />
      
      {isOpen && !disabled && (
        <div 
          ref={dropdownRef}
          className="fixed bg-white border border-lightGrey rounded-md shadow-xl z-[9999] overflow-hidden"
          style={{
            top: `${dropdownPosition.top}px`,
            left: `${dropdownPosition.left}px`,
            width: '320px',
            maxHeight: '240px'
          }}>
          <div className="flex">
            {/* Années */}
            <div className="w-1/3 border-r border-lightGrey">
              <div className="p-2 font-medium text-sm text-neutral border-b border-lightGrey bg-gray-50">
                Année
              </div>
              <div className="max-h-48 overflow-y-auto">
                {YEARS.map((year) => (
                  <button
                    key={year}
                    onClick={() => handleYearSelect(year)}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-100 ${
                      selectedYear === year ? 'bg-primaryLight text-primary font-medium' : 'text-neutral'
                    }`}
                  >
                    {year}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Mois */}
            <div className="w-2/3">
              <div className="p-2 font-medium text-sm text-neutral border-b border-lightGrey bg-gray-50">
                Mois
              </div>
              <div className="grid grid-cols-3 gap-1 p-2">
                {MONTHS.map((month) => {
                  const disabled = isMonthDisabled(month.value);
                  return (
                    <button
                      key={month.value}
                      onClick={() => !disabled && handleMonthSelect(month.value)}
                      disabled={disabled}
                      className={`px-2 py-2 text-sm rounded transition-colors ${
                        disabled 
                          ? 'text-lightGrey cursor-not-allowed bg-gray-50' 
                          : value.month === month.value 
                            ? 'bg-primaryLight text-primary font-medium' 
                            : 'text-neutral hover:bg-gray-100'
                      }`}
                    >
                      {month.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
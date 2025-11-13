import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLanguage } from "@/contexts/LanguageContext";

interface YearSelectorProps {
  label: string;
  id: string;
  value: string;
  onChange: (year: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

const currentYear = new Date().getFullYear();

const YEARS = Array.from({ length: 30 }, (_, i) => {
  const year = currentYear - i;
  return year.toString();
});

export function YearSelector({ label, id, value, onChange, disabled = false, placeholder = "yyyy" }: YearSelectorProps) {
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedYear, setSelectedYear] = useState(value || '');
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const displayValue = value || '';

  const handleInputClick = (e: React.MouseEvent) => {
    if (disabled) return;
    e.stopPropagation();
    updateDropdownPosition();
    setIsOpen(true);
  };

  const handleInputFocus = () => {
    if (disabled) return;
    updateDropdownPosition();
    setIsOpen(true);
  };

  const updateDropdownPosition = () => {
    if (inputRef.current) {
      const rect = inputRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + window.scrollY + 4,
        left: rect.left + window.scrollX,
        width: rect.width
      });
    }
  };

  const handleYearSelect = (year: string) => {
    setSelectedYear(year);
    onChange(year);
    setIsOpen(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    // Allow only 4-digit years
    if (inputValue.length <= 4 && /^\d*$/.test(inputValue)) {
      setSelectedYear(inputValue);
      onChange(inputValue);
    }
  };

  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      setIsOpen(false);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setIsOpen(true);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node) && 
          inputRef.current && !inputRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      // Use a small delay to prevent immediate closure
      const timeoutId = setTimeout(() => {
        document.addEventListener('mousedown', handleClickOutside);
      }, 100);
      
      return () => {
        clearTimeout(timeoutId);
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const dropdownContent = isOpen && (
    <div
      ref={dropdownRef}
      className="fixed z-[9999] bg-white border border-lightGrey rounded-md shadow-xl max-h-48 overflow-y-auto"
      style={{
        top: dropdownPosition.top,
        left: dropdownPosition.left,
        width: dropdownPosition.width,
        minWidth: '120px'
      }}
    >
      {YEARS.map((year) => (
        <div
          key={year}
          className={`px-3 py-2 cursor-pointer hover:bg-lightGrey/20 text-sm ${
            selectedYear === year ? 'bg-primary/10 text-primary' : 'text-neutral'
          }`}
          onClick={(e) => {
            e.stopPropagation();
            handleYearSelect(year);
          }}
        >
          {year}
        </div>
      ))}
    </div>
  );

  return (
    <div className="relative w-full">
      <Label htmlFor={id} className="cv-label">
        {label}
      </Label>
      <Input
        ref={inputRef}
        id={id}
        value={displayValue}
        onChange={handleInputChange}
        onClick={handleInputClick}
        onFocus={handleInputFocus}
        onKeyDown={handleInputKeyDown}
        disabled={disabled}
        placeholder={placeholder}
        className="cv-input cursor-pointer"
        maxLength={4}
      />
      
      {typeof window !== 'undefined' && dropdownContent && createPortal(
        dropdownContent,
        document.body
      )}
    </div>
  );
}

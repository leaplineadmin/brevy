import React from 'react';
import { Input, InputProps } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface AccessibleInputProps extends InputProps {
  label: string;
  error?: string;
  helperText?: string;
  required?: boolean;
  'aria-describedby'?: string;
}

export const AccessibleInput: React.FC<AccessibleInputProps> = ({
  label,
  error,
  helperText,
  required = false,
  id,
  className,
  'aria-describedby': ariaDescribedby,
  ...props
}) => {
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
  const errorId = error ? `${inputId}-error` : undefined;
  const helperId = helperText ? `${inputId}-helper` : undefined;
  const describedBy = [errorId, helperId, ariaDescribedby].filter(Boolean).join(' ');

  return (
    <div className="space-y-2">
      <Label 
        htmlFor={inputId}
        className={cn(required && "after:content-['*'] after:ml-0.5 after:text-red-500")}
      >
        {label}
      </Label>
      
      <Input
        id={inputId}
        className={cn(
          error && "border-red-500 focus:border-red-500 focus:ring-red-500",
          className
        )}
        aria-invalid={!!error}
        aria-describedby={describedBy || undefined}
        aria-required={required}
        autoocomplete={props.type === 'email' ? 'email' : props.type === 'password' ? 'current-password' : 'off'}
        {...props}
      />
      
      {error && (
        <p id={errorId} className="text-sm text-red-500" role="alert">
          {error}
        </p>
      )}
      
      {helperText && !error && (
        <p id={helperId} className="text-sm text-gray-500">
          {helperText}
        </p>
      )}
    </div>
  );
};

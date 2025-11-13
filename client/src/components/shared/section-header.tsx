import React from 'react';
import { cn } from '@/lib/utils';

interface SectionHeaderProps {
  title: string;
  className?: string;
  mainColor?: string;
  children?: React.ReactNode;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  className,
  mainColor = '#000000',
  children
}) => {
  return (
    <div className={cn("flex items-center gap-3 mb-4", className)}>
      <div 
        className="w-1 h-6 rounded-full"
        style={{ backgroundColor: mainColor }}
      />
      <h3 
        className="text-lg font-semibold uppercase tracking-wide"
        style={{ color: mainColor }}
      >
        {title}
      </h3>
      {children}
    </div>
  );
};

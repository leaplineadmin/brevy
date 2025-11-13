import React from 'react';
import { cn } from '@/lib/utils';

interface DateRangeProps {
  startDate?: string;
  endDate?: string;
  isCurrent?: boolean;
  className?: string;
  currentLabel?: string;
}

export const DateRange: React.FC<DateRangeProps> = ({
  startDate,
  endDate,
  isCurrent = false,
  className,
  currentLabel = 'Present'
}) => {
  const formatDate = (date: string) => {
    if (!date) return '';
    
    // Handle different date formats
    if (date.includes('/')) {
      const [month, year] = date.split('/');
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return `${months[parseInt(month) - 1] || ''} ${year}`;
    }
    
    if (date.includes('-')) {
      const [year, month] = date.split('-');
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return `${months[parseInt(month) - 1] || ''} ${year}`;
    }
    
    return date;
  };

  const start = formatDate(startDate || '');
  const end = isCurrent ? currentLabel : formatDate(endDate || '');

  if (!start && !end) return null;

  return (
    <span className={cn("text-sm text-gray-600", className)}>
      {start && end ? `${start} - ${end}` : start || end}
    </span>
  );
};

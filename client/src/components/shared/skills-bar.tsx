import React, { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

interface SkillsBarProps {
  level: 'beginner' | 'medium' | 'advanced' | 'expert';
  className?: string;
  showLevel?: boolean;
  animated?: boolean;
  delay?: number;
}

const levelWidths = {
  beginner: '25%',
  medium: '50%',
  advanced: '75%',
  expert: '100%'
};

export const SkillsBar: React.FC<SkillsBarProps> = ({
  level,
  className,
  showLevel = true,
  animated = true,
  delay = 0
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const barRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!animated) {
      setIsVisible(true);
      return;
    }

    const timer = setTimeout(() => {
      setIsVisible(true);
    }, delay);

    return () => clearTimeout(timer);
  }, [animated, delay]);

  const width = levelWidths[level];

  return (
    <div className={cn("skills-bar", className)}>
      <span
        ref={barRef}
        className={cn(
          "skill-level-fill",
          animated && isVisible && "animate-in"
        )}
        style={{
          width: isVisible ? width : '0%',
          transition: animated ? 'width 1.5s ease-out' : 'none'
        }}
      />
    </div>
  );
};

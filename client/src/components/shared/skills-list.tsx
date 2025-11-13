import React from 'react';
import { SkillsBar } from './skills-bar';
import { cn } from '@/lib/utils';

interface Skill {
  id: string;
  name: string;
  level: 'beginner' | 'medium' | 'advanced' | 'expert';
  showLevel?: boolean;
}

interface SkillsListProps {
  skills: Skill[];
  hideLevels?: boolean;
  className?: string;
  animated?: boolean;
  horizontal?: boolean;
}

export const SkillsList: React.FC<SkillsListProps> = ({
  skills,
  hideLevels = false,
  className,
  animated = true,
  horizontal = false
}) => {
  if (hideLevels || horizontal) {
    return (
      <div className={cn("skills-horizontal", className)}>
        {skills.map((skill) => (
          <span key={skill.id} className="skill-name-only">
            {skill.name}
          </span>
        ))}
      </div>
    );
  }

  return (
    <div className={cn("skills-container", className)}>
      {skills.map((skill, index) => (
        <div key={skill.id} className="skill-item">
          <span className="skill-name">{skill.name}</span>
          {skill.showLevel !== false && (
            <SkillsBar
              level={skill.level}
              animated={animated}
              delay={index * 100} // Stagger animation
            />
          )}
        </div>
      ))}
    </div>
  );
};

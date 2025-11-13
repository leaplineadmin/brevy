import React, { useState } from 'react';
import { SkillsList } from './skills-list';
import { Button } from '@/components/ui/button';

// Composant de test pour vérifier les animations des skills
export const SkillsAnimationTest: React.FC = () => {
  const [animated, setAnimated] = useState(true);
  const [hideLevels, setHideLevels] = useState(false);

  const testSkills = [
    { id: '1', name: 'JavaScript', level: 'expert' as const, showLevel: true },
    { id: '2', name: 'React', level: 'advanced' as const, showLevel: true },
    { id: '3', name: 'TypeScript', level: 'medium' as const, showLevel: true },
    { id: '4', name: 'Node.js', level: 'beginner' as const, showLevel: true },
  ];

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-2xl font-bold">Test des animations des skills-bar</h2>
      
      <div className="flex gap-4">
        <Button 
          onClick={() => setAnimated(!animated)}
          variant={animated ? "default" : "outline"}
        >
          {animated ? 'Désactiver' : 'Activer'} les animations
        </Button>
        
        <Button 
          onClick={() => setHideLevels(!hideLevels)}
          variant={hideLevels ? "default" : "outline"}
        >
          {hideLevels ? 'Afficher' : 'Masquer'} les niveaux
        </Button>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Template Bento Style</h3>
        <div className="template-bento" style={{ '--mainColor': '#3B82F6' } as any}>
          <div className="bento-card skills-card">
            <div className="skills section">
              <span className="section-title">Compétences</span>
              <SkillsList 
                skills={testSkills}
                hideLevels={hideLevels}
                animated={animated}
              />
            </div>
          </div>
        </div>

        <h3 className="text-lg font-semibold">Template Classic Style</h3>
        <div className="template-classic" style={{ '--mainColor': '#10B981' } as any}>
          <div className="skills-section">
            <h3 className="section-title">Compétences</h3>
            <div className="section-content">
              <SkillsList 
                skills={testSkills}
                hideLevels={hideLevels}
                animated={animated}
              />
            </div>
          </div>
        </div>

        <h3 className="text-lg font-semibold">Template Datalover Style</h3>
        <div className="template-datalover" style={{ '--mainColor': '#8B5CF6' } as any}>
          <div className="skills-container">
            <SkillsList 
              skills={testSkills}
              hideLevels={hideLevels}
              animated={animated}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

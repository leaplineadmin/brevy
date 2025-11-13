import { Button } from "@/components/ui/button";
import { DeleteButton } from "@/components/shared/delete-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trash2 } from "lucide-react";
import { useCVData } from "@/hooks/use-cv-data";
import { AddButton } from "./add-button";

export default function Hobbies() {
  const { 
    cvData, 
    addHobby, 
    updateHobby, 
    removeHobby,
    removeHobbySection
  } = useCVData();

  return (
    <div className="cv-section-content flex flex-col gap-6">
      {/* Titre de section avec bouton de suppression */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Hobbies</h3>
        <DeleteButton 
          onClick={removeHobbySection}
          className="h-8 w-8"
        />
      </div>
      
      {(!cvData.hobbies || cvData.hobbies.length === 0) ? (
        <div className="p-4 border border-lightGrey rounded-md bg-white/50 text-center text-neutral/60">
          <p>No hobbies added. Click on "+" to include them.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {(cvData.hobbies || []).map((hobby) => (
            <div key={hobby.id} className="cv-item-card">
              <div className="cv-item-header">
                <DeleteButton onClick={() => removeHobby(hobby.id)} />
              </div>
              
              <div className="cv-item-content">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor={`hobby-name-${hobby.id}`} className="cv-label">
                      Hobby
                    </Label>
                    <Input
                      id={`hobby-name-${hobby.id}`}
                      placeholder="Music, Sport, Reading"
                      value={hobby.name === undefined ? "" : hobby.name}
                      onChange={(e) =>
                        updateHobby(hobby.id, { name: e.target.value })
                      }
                      className="cv-input"
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      <AddButton onClick={addHobby}>
        Add a hobby
      </AddButton>
    </div>
  );
}

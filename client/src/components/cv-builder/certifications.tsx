import { Button } from "@/components/ui/button";
import { DeleteButton } from "@/components/shared/delete-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trash2 } from "lucide-react";
import { useCVData } from "@/hooks/use-cv-data";
import { AddButton } from "./add-button";
import { DateSelector } from "./date-selector";
import { YearSelector } from "./year-selector";

export default function Certifications() {
  const { 
    cvData, 
    addCertification, 
    updateCertification, 
    removeCertification,
    removeCertificationSection
  } = useCVData();

  return (
    <div className="cv-section-content flex flex-col gap-6">
      {/* Titre de section avec bouton de suppression */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Certifications</h3>
        <DeleteButton 
          onClick={removeCertificationSection}
          className="h-8 w-8"
        />
      </div>
      
      {(!cvData.certifications || cvData.certifications.length === 0) ? (
        <div className="p-4 border border-lightGrey rounded-md bg-white/50 text-center text-neutral/60">
          <p>No certifications added. Click on "+" to include them.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {(cvData.certifications || []).map((certification) => (
            <div key={certification.id} className="cv-item-card">
              <div className="cv-item-header">
                <DeleteButton onClick={() => removeCertification(certification.id)} />
              </div>
              
              <div className="cv-item-content">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor={`cert-name-${certification.id}`} className="cv-label">
                      Certification name
                    </Label>
                    <Input
                      id={`cert-name-${certification.id}`}
                      placeholder="Certification name"
                      value={certification.name === undefined ? "" : certification.name}
                      onChange={(e) =>
                        updateCertification(certification.id, { name: e.target.value })
                      }
                      className="cv-input"
                    />
                  </div>

                  <div>
                    <Label htmlFor={`cert-issuer-${certification.id}`} className="cv-label">
                      Training organization
                    </Label>
                    <Input
                      id={`cert-issuer-${certification.id}`}
                      placeholder="Training organization"
                      value={certification.issuer === undefined ? "" : certification.issuer}
                      onChange={(e) =>
                        updateCertification(certification.id, { issuer: e.target.value })
                      }
                      className="cv-input"
                    />
                  </div>

                  <div>
                    <YearSelector
                      label="Completion date"
                      id={`cert-year-${certification.id}`}
                      value={certification.date || ""}
                      onChange={(year) => {
                        updateCertification(certification.id, { date: year });
                      }}
                      placeholder="yyyy"
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      <AddButton onClick={addCertification}>
        Add a certification
      </AddButton>
    </div>
  );
}

import { createContext, ReactNode, useContext, useState, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { v4 as uuidv4 } from "uuid";
import { DEFAULT_MAIN_COLOR } from "@/components/cv-builder/shared/color-selector";
import {
  CVData,
  Experience,
  Education,
  Skill,
  Language,
  Tool,
  Certification,
  Hobby,
  cvDataSchema,
} from "@shared/schema";

interface CVContextType {
  cvData: CVData;
  templateType: "A4" | "digital";
  templateId: string;
  mainColor: string;
  title: string;
  setTitle: (title: string) => void;
  setTemplateType: (type: "A4" | "digital") => void;
  setTemplateId: (id: string) => void;
  setMainColor: (color: string) => void;
  updateCvData: (key: keyof CVData, value: any) => void;

  // Experience methods
  addExperience: () => void;
  updateExperience: (id: string, data: Partial<Experience>) => void;
  removeExperience: (id: string) => void;

  // Education methods
  addEducation: () => void;
  updateEducation: (id: string, data: Partial<Education>) => void;
  removeEducation: (id: string) => void;

  // Skill methods
  addSkill: () => void;
  updateSkill: (id: string, data: Partial<Skill>) => void;
  removeSkill: (id: string) => void;

  // Language methods
  addLanguage: () => void;
  updateLanguage: (id: string, data: Partial<Language>) => void;
  removeLanguage: (id: string) => void;

  // Tool methods
  addTool: () => void;
  updateTool: (id: string, data: Partial<Tool>) => void;
  removeTool: (id: string) => void;
  removeToolSection: () => void;

  // Certification methods
  addCertification: () => void;
  updateCertification: (id: string, data: Partial<Certification>) => void;
  removeCertification: (id: string) => void;
  removeCertificationSection: () => void;

  // Hobby methods
  addHobby: () => void;
  updateHobby: (id: string, data: Partial<Hobby>) => void;
  removeHobby: (id: string) => void;
  removeHobbySection: () => void;

  // Reset data
  resetData: () => void;

  // Set entire CV data at once (for loading saved CVs)
  setInitialData: (data: {
    cvData: CVData;
    templateType: "A4" | "digital";
    templateId: string;
    mainColor: string;
    title: string;
    displaySettings?: {
      hidePhoto: boolean;
      hideCity: boolean;
      hideSkillLevels: boolean;
      hideToolLevels: boolean;
      hideLanguageLevels: boolean;
      hideLinkedIn: boolean;
      hideWebsite: boolean;
    };
  }) => void;
}



const CVContext = createContext<CVContextType | null>(null);

export function CVProvider({ children }: { children: ReactNode }) {
  const { language, t } = useLanguage();
  // Données par défaut vides pour le formulaire
  const getDefaultData = () => {
    // Choisir le dial code par défaut selon la langue sélectionnée
    const defaultDial = language === 'fr' ? '+33' : '+1';
    return {
      photoUrl: "",
      firstName: "",
      lastName: "",
      position: "",
      email: "",
      phoneCountryCode: defaultDial,
      phone: "",
      city: "",
      country: "",
      summary: "",
      experience: [
        {
          id: "1",
          position: "",
          company: "",
          location: "",
          startMonth: "",
          startYear: "",
          endMonth: "",
          endYear: "",
          isCurrent: false,
          description: "",
        },
      ],
      education: [
        {
          id: "1",
          degree: "",
          diploma: "",
          school: "",
          location: "",
          from: "",
          to: "",
          startMonth: "",
          startYear: "",
          endMonth: "",
          endYear: "",
          description: "",
        },
      ],
      skills: [
        {
          id: "1",
          name: "",
          level: "medium" as const,
          showLevel: true,
        },
      ],
      languages: [
        {
          id: "1",
          name: "",
          level: "native" as const,
        },
      ],
      tools: undefined,
      certifications: undefined,
      hobbies: undefined,
    } as CVData;
  };
  
  const [cvData, setCvData] = useState<CVData>(getDefaultData());
  
  // Update phone country code when language changes (but not when user manually changes it)
  useEffect(() => {
    const defaultDial = language === 'fr' ? '+33' : '+1';
    // Only update if the current phoneCountryCode is the old language's default
    const oldDefaultDial = language === 'fr' ? '+1' : '+33';
    if (cvData.phoneCountryCode === oldDefaultDial) {
      setCvData(prev => ({
        ...prev,
        phoneCountryCode: defaultDial
      }));
    }
  }, [language]); // Remove cvData.phoneCountryCode from dependencies to avoid infinite loop
  const [templateType, setTemplateType] = useState<"A4" | "digital">("digital");
  const [templateId, setTemplateId] = useState<string>("template-classic"); // Template "Classic" par défaut
  const [mainColor, setMainColorState] = useState<string>(DEFAULT_MAIN_COLOR);
  
  const setMainColor = (color: string) => {
    setMainColorState(color);
  };
  const [title, setTitle] = useState<string>(t("cvBuilder.title.untitled"));

  const updateCvData = (key: keyof CVData, value: any) => {
    setCvData((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  // Experience methods
  const addExperience = () => {
    const newExperience: Experience = {
      id: uuidv4(),
      position: "",
      company: "",
      location: "",
      startMonth: "",
      startYear: "",
      endMonth: "",
      endYear: "",
      isCurrent: false,
      description: "",
    };

    setCvData((prev) => ({
      ...prev,
      experience: [...prev.experience, newExperience],
    }));
  };

  const updateExperience = (id: string, data: Partial<Experience>) => {
    setCvData((prev) => ({
      ...prev,
      experience: prev.experience.map((exp) =>
        exp.id === id ? { ...exp, ...data } : exp,
      ),
    }));
  };

  const removeExperience = (id: string) => {
    setCvData((prev) => ({
      ...prev,
      experience: prev.experience.filter((exp) => exp.id !== id),
    }));
  };

  // Education methods
  const addEducation = () => {
    const newEducation: Education = {
      id: uuidv4(),
      degree: "",
      diploma: "",
      school: "",
      location: "",
      from: "",
      to: "",
      startMonth: "",
      startYear: "",
      endMonth: "",
      endYear: "",
      description: "",
    };

    setCvData((prev) => ({
      ...prev,
      education: [...prev.education, newEducation],
    }));
  };

  const updateEducation = (id: string, data: Partial<Education>) => {
    setCvData((prev) => ({
      ...prev,
      education: prev.education.map((edu) =>
        edu.id === id ? { ...edu, ...data } : edu,
      ),
    }));
  };

  const removeEducation = (id: string) => {
    setCvData((prev) => ({
      ...prev,
      education: prev.education.filter((edu) => edu.id !== id),
    }));
  };

  // Skill methods
  const addSkill = () => {
    const newSkill: Skill = {
      id: uuidv4(),
      name: "",
      level: "medium", // Default to Intermediate
      showLevel: true, // Niveau visible par défaut
    };

    setCvData((prev) => ({
      ...prev,
      skills: [...prev.skills, newSkill],
    }));
  };

  const updateSkill = (id: string, data: Partial<Skill>) => {
    setCvData((prev) => ({
      ...prev,
      skills: prev.skills.map((skill) =>
        skill.id === id ? { ...skill, ...data } : skill,
      ),
    }));
  };

  const removeSkill = (id: string) => {
    setCvData((prev) => ({
      ...prev,
      skills: prev.skills.filter((skill) => skill.id !== id),
    }));
  };

  // Language methods
  const addLanguage = () => {
    const newLanguage: Language = {
      id: uuidv4(),
      name: "",
      level: "native", // Default to Native or Bilingual Proficiency
    };

    setCvData((prev) => ({
      ...prev,
      languages: [...prev.languages, newLanguage],
    }));
  };

  const updateLanguage = (id: string, data: Partial<Language>) => {
    setCvData((prev) => ({
      ...prev,
      languages: prev.languages.map((lang) =>
        lang.id === id ? { ...lang, ...data } : lang,
      ),
    }));
  };

  const removeLanguage = (id: string) => {
    setCvData((prev) => ({
      ...prev,
      languages: prev.languages.filter((lang) => lang.id !== id),
    }));
  };

  // Tool methods
  const addTool = () => {
    // Créer un seul outil vide pour le formulaire
    const newTool: Tool = {
      id: uuidv4(),
      name: "",
      level: "medium",
      showLevel: true,
    };

    setCvData((prev) => ({
      ...prev,
      tools: prev.tools ? [...prev.tools, newTool] : [newTool],
    }));
  };

  const updateTool = (id: string, data: Partial<Tool>) => {
    setCvData((prev) => ({
      ...prev,
      tools: (prev.tools || []).map((tool) =>
        tool.id === id ? { ...tool, ...data } : tool,
      ),
    }));
  };

  const removeTool = (id: string) => {
    setCvData((prev) => ({
      ...prev,
      tools: (prev.tools || []).filter((tool) => tool.id !== id),
    }));
  };

  const removeToolSection = () => {
    setCvData((prev) => ({
      ...prev,
      tools: undefined,
    }));
  };

  // Certification methods
  const addCertification = () => {
    const newCertification: Certification = {
      id: uuidv4(),
      name: "",
      issuer: "",
      date: "",
    };

    setCvData((prev) => ({
      ...prev,
      certifications: prev.certifications
        ? [...prev.certifications, newCertification]
        : [newCertification],
    }));
  };

  const updateCertification = (id: string, data: Partial<Certification>) => {
    setCvData((prev) => ({
      ...prev,
      certifications: (prev.certifications || []).map((cert) =>
        cert.id === id ? { ...cert, ...data } : cert,
      ),
    }));
  };

  const removeCertification = (id: string) => {
    setCvData((prev) => ({
      ...prev,
      certifications: (prev.certifications || []).filter(
        (cert) => cert.id !== id,
      ),
    }));
  };

  const removeCertificationSection = () => {
    setCvData((prev) => ({
      ...prev,
      certifications: undefined,
    }));
  };

  // Hobby methods
  const addHobby = () => {
    const newHobby: Hobby = {
      id: uuidv4(),
      name: "",
    };

    setCvData((prev) => ({
      ...prev,
      hobbies: prev.hobbies ? [...prev.hobbies, newHobby] : [newHobby],
    }));
  };

  const updateHobby = (id: string, data: Partial<Hobby>) => {
    setCvData((prev) => ({
      ...prev,
      hobbies: (prev.hobbies || []).map((hobby) =>
        hobby.id === id ? { ...hobby, ...data } : hobby,
      ),
    }));
  };

  const removeHobby = (id: string) => {
    setCvData((prev) => ({
      ...prev,
      hobbies: (prev.hobbies || []).filter((hobby) => hobby.id !== id),
    }));
  };

  const removeHobbySection = () => {
    setCvData((prev) => ({
      ...prev,
      hobbies: undefined,
    }));
  };

  // Reset all data
  const resetData = () => {
    setCvData(getDefaultData());
    setTemplateType("digital");
    setTemplateId("template-classic"); // Template "Classic" par défaut
    setMainColor(DEFAULT_MAIN_COLOR); // Utiliser la même couleur par défaut que le sélecteur
    setTitle(t("cvBuilder.title.untitled"));
  };

  // Set all data at once (for loading saved CVs)
  const setInitialData = (data: {
    cvData: CVData;
    templateType: "A4" | "digital";
    templateId: string;
    mainColor: string;
    title: string;
  }) => {
    console.log('🔍 [CV DATA] Setting initial data:', data);
    console.log('🔍 [CV DATA] Languages in data:', data.cvData.languages);
    
    // Ensure languages array exists and is properly structured
    const processedCvData = {
      ...data.cvData,
      languages: data.cvData.languages && Array.isArray(data.cvData.languages) && data.cvData.languages.length > 0 
        ? data.cvData.languages 
        : [
            {
              id: uuidv4(),
              name: "",
              level: "native" as const,
            }
          ]
    };
    
    console.log('🔍 [CV DATA] Processed languages:', processedCvData.languages);
    
    setCvData(processedCvData);
    setTemplateType(data.templateType);
    setTemplateId(data.templateId);
    setTitle(data.title);
    
    // Mettre à jour la couleur
    setMainColorState(data.mainColor);
  };

  return (
    <CVContext.Provider
      value={{
        cvData,
        templateType,
        templateId,
        mainColor,
        title,
        setTitle,
        setTemplateType,
        setTemplateId,
        setMainColor,
        updateCvData,
        addExperience,
        updateExperience,
        removeExperience,
        addEducation,
        updateEducation,
        removeEducation,
        addSkill,
        updateSkill,
        removeSkill,
        addLanguage,
        updateLanguage,
        removeLanguage,
        addTool,
        updateTool,
        removeTool,
        removeToolSection,
        addCertification,
        updateCertification,
        removeCertification,
        removeCertificationSection,
        addHobby,
        updateHobby,
        removeHobby,
        removeHobbySection,
        resetData,
        setInitialData,
      }}
    >
      {children}
    </CVContext.Provider>
  );
}

export function useCVData() {
  const context = useContext(CVContext);
  if (!context) {
    throw new Error("useCVData must be used within a CVProvider");
  }
  return context;
}

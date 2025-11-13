import { CV } from "@/types/cv";

export interface CVDefaultData {
  personalInfo: {
    firstName: string;
    lastName: string;
    jobTitle: string;
    city: string;
    country: string;
    phone: string;
    summary: string;
  };
  experience: Array<{
    company: string;
    position: string;
    location: string;
    description: string;
    from?: string;
    to?: string;
  }>;
  education: Array<{
    school: string;
    diploma: string;
    location: string;
    description?: string;
    from?: string;
    to?: string;
  }>;
  skills: Array<{
    name: string;
  }>;
  languages: Array<{
    name: string;
  }>;
  tools: Array<{
    name: string;
  }>;
}

// Données par défaut en français
export const frenchDefaultData: CVDefaultData = {
  personalInfo: {
    firstName: "Alex",
    lastName: "Martin",
    jobTitle: "Intitulé du poste",
    city: "Ville",
    country: "Pays",
    phone: "+00 1 23 45 67 89",
    summary: "Professionnel dynamique et à l'écoute des clients, fort de plus de 4 ans d'expérience..."
  },
  experience: [
    {
      company: "Nom de l'Entreprise",
      position: "Intitulé du Poste",
      location: "Ville, Pays",
      description: "Responsable de diverses missions au sein de l'entreprise. Collaboration avec les équipes internes et externes...",
      from: "Jan 2020",
      to: "Present"
    },
    {
      company: "Nom de l'Entreprise",
      position: "Intitulé du Poste",
      location: "Ville, Pays",
      description: "Responsable de diverses missions au sein de l'entreprise. Collaboration avec les équipes internes et externes...",
      from: "Jun 2018",
      to: "Dec 2019"
    }
  ],
  education: [
    {
      school: "Nom de l'école",
      diploma: "Diplôme obtenu",
      location: "Ville, Pays",
      description: "Formation complète dans le domaine d'études. Acquisition de compétences théoriques et pratiques essentielles…",
      from: "Sep 2016",
      to: "Jun 2018"
    },
    {
      school: "Nom de l'école",
      diploma: "Diplôme obtenu",
      location: "Ville, Pays",
      description: "Formation complète dans le domaine d'études. Acquisition de compétences théoriques et pratiques essentielles…",
      from: "Sep 2013",
      to: "Jun 2016"
    }
  ],
  skills: [
    { name: "Communication" },
    { name: "Gestion de projet" }
  ],
  languages: [
    { name: "Anglais" },
    { name: "Espagnol" }
  ],
  tools: [
    { name: "Outils bureautique" },
    { name: "Outils no-code" }
  ]
};

// Données par défaut en anglais
export const englishDefaultData: CVDefaultData = {
  personalInfo: {
    firstName: "Alex",
    lastName: "Martin",
    jobTitle: "Job title",
    city: "City",
    country: "Country",
    phone: "+00 1 23 45 67 89",
    summary: "Dynamic and customer-oriented professional with over 4 years of experience..."
  },
  experience: [
    {
      company: "Company name",
      position: "Job title",
      location: "City, Country",
      description: "Responsible for various missions within the company. Collaboration with internal and external teams...",
      from: "Jan 2020",
      to: "Present"
    },
    {
      company: "Company name",
      position: "Job title",
      location: "City, Country",
      description: "Responsible for various missions within the company. Collaboration with internal and external teams...",
      from: "Jun 2018",
      to: "Dec 2019"
    }
  ],
  education: [
    {
      school: "School name",
      diploma: "Degree obtained",
      location: "City, Country",
      description: "Comprehensive training in the field of study. Acquisition of essential theoretical and practical skills…",
      from: "Sep 2016",
      to: "Jun 2018"
    },
    {
      school: "School name",
      diploma: "Degree obtained",
      location: "City, Country",
      description: "Comprehensive training in the field of study. Acquisition of essential theoretical and practical skills…",
      from: "Sep 2013",
      to: "Jun 2016"
    }
  ],
  skills: [
    { name: "Public speaking" },
    { name: "Project management" }
  ],
  languages: [
    { name: "English" },
    { name: "Spanish" }
  ],
  tools: [
    { name: "Adobe suite" },
    { name: "No-code tools" }
  ]
};

// Function to get default data according to language (defaults to English)
export const getDefaultCVData = (language: 'fr' | 'en' = 'en'): CVDefaultData => {
  return language === 'fr' ? frenchDefaultData : englishDefaultData;
};

// Function to check if a value is a default/example value that should be filtered out
export const isDefaultValue = (value: string, field: string): boolean => {
  if (!value || value.trim() === '') return true;
  
  // Check against known default values in both languages
  const defaultValues = [
    // English defaults
    "Alex", "Martin", "Job title", "City", "Country", "Company name", 
    "School name", "Degree obtained", "Public speaking", "Project Management",
    "Adobe suite", "No-code tools",
    // French defaults  
    "Intitulé du poste", "Ville", "Pays", "Nom de l'Entreprise", "Intitulé du Poste",
    "Nom de l'école", "Diplôme obtenu", "Anglais (Capacité professionnelle complète)",
    "Espagnol (Capacité professionnelle limitée)", "Outils bureautique", "Outils no-code",
    // Generic defaults
    "+00 1 23 45 67 89", "Ville, Pays", "City, Country"
  ];
  
  return defaultValues.includes(value.trim());
};

// Function to clean CV data by removing default/example values
export const cleanCVData = (cvData: any): any => {
  const cleaned = { ...cvData };
  
  // Clean personal info
  if (cleaned.personalInfo) {
    Object.keys(cleaned.personalInfo).forEach(key => {
      if (isDefaultValue(cleaned.personalInfo[key], key)) {
        cleaned.personalInfo[key] = '';
      }
    });
  }
  
  // Clean experience - remove entries that are all default values
  if (cleaned.experience) {
    cleaned.experience = cleaned.experience.filter((exp: any) => {
      const hasRealData = !isDefaultValue(exp.company || '', 'company') || 
                         !isDefaultValue(exp.position || '', 'position') ||
                         (exp.description && !exp.description.includes('Responsible for various missions'));
      return hasRealData;
    }).map((exp: any) => ({
      ...exp,
      company: isDefaultValue(exp.company || '', 'company') ? '' : exp.company,
      position: isDefaultValue(exp.position || '', 'position') ? '' : exp.position,
      location: isDefaultValue(exp.location || '', 'location') ? '' : exp.location,
    }));
  }
  
  // Clean education - remove entries that are all default values
  if (cleaned.education) {
    cleaned.education = cleaned.education.filter((edu: any) => {
      const hasRealData = !isDefaultValue(edu.school || '', 'school') || 
                         !isDefaultValue(edu.diploma || '', 'diploma');
      return hasRealData;
    }).map((edu: any) => ({
      ...edu,
      school: isDefaultValue(edu.school || '', 'school') ? '' : edu.school,
      diploma: isDefaultValue(edu.diploma || '', 'diploma') ? '' : edu.diploma,
      location: isDefaultValue(edu.location || '', 'location') ? '' : edu.location,
    }));
  }
  
  // Clean skills - remove default skill names
  if (cleaned.skills) {
    cleaned.skills = cleaned.skills.filter((skill: any) => 
      !isDefaultValue(skill.name || '', 'skill')
    );
  }
  
  // Clean languages - remove empty languages or those with default names only
  if (cleaned.languages) {
    console.log('🧹 [CLEAN CV DATA] Original languages:', cleaned.languages);
    cleaned.languages = cleaned.languages.filter((lang: any) => {
      // Keep languages that have a name and it's not empty
      const hasName = lang.name && lang.name.trim() !== '';
      // Only remove if it's truly a default/example value (like the long French descriptions)
      const isDefault = isDefaultValue(lang.name || '', 'language');
      const shouldKeep = hasName && !isDefault;
      console.log(`🧹 [CLEAN CV DATA] Language "${lang.name}": hasName=${hasName}, isDefault=${isDefault}, keep=${shouldKeep}`);
      return shouldKeep;
    });
    console.log('🧹 [CLEAN CV DATA] Cleaned languages:', cleaned.languages);
  }
  
  // Clean tools - remove default tool names
  if (cleaned.tools) {
    cleaned.tools = cleaned.tools.filter((tool: any) => 
      !isDefaultValue(tool.name || '', 'tool')
    );
  }
  
  return cleaned;
};

// Function to create a complete CV with default data (defaults to English)
export const createDefaultCV = (language: 'fr' | 'en' = 'en'): CV => {
  const data = getDefaultCVData(language);
  
  return {
    personalInfo: {
      firstName: '',
      lastName: '',
      jobTitle: '',
      email: '',
      phone: '',
      country: '',
      city: '',
      linkedin: '',
      summary: '',
      photoUrl: '',
      // Les données par défaut seront utilisées dans les templates quand les champs sont vides
    },
    experience: [
      {
        id: '1',
        company: '',
        position: '',
        location: '',
        from: '2020-01',
        to: 'Present',
        summary: '',
        current: true,
      },
      {
        id: '2',
        company: '',
        position: '',
        location: '',
        from: '2018-06',
        to: '2019-12',
        summary: '',
        current: false,
      }
    ],
    education: [
      {
        id: '1',
        school: '',
        diploma: '',
        location: '',
        from: '2016-09',
        to: '2018-06',
      },
      {
        id: '2',
        school: '',
        diploma: '',
        location: '',
        from: '2013-09',
        to: '2016-06',
      }
    ],
    skills: [
      {
        id: '1',
        name: '',
        level: 'expert',
        showLevel: true,
      },
      {
        id: '2',
        name: '',
        level: 'expert',
        showLevel: true,
      }
    ],
    languages: [
      {
        id: '1',
        name: 'Français',
        level: 'native',
        showLevel: true,
      },
      {
        id: '2',
        name: '',
        level: 'native',
        showLevel: true,
      }
    ],
    tools: [],
    certifications: [],
    hobbies: [],
    style: {
      mainColor: '#008BC7',
      template: 'modern',
    }
  };
};
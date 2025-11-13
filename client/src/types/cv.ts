export interface PersonalInfo {
  firstName?: string;
  lastName?: string;
  jobTitle?: string;
  position?: string;
  photo?: string;
  photoUrl?: string;
  email?: string;
  phoneCountryCode?: string;
  phone?: string;
  country?: string;
  city?: string;
  linkedin?: string;
  website?: string;
  summary?: string;
}

export interface Experience {
  id: string;
  company?: string;
  position?: string;
  location?: string;
  from?: string;
  to?: string;
  startMonth?: string;
  startYear?: string;
  endMonth?: string;
  endYear?: string;
  summary?: string;
  description?: string;
  current?: boolean;
  isCurrent?: boolean;
}

export interface Education {
  id: string;
  school?: string;
  diploma?: string;
  location?: string;
  from?: string;
  to?: string;
  description?: string;
  degree?: string;
  startMonth?: string;
  startYear?: string;
  endMonth?: string;
  endYear?: string;
}

export interface Skill {
  id: string;
  name?: string;
  level?: 'beginner' | 'medium' | 'advanced' | 'expert';
  showLevel?: boolean;
}

export interface Language {
  id: string;
  name?: string;
  level?: 'beginner' | 'intermediate' | 'advanced' | 'native';
  showLevel?: boolean;
}

export interface Certification {
  id: string;
  name?: string;
  issuer?: string;
  date?: string;
}

export interface Hobby {
  id: string;
  name?: string;
}



export interface CVStyle {
  mainColor?: string;
  template?: string;
}

export interface Tool {
  id: string;
  name?: string;
  level?: 'beginner' | 'medium' | 'advanced' | 'expert';
  showLevel?: boolean;
}

export interface CV {
  personalInfo: PersonalInfo;
  experience: Experience[];
  education: Education[];
  skills: Skill[];
  languages: Language[];
  tools?: Tool[];
  certifications?: Certification[];
  hobbies?: Hobby[];
  style: CVStyle;
}
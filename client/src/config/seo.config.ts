export const seoConfig = {
  en: {
    home: {
      title: "CVfolio - Create Interactive Resumes | Professional CV Builder",
      description: "Create professional, interactive resumes in minutes. No design skills required. Choose from multiple templates, customize colors, and share your CV with a unique link. Download as PDF.",
      keywords: "CV builder, resume builder, interactive CV, professional resume, CV templates, online CV, digital resume, PDF CV",
      ogLocale: "en_US",
      canonical: "https://cvfolio.app/",
      lang: "en"
    },
    blog: {
      title: "CVfolio Blog - Career Tips, Resume Guides & Job Search Advice",
      description: "Discover expert tips on creating professional resumes, career advice, and job search strategies. Learn how to optimize your CV for ATS and stand out to recruiters.",
      keywords: "resume tips, career advice, CV guide, job search, ATS optimization, professional resume",
      ogLocale: "en_US",
      canonical: "https://www.cvfolio.app/blog",
      lang: "en"
    }
  },
  fr: {
    home: {
      title: "CVfolio - Créateur de CV Interactifs | Générateur de CV Professionnel",
      description: "Créez des CV professionnels et interactifs en quelques minutes. Aucune compétence en design requise. Choisissez parmi plusieurs modèles, personnalisez les couleurs et partagez votre CV avec un lien unique. Téléchargement PDF disponible.",
      keywords: "créateur de CV, générateur de CV, CV interactif, CV professionnel, modèles de CV, CV en ligne, CV numérique, CV PDF",
      ogLocale: "fr_FR",
      canonical: "https://cvfolio.app/fr/",
      lang: "fr"
    },
    blog: {
      title: "Blog CVfolio - Conseils Carrière, Guides CV & Astuces Recherche d'Emploi",
      description: "Découvrez des conseils d'experts pour créer des CV professionnels, des astuces carrière et des stratégies de recherche d'emploi. Apprenez à optimiser votre CV pour les ATS et à vous démarquer auprès des recruteurs.",
      keywords: "conseils CV, astuces carrière, guide CV, recherche d'emploi, optimisation ATS, CV professionnel",
      ogLocale: "fr_FR",
      canonical: "https://www.cvfolio.app/blog",
      lang: "fr"
    }
  }
};

export const getHreflangLinks = () => {
  return [
    { hreflang: 'en', href: 'https://cvfolio.app/' },
    { hreflang: 'fr', href: 'https://cvfolio.app/fr/' },
    { hreflang: 'x-default', href: 'https://cvfolio.app/' }
  ];
};

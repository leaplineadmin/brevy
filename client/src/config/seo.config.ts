export const seoConfig = {
  en: {
    home: {
      title: "Brevy - Create Interactive Resumes | Professional CV Builder",
      description: "Create professional, interactive resumes in minutes. No design skills required. Choose from multiple templates, customize colors, and share your CV with a unique link. Download as PDF.",
      keywords: "CV builder, resume builder, interactive CV, professional resume, CV templates, online CV, digital resume, PDF CV",
      ogLocale: "en_US",
      canonical: "https://brevy.me/",
      lang: "en"
    },
    blog: {
      title: "Brevy Blog - Career Tips, Resume Guides & Job Search Advice",
      description: "Discover expert tips on creating professional resumes, career advice, and job search strategies. Learn how to optimize your CV for ATS and stand out to recruiters.",
      keywords: "resume tips, career advice, CV guide, job search, ATS optimization, professional resume",
      ogLocale: "en_US",
      canonical: "https://brevy.me/blog",
      lang: "en"
    },
    privacy: {
      title: "Privacy Policy - Brevy | Data Protection & GDPR Compliance",
      description: "Learn how Brevy protects your personal data. Our privacy policy explains data collection, usage, storage, and your rights under GDPR.",
      keywords: "privacy policy, data protection, GDPR, personal data, privacy rights, data security",
      ogLocale: "en_US",
      canonical: "https://brevy.me/privacy-policy",
      lang: "en"
    },
    terms: {
      title: "Terms of Service - Brevy | User Agreement & Legal Terms",
      description: "Read Brevy's terms of service. Understand your rights and responsibilities when using our CV builder platform.",
      keywords: "terms of service, user agreement, legal terms, terms and conditions, service agreement",
      ogLocale: "en_US",
      canonical: "https://brevy.me/terms-of-service",
      lang: "en"
    },
    legal: {
      title: "Legal Notice - Brevy | Company Information & Contact",
      description: "Legal notice and company information for Brevy. Find contact details, hosting information, and legal entity details.",
      keywords: "legal notice, company information, contact, legal entity, hosting",
      ogLocale: "en_US",
      canonical: "https://brevy.me/legal-notice",
      lang: "en"
    }
  },
  fr: {
    home: {
      title: "Brevy - Créateur de CV Interactifs | Générateur de CV Professionnel",
      description: "Créez des CV professionnels et interactifs en quelques minutes. Aucune compétence en design requise. Choisissez parmi plusieurs modèles, personnalisez les couleurs et partagez votre CV avec un lien unique. Téléchargement PDF disponible.",
      keywords: "créateur de CV, générateur de CV, CV interactif, CV professionnel, modèles de CV, CV en ligne, CV numérique, CV PDF",
      ogLocale: "fr_FR",
      canonical: "https://brevy.me/fr/",
      lang: "fr"
    },
    blog: {
      title: "Blog Brevy - Conseils Carrière, Guides CV & Astuces Recherche d'Emploi",
      description: "Découvrez des conseils d'experts pour créer des CV professionnels, des astuces carrière et des stratégies de recherche d'emploi. Apprenez à optimiser votre CV pour les ATS et à vous démarquer auprès des recruteurs.",
      keywords: "conseils CV, astuces carrière, guide CV, recherche d'emploi, optimisation ATS, CV professionnel",
      ogLocale: "fr_FR",
      canonical: "https://brevy.me/blog",
      lang: "fr"
    },
    privacy: {
      title: "Politique de Confidentialité - Brevy | Protection des Données & RGPD",
      description: "Découvrez comment Brevy protège vos données personnelles. Notre politique de confidentialité explique la collecte, l'utilisation, le stockage des données et vos droits sous le RGPD.",
      keywords: "politique de confidentialité, protection des données, RGPD, données personnelles, droits de confidentialité, sécurité des données",
      ogLocale: "fr_FR",
      canonical: "https://brevy.me/privacy-policy",
      lang: "fr"
    },
    terms: {
      title: "Conditions d'Utilisation - Brevy | Accord Utilisateur & Conditions Légales",
      description: "Lisez les conditions d'utilisation de Brevy. Comprenez vos droits et responsabilités lors de l'utilisation de notre plateforme de création de CV.",
      keywords: "conditions d'utilisation, accord utilisateur, conditions légales, termes et conditions, accord de service",
      ogLocale: "fr_FR",
      canonical: "https://brevy.me/terms-of-service",
      lang: "fr"
    },
    legal: {
      title: "Mentions Légales - Brevy | Informations Entreprise & Contact",
      description: "Mentions légales et informations sur l'entreprise Brevy. Trouvez les coordonnées, informations d'hébergement et détails de l'entité légale.",
      keywords: "mentions légales, informations entreprise, contact, entité légale, hébergement",
      ogLocale: "fr_FR",
      canonical: "https://brevy.me/legal-notice",
      lang: "fr"
    }
  }
};

export const getHreflangLinks = () => {
  return [
    { hreflang: 'en', href: 'https://brevy.me/' },
    { hreflang: 'fr', href: 'https://brevy.me/fr/' },
    { hreflang: 'x-default', href: 'https://brevy.me/' }
  ];
};

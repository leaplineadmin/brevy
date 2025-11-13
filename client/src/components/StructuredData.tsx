import { Helmet } from 'react-helmet-async';

interface StructuredDataProps {
  lang?: string;
}

export const StructuredData = ({ lang = 'en' }: StructuredDataProps) => {
  const structuredDataConfig = {
    en: {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      "name": "Brevy",
      "description": "Create professional, interactive resumes in minutes. No design skills required.",
      "url": "https://brevy.me",
      "inLanguage": "en-US",
      "applicationCategory": "BusinessApplication",
      "operatingSystem": "Web Browser",
      "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "USD"
      },
      "creator": {
        "@type": "Organization",
        "name": "Brevy"
      }
    },
    fr: {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      "name": "Brevy",
      "description": "Créez des CV professionnels et interactifs en quelques minutes. Aucune compétence en design requise.",
      "url": "https://brevy.me/fr",
      "inLanguage": "fr-FR",
      "applicationCategory": "BusinessApplication",
      "operatingSystem": "Navigateur Web",
      "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "EUR"
      },
      "creator": {
        "@type": "Organization",
        "name": "Brevy"
      }
    }
  };

  const structuredData = structuredDataConfig[lang as keyof typeof structuredDataConfig] || structuredDataConfig.en;

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(structuredData)}
      </script>
    </Helmet>
  );
};

import { Helmet } from 'react-helmet-async';

interface StructuredDataProps {
  lang?: string;
}

export const StructuredData = ({ lang = 'en' }: StructuredDataProps) => {
  const organizationSchema = {
    "@type": "Organization",
    "name": "Brevy",
    "url": "https://brevy.me",
    "logo": "https://brevy.me/logo-brevy.svg",
    "sameAs": [],
    "contactPoint": {
      "@type": "ContactPoint",
      "contactType": "Customer Service",
      "email": "contact@brevy.me"
    }
  };

  const structuredDataConfig = {
    en: [
      {
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
        "creator": organizationSchema,
        "publisher": organizationSchema
      },
      {
        "@context": "https://schema.org",
        "@type": "WebSite",
        "name": "Brevy",
        "url": "https://brevy.me",
        "image": "https://brevy.me/assets/ogImage-brevy.webp",
        "description": "Create interactive resumes in minutes. Export ATS-friendly PDFs.",
        "inLanguage": "en-US",
        "potentialAction": {
          "@type": "SearchAction",
          "target": "https://brevy.me/search?q={search_term_string}",
          "query-input": "required name=search_term_string"
        },
        "publisher": organizationSchema
      },
      organizationSchema
    ],
    fr: [
      {
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
        "creator": organizationSchema,
        "publisher": organizationSchema
      },
      {
        "@context": "https://schema.org",
        "@type": "WebSite",
        "name": "Brevy",
        "url": "https://brevy.me",
        "image": "https://brevy.me/assets/ogImage-brevy.webp",
        "description": "Créez des CV interactifs en quelques minutes. Exportez des PDF compatibles ATS.",
        "inLanguage": "fr-FR",
        "potentialAction": {
          "@type": "SearchAction",
          "target": "https://brevy.me/search?q={search_term_string}",
          "query-input": "required name=search_term_string"
        },
        "publisher": organizationSchema
      },
      organizationSchema
    ]
  };

  const structuredData = structuredDataConfig[lang as keyof typeof structuredDataConfig] || structuredDataConfig.en;

  return (
    <Helmet>
      {Array.isArray(structuredData) ? (
        structuredData.map((schema, index) => (
          <script key={index} type="application/ld+json">
            {JSON.stringify(schema)}
          </script>
        ))
      ) : (
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      )}
    </Helmet>
  );
};

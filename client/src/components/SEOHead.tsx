import { Helmet } from 'react-helmet-async';
import { seoConfig, getHreflangLinks } from '../config/seo.config';

interface SEOHeadProps {
  lang?: string;
  page?: string;
  // Custom SEO props for blog articles
  customTitle?: string;
  customDescription?: string;
  customKeywords?: string;
  customCanonical?: string;
  customOgImage?: string;
  // Article-specific props
  isArticle?: boolean;
  articlePublishedTime?: string;
  articleModifiedTime?: string;
}

export const SEOHead = ({ 
  lang = 'en', 
  page = 'home',
  customTitle,
  customDescription,
  customKeywords,
  customCanonical,
  customOgImage,
  isArticle = false,
  articlePublishedTime,
  articleModifiedTime,
}: SEOHeadProps) => {
  const defaultSeo = seoConfig[lang as keyof typeof seoConfig]?.[page as keyof typeof seoConfig.en] || seoConfig.en.home;
  
  // Use custom props if provided, otherwise fall back to config
  const seo = {
    title: customTitle || defaultSeo.title,
    description: customDescription || defaultSeo.description,
    keywords: customKeywords || defaultSeo.keywords,
    canonical: customCanonical || defaultSeo.canonical,
    ogLocale: defaultSeo.ogLocale,
    lang: defaultSeo.lang,
  };
  
  const hreflangLinks = getHreflangLinks();
  const ogImage = customOgImage || "https://www.brevy.app/assets/imgHeader-brevy.webp";

  return (
    <Helmet>
      <html lang={seo.lang} />
      <title>{seo.title}</title>
      <meta name="title" content={seo.title} />
      <meta name="description" content={seo.description} />
      <meta name="keywords" content={seo.keywords} />
      <meta name="author" content="CVfolio" />
      <meta name="robots" content="index, follow" />
      
      <link rel="canonical" href={seo.canonical} />
      
      {hreflangLinks.map(link => (
        <link 
          key={link.hreflang}
          rel="alternate" 
          hreflang={link.hreflang} 
          href={link.href} 
        />
      ))}
      
      <meta property="og:type" content={isArticle ? "article" : "website"} />
      <meta property="og:url" content={seo.canonical} />
      <meta property="og:title" content={seo.title} />
      <meta property="og:description" content={seo.description} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:site_name" content="CVfolio" />
      <meta property="og:locale" content={seo.ogLocale} />
      {isArticle && articlePublishedTime && (
        <meta property="article:published_time" content={articlePublishedTime} />
      )}
      {isArticle && articleModifiedTime && (
        <meta property="article:modified_time" content={articleModifiedTime} />
      )}
      
      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:url" content={seo.canonical} />
      <meta property="twitter:title" content={seo.title} />
      <meta property="twitter:description" content={seo.description} />
      <meta property="twitter:image" content={ogImage} />
      
      <meta name="theme-color" content="#2563eb" />
      <meta name="msapplication-TileColor" content="#2563eb" />
    </Helmet>
  );
};

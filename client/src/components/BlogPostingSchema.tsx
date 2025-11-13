import React from 'react';
import { Helmet } from 'react-helmet-async';

interface BlogPostingSchemaProps {
  headline: string;
  description: string;
  image: string;
  url: string;
  publishedTime: string;
  modifiedTime?: string;
}

/**
 * Schema.org BlogPosting JSON-LD component
 * Adds structured data for blog articles to improve SEO
 */
export const BlogPostingSchema: React.FC<BlogPostingSchemaProps> = ({
  headline,
  description,
  image,
  url,
  publishedTime,
  modifiedTime,
}) => {
  const schema = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": url,
    },
    "headline": headline,
    "description": description,
    "image": image,
    "author": {
      "@type": "Organization",
      "name": "Brevy",
      "url": "https://brevy.me"
    },
    "publisher": {
      "@type": "Organization",
      "name": "Brevy",
      "url": "https://brevy.me",
      "logo": {
        "@type": "ImageObject",
        "url": "https://brevy.me/logo-brevy.svg",
        "width": 85,
        "height": 32
      },
    },
    "datePublished": publishedTime.split('T')[0], // Format: YYYY-MM-DD
    "dateModified": (modifiedTime || publishedTime).split('T')[0],
  };

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(schema)}
      </script>
    </Helmet>
  );
};


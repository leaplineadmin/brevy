/**
 * Centralized blog articles data
 * This file contains all blog articles metadata for SEO and routing
 */

import article1Image from "@/assets/blog/cvfolioarticle_1.webp";
import article2Image from "@/assets/blog/cvfolioarticle_2.webp";
import article3Image from "@/assets/blog/cvfolioarticle_3.webp";

export interface BlogArticle {
  slug: string;
  title: {
    en: string;
    fr: string;
  };
  description: {
    en: string;
    fr: string;
  };
  image: string;
  publishedTime: string;
  modifiedTime?: string;
  keywords?: {
    en: string;
    fr: string;
  };
}

export const blogArticles: BlogArticle[] = [
  {
    slug: 'how-to-create-professional-resume-2025',
    title: {
      en: 'How to Create a Professional Resume in 2025: The Complete Guide',
      fr: 'Comment Créer un CV Professionnel en 2025 : Le Guide Complet (+ Modèles Gratuits)',
    },
    description: {
      en: 'Learn how to create a professional resume in 2025 with our complete step-by-step guide. Expert tips, free templates, and ATS optimization advice.',
      fr: 'Vous cherchez à créer un CV professionnel qui se démarque en 2025 ? Suivez notre guide complet étape par étape, découvrez des conseils d\'experts et accédez à des modèles gratuits pour décrocher l\'emploi de vos rêves.',
    },
    image: article1Image,
    publishedTime: '2025-01-15T10:00:00Z',
    keywords: {
      en: 'how to create a resume, make a professional resume, create resume online, free resume template, resume 2025, resume guide, resume example',
      fr: 'comment créer un cv, faire un cv professionnel, créer cv en ligne, modèle cv gratuit, cv 2025, guide cv, exemple cv',
    },
  },
  {
    slug: 'how-to-create-resume-website-10-minutes',
    title: {
      en: 'How to Create a Professional Resume Website in 10 Minutes (Without Coding)',
      fr: 'Comment Créer un Site CV Professionnel en 10 Minutes (Sans Coder)',
    },
    description: {
      en: 'Want to create a professional resume website without knowing how to code? Discover how to publish your own resume online in less than 10 minutes and get a unique link to share with recruiters.',
      fr: 'Vous voulez créer un site CV professionnel sans savoir coder ? Découvrez comment publier votre propre CV en ligne en moins de 10 minutes, et obtenez un lien unique à partager avec les recruteurs.',
    },
    image: article2Image,
    publishedTime: '2025-01-20T10:00:00Z',
    keywords: {
      en: 'create resume website, resume website without coding, professional resume website, free online resume, online portfolio, personal website for resume',
      fr: 'créer site cv, site cv sans coder, site cv professionnel, cv en ligne gratuit, portfolio en ligne, site personnel pour cv',
    },
  },
  {
    slug: 'top-7-best-resume-builder-tools-2025',
    title: {
      en: 'Top 7 Best Tools to Create a Resume Online in 2025 (Free and Paid)',
      fr: 'Top 7 Meilleurs Outils pour Créer un CV en Ligne en 2025 (Gratuits et Payants)',
    },
    description: {
      en: 'Looking for the best tool to create your resume in 2025? We\'ve tested and compared the 7 best platforms (free and paid) to help you choose the perfect resume builder.',
      fr: 'À la recherche du meilleur outil pour créer votre CV en 2025 ? Nous avons testé et comparé les 7 meilleures plateformes (gratuites et payantes) pour vous aider à choisir le créateur de CV parfait.',
    },
    image: article3Image,
    publishedTime: '2025-01-25T10:00:00Z',
    keywords: {
      en: 'best resume tools online, free resume builder, resume software, resume website, resume comparison, Canva, Zety, CVfolio',
      fr: 'meilleurs outils cv en ligne, créateur de cv gratuit, logiciel cv, site pour faire cv, comparatif cv, Canva, Zety, CVfolio',
    },
  },
];

/**
 * Get article by slug
 */
export function getArticleBySlug(slug: string): BlogArticle | undefined {
  return blogArticles.find(article => article.slug === slug);
}

/**
 * Get all articles (for homepage and related articles)
 */
export function getAllArticles(): BlogArticle[] {
  return blogArticles;
}

/**
 * Get related articles (exclude current article)
 */
export function getRelatedArticles(currentSlug: string, limit: number = 2): BlogArticle[] {
  return blogArticles
    .filter(article => article.slug !== currentSlug)
    .slice(0, limit);
}


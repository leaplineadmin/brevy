import React from "react";
import { useRoute } from "wouter";
import BlogArticle1 from "./blog-article-1";
import BlogArticle2 from "./blog-article-2";
import BlogArticle3 from "./blog-article-3";
import { getArticleBySlug } from "@/lib/blog-data";

// Map slugs to article components (using English slugs)
const articleMap: Record<string, React.ComponentType> = {
  "how-to-create-professional-resume-2025": BlogArticle1,
  "how-to-create-resume-website-10-minutes": BlogArticle2,
  "top-7-best-resume-builder-tools-2025": BlogArticle3,
  // Legacy French slugs for backward compatibility
  "comment-creer-cv-professionnel-2025": BlogArticle1,
  "comment-creer-site-cv-professionnel-10-minutes": BlogArticle2,
  "meilleurs-outils-creer-cv-en-ligne": BlogArticle3,
};

export default function BlogArticle() {
  const [match, params] = useRoute("/blog/:slug");
  const articleSlug = params?.slug || "";

  const ArticleComponent = articleMap[articleSlug];

  if (!ArticleComponent) {
    // Fallback to 404 or default article
    return <BlogArticle1 />;
  }

  return <ArticleComponent />;
}


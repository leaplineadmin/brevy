import { useLanguage } from "@/contexts/LanguageContext";
import { SEOHead } from "@/components/SEOHead";
import Navbar from "@/components/layout/navbar";
import { ArticleCard } from "@/components/shared/article-card";
import { Helmet } from "react-helmet-async";
import { getAllArticles } from "@/lib/blog-data";
import brevyHomeDesc1 from "@/assets/brevyhomedesc_1.webp";

export default function Blog() {
  const { language } = useLanguage();
  const allArticles = getAllArticles();

  // Map articles to ArticleCard format
  const articles = allArticles.map((article) => ({
    id: article.slug,
    slug: article.slug,
    title: article.title[language as 'en' | 'fr'] || article.title.en,
    description: article.description[language as 'en' | 'fr'] || article.description.en,
    link: `/blog/${article.slug}`,
    date: article.publishedTime.split('T')[0], // Extract date from ISO string
    imageUrl: article.image || brevyHomeDesc1,
  }));

  return (
    <>
      <Helmet>
        {/* Google tag (gtag.js) */}
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-RZK3DRL6LH"></script>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-RZK3DRL6LH');
            `,
          }}
        />
      </Helmet>
      <SEOHead lang={language} page="blog" />
      <div className="min-h-screen bg-light">
        <Navbar />

        <div className="mx-auto px-8 max-w-[1280px] py-12">
          <h1 className="text-4xl font-bold text-[#1a1a2e] mb-8 text-center">
            {language === "fr" ? "Nos articles" : "Our Articles"}
          </h1>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {articles.map((article) => (
              <ArticleCard
                key={article.id}
                title={article.title}
                description={article.description}
                link={article.link}
                date={new Date(article.date).toLocaleDateString(
                  language === "fr" ? "fr-FR" : "en-US",
                  {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  }
                )}
                imageUrl={article.imageUrl}
              />
            ))}
          </div>
        </div>
      </div>
    </>
  );
}


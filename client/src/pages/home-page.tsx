import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/layout/navbar";
import { useLanguage } from "@/contexts/LanguageContext";
import { Check } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { SEOHead } from "@/components/SEOHead";
import { StructuredData } from "@/components/StructuredData";
import { useLanguageDetection } from "@/hooks/useLanguageDetection";
import { Helmet } from "react-helmet-async";
import { getAllArticles } from "@/lib/blog-data";
import { ArticleCard } from "@/components/shared/article-card";
import imgHeaderCvfolio from "@/assets/imgHeader-cvfolio.webp";
import cvfolioHomeDesc1 from "@/assets/cvfoliohomedesc_1.webp";
import cvfolioHomeDesc2 from "@/assets/cvfoliohomedesc_2.webp";
import cvfolioHomeDesc3 from "@/assets/cvfoliohomedesc_3.webp";

export default function HomePage() {
  const { isAuthenticated } = useAuth();
  const isUserLoggedIn = isAuthenticated;
  const { t } = useLanguage();
  const currentLang = useLanguageDetection();

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
      <SEOHead lang={currentLang} page="home" />
      <StructuredData lang={currentLang} />
      <div className="min-h-screen bg-light">
      <Navbar />

      {/* Main container */}
      <div className="mx-auto px-8 max-w-[1280px]">
        {/* Hero Section */}
        <section className="p-4 md:py-12">
          <div className="grid grid-cols-6 gap-8 items-center max-md:grid-cols-1 max-md:gap-4">
            {/* Left content - 3 columns */}
            <div className="col-span-3 max-md:order-2">
              <h1 className="text-[4rem] text-[#1a1a2e] leading-none mb-10 hero-title font-special-gothic font-regular">
                {t('home.hero.title')}
              </h1>

              <div className="space-y-4 mb-10">
                <div className="flex items-center">
                  <div className="mr-3">
                    <Check className="h-5 w-5 text-indigo-800" />
                  </div>
                  <p className="text-gray-700">{t('home.hero.features.professional')}</p>
                </div>
                <div className="flex items-center">
                  <div className="mr-3">
                    <Check className="h-5 w-5 text-indigo-800" />
                  </div>
                  <p className="text-gray-700">{t('home.hero.features.noSkills')}</p>
                </div>
                <div className="flex items-center">
                  <div className="mr-3">
                    <Check className="h-5 w-5 text-indigo-800" />
                  </div>
                  <p className="text-gray-700">{t('home.hero.features.pdf')}</p>
                </div>
                <div className="flex items-center">
                  <div className="mr-3">
                    <Check className="h-5 w-5 text-indigo-800" />
                  </div>
                  <p className="text-gray-700">{t('home.hero.features.impact')}</p>
                </div>
              </div>

              <Link href="/cv-builder">
                <Button
                  className="bg-blue-600 hover:bg-blue-700 text-white rounded-md cta-button"
                  style={{
                    height: "3.5rem",
                    width: "16rem",
                    fontSize: "1.125rem",
                    fontWeight: "600",
                  }}
                >
                  {t('home.hero.cta')}
                </Button>
              </Link>
            </div>

            {/* Right image - 3 columns */}
            <div className="col-span-3 max-md:order-1">
              <img
                src={imgHeaderCvfolio}
                alt="Person working on resume"
                className="w-full object-cover object-center rounded-lg"
              />
            </div>
          </div>
        </section>

        {/* Features Cards Section */}
        <section className="p-4 md:py-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white rounded-xl shadow-lg p-2 hover:shadow-xl transition-shadow duration-300">
              <div className="mb-2">
                <img
                  src={cvfolioHomeDesc2}
                  alt="Style and color customization"
                  className="w-full h-auto rounded-lg"
                />
              </div>
              <div className="cardContent p-6">
                <h3 className="text-xl font-bold text-[#1a1a2e] text-center mb-2">{t('home.cards.chooseLayoutTitle') || 'Choose a layout'}</h3>
                <p className="text-gray-600 text-center leading-relaxed">
                  {t('home.cards.chooseLayoutDescription') || 'Pick a template, customize the colors, and add your content in just a few clicks.'}
                </p>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-2 hover:shadow-xl transition-shadow duration-300">
              <div className="mb-2">
                <img
                  src={cvfolioHomeDesc3}
                  alt="CV link sharing"
                  className="w-full h-auto rounded-lg"
                />
              </div>
              <div className="cardContent p-6">
                <h3 className="text-xl font-bold text-[#1a1a2e] text-center mb-2">{t('home.cards.publishTitle') || 'Publish your resume'}</h3>
                <p className="text-gray-600 text-center leading-relaxed">
                  {t('home.cards.publishDescription') || 'Generate and send a unique and professional link. Updates appear instantly.'}
                </p>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-2 hover:shadow-xl transition-shadow duration-300">
              <div className="mb-2">
                <img
                  src={cvfolioHomeDesc1}
                  alt="Interactive responsive CV"
                  className="w-full h-auto rounded-lg"
                />
              </div>
              <div className="cardContent p-6">
                <h3 className="text-xl font-bold text-[#1a1a2e] text-center mb-2">{t('home.cards.viewAnywhereTitle') || 'View it anywhere'}</h3>
                <p className="text-gray-600 text-center leading-relaxed">
                  {t('home.cards.viewAnywhereDescription') || 'Your resume adapts to any screen. Recruiters can read it on all devices.'}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Study text */}
        <section className="p-4">
          <p className="text-gray-500 text-xs text-center">{t('home.studyFootnote') || '* Qureos Study 2025'}</p>
        </section>

        {/* Latest Articles Section */}
        <section className="p-4 md:py-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-[#1a1a2e] mb-4">
              {currentLang === 'fr' ? 'Nos Derniers Articles' : 'Our Latest Articles'}
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              {currentLang === 'fr' 
                ? 'Découvrez nos guides et conseils pour créer le CV parfait et décrocher l\'emploi de vos rêves.'
                : 'Discover our guides and tips to create the perfect resume and land your dream job.'}
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {getAllArticles()
              .slice(0, 3)
              .map((article) => (
                <ArticleCard
                  key={article.slug}
                  title={article.title[currentLang as 'en' | 'fr'] || article.title.en}
                  description={article.description[currentLang as 'en' | 'fr'] || article.description.en}
                  link={`/blog/${article.slug}`}
                  date={new Date(article.publishedTime).toLocaleDateString(
                    currentLang === 'fr' ? 'fr-FR' : 'en-US',
                    {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    }
                  )}
                  imageUrl={article.image || cvfolioHomeDesc1}
                />
              ))}
          </div>

          <div className="text-center mt-8">
            <Link href="/blog">
              <Button
                variant="outline"
                className="text-blue-600 border-blue-600 hover:bg-blue-50"
              >
                {currentLang === 'fr' ? 'Voir tous les articles' : 'View all articles'}
              </Button>
            </Link>
          </div>
        </section>
      </div>

      {/* Footer */}
      <footer className="bg-gray-100 border-t border-gray-200">
        <div className="mx-auto px-8 max-w-[1280px] py-6">
          <div className="flex flex-col md:flex-row justify-center items-center gap-2 md:gap-4 text-sm text-gray-600">
            <span>{t('home.footer.rights') || 'All rights reserved - cvfolio.app'}</span>
            <span className="hidden md:inline">•</span>
            <Link href="/privacy-policy">
              <span className="text-blue-600 hover:text-blue-800 cursor-pointer">
                {t('gdpr.cookies.banner.privacyPolicyLink') || 'Privacy Policy'}
              </span>
            </Link>
            <span className="hidden md:inline">•</span>
            <Link href="/terms-of-service">
              <span className="text-blue-600 hover:text-blue-800 cursor-pointer">
                {t('gdpr.auth.termsOfService') || 'Terms of Service'}
              </span>
            </Link>
            <span className="hidden md:inline">•</span>
            <button
              onClick={() => {
                if ((window as any).openCookiePanel) {
                  (window as any).openCookiePanel();
                }
              }}
              className="text-blue-600 hover:text-blue-800 cursor-pointer"
            >
              {t('gdpr.cookies.banner.manageCookies') || 'Manage cookies'}
            </button>
            <span className="hidden md:inline">•</span>
            <Link href="/legal-notice">
              <span className="text-blue-600 hover:text-blue-800 cursor-pointer">{t('home.footer.legal') || 'Legal Notice'}</span>
            </Link>
            <span className="hidden md:inline">•</span>
            <a href="mailto:contact@cvfolio.app" className="text-blue-600 hover:text-blue-800 cursor-pointer">
              Contact
            </a>
          </div>
        </div>
      </footer>
      </div>
    </>
  );
}

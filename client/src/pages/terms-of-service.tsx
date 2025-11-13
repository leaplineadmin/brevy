import { Link } from "wouter";
import Navbar from "@/components/layout/navbar";
import { useLanguage } from "@/contexts/LanguageContext";
import { SEOHead } from "@/components/SEOHead";

export default function TermsOfService() {
  const { t, language } = useLanguage();

  return (
    <>
      <SEOHead lang={language} page="terms" />
      <div className="min-h-screen bg-light">
        <Navbar />

        <div className="mx-auto px-8 max-w-[1280px] py-12">
          <div className="bg-white rounded-lg shadow-sm p-8">
            <h1 className="text-3xl font-bold text-[#1a1a2e] mb-4">
              {t("gdpr.terms.title")}
            </h1>
            <p className="text-sm text-gray-500 mb-8">
              {t("gdpr.terms.lastUpdated")}
            </p>

            <div className="space-y-8 text-gray-700">
              {/* Table of Contents */}
              <section className="bg-gray-50 p-6 rounded-lg">
                <h2 className="text-xl font-semibold text-[#1a1a2e] mb-4">
                  {language === "fr" ? "Table des matières" : "Table of Contents"}
                </h2>
                <ul className="space-y-2 text-sm">
                  <li>
                    <a href="#description" className="text-blue-600 hover:text-blue-800">
                      {language === "fr" ? "1. Description du service" : "1. Service Description"}
                    </a>
                  </li>
                  <li>
                    <a href="#access" className="text-blue-600 hover:text-blue-800">
                      {language === "fr" ? "2. Conditions d'accès" : "2. Access Conditions"}
                    </a>
                  </li>
                  <li>
                    <a href="#intellectual" className="text-blue-600 hover:text-blue-800">
                      {language === "fr" ? "3. Propriété intellectuelle" : "3. Intellectual Property"}
                    </a>
                  </li>
                  <li>
                    <a href="#responsibilities" className="text-blue-600 hover:text-blue-800">
                      {language === "fr" ? "4. Responsabilités" : "4. Responsibilities"}
                    </a>
                  </li>
                  <li>
                    <a href="#modifications" className="text-blue-600 hover:text-blue-800">
                      {language === "fr" ? "5. Modification des conditions" : "5. Terms Modifications"}
                    </a>
                  </li>
                  <li>
                    <a href="#termination" className="text-blue-600 hover:text-blue-800">
                      {language === "fr" ? "6. Résiliation du compte" : "6. Account Termination"}
                    </a>
                  </li>
                  <li>
                    <a href="#law" className="text-blue-600 hover:text-blue-800">
                      {language === "fr" ? "7. Loi applicable" : "7. Applicable Law"}
                    </a>
                  </li>
                </ul>
              </section>

              {/* Section 1: Description */}
              <section id="description">
                <h2 className="text-2xl font-semibold text-[#1a1a2e] mb-4">
                  {language === "fr" ? "1. Description du service" : "1. Service Description"}
                </h2>
                <p>
                  {language === "fr"
                        ? "Brevy.me est un service en ligne permettant de créer des CV interactifs et professionnels."
                        : "Brevy.me is an online service that allows you to create interactive and professional resumes."}
                </p>
              </section>

              {/* Section 2: Access */}
              <section id="access">
                <h2 className="text-2xl font-semibold text-[#1a1a2e] mb-4">
                  {language === "fr" ? "2. Conditions d'accès" : "2. Access Conditions"}
                </h2>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>
                    {language === "fr"
                          ? "Le service est accessible gratuitement (ou avec des options payantes, selon le modèle)."
                          : "The service is accessible free of charge (or with paid options, depending on the model)."}
                  </li>
                  <li>
                    {language === "fr"
                          ? "L'utilisateur doit avoir au moins 16 ans."
                          : "The user must be at least 16 years old."}
                  </li>
                  <li>
                    {language === "fr"
                          ? "L'utilisateur doit fournir des informations exactes lors de l'inscription."
                          : "The user must provide accurate information during registration."}
                  </li>
                </ul>
              </section>

              {/* Section 3: Intellectual Property */}
              <section id="intellectual">
                <h2 className="text-2xl font-semibold text-[#1a1a2e] mb-4">
                  {language === "fr" ? "3. Propriété intellectuelle" : "3. Intellectual Property"}
                </h2>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>
                    {language === "fr"
                          ? "Le contenu créé par l'utilisateur (CV) reste sa propriété."
                          : "Content created by the user (CV) remains their property."}
                  </li>
                  <li>
                    {language === "fr"
                          ? "Brevy.me conserve une licence pour héberger et afficher le contenu."
                          : "Brevy.me retains a license to host and display the content."}
                  </li>
                  <li>
                    {language === "fr"
                          ? "Le code source et le design de l'application sont protégés par le droit d'auteur."
                          : "The source code and design of the application are protected by copyright."}
                  </li>
                </ul>
              </section>

              {/* Section 4: Responsibilities */}
              <section id="responsibilities">
                <h2 className="text-2xl font-semibold text-[#1a1a2e] mb-4">
                  {language === "fr" ? "4. Responsabilités" : "4. Responsibilities"}
                </h2>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>
                    {language === "fr"
                          ? "L'utilisateur est responsable du contenu qu'il publie."
                          : "The user is responsible for the content they publish."}
                  </li>
                  <li>
                    {language === "fr"
                          ? "Brevy.me ne peut être tenu responsable des erreurs ou omissions dans les CV."
                          : "Brevy.me cannot be held responsible for errors or omissions in CVs."}
                  </li>
                  <li>
                    {language === "fr"
                          ? "Brevy.me s'efforce d'assurer la disponibilité du service, mais ne garantit pas une disponibilité 24/7."
                          : "Brevy.me strives to ensure service availability, but does not guarantee 24/7 availability."}
                  </li>
                </ul>
              </section>

              {/* Section 5: Modifications */}
              <section id="modifications">
                <h2 className="text-2xl font-semibold text-[#1a1a2e] mb-4">
                  {language === "fr" ? "5. Modification des conditions" : "5. Terms Modifications"}
                </h2>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>
                    {language === "fr"
                          ? "Brevy.me se réserve le droit de modifier ces conditions à tout moment."
                          : "Brevy.me reserves the right to modify these terms at any time."}
                  </li>
                  <li>
                    {language === "fr"
                          ? "Les utilisateurs seront informés par email des modifications importantes."
                          : "Users will be informed by email of important changes."}
                  </li>
                </ul>
              </section>

              {/* Section 6: Termination */}
              <section id="termination">
                <h2 className="text-2xl font-semibold text-[#1a1a2e] mb-4">
                  {language === "fr" ? "6. Résiliation du compte" : "6. Account Termination"}
                </h2>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>
                    {language === "fr"
                          ? "L'utilisateur peut supprimer son compte à tout moment depuis son espace personnel."
                          : "The user can delete their account at any time from their personal space."}
                  </li>
                  <li>
                    {language === "fr"
                          ? "Brevy.me peut suspendre ou supprimer un compte en cas de violation des conditions."
                          : "Brevy.me may suspend or delete an account in case of violation of the terms."}
                  </li>
                </ul>
              </section>

              {/* Section 7: Law */}
              <section id="law">
                <h2 className="text-2xl font-semibold text-[#1a1a2e] mb-4">
                  {language === "fr" ? "7. Loi applicable" : "7. Applicable Law"}
                </h2>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>
                    {language === "fr"
                          ? "Les présentes conditions sont régies par le droit grec."
                          : "These terms are governed by Greek law."}
                  </li>
                  <li>
                    {language === "fr"
                          ? "Tout litige sera soumis aux tribunaux compétents d'Athènes, Grèce."
                          : "Any dispute will be submitted to the competent courts of Athens, Greece."}
                  </li>
                </ul>
              </section>
            </div>

            <div className="mt-8 pt-6 border-t border-gray-200">
              <Link href="/">
                <span className="text-blue-600 hover:text-blue-800 cursor-pointer">
                  ← {language === "fr" ? "Retour à l'accueil" : "Back to homepage"}
                </span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}


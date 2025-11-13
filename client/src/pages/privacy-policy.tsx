import { Link } from "wouter";
import Navbar from "@/components/layout/navbar";
import { useLanguage } from "@/contexts/LanguageContext";
import { SEOHead } from "@/components/SEOHead";

export default function PrivacyPolicy() {
  const { t, language } = useLanguage();

  return (
    <>
      <SEOHead lang={language} page="privacy" />
      <div className="min-h-screen bg-light">
        <Navbar />

        <div className="mx-auto px-8 max-w-[1280px] py-12">
          <div className="bg-white rounded-lg shadow-sm p-8">
            <h1 className="text-3xl font-bold text-[#1a1a2e] mb-4">
              {t("gdpr.privacy.title")}
            </h1>
            <p className="text-sm text-gray-500 mb-8">
              {t("gdpr.privacy.lastUpdated")}
            </p>

            <div className="space-y-8 text-gray-700">
              {/* Table of Contents */}
              <section className="bg-gray-50 p-6 rounded-lg">
                <h2 className="text-xl font-semibold text-[#1a1a2e] mb-4">
                  {language === "fr" ? "Table des matières" : "Table of Contents"}
                </h2>
                <ul className="space-y-2 text-sm">
                  <li>
                    <a href="#identity" className="text-blue-600 hover:text-blue-800">
                      {language === "fr" ? "1. Identité du responsable de traitement" : "1. Data Controller Identity"}
                    </a>
                  </li>
                  <li>
                    <a href="#data-types" className="text-blue-600 hover:text-blue-800">
                      {language === "fr" ? "2. Types de données collectées" : "2. Types of Data Collected"}
                    </a>
                  </li>
                  <li>
                    <a href="#purposes" className="text-blue-600 hover:text-blue-800">
                      {language === "fr" ? "3. Finalités du traitement" : "3. Processing Purposes"}
                    </a>
                  </li>
                  <li>
                    <a href="#legal-basis" className="text-blue-600 hover:text-blue-800">
                      {language === "fr" ? "4. Bases légales" : "4. Legal Basis"}
                    </a>
                  </li>
                  <li>
                    <a href="#recipients" className="text-blue-600 hover:text-blue-800">
                      {language === "fr" ? "5. Destinataires des données" : "5. Data Recipients"}
                    </a>
                  </li>
                  <li>
                    <a href="#transfers" className="text-blue-600 hover:text-blue-800">
                      {language === "fr" ? "6. Transferts internationaux" : "6. International Transfers"}
                    </a>
                  </li>
                  <li>
                    <a href="#retention" className="text-blue-600 hover:text-blue-800">
                      {language === "fr" ? "7. Durée de conservation" : "7. Data Retention"}
                    </a>
                  </li>
                  <li>
                    <a href="#rights" className="text-blue-600 hover:text-blue-800">
                      {language === "fr" ? "8. Droits des utilisateurs" : "8. User Rights"}
                    </a>
                  </li>
                  <li>
                    <a href="#security" className="text-blue-600 hover:text-blue-800">
                      {language === "fr" ? "9. Mesures de sécurité" : "9. Security Measures"}
                    </a>
                  </li>
                  <li>
                    <a href="#contact" className="text-blue-600 hover:text-blue-800">
                      {language === "fr" ? "10. Contact" : "10. Contact"}
                    </a>
                  </li>
                </ul>
              </section>

              {/* Section 1: Identity */}
              <section id="identity">
                <h2 className="text-2xl font-semibold text-[#1a1a2e] mb-4">
                  {language === "fr" ? "1. Identité du responsable de traitement" : "1. Data Controller Identity"}
                </h2>
                <p className="mb-2">
                  <strong>{language === "fr" ? "Nom" : "Name"}:</strong> Leapline.io
                </p>
                <p className="mb-2">
                  <strong>{language === "fr" ? "Adresse" : "Address"}:</strong> Καραϊσκάκη 28 Αθήνα, Grèce
                </p>
                <p>
                  <strong>{language === "fr" ? "Contact" : "Contact"}:</strong>{" "}
                  <a href="mailto:contact@brevy.me" className="text-blue-600 hover:text-blue-800">
                    contact@brevy.me
                  </a>
                </p>
              </section>

              {/* Section 2: Data Types */}
              <section id="data-types">
                <h2 className="text-2xl font-semibold text-[#1a1a2e] mb-4">
                  {language === "fr" ? "2. Types de données collectées" : "2. Types of Data Collected"}
                </h2>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>
                    <strong>{language === "fr" ? "Données d'identification" : "Identity data"}:</strong>{" "}
                    {language === "fr"
                      ? "email, mot de passe (chiffré)"
                      : "email, password (encrypted)"}
                  </li>
                  <li>
                    <strong>{language === "fr" ? "Données de CV" : "CV data"}:</strong>{" "}
                    {language === "fr"
                      ? "nom, prénom, expériences professionnelles, formations, compétences, photo de profil, etc."
                      : "name, first name, professional experience, education, skills, profile photo, etc."}
                  </li>
                  <li>
                    <strong>{language === "fr" ? "Données de navigation" : "Navigation data"}:</strong>{" "}
                    {language === "fr"
                      ? "cookies, adresse IP, type de navigateur"
                      : "cookies, IP address, browser type"}
                  </li>
                </ul>
              </section>

              {/* Section 3: Purposes */}
              <section id="purposes">
                <h2 className="text-2xl font-semibold text-[#1a1a2e] mb-4">
                  {language === "fr" ? "3. Finalités du traitement" : "3. Processing Purposes"}
                </h2>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>{language === "fr" ? "Création et gestion de compte utilisateur" : "User account creation and management"}</li>
                  <li>{language === "fr" ? "Génération et hébergement de CV interactifs" : "Interactive CV generation and hosting"}</li>
                  <li>{language === "fr" ? "Partage de CV via URL unique" : "CV sharing via unique URL"}</li>
                  <li>{language === "fr" ? "Amélioration du service (analytics)" : "Service improvement (analytics)"}</li>
                  <li>{language === "fr" ? "Communication avec les utilisateurs" : "Communication with users"}</li>
                </ul>
              </section>

              {/* Section 4: Legal Basis */}
              <section id="legal-basis">
                <h2 className="text-2xl font-semibold text-[#1a1a2e] mb-4">
                  {language === "fr" ? "4. Bases légales" : "4. Legal Basis"}
                </h2>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>
                    {language === "fr"
                      ? "Consentement de l'utilisateur (création de compte)"
                      : "User consent (account creation)"}
                  </li>
                  <li>
                    {language === "fr"
                      ? "Exécution du contrat (fourniture du service)"
                      : "Contract execution (service provision)"}
                  </li>
                  <li>
                    {language === "fr"
                      ? "Intérêt légitime (amélioration du service, sécurité)"
                      : "Legitimate interest (service improvement, security)"}
                  </li>
                </ul>
              </section>

              {/* Section 5: Recipients */}
              <section id="recipients">
                <h2 className="text-2xl font-semibold text-[#1a1a2e] mb-4">
                  {language === "fr" ? "5. Destinataires des données" : "5. Data Recipients"}
                </h2>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>
                    <strong>{language === "fr" ? "Hébergeur" : "Hosting provider"}:</strong> Vercel Inc. (États-Unis)
                  </li>
                  <li>
                    <strong>{language === "fr" ? "Services d'authentification" : "Authentication services"}:</strong>{" "}
                    {language === "fr" ? "Google (si utilisation de Google Auth)" : "Google (if using Google Auth)"}
                  </li>
                  <li>
                    <strong>{language === "fr" ? "Outils d'analyse" : "Analytics tools"}:</strong>{" "}
                    {language === "fr" ? "Google Analytics (si utilisé)" : "Google Analytics (if used)"}
                  </li>
                </ul>
              </section>

              {/* Section 6: Transfers */}
              <section id="transfers">
                <h2 className="text-2xl font-semibold text-[#1a1a2e] mb-4">
                  {language === "fr" ? "6. Transferts internationaux" : "6. International Transfers"}
                </h2>
                <p className="mb-2">
                  {language === "fr"
                        ? "Mention des transferts vers les États-Unis (Vercel, Google)."
                        : "Mention of transfers to the United States (Vercel, Google)."}
                </p>
                <p>
                  <strong>{language === "fr" ? "Garanties appropriées" : "Appropriate safeguards"}:</strong>{" "}
                  {language === "fr"
                        ? "Clauses Contractuelles Types (CCT) de la Commission européenne"
                        : "Standard Contractual Clauses (SCC) of the European Commission"}
                </p>
              </section>

              {/* Section 7: Retention */}
              <section id="retention">
                <h2 className="text-2xl font-semibold text-[#1a1a2e] mb-4">
                  {language === "fr" ? "7. Durée de conservation" : "7. Data Retention"}
                </h2>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>
                    <strong>{language === "fr" ? "Données de compte" : "Account data"}:</strong>{" "}
                    {language === "fr"
                          ? "Tant que le compte est actif + 1 an après suppression (pour conformité légale)"
                          : "As long as the account is active + 1 year after deletion (for legal compliance)"}
                  </li>
                  <li>
                    <strong>Cookies:</strong>{" "}
                    {language === "fr" ? "6 mois maximum (selon le type)" : "Maximum 6 months (depending on type)"}
                  </li>
                </ul>
              </section>

              {/* Section 8: Rights */}
              <section id="rights">
                <h2 className="text-2xl font-semibold text-[#1a1a2e] mb-4">
                  {language === "fr" ? "8. Droits des utilisateurs" : "8. User Rights"}
                </h2>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>
                    <strong>{language === "fr" ? "Droit d'accès" : "Right of access"}:</strong>{" "}
                    {language === "fr" ? "Obtenir une copie de vos données" : "Obtain a copy of your data"}
                  </li>
                  <li>
                    <strong>{language === "fr" ? "Droit de rectification" : "Right to rectification"}:</strong>{" "}
                    {language === "fr" ? "Modifier vos données" : "Modify your data"}
                  </li>
                  <li>
                    <strong>{language === "fr" ? "Droit à l'effacement" : "Right to erasure"}:</strong>{" "}
                    {language === "fr" ? "Supprimer votre compte et vos données" : "Delete your account and data"}
                  </li>
                  <li>
                    <strong>{language === "fr" ? "Droit à la portabilité" : "Right to data portability"}:</strong>{" "}
                    {language === "fr"
                          ? "Télécharger vos données dans un format structuré"
                          : "Download your data in a structured format"}
                  </li>
                  <li>
                    <strong>{language === "fr" ? "Droit d'opposition" : "Right to object"}:</strong>{" "}
                    {language === "fr" ? "S'opposer au traitement de vos données" : "Object to processing of your data"}
                  </li>
                  <li>
                    <strong>{language === "fr" ? "Droit à la limitation" : "Right to restriction"}:</strong>{" "}
                    {language === "fr" ? "Limiter le traitement de vos données" : "Limit processing of your data"}
                  </li>
                  <li>
                    <strong>{language === "fr" ? "Droit de retirer le consentement" : "Right to withdraw consent"}:</strong>{" "}
                    {language === "fr" ? "À tout moment" : "At any time"}
                  </li>
                  <li>
                    <strong>{language === "fr" ? "Droit d'introduire une réclamation" : "Right to lodge a complaint"}:</strong>{" "}
                    {language === "fr"
                          ? "Auprès de la CNIL (https://www.cnil.fr)"
                          : "With CNIL (https://www.cnil.fr)"}
                  </li>
                </ul>
              </section>

              {/* Section 9: Security */}
              <section id="security">
                <h2 className="text-2xl font-semibold text-[#1a1a2e] mb-4">
                  {language === "fr" ? "9. Mesures de sécurité" : "9. Security Measures"}
                </h2>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>{language === "fr" ? "Chiffrement des mots de passe (bcrypt ou argon2)" : "Password encryption (bcrypt or argon2)"}</li>
                  <li>{language === "fr" ? "Connexion HTTPS obligatoire" : "Mandatory HTTPS connection"}</li>
                  <li>{language === "fr" ? "Accès restreint aux données" : "Restricted data access"}</li>
                  <li>{language === "fr" ? "Sauvegardes régulières" : "Regular backups"}</li>
                </ul>
              </section>

              {/* Section 10: Contact */}
              <section id="contact">
                <h2 className="text-2xl font-semibold text-[#1a1a2e] mb-4">
                  {language === "fr" ? "10. Contact" : "10. Contact"}
                </h2>
                <p>
                  {language === "fr"
                        ? "Pour toute question relative à la protection de vos données :"
                        : "For any questions regarding the protection of your data:"}{" "}
                  <a href="mailto:contact@brevy.me" className="text-blue-600 hover:text-blue-800">
                    contact@brevy.me
                  </a>
                </p>
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


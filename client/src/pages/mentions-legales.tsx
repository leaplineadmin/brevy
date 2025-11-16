import { Link } from "wouter";
import Navbar from "@/components/layout/navbar";
import { SEOHead } from "@/components/SEOHead";
import { useLanguage } from "@/contexts/LanguageContext";

export default function LegalNotice() {
  const { language } = useLanguage();
  return (
    <>
      <SEOHead lang={language} page="legal" />
      <div className="min-h-screen bg-light">
        <Navbar />

      <div className="mx-auto px-8 max-w-[1280px] py-12">
        <div className="bg-white rounded-lg shadow-sm p-8">
          <h1 className="text-3xl font-bold text-[#1a1a2e] mb-8">Legal Notice</h1>

          <div className="space-y-6 text-gray-700">
            <section>
              <h2 className="text-xl font-semibold text-[#1a1a2e] mb-3">App Owner</h2>
              <p>
                <strong>Leapline.io</strong><br />
                Καραϊσκάκη 28 Αθήνα<br />
                Ατομική Επιχείρηση<br />    
                <strong>Contact:</strong> contact@brevy.me
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[#1a1a2e] mb-3">Hosting</h2>
              <p>
                This website is hosted by:<br />
                <strong>Vercel Inc.</strong><br />
                340 S Lemon Ave #4133, Walnut, CA 91789<br />
                Website: <a href="https://vercel.com" className="text-blue-600 hover:text-blue-800">https://vercel.com</a>
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[#1a1a2e] mb-3">Intellectual Property</h2>
              <p>
                All content on this website is protected under Greek and international copyright and intellectual property laws.
                Any reproduction, distribution, or modification of the content, including downloadable materials and images, 
                is strictly prohibited without prior written consent from the owner.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[#1a1a2e] mb-3">Personal Data Protection</h2>
              <p>
                In accordance with Regulation (EU) 2016/679 (General Data Protection Regulation - GDPR) and Greek Law 4624/2019, 
                you have the right to access, rectify, delete, and port your personal data. 
                To exercise these rights, please contact us at: contact@brevy.me
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[#1a1a2e] mb-3">Cookies</h2>
              <p>
                This website uses cookies to enhance user experience and analyze traffic. 
                By continuing to browse this website, you agree to the use of cookies. 
                You can change your cookie preferences in your browser settings at any time.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[#1a1a2e] mb-3">Disclaimer</h2>
              <p>
                While every effort is made to ensure the accuracy of the information on this website, 
                errors or omissions may occur. The owner cannot be held responsible for any such inaccuracies. 
                If you notice any error or malfunction, please report it via email at contact@brevy.me.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[#1a1a2e] mb-3">Governing Law</h2>
              <p>
                Any dispute relating to the use of this website shall be governed by Greek law.
                Unless otherwise required by law, exclusive jurisdiction is granted to the competent courts of Athens, Greece.
              </p>
            </section>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-200">
            <Link href="/">
              <span className="text-blue-600 hover:text-blue-800 cursor-pointer">
                ← Back to homepage
              </span>
            </Link>
          </div>
        </div>
      </div>
      </div>
    </>
  );
}

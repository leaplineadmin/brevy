import { Link } from "wouter";
import { Helmet } from "react-helmet-async";

export default function SharedNotFound() {
  return (
    <>
      <Helmet>
        <title>CV Not Found | Brevy</title>
        <meta name="robots" content="noindex, nofollow" />
        <link rel="canonical" href="https://brevy.me/shared/not-found" />
      </Helmet>
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          {/* Brevy Logo */}
          <div className="mx-auto mb-4 w-16 h-16 bg-orange-500 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-xl">CV</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">CV non trouvé</h1>
          <p className="text-gray-600 mb-6">
            Ce CV n'existe pas ou n'est plus publié.
          </p>
        </div>
        
        <div className="space-y-4">
          <Link href="/">
            <button className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors">
              Retour à l'accueil
            </button>
          </Link>
          
          <Link href="/auth">
            <button className="w-full border border-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-50 transition-colors">
              Créer mon CV
            </button>
          </Link>
        </div>
        
        <div className="mt-8 text-xs text-gray-500">
          <p>© 2025 Brevy.me - Créateur de CV professionnel</p>
        </div>
      </div>
      </div>
    </>
  );
}
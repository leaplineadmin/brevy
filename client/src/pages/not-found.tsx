import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import { SEOHead } from "@/components/SEOHead";
import { Helmet } from "react-helmet-async";

export default function NotFound() {
  return (
    <>
      <Helmet>
        <title>404 - Page Not Found | Brevy</title>
        <meta name="robots" content="noindex, nofollow" />
        <link rel="canonical" href="https://brevy.me/404" />
      </Helmet>
      <div className="min-h-screen w-full flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md mx-4">
        <CardContent className="pt-6">
          <div className="flex mb-4 gap-2">
            <AlertCircle className="h-8 w-8 text-red-500" />
            <h1 className="text-2xl font-bold text-gray-900">404 Page Not Found</h1>
          </div>

          <p className="mt-4 text-sm text-gray-600">
            La page que vous recherchez n'existe pas ou a été déplacée.
          </p>
          
          <div className="mt-6">
            <a href="/" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
              ← Retour à l'accueil
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
    </>
  );
}

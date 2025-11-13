import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  FileText, 
  Palette, 
  Download, 
  Share2, 
  Smartphone, 
  Monitor,
  LogOut,
  User
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export default function Landing() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  const handleGetStarted = () => {
    setLocation('/cv-builder');
  };

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  const getUserName = () => {
    return user?.firstName && user?.lastName 
      ? `${user.firstName} ${user.lastName}`
      : user?.email?.split('@')[0] || 'User';
  };

  const getUserInitials = () => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    }
    if (user?.email) {
      return user.email[0].toUpperCase();
    }
    return 'U';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-orange-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
              <h1 className="text-xl font-semibold">
                <span className="text-orange-500">online</span>
                <span className="text-gray-700">resume</span>
              </h1>
            </div>

            {/* User section si connecté */}
            {user || localStorage.getItem('test-user') ? (
              <div className="flex items-center space-x-4">
                <span className="text-sm text-blue-600">Version d'essai</span>
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-gray-700">
                      {getUserInitials()}
                    </span>
                  </div>
                  <span className="text-sm font-medium text-gray-700">
                    {getUserName()}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleLogout}
                    className="text-gray-600 hover:text-gray-800"
                  >
                    <LogOut className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Button variant="outline" size="sm">
                  Se connecter
                </Button>
                <Button size="sm">
                  S'inscrire
                </Button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <Badge variant="secondary" className="mb-4">
            Nouveau • Templates professionnels
          </Badge>
          <h1 className="hero-title text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Créez votre CV professionnel en quelques minutes
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Choisissez parmi nos templates modernes, personnalisez votre design et téléchargez votre CV prêt à l'emploi.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button 
              size="lg" 
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3"
              onClick={handleGetStarted}
            >
              {user || localStorage.getItem('test-user') ? 'Créer mon CV' : 'Commencer gratuitement'}
            </Button>
            
            {user || localStorage.getItem('test-user') ? (
              <Link href="/dashboard">
                <Button variant="outline" size="lg" className="px-8 py-3">
                  Mes CV sauvegardés
                </Button>
              </Link>
            ) : null}
          </div>
          
          <p className="text-sm text-gray-500 mt-4">
            Gratuit • Aucune carte de crédit requise
          </p>
        </div>
      </section>

      {/* Features Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Tout ce dont vous avez besoin pour un CV parfait
          </h2>
          <p className="text-lg text-gray-600">
            Des outils professionnels pour créer un CV qui vous démarque
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Templates modernes</h3>
              <p className="text-gray-600">
                5 designs professionnels adaptés à tous les secteurs d'activité
              </p>
            </CardContent>
          </Card>
          
          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Palette className="w-6 h-6 text-orange-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Personnalisation</h3>
              <p className="text-gray-600">
                Changez les couleurs, masquez des sections selon vos besoins
              </p>
            </CardContent>
          </Card>
          
          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Download className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Export PDF</h3>
              <p className="text-gray-600">
                Téléchargez votre CV en PDF haute qualité, prêt à envoyer
              </p>
            </CardContent>
          </Card>
          
          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Share2 className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Partage en ligne</h3>
              <p className="text-gray-600">
                Partagez votre CV via un lien unique et moderne
              </p>
            </CardContent>
          </Card>
          
          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Smartphone className="w-6 h-6" style={{ color: 'var(--danger)' }} />
              </div>
              <h3 className="text-xl font-semibold mb-2">Mobile first</h3>
              <p className="text-gray-600">
                Interface optimisée pour mobile, travaillez depuis n'importe où
              </p>
            </CardContent>
          </Card>
          
          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Monitor className="w-6 h-6 text-indigo-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Aperçu temps réel</h3>
              <p className="text-gray-600">
                Visualisez vos modifications instantanément en desktop et mobile
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Prêt à créer votre CV parfait ?
          </h2>
          <p className="text-lg text-gray-600 mb-8">
            Rejoignez des milliers de professionnels qui ont déjà créé leur CV avec notre outil
          </p>
          <Button 
            size="lg" 
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3"
            onClick={handleGetStarted}
          >
            Commencer maintenant
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center text-gray-600">
            <p>&copy; 2025 OnlineResume. Créez des CV professionnels en quelques minutes.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
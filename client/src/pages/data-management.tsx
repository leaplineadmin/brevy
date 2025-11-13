import { useState } from "react";
import { Link, useLocation } from "wouter";
import Navbar from "@/components/layout/navbar";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Download, Trash2, ArrowLeft } from "lucide-react";

export default function DataManagement() {
  const { t, language } = useLanguage();
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [isDownloading, setIsDownloading] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const handleExportData = async () => {
    if (!user) return;

    setIsDownloading(true);
    try {
      const isProd = typeof window !== 'undefined' && window.location.hostname.endsWith('cvfolio.app');
      const base = isProd ? 'https://cvfolio.onrender.com' : '';

      const response = await fetch(`${base}/api/user/export-data`, {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to export data');
      }

      const data = await response.json();

      // Create a blob and download it
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cvfolio-data-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: t('gdpr.dataManagement.exportData.success') || "Success",
        description: t('gdpr.dataManagement.exportData.success') || "Your data has been downloaded successfully",
      });
    } catch (error) {
      console.error('Error exporting data:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to export your data. Please try again later.",
      });
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user || !deletePassword) {
      toast({
        variant: "destructive",
        title: "Error",
        description: t('gdpr.dataManagement.deleteAccount.passwordRequired') || "Please enter your password to confirm deletion",
      });
      return;
    }

    setIsDeleting(true);
    try {
      const isProd = typeof window !== 'undefined' && window.location.hostname.endsWith('cvfolio.app');
      const base = isProd ? 'https://cvfolio.onrender.com' : '';

      const response = await fetch(`${base}/api/user/delete-account`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ password: deletePassword }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete account');
      }

      toast({
        title: t('gdpr.dataManagement.deleteAccount.success') || "Success",
        description: t('gdpr.dataManagement.deleteAccount.success') || "Your account has been deleted successfully",
      });

      // Logout and redirect to home
      await logout();
      setTimeout(() => {
        setLocation('/');
      }, 1000);
    } catch (error: any) {
      console.error('Error deleting account:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to delete your account. Please try again later.",
      });
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
      setDeletePassword("");
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <p className="text-gray-600">Please sign in to access this page.</p>
            <Link href="/auth">
              <Button className="mt-4">Sign In</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-6">
          <Link href="/dashboard">
            <Button variant="outline" className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              {language === "fr" ? "Retour au tableau de bord" : "Back to Dashboard"}
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {t('gdpr.dataManagement.title') || 'My Personal Data'}
          </h1>
          <p className="text-gray-600">
            {t('gdpr.dataManagement.description') || 'Manage your personal data and exercise your rights under GDPR'}
          </p>
        </div>

        <div className="space-y-6">
          {/* Export Data Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="w-5 h-5" />
                {t('gdpr.dataManagement.exportData.title') || 'Download My Data'}
              </CardTitle>
              <CardDescription>
                {t('gdpr.dataManagement.exportData.description') || 'Download a copy of all your personal data in JSON format'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={handleExportData}
                disabled={isDownloading}
                className="w-full sm:w-auto"
              >
                {isDownloading
                  ? (t('gdpr.dataManagement.exportData.downloading') || 'Preparing download...')
                  : (t('gdpr.dataManagement.exportData.button') || 'Download My Data')}
              </Button>
            </CardContent>
          </Card>

          {/* Delete Account Card */}
          <Card className="border-red-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-600">
                <Trash2 className="w-5 h-5" />
                {t('gdpr.dataManagement.deleteAccount.title') || 'Delete My Account'}
              </CardTitle>
              <CardDescription>
                {t('gdpr.dataManagement.deleteAccount.description') || 'Permanently delete your account and all associated data. This action cannot be undone.'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                variant="destructive"
                onClick={() => setShowDeleteDialog(true)}
                className="w-full sm:w-auto"
              >
                {t('gdpr.dataManagement.deleteAccount.button') || 'Delete My Account'}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Delete Account Confirmation Dialog */}
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {t('gdpr.dataManagement.deleteAccount.confirmTitle') || 'Confirm Account Deletion'}
              </AlertDialogTitle>
              <AlertDialogDescription className="space-y-4">
                <p>
                  {t('gdpr.dataManagement.deleteAccount.confirmDescription') || 'Are you sure you want to delete your account? This action is irreversible. All your CVs, data, and subscription will be permanently deleted.'}
                </p>
                <div className="space-y-2 pt-4">
                  <Label htmlFor="deletePassword">
                    {t('gdpr.dataManagement.deleteAccount.passwordRequired') || 'Please enter your password to confirm deletion'}
                  </Label>
                  <Input
                    id="deletePassword"
                    type="password"
                    value={deletePassword}
                    onChange={(e) => setDeletePassword(e.target.value)}
                    placeholder={t('gdpr.dataManagement.deleteAccount.passwordPlaceholder') || 'Enter your password'}
                    className="mt-1"
                  />
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeleting}>
                {language === "fr" ? "Annuler" : "Cancel"}
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteAccount}
                disabled={isDeleting || !deletePassword}
                className="bg-red-600 hover:bg-red-700"
              >
                {isDeleting
                  ? (t('gdpr.dataManagement.deleteAccount.deleting') || 'Deleting account...')
                  : (language === "fr" ? "Supprimer définitivement" : "Delete Permanently")}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}


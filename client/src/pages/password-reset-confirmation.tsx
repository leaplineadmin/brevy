import { CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function PasswordResetConfirmation() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full p-8 bg-white rounded-lg shadow-lg text-center">
        <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Password Reset Successful!</h2>
        <p className="text-gray-600 mb-6">Your password has been successfully reset. You can now sign in with your new password.</p>
        <Button 
          onClick={() => window.location.href = '/auth'}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white"
        >
          Return to login page
        </Button>
      </div>
    </div>
  );
}

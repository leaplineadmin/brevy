import React from "react";
import { Crown } from "lucide-react";

interface PremiumSaveBannerProps {
  isAuthenticated: boolean;
  hasSubscription: boolean;
  isPremiumTemplate: boolean;
}

export const PremiumSaveBanner: React.FC<PremiumSaveBannerProps> = ({
  isAuthenticated,
  hasSubscription,
  isPremiumTemplate,
}) => {
  // Only show banner for premium templates when user doesn't have subscription
  if (!isPremiumTemplate || (isAuthenticated && hasSubscription)) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-gradient-to-r from-yellow-50 to-orange-50 border-t-2 border-yellow-400 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-center">
        <div className="flex items-center gap-3">
          <Crown className="w-6 h-6 text-yellow-600" />
          <div>
            <p className="text-sm font-semibold text-gray-900">
              Premium Template
            </p>
            <p className="text-xs text-gray-600">
              Use "Save my Resume" in the top navigation to save this template
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
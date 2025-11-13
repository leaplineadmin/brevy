import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";
import { User } from "@shared/schema";

export function useAuth() {
  const queryClient = useQueryClient();
  
  const { data: user, isLoading, refetch } = useQuery<User | null>({
    queryKey: ["/api/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    retry: false,
    staleTime: 1000 * 30, // 30 seconds - allow more frequent updates for subscription changes
    // Remove automatic polling - only poll on demand via refreshUser()
    enabled: true,
  });

  // Fonction pour forcer le rafraîchissement du statut utilisateur
  const refreshUser = async () => {
    
    // Force a complete refresh by clearing cache and refetching
    await queryClient.removeQueries({ queryKey: ["/api/user"] });
    const result = await refetch();
    
    
    return result;
  };

  // Fonction pour nettoyer complètement les sessions et données locales
  const clearAllSessions = async () => {
    try {
      // Clear all localStorage data
      localStorage.clear();
      
      // Clear all sessionStorage data
      sessionStorage.clear();
      
      // Clear all cookies
      document.cookie.split(";").forEach((c) => {
        const eqPos = c.indexOf("=");
        const name = eqPos > -1 ? c.substr(0, eqPos) : c;
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;sameSite=lax`;
      });
      
      // Invalidate all queries
      await queryClient.clear();
      
    } catch (error) {
      console.error('❌ [AUTH] Error clearing sessions:', error);
    }
  };

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    refreshUser,
    clearAllSessions,
  };
}
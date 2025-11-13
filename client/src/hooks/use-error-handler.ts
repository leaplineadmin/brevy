import { useState, useCallback } from 'react';
import { useToast } from './use-toast';

interface ErrorState {
  hasError: boolean;
  error: Error | null;
  message: string;
}

export const useErrorHandler = () => {
  const [errorState, setErrorState] = useState<ErrorState>({
    hasError: false,
    error: null,
    message: ''
  });
  const { toast } = useToast();

  const handleError = useCallback((error: Error | unknown, customMessage?: string) => {
    const errorMessage = customMessage || (error instanceof Error ? error.message : 'An unexpected error occurred');
    
    setErrorState({
      hasError: true,
      error: error instanceof Error ? error : new Error(String(error)),
      message: errorMessage
    });

    // Show toast notification
    toast({
      title: 'Error',
      description: errorMessage,
      variant: 'destructive'
    });

    // Log error for debugging
    console.error('Error handled by useErrorHandler:', error);
  }, [toast]);

  const clearError = useCallback(() => {
    setErrorState({
      hasError: false,
      error: null,
      message: ''
    });
  }, []);

  const reset = useCallback(() => {
    clearError();
  }, [clearError]);

  return {
    ...errorState,
    handleError,
    clearError,
    reset
  };
};

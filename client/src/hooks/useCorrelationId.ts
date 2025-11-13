// Hook pour générer et maintenir correlation ID par navigation
import { useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';

let globalCorrelationId: string | null = null;

export function useCorrelationId(): string {
  const correlationId = useMemo(() => {
    if (!globalCorrelationId) {
      globalCorrelationId = uuidv4().substring(0, 8);
    }
    return globalCorrelationId;
  }, []);

  return correlationId;
}

export function getGlobalCorrelationId(): string {
  if (!globalCorrelationId) {
    globalCorrelationId = uuidv4().substring(0, 8);
  }
  return globalCorrelationId;
}
import { QueryClient, QueryFunction } from "@tanstack/react-query";

function getApiBase() {
  if (typeof window === 'undefined') return '';
  const host = window.location.hostname;
  const isProd = host.endsWith('cvfolio.app');
  return isProd ? 'https://cvfolio.onrender.com' : '';
}

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  // Import dynamique pour éviter les dépendances circulaires
  const { getGlobalCorrelationId } = await import('../hooks/useCorrelationId');
  const correlationId = getGlobalCorrelationId();
  
  const headers: Record<string, string> = {
    'X-CID': correlationId,
  };
  
  if (data) {
    headers['Content-Type'] = 'application/json';
  }
  
  const res = await fetch(`${getApiBase()}${url}`, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    // Import dynamique pour éviter les dépendances circulaires
    const { getGlobalCorrelationId } = await import('../hooks/useCorrelationId');
    const correlationId = getGlobalCorrelationId();
    
    const res = await fetch(`${getApiBase()}${queryKey[0] as string}`, {
      credentials: "include",
      headers: {
        'X-CID': correlationId,
      },
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "returnNull" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});

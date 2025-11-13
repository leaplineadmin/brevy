/**
 * Centralized API client for the application
 * Handles all HTTP requests with proper error handling and authentication
 */

import { logger } from '@shared/logger';

interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
  message?: string;
}

interface ApiOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  body?: unknown;
  headers?: Record<string, string>;
  signal?: AbortSignal | undefined;
}

class ApiClient {
  private baseURL: string;

  constructor() {
    // Use full backend URL in production, relative URL in development
    if (typeof window !== 'undefined' && window.location.hostname.endsWith('cvfolio.app')) {
      this.baseURL = 'https://cvfolio.onrender.com/api';
    } else {
      this.baseURL = import.meta.env.VITE_API_URL || '/api';
    }
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      if (response.status === 401) {
        // Redirect to login on authentication failure
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        throw new Error('Authentication required');
      }

      let errorMessage = `HTTP ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorData.message || errorMessage;
      } catch {
        // If we can't parse the error response, use the status text
        errorMessage = response.statusText || errorMessage;
      }

      throw new Error(errorMessage);
    }

    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return response.json();
    }

    return response.text() as T;
  }

  async request<T = unknown>(endpoint: string, options: ApiOptions = {}): Promise<T> {
    const { method = 'GET', body, headers = {}, signal } = options;

    const url = `${this.baseURL}${endpoint}`;

    const config: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      credentials: 'include', // Include cookies for authentication
      signal: signal || null,
    };

    if (body && method !== 'GET') {
      config.body = JSON.stringify(body);
    }

    try {
      const response = await fetch(url, config);
      return this.handleResponse<T>(response);
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        logger.debug('Request aborted', 'api');
        throw error;
      }

      logger.error('API request failed', error instanceof Error ? error : undefined, 'api');
      throw error;
    }
  }

  // Convenience methods
  async get<T = any>(endpoint: string, signal?: AbortSignal): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET', signal });
  }

  async post<T = any>(endpoint: string, body?: any, signal?: AbortSignal): Promise<T> {
    return this.request<T>(endpoint, { method: 'POST', body, signal });
  }

  async put<T = any>(endpoint: string, body?: any, signal?: AbortSignal): Promise<T> {
    return this.request<T>(endpoint, { method: 'PUT', body, signal });
  }

  async delete<T = any>(endpoint: string, signal?: AbortSignal): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE', signal });
  }

  async patch<T = any>(endpoint: string, body?: any, signal?: AbortSignal): Promise<T> {
    return this.request<T>(endpoint, { method: 'PATCH', body, signal });
  }

  // File upload method
  async uploadFile(endpoint: string, file: File, signal?: AbortSignal): Promise<any> {
    const formData = new FormData();
    formData.append('photo', file);

    const url = `${this.baseURL}${endpoint}`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        body: formData,
        credentials: 'include',
        signal: signal || null,
      });

      return this.handleResponse(response);
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        logger.debug('File upload aborted', 'api');
        throw error;
      }

      logger.error('File upload failed', error instanceof Error ? error : undefined, 'api');
      throw error;
    }
  }
}

export const apiClient = new ApiClient();

// Legacy export for backward compatibility
export default apiClient;

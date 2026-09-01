import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

const API_BASE_URL = typeof window !== 'undefined' ? (process.env.NEXT_PUBLIC_API_URL || '/api/v1') : '/api/v1';

export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  timeout: 15000, // 15 seconds timeout prevents hanging UI
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for Bearer token
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('dayforge_token');
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor with automatic retry on transient failures
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const config = error.config as InternalAxiosRequestConfig & { _retryCount?: number };

    // Handle 401 unauthenticated
    if (
      typeof window !== 'undefined' &&
      error.response?.status === 401 &&
      !config?.url?.includes('/auth/session') &&
      !config?.url?.includes('/auth/login') &&
      !config?.url?.includes('/auth/register')
    ) {
      if (
        !window.location.pathname.startsWith('/login') &&
        !window.location.pathname.startsWith('/welcome') &&
        !window.location.pathname.startsWith('/register')
      ) {
        localStorage.removeItem('dayforge_token');
        window.location.href = '/login';
      }
      return Promise.reject(error);
    }

    // Auto-retry transient network errors or 500/502/503/504 up to 2 times
    if (config && (!error.response || (error.response.status >= 500 && error.response.status <= 504))) {
      config._retryCount = config._retryCount || 0;
      if (config._retryCount < 2 && config.method?.toLowerCase() === 'get') {
        config._retryCount += 1;
        const delay = config._retryCount * 500; // 500ms, 1000ms
        await new Promise((resolve) => setTimeout(resolve, delay));
        return api(config);
      }
    }

    return Promise.reject(error);
  }
);

export const getAvatarFullUrl = (avatarUrl?: string | null) => {
  if (!avatarUrl) return null;
  if (avatarUrl.startsWith('http') || avatarUrl.startsWith('data:') || avatarUrl.startsWith('/')) return avatarUrl;
  return `/api/v1/uploads/${avatarUrl}`;
};

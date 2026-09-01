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

// Request interceptor for Bearer token & client data vault header
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (typeof window !== 'undefined' && config.headers) {
      const token = localStorage.getItem('dayforge_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      // Attach client data vault token for cross-container serverless synchronization
      const vaultData = localStorage.getItem('dayforge_data_vault');
      if (vaultData) {
        config.headers['x-dayforge-vault-data'] = vaultData;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor with automatic retry on transient failures & vault token storage
api.interceptors.response.use(
  (response) => {
    if (typeof window !== 'undefined') {
      const vaultTokenFromHeader = response.headers?.['x-dayforge-vault-token'];
      const vaultTokenFromBody = response.data?.vault_token;
      const tokenToStore = vaultTokenFromHeader || vaultTokenFromBody;
      if (tokenToStore && typeof tokenToStore === 'string') {
        try {
          localStorage.setItem('dayforge_data_vault', tokenToStore);
        } catch {}
      }
    }
    return response;
  },
  async (error: AxiosError) => {
    const config = error.config as InternalAxiosRequestConfig & { _retryCount?: number };

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

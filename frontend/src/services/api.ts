import axios from 'axios';

// In production on Vercel, requests to /api/v1 are routed automatically by vercel.json rewrites.
// In local dev, Vite proxy forwards /api to http://127.0.0.1:5050.
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for Bearer token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('dayforge_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Response interceptor for 401 handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      if (!window.location.pathname.startsWith('/login') && !window.location.pathname.startsWith('/welcome') && !window.location.pathname.startsWith('/register')) {
        localStorage.removeItem('dayforge_token');
        window.location.href = '/login';
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

import axios from 'axios';
import { useAuthStore } from '../store/authStore';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || (import.meta.env.DEV ? '/api' : 'https://secure-save-blue.vercel.app/api'),
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 unauthorized globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // If unauthorized on protected endpoint, lock vault
      if (!error.config?.url?.includes('/auth/session/login') && !error.config?.url?.includes('/auth/session/lookup')) {
        useAuthStore.getState().logout();
      }
    }
    return Promise.reject(error);
  }
);

export default api;

export const getApiErrorMessage = (error: unknown, fallback: string): string => {
  if (axios.isAxiosError(error)) {
    if (!error.response) {
      return `${fallback} Please check your network connection and try again.`;
    }

    const message = error.response.data?.message;
    if (typeof message === 'string') {
      return message;
    }
  }

  return error instanceof Error ? error.message : fallback;
};

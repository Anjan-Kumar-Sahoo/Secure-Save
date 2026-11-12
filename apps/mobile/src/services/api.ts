import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || (import.meta.env.DEV ? '/api' : 'https://secure-save-api.onrender.com/api'),
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const persistedAuth = localStorage.getItem('secure-save-auth');
  if (persistedAuth) {
    try {
      const token = JSON.parse(persistedAuth)?.state?.token;
      if (typeof token === 'string' && token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Unable to read saved authentication state', error);
    }
  }
  return config;
});

export default api;

export const getApiErrorMessage = (error: unknown, fallback: string): string => {
  if (axios.isAxiosError(error)) {
    if (!error.response) {
      return `${fallback} Check your internet connection and try again.`;
    }

    const message = error.response.data?.message;
    if (typeof message === 'string') {
      return message;
    }
  }

  return error instanceof Error ? error.message : fallback;
};
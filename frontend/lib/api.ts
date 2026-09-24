import axios from 'axios';

const serverApiUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '') || 'http://146.181.58.160:8080/api';

export const API_URL = typeof window !== 'undefined' ? '/api' : serverApiUrl;

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const adminApi = (token?: string | null) => {
  const instance = axios.create({
    baseURL: API_URL,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  instance.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401 || error.response?.status === 403) {
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('miquipu_auth_expired'));
        }
      }
      return Promise.reject(error);
    }
  );

  return instance;
};

export default api;

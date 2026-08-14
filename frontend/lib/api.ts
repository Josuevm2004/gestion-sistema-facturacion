import axios from 'axios';

const PUBLIC_BACKEND_API_URL = 'http://146.181.58.160:8080/api';
const configuredApiUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '');

export const API_URL = configuredApiUrl || PUBLIC_BACKEND_API_URL;

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const adminApi = (token?: string | null) => {
  return axios.create({
    baseURL: API_URL,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
};

export default api;

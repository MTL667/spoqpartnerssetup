import axios from 'axios';

export const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const isAuthEndpoint = error.config?.url?.startsWith('/auth/');
      if (!isAuthEndpoint) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  },
);

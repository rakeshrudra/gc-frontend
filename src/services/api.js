import axios from 'axios';
import { refreshSession, redirectToVitalityLogin } from './authApi';

const API_BASE_URL =
  import.meta.env.VITE_API_URL;

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

let refreshPromise = null;

function refreshOnce() {
  if (!refreshPromise) {
    refreshPromise = refreshSession().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config || {};
    const status = error.response?.status;

    if (status === 401 && !originalRequest._retried) {
      originalRequest._retried = true;

      try {
        await refreshOnce();
        return api(originalRequest);
      } catch {
        redirectToVitalityLogin();
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  }
);

export const uploadFile = async (file) => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await api.post('/match/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

  return response.data;
};

export const getVendorwiseResults = async (results) => {
  const response = await api.post('/match/vendorwise', { results });
  return response.data;
};

export const searchMasterMedicines = async (query) => {
  const response = await api.get('/match/search-master', {
    params: { query },
  });

  return response.data;
};

export default api;

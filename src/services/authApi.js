import axios from 'axios';

const AUTH_BASE_URL = import.meta.env.VITE_PUBLIC_AUTH_SERVICE_URL;

export const authApi = axios.create({
  baseURL: AUTH_BASE_URL,
  withCredentials: true,
});

export const refreshSession = () => authApi.post('/auth/refresh');

export const logoutSession = () => authApi.post('/auth/logout');

export function redirectToVitalityLogin() {
  const vitalityUrl = import.meta.env.VITE_PUBLIC_VITALITY_URL;
  
  const redirect = encodeURIComponent(window.location.href);
  window.location.href = `${vitalityUrl}/login?redirect=${redirect}`;
}

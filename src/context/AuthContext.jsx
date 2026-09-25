import { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import api from '../services/api';
import { logoutSession, redirectToVitalityLogin } from '../services/authApi';

export const AuthContext = createContext(undefined);

export function AuthProvider({ children }) {
  const [admin, setAdmin] = useState(null);
  const [storeUser, setStoreUser] = useState(null);
  const [role, setRole] = useState(null); // 'admin' | 'store' | null
  const [adminRole, setAdminRole] = useState(null); // fine-grained AdminRole enum value, e.g. 'emedix_sales'
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isProvisioned, setIsProvisioned] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function resolveAsStore() {
      try {
        const userResponse = await api.get('/users/me');
        setStoreUser(userResponse.data);
        setRole('store');
        setIsAuthenticated(true);
        setIsProvisioned(true);
      } catch {
        setIsAuthenticated(true);
        setIsProvisioned(false);
      }
    }

    async function resolveAsAdmin() {
      try {
        const response = await api.get('/admins/me');
        setAdmin(response.data);
        setAdminRole(response.data?.role ?? null);
        setRole('admin');
        setIsAuthenticated(true);
        setIsProvisioned(true);
        return;
      } catch (error) {
        const status = error?.response?.status;
        const message = error?.response?.data?.message;

        if (status === 401 && message === 'Admin is not provisioned') {
          await resolveAsStore();
          return;
        }

        setIsAuthenticated(false);
        setIsProvisioned(true);
      }
    }

    async function resolveSession() {
      const params = new URLSearchParams(window.location.search);
      if (params.get('session') === 'store') {
        await resolveAsStore();
        return;
      }

      await resolveAsAdmin();
    }

    resolveSession().finally(() => setIsLoading(false));
  }, []);

  const logout = useCallback(async () => {
    try {
      await logoutSession();
    } finally {
      setAdmin(null);
      setStoreUser(null);
      setRole(null);
      setAdminRole(null);
      setIsAuthenticated(false);
      redirectToVitalityLogin();
    }
  }, []);

  const value = useMemo(
    () => ({
      admin,
      storeUser,
      role,
      adminRole,
      isAuthenticated,
      isProvisioned,
      isLoading,
      logout,
    }),
    [admin, storeUser, role, adminRole, isAuthenticated, isProvisioned, isLoading, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

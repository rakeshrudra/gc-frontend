import { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import api from '../services/api';
import { logoutSession, redirectToVitalityLogin } from '../services/authApi';

export const AuthContext = createContext(undefined);

export function AuthProvider({ children }) {
  const [admin, setAdmin] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isProvisioned, setIsProvisioned] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    api
      .get('/admins/me')
      .then((response) => {
        setAdmin(response.data);
        setIsAuthenticated(true);
        setIsProvisioned(true);
      })
      .catch((error) => {
        setAdmin(null);
        const status = error?.response?.status;
        const message = error?.response?.data?.message;
        if (status === 401 && message === 'Admin is not provisioned') {
          setIsAuthenticated(true);
          setIsProvisioned(false);
        } else {
          setIsAuthenticated(false);
          setIsProvisioned(true);
        }
      })
      .finally(() => setIsLoading(false));
  }, []);

  const logout = useCallback(async () => {
    try {
      await logoutSession();
    } finally {
      setAdmin(null);
      setIsAuthenticated(false);
      redirectToVitalityLogin();
    }
  }, []);

  const value = useMemo(
    () => ({
      admin,
      isAuthenticated,
      isProvisioned,
      isLoading,
      logout,
    }),
    [admin, isAuthenticated, isProvisioned, isLoading, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

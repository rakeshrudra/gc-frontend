import { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import api from '../services/api';
import { logoutSession, redirectToVitalityLogin } from '../services/authApi';

export const AuthContext = createContext(undefined);

export function AuthProvider({ children }) {
  const [admin, setAdmin] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    api
      .get('/admins/me')
      .then((response) => setAdmin(response.data))
      .catch(() => setAdmin(null))
      .finally(() => setIsLoading(false));
  }, []);

  const logout = useCallback(async () => {
    try {
      await logoutSession();
    } finally {
      setAdmin(null);
      redirectToVitalityLogin();
    }
  }, []);

  const value = useMemo(
    () => ({
      admin,
      isAuthenticated: admin !== null,
      isLoading,
      logout,
    }),
    [admin, isLoading, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

import { useContext, useEffect } from 'react';
import { Box } from '@mui/material';
import { AuthContext } from '../context/AuthContext';
import { redirectToVitalityLogin } from '../services/authApi';
import NotProvisioned from '../pages/NotProvisioned';

export function ProtectedRoute({ children }) {
  const { isAuthenticated, isProvisioned, isLoading } = useContext(AuthContext);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      redirectToVitalityLogin();
    }
  }, [isLoading, isAuthenticated]);

  if (isLoading || !isAuthenticated) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#f4fdfc',
        }}
      >
        Loading…
      </Box>
    );
  }

  if (!isProvisioned) {
    return <NotProvisioned />;
  }

  return children;
}

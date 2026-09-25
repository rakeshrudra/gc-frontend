import { useContext, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { Box } from '@mui/material';
import { AuthContext } from '../context/AuthContext';
import { redirectToVitalityLogin } from '../services/authApi';
import NotProvisioned from '../pages/NotProvisioned';

export function ProtectedRoute({ children, allowedRoles, allowedAdminRoles }) {
  const { isAuthenticated, isProvisioned, isLoading, role, adminRole } = useContext(AuthContext);

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

  if (allowedRoles && !allowedRoles.includes(role)) {
    return <Navigate to="/home" replace />;
  }

  if (allowedAdminRoles && !allowedAdminRoles.includes(adminRole)) {
    return <Navigate to="/home" replace />;
  }

  return children;
}

import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Box, Container, createTheme, ThemeProvider, CssBaseline } from '@mui/material';
import Login from './pages/login';
import Dashboard from './pages/dashboard';
import Home from './pages/Home';
import MedicineVendorSearch from './pages/MedicineVendorSearch';
import ResetPasswordPage from "./pages/ResetPasswordPage";
import Navbar from './components/Navbar';

const theme = createTheme({
  typography: {
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    fontSize: 13,
    h3: { fontSize: '1.8rem', fontWeight: 700, color: '#01579b' },
    h5: { fontSize: '1.2rem', fontWeight: 700, color: '#01579b' },
    h6: { fontSize: '1rem', fontWeight: 700, color: '#01579b' },
    body1: { fontSize: '0.875rem', color: '#2c3e50' }, // Darker for better contrast
    body2: { fontSize: '0.8rem', color: '#546e7a' },
  },
  palette: {
    primary: { main: '#0277bd' }, // Slightly darker light blue for better contrast
    secondary: { main: '#b3e5fc' },
    text: {
      primary: '#1a1a1a', // High contrast text
      secondary: '#455a64',
    },
    background: {
      default: '#f8f9fa',
      paper: '#ffffff',
    },
  },
  shape: { borderRadius: 6 },
  components: {
    MuiButton: {
      styleOverrides: {
        root: { textTransform: 'none', fontWeight: 600, borderRadius: 6, fontSize: '0.8rem' },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#ffffff',
          color: '#1a1a1a',
          borderBottom: '1px solid #e0e0e0',
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          fontSize: '0.75rem',
          padding: '8px 12px',
          color: '#1a1a1a',
        },
        head: {
          fontWeight: 700,
          backgroundColor: '#f1f8fe',
          color: '#01579b',
        },
      },
    },
  },
});

// Simple auth guard
const ProtectedRoute = ({ children }) => {
  const token = sessionStorage.getItem('token');
  return token ? children : <Navigate to="/" replace />;
};

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Routes>
        <Route path="/" element={<Login />} />
        <Route
          path="/home"
          element={
            <ProtectedRoute>
              <Box sx={{ minHeight: '100vh', background: '#f4fdfc' }}>
                <Navbar />
                <Container maxWidth="xl" sx={{ py: 3 }}>
                  <Home />
                </Container>
              </Box>
            </ProtectedRoute>
          }
        />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route
          path="/medicine-vendor-search"
          element={
            <ProtectedRoute>
              <Box sx={{ minHeight: '100vh', background: '#f4fdfc' }}>
                <Navbar />
                <Container maxWidth="xl" sx={{ py: 3 }}>
                  <MedicineVendorSearch />
                </Container>
              </Box>
            </ProtectedRoute>
          }
        />
        <Route path="/vendorsearch" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
      </Routes>
    </ThemeProvider>
  );
}

export default App;

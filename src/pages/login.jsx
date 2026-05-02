import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, TextField, Button, Typography, Paper, Alert, Collapse,
  CircularProgress, InputAdornment, IconButton,
} from '@mui/material';
import logo from '../assets/eops-logo.png';
import PersonOutlineIcon from '@mui/icons-material/PersonOutlined';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import { loginUser } from '../services/api';

const Login = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    const token = sessionStorage.getItem('token');
    if (token) {
      navigate('/home', { replace: true });
    }
  }, [navigate]);

  const performLogin = async () => {
    if (!username.trim() || !password.trim()) {
      setError('Please fill in all fields');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const data = await loginUser(username, password);
      const token =
        data?.accessToken ??
        data?.access_token ??
        data?.data?.accessToken ??
        data?.data?.access_token;

      if (!token || typeof token !== 'string') {
        setError('Login succeeded but no token was returned. Check API configuration.');
        return;
      }

      sessionStorage.setItem('token', token);
      navigate('/home', { replace: true });
    } catch {
      setError('Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await performLogin();
  };

  /** MUI password adornment can swallow implicit form submit on Enter; submit explicitly */
  const handleFieldKeyDown = (e) => {
    if (e.key !== 'Enter' || loading) return;
    e.preventDefault();
    void performLogin();
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',

        // ✅ SOFT BACKGROUND (NO HARSH GRADIENT)
        background: '#f4fdfc',
      }}
    >
      <Paper
        elevation={0}
        sx={{
          p: 5,
          width: '100%',
          maxWidth: 420,
          borderRadius: '20px',

          // ✅ CLEAN CARD
          background: '#ffffff',
          boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
        }}
      >
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <img
            src={logo}
            alt="EOPS Logo"
            style={{
              width: '200px',
              maxWidth: '100%',
              marginBottom: '16px',
            }}
          />

          <Typography
            variant="h5"
            sx={{
              fontWeight: 800,
              color: '#2bb3b1',
            }}
          >
            EMEDIX GC
          </Typography>

          <Typography
            variant="body2"
            sx={{
              color: '#6b7280',
              mt: 0.5,
            }}
          >
            Admin Portal
          </Typography>
        </Box>

        <Collapse in={!!error}>
          <Alert
            severity="error"
            sx={{ mb: 2, borderRadius: '8px' }}
            onClose={() => setError('')}
          >
            {error}
          </Alert>
        </Collapse>

        <form onSubmit={handleSubmit}>
          {/* USERNAME */}
          <TextField
            fullWidth
            label="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            onKeyDown={handleFieldKeyDown}
            autoFocus
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <PersonOutlineIcon sx={{ color: '#2bb3b1' }} />
                  </InputAdornment>
                ),
              },
            }}
            sx={{
              mb: 2.5,
              '& .MuiOutlinedInput-root': {
                borderRadius: '10px',
                '& fieldset': {
                  borderColor: '#d1f0ed',
                },
                '&:hover fieldset': {
                  borderColor: '#2bb3b1',
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#2bb3b1',
                },
              },
            }}
          />

          {/* PASSWORD */}
          <TextField
            fullWidth
            label="Password"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={handleFieldKeyDown}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <LockOutlinedIcon sx={{ color: '#2bb3b1' }} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      size="small"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    </IconButton>
                  </InputAdornment>
                ),
              },
            }}
            sx={{
              mb: 3,
              '& .MuiOutlinedInput-root': {
                borderRadius: '10px',
                '& fieldset': {
                  borderColor: '#d1f0ed',
                },
                '&:hover fieldset': {
                  borderColor: '#2bb3b1',
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#2bb3b1',
                },
              },
            }}
          />

          {/* BUTTON */}
          <Button
            type="submit"
            fullWidth
            variant="contained"
            disabled={loading}
            sx={{
              py: 1.3,
              borderRadius: '10px',
              fontWeight: 700,

              // ✅ SIMPLE CLEAN BUTTON
              background: '#2bb3b1',

              '&:hover': {
                background: '#239c9a',
              },
            }}
          >
            {loading ? (
              <CircularProgress size={24} sx={{ color: '#fff' }} />
            ) : (
              'Sign In'
            )}
          </Button>
        </form>
      </Paper>
    </Box>
  );
};

export default Login;
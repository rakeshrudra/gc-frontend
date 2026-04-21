import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, TextField, Button, Typography, Paper, Alert, Collapse,
  CircularProgress, InputAdornment, IconButton,
} from '@mui/material';
import PersonOutlineIcon from '@mui/icons-material/PersonOutlined';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import LocalPharmacyIcon from '@mui/icons-material/LocalPharmacy';
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
      navigate('/dashboard', { replace: true });
    }
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError('Please fill in all fields');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const data = await loginUser(username, password);
      sessionStorage.setItem('token', data.access_token);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      const msg = err.response?.data?.message || 'Invalid credentials. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(135deg, #0d1b2a 0%, #1b2838 40%, #1a237e 100%)',
      position: 'relative', overflow: 'hidden',
    }}>
      {/* Background decoration */}
      <Box sx={{
        position: 'absolute', top: '-20%', right: '-10%', width: 500, height: 500,
        borderRadius: '50%', background: 'radial-gradient(circle, rgba(57,73,171,0.3), transparent 70%)',
      }} />
      <Box sx={{
        position: 'absolute', bottom: '-15%', left: '-10%', width: 400, height: 400,
        borderRadius: '50%', background: 'radial-gradient(circle, rgba(128,203,196,0.2), transparent 70%)',
      }} />

      <Paper elevation={0} sx={{
        p: 5, width: '100%', maxWidth: 420, borderRadius: '24px', position: 'relative',
        background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(20px)',
        boxShadow: '0 24px 80px rgba(0,0,0,0.3)',
      }}>
        {/* Logo */}
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Box sx={{
            width: 50, height: 50, borderRadius: '12px', mx: 'auto', mb: 2,
            background: 'linear-gradient(135deg, #0277bd, #01579b)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(2,119,189,0.3)',
          }}>
            <LocalPharmacyIcon sx={{ fontSize: 24, color: '#fff' }} />
          </Box>
          <Typography variant="h6" sx={{ fontWeight: 800, color: '#01579b', letterSpacing: '0.02em', fontSize: '1rem' }}>
            E_MEDIX GYAN CENTER
          </Typography>
          <Typography variant="body2" sx={{ mt: 0.5, color: '#546e7a', fontSize: '0.75rem' }}>
            Authentication Portal
          </Typography>
        </Box>

        <Collapse in={!!error}>
          <Alert id="login-error" severity="error" sx={{ mb: 2, borderRadius: '10px' }} onClose={() => setError('')}>
            {error}
          </Alert>
        </Collapse>

        <form onSubmit={handleSubmit}>
          <TextField id="username-input" fullWidth label="Username" value={username}
            onChange={(e) => setUsername(e.target.value)} autoFocus
            slotProps={{
              input: {
                startAdornment: <InputAdornment position="start"><PersonOutlineIcon sx={{ color: 'grey.400' }} /></InputAdornment>,
              },
            }}
            sx={{ mb: 2.5, '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
          />
          <TextField id="password-input" fullWidth label="Password" type={showPassword ? 'text' : 'password'}
            value={password} onChange={(e) => setPassword(e.target.value)}
            slotProps={{
              input: {
                startAdornment: <InputAdornment position="start"><LockOutlinedIcon sx={{ color: 'grey.400' }} /></InputAdornment>,
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowPassword(!showPassword)} edge="end" size="small">
                      {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    </IconButton>
                  </InputAdornment>
                ),
              },
            }}
            sx={{ mb: 3, '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
          />
          <Button id="login-button" type="submit" fullWidth variant="contained" disabled={loading}
            sx={{
              py: 1.4, borderRadius: '12px', textTransform: 'none', fontWeight: 600,
              fontSize: '1rem', background: 'linear-gradient(135deg, #1a237e, #3949ab)',
              boxShadow: '0 6px 20px rgba(26,35,126,0.35)',
              '&:hover': { background: 'linear-gradient(135deg, #0d1642, #283593)', boxShadow: '0 8px 28px rgba(26,35,126,0.45)' },
            }}
          >
            {loading ? <CircularProgress size={24} sx={{ color: '#fff' }} /> : 'Sign In'}
          </Button>
        </form>
      </Paper>
    </Box>
  );
};

export default Login;

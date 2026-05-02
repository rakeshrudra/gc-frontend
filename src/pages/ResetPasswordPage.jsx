import React, { useState } from 'react';
import {
  Alert,
  Box,
  Button,
  IconButton,
  InputAdornment,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import LockResetIcon from '@mui/icons-material/LockReset';
import { resetAdminPassword } from '../services/api';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useNavigate } from 'react-router-dom';

const ResetPasswordPage = () => {
    const navigate = useNavigate();
  const [form, setForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: '',
  });

  const [showPassword, setShowPassword] = useState({
    currentPassword: false,
    newPassword: false,
    confirmNewPassword: false,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (field) => (event) => {
    setForm((prev) => ({
      ...prev,
      [field]: event.target.value,
    }));

    setError('');
    setSuccess('');
  };

  const toggleShowPassword = (field) => {
    setShowPassword((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.currentPassword || !form.newPassword || !form.confirmNewPassword) {
      setError('Please fill all fields.');
      return;
    }

    if (form.newPassword.length < 6) {
      setError('New password must be at least 6 characters.');
      return;
    }

    if (form.newPassword !== form.confirmNewPassword) {
      setError('New password and confirm password do not match.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setSuccess('');

      await resetAdminPassword({
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      });

      setSuccess('Password reset successfully.');

      setForm({
        currentPassword: '',
        newPassword: '',
        confirmNewPassword: '',
      });
    } catch (err) {
      const message =
        err?.response?.data?.message ||
        'Failed to reset password. Please try again.';

      setError(Array.isArray(message) ? message[0] : message);
    } finally {
      setLoading(false);
    }
  };

  const passwordField = (label, field) => (
    <TextField
      label={label}
      type={showPassword[field] ? 'text' : 'password'}
      size="small"
      fullWidth
      value={form[field]}
      onChange={handleChange(field)}
      InputProps={{
        endAdornment: (
          <InputAdornment position="end">
            <IconButton
              onClick={() => toggleShowPassword(field)}
              edge="end"
              size="small"
            >
              {showPassword[field] ? <VisibilityOffIcon /> : <VisibilityIcon />}
            </IconButton>
          </InputAdornment>
        ),
      }}
    />
  );

  return (
    <Box
      sx={{
        minHeight: 'calc(100vh - 120px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        px: 2,
        py: 4,
      }}
    >
      <Paper
        elevation={0}
        sx={{
          width: '100%',
          maxWidth: 460,
          p: { xs: 3, sm: 4 },
          borderRadius: 4,
          border: '1px solid #d1f0ed',
          boxShadow: '0 10px 30px rgba(15, 159, 154, 0.08)',
          backgroundColor: '#ffffff',
        }}
      >

<IconButton
  onClick={() => navigate('/home')}
  sx={{
    color: '#0f9f9a',
    mb: 1,
    ml: -1,
    '&:hover': {
      backgroundColor: '#e9fffb',
    },
  }}
>
  <ArrowBackIcon />
</IconButton>

        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <LockResetIcon
            sx={{
              fontSize: 42,
              color: '#0f9f9a',
              mb: 1,
            }}
          />

          <Typography
            sx={{
              fontWeight: 900,
              fontSize: { xs: '1.25rem', sm: '1.45rem' },
              color: '#0f9f9a',
            }}
          >
            Reset Password
          </Typography>

          <Typography
            sx={{
              color: '#607d8b',
              fontSize: '0.88rem',
              mt: 0.6,
            }}
          >
            Enter your current password and set a new one.
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {success}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit}>
          <Stack spacing={2}>
            {passwordField('Current Password', 'currentPassword')}
            {passwordField('New Password', 'newPassword')}
            {passwordField('Confirm New Password', 'confirmNewPassword')}

            <Button
              type="submit"
              variant="contained"
              disabled={loading}
              sx={{
                backgroundColor: '#0f9f9a',
                textTransform: 'none',
                fontWeight: 800,
                py: 1,
                mt: 1,
                '&:hover': {
                  backgroundColor: '#0b827e',
                },
              }}
            >
              {loading ? 'Updating...' : 'Reset Password'}
            </Button>
          </Stack>
        </Box>
      </Paper>
    </Box>
  );
};

export default ResetPasswordPage;
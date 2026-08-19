import { Box, Button, Paper, Typography } from '@mui/material';

const VITALITY_URL = import.meta.env.VITE_PUBLIC_VITALITY_URL;

export default function NotProvisioned() {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f4fdfc',
        px: 2,
      }}
    >
      <Paper sx={{ maxWidth: 380, p: 4, textAlign: 'center' }}>
        <Typography variant="h6" fontWeight={700}>
          No Gyan Center admin account yet
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          You're signed in, but you haven't setup your account for Gyan Center yet. Sign up from the
          eMedix Vitality dashboard to continue.
        </Typography>
        <Button
          variant="contained"
          fullWidth
          sx={{ mt: 3 }}
          onClick={() => {
            window.location.href = VITALITY_URL;
          }}
        >
          Go to Emedix Dashboard
        </Button>
      </Paper>
    </Box>
  );
}

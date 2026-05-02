import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Stack,
  Card,
  CardContent,
  CardActionArea,
} from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import SearchIcon from '@mui/icons-material/Search';

const Home = () => {
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        minHeight: 'calc(100vh - 120px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        px: { xs: 2, sm: 3 },
        py: { xs: 4, sm: 6 },
      }}
    >
      <Paper
        elevation={0}
        sx={{
          p: { xs: 3, sm: 5 },
          borderRadius: 4,
          border: '1px solid #cdecea',
          textAlign: 'center',
          maxWidth: 760,
          width: '100%',
          backgroundColor: '#ffffff',
          boxShadow: '0 10px 30px rgba(15, 159, 154, 0.08)',
        }}
      >
        <Typography
          sx={{
            fontSize: { xs: '1.35rem', sm: '1.8rem' },
            fontWeight: 900,
            color: '#007f7a',
            mb: 1,
          }}
        >
          Welcome to Emedix GC
        </Typography>

        <Typography
          sx={{
            fontSize: { xs: '0.9rem', sm: '1rem' },
            color: '#4b6470',
            mb: 3,
          }}
        >
          Click a card below to get started, or use the menu in the top left.
        </Typography>

        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={2}
          justifyContent="center"
        >
          <Card
            variant="outlined"
            sx={{
              flex: 1,
              borderRadius: 3,
              borderColor: '#d1f0ed',
              backgroundColor: '#f8fffe',
              transition: 'box-shadow 0.2s ease, border-color 0.2s ease',
              '&:hover': {
                borderColor: '#0f9f9a',
                boxShadow: '0 6px 20px rgba(15, 159, 154, 0.15)',
              },
            }}
          >
            <CardActionArea
              onClick={() => navigate('/dashboard')}
              sx={{ borderRadius: 3, textAlign: 'left' }}
              aria-label="Open YES MAYBE report upload"
            >
              <CardContent>
                <UploadFileIcon sx={{ color: '#0f9f9a', fontSize: 36, mb: 1 }} />

                <Typography fontWeight={800} color="#113b4a">
                  YES/MAYBE Report
                </Typography>

                <Typography
                  variant="body2"
                  sx={{ color: '#607d8b', mt: 0.8 }}
                >
                  Upload Excel or CSV file and view medicine matching results.
                </Typography>
              </CardContent>
            </CardActionArea>
          </Card>

          <Card
            variant="outlined"
            sx={{
              flex: 1,
              borderRadius: 3,
              borderColor: '#d1f0ed',
              backgroundColor: '#f8fffe',
              transition: 'box-shadow 0.2s ease, border-color 0.2s ease',
              '&:hover': {
                borderColor: '#0f9f9a',
                boxShadow: '0 6px 20px rgba(15, 159, 154, 0.15)',
              },
            }}
          >
            <CardActionArea
              onClick={() => navigate('/medicine-vendor-search')}
              sx={{ borderRadius: 3, textAlign: 'left' }}
              aria-label="Open search medicines and vendors"
            >
              <CardContent>
                <SearchIcon sx={{ color: '#0f9f9a', fontSize: 36, mb: 1 }} />

                <Typography fontWeight={800} color="#113b4a">
                  Search Medicines & Vendors
                </Typography>

                <Typography
                  variant="body2"
                  sx={{ color: '#607d8b', mt: 0.8 }}
                >
                  Search master data and view vendor bill, date, and discount.
                </Typography>
              </CardContent>
            </CardActionArea>
          </Card>
        </Stack>

        <Typography
          sx={{
            mt: 3,
            fontSize: '0.82rem',
            color: '#78909c',
          }}
        >
          The menu has the same options anytime.
        </Typography>
      </Paper>
    </Box>
  );
};

export default Home;
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Container, Typography, Paper } from '@mui/material';
import Navbar from '../components/Navbar';
import Upload from '../components/Upload';
import ResultsTable from '../components/Table';

const Dashboard = () => {
  const navigate = useNavigate();
  const [results, setResults] = useState([]);
  const [view, setView] = useState('home'); // 'home' or 'match'

  useEffect(() => {
    const token = sessionStorage.getItem('token');
    if (!token) {
      navigate('/', { replace: true });
    }
  }, [navigate]);

  const handleUploadSuccess = (data) => {
    const rows = Array.isArray(data) ? data : data.results || [];
    setResults(rows);
    setView('match'); // Switch to results view on success
  };

  const handleMenuSelect = (selectedView) => {
    setView(selectedView);
  };

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: '#f4f7f9' }}>
      <Navbar onMenuSelect={handleMenuSelect} />
      <Container maxWidth="xl" sx={{ py: 3 }}>
        {view === 'home' && (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Typography variant="h5" sx={{ fontWeight: 800, color: '#01579b', mb: 1 }}>
              E_MEDIX GYAN CENTER
            </Typography>
            <Typography variant="body2" sx={{ mb: 4, color: '#546e7a' }}>
              Select an option from the menu to continue.
            </Typography>
          </Box>
        )}

        {view === 'match' && (
          <>
            <Box sx={{ mb: 3 }}>
              <Upload onUploadSuccess={handleUploadSuccess} />
            </Box>

            {results.length > 0 && (
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1a1a1a', flexGrow: 1 }}>
                    MATCHED RESULTS
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#546e7a', fontWeight: 600 }}>
                    TOTAL: {results.length}
                  </Typography>
                </Box>
                <ResultsTable data={results} />
              </Box>
            )}
          </>
        )}
      </Container>
    </Box>
  );
};

export default Dashboard;

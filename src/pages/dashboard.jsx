import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Container, Typography, Paper, Button } from '@mui/material';
import axios from 'axios';

import Navbar from '../components/Navbar';
import Upload from '../components/Upload';
import ResultsTable from '../components/Table';
import VendorSearch from './SearchVendor';

const Dashboard = () => {
  const navigate = useNavigate();
  const reportRef = useRef(null);

  const [results, setResults] = useState([]);
  const [docHeader, setDocHeader] = useState(null);
  const [view, setView] = useState('home');

  const [showVendorwise, setShowVendorwise] = useState(false);
  const [vendorwiseResults, setVendorwiseResults] = useState([]);

  useEffect(() => {
    const token = sessionStorage.getItem('token');
    if (!token) navigate('/', { replace: true });
  }, [navigate]);

  const handleUploadSuccess = (data) => {
    setResults(data.results || []);
    setDocHeader(data.documentHeader || null);

    setShowVendorwise(false);
    setVendorwiseResults([]);
    setView('match');
  };

  const handleMenuSelect = (selectedView) => setView(selectedView);
  const handlePrint = () => window.print();

  // ✅ FIXED FUNCTION WITH TOKEN
  const handleVendorwiseToggle = async () => {
    if (showVendorwise) {
      setShowVendorwise(false);
      return;
    }

    try {
      const token = sessionStorage.getItem('token');

      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/match/vendorwise`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setVendorwiseResults(res.data.vendorwiseResults || []);
      setShowVendorwise(true);

    } catch (err) {
      console.error(err);
      alert('Failed to load vendorwise report');
    }
  };

  const getMajorityDecision = () => {
    if (!results || results.length === 0) return null;

    const counts = {
      yes: results.filter((r) => r.decision === 'yes').length,
      maybe: results.filter((r) => r.decision === 'maybe').length,
      no: results.filter((r) => r.decision === 'no').length,
    };

    if (counts.yes >= counts.maybe && counts.yes >= counts.no) return 'YES';
    if (counts.maybe >= counts.yes && counts.maybe >= counts.no) return 'MAYBE';
    return 'NO';
  };

  const majority = getMajorityDecision();

  return (
    <Box sx={{ minHeight: '100vh', background: '#f4fdfc' }}>
      <Box className="no-print">
        <Navbar onMenuSelect={handleMenuSelect} />
      </Box>

      <Container maxWidth="xl" sx={{ py: 3 }}>
        {view === 'home' && (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Typography
              variant="h5"
              sx={{
                fontWeight: 900,
                color: '#2bb3b1',
                mb: 1,
              }}
            >
              EMEDIX GC
            </Typography>

            <Upload onUploadSuccess={handleUploadSuccess} />
          </Box>
        )}

        {view === 'match' && (
          <>
            <Box sx={{ mb: 3 }} className="no-print">
              <Upload onUploadSuccess={handleUploadSuccess} />
            </Box>

            <Box
              ref={reportRef}
              sx={{
                backgroundColor: '#ffffff',
                p: 1,
                borderRadius: '14px',
                border: '1px solid #d1f0ed',
              }}
            >
              {majority && (
                <Typography
                  variant="h4"
                  sx={{
                    textAlign: 'center',
                    fontWeight: 900,
                    color: '#2bb3b1',
                    mb: 1.5,
                  }}
                >
                  {showVendorwise
                    ? 'VENDORWISE REPORT'
                    : 'YES/MAYBE REPORT'}
                </Typography>
              )}

              {docHeader?.lines?.length > 0 && (
                <Paper sx={{ p: 2, mb: 2, textAlign: 'center' }}>
                  {docHeader.lines.map((line, index) => (
                    <Typography key={index}>{line}</Typography>
                  ))}
                </Paper>
              )}

              {results.length > 0 && (
                <Box>
                  <Box sx={{ display: 'flex', mb: 1.5, gap: 1 }}>
                    <Typography sx={{ flexGrow: 1 }}>
                      {showVendorwise
                        ? 'VENDORWISE REPORT'
                        : 'MATCHED RESULTS'}
                    </Typography>

                    <Typography>
                      TOTAL:{' '}
                      {showVendorwise
                        ? vendorwiseResults.length
                        : results.length}
                    </Typography>

                    <Button onClick={handlePrint}>Print</Button>

                    <Button onClick={handleVendorwiseToggle}>
                      {showVendorwise
                        ? 'Show Normal Report'
                        : 'Show Vendorwise'}
                    </Button>
                  </Box>

                  {showVendorwise ? (
                    <VendorSearch
                      results={vendorwiseResults}
                      documentHeader={docHeader}
                    />
                  ) : (
                    <ResultsTable data={results} />
                  )}
                </Box>
              )}
            </Box>
          </>
        )}
      </Container>
    </Box>
  );
};

export default Dashboard;
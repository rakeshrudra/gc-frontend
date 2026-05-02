import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Container, Typography, Paper, Button, Stack, Chip } from '@mui/material';
import axios from 'axios';

import Navbar from '../components/Navbar';
import Upload from '../components/Upload';
import ResultsTable from '../components/Table';
import VendorSearch from './SearchVendor';
import MedicineVendorSearch from './MedicineVendorSearch';

const getNumberValue = (value) => {
  if (value === null || value === undefined || value === '') return null;

  const num = Number(String(value).replace(/[^\d.-]/g, ''));

  return Number.isNaN(num) ? null : num;
};

const getRowMrp = (row) => {
  if (row.mrp !== null && row.mrp !== undefined && row.mrp !== '') {
    return getNumberValue(row.mrp);
  }

  if (Array.isArray(row.uniqueVendors) && row.uniqueVendors.length > 0) {
    const firstVendorWithMrp = row.uniqueVendors.find((vendor) => {
      if (typeof vendor === 'string') return false;
      return vendor?.mrp !== null && vendor?.mrp !== undefined && vendor?.mrp !== '';
    });

    if (firstVendorWithMrp) {
      return getNumberValue(firstVendorWithMrp.mrp);
    }
  }

  return null;
};

const getRowQty = (row) => {
  return getNumberValue(row['Qty.'] ?? row.Qty);
};

const getCalculatedAmount = (row) => {
  const mrp = getRowMrp(row);
  const qty = getRowQty(row);

  if (mrp === null || qty === null) return null;

  return mrp * qty;
};

const formatAmount = (value) => {
  const num = getNumberValue(value);

  if (num === null) return '0.00';

  return num.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

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

  const totalUploadAmount = results.reduce((sum, row) => {
    const amount = getCalculatedAmount(row);
    return amount === null ? sum : sum + amount;
  }, 0);

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
              className="print-area"
              sx={{
                backgroundColor: '#ffffff',
                p: { xs: 1, sm: 2 },
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
                  <Paper
                    elevation={0}
                    className="no-print"
                    sx={{
                      mb: 2,
                      p: 1.5,
                      borderRadius: 2,
                      border: '1px solid #e0f2f1',
                      backgroundColor: '#fbfffe',
                    }}
                  >
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: { xs: 'stretch', sm: 'center' },
                        justifyContent: 'space-between',
                        gap: 1.5,
                        flexDirection: { xs: 'column', md: 'row' },
                      }}
                    >
                      <Box>
                        <Typography
                          sx={{
                            fontWeight: 800,
                            color: '#113b4a',
                            fontSize: '0.95rem',
                          }}
                        >
                          {showVendorwise
                            ? 'Vendorwise Results'
                            : 'Matched Results'}
                        </Typography>

                        <Typography
                          sx={{
                            color: '#607d8b',
                            fontSize: '0.78rem',
                            mt: 0.3,
                          }}
                        >
                          {showVendorwise
                            ? 'Vendor grouped report from matched upload results'
                            : 'Upload matching report with DB MRP and calculated amount'}
                        </Typography>
                      </Box>

                      <Stack
                        direction={{ xs: 'column', sm: 'row' }}
                        spacing={1}
                        alignItems={{ xs: 'stretch', sm: 'center' }}
                        justifyContent="flex-end"
                        flexWrap="wrap"
                      >
                        <Chip
                          label={`Total Rows: ${showVendorwise ? vendorwiseResults.length : results.length}`}
                          sx={{
                            fontWeight: 800,
                            backgroundColor: '#e9fffb',
                            color: '#006c68',
                          }}
                        />

                        {!showVendorwise && (
                          <Chip
                          label={`Total Amount: ₹${formatAmount(totalUploadAmount)}`}
                            sx={{
                              fontWeight: 800,
                              backgroundColor: '#e8f5e9',
                              color: '#1b5e20',
                            }}
                          />
                        )}

                        <Button
                          onClick={handlePrint}
                          variant="outlined"
                          size="small"
                          sx={{
                            textTransform: 'none',
                            fontWeight: 800,
                            borderColor: '#0f9f9a',
                            color: '#0f9f9a',
                            '&:hover': {
                              borderColor: '#0b827e',
                              backgroundColor: '#e9fffb',
                            },
                          }}
                        >
                          Print
                        </Button>

                        <Button
                          onClick={handleVendorwiseToggle}
                          variant="contained"
                          size="small"
                          sx={{
                            textTransform: 'none',
                            fontWeight: 800,
                            backgroundColor: '#0f9f9a',
                            '&:hover': {
                              backgroundColor: '#0b827e',
                            },
                          }}
                        >
                          {showVendorwise
                            ? 'Show Normal Report'
                            : 'Show Vendorwise'}
                        </Button>
                      </Stack>
                    </Box>
                  </Paper>

                  {showVendorwise ? (
                    <VendorSearch
                      results={vendorwiseResults}
                      documentHeader={docHeader}
                    />
                  ) : (
                    <ResultsTable data={results} documentHeader={docHeader} />
                  )}
                </Box>
              )}
            </Box>
          </>
        )}

        {view === 'searchMaster' && (
          <MedicineVendorSearch />
        )}
      </Container>
    </Box>
  );
};

export default Dashboard;
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Container, Typography, Paper } from '@mui/material';
import Navbar from '../components/Navbar';
import Upload from '../components/Upload';
import ResultsTable from '../components/Table';
import VendorSearch from './SearchVendor';

const Dashboard = () => {
  const navigate = useNavigate();

  const [results, setResults] = useState([]);
  const [docHeader, setDocHeader] = useState(null);
  const [vendorwiseResults, setVendorwiseResults] = useState([]);
  const [vendorwiseGrouped, setVendorwiseGrouped] = useState({});
  const [view, setView] = useState('home'); // home | match | vendorsearch

  useEffect(() => {
    const token = sessionStorage.getItem('token');
    if (!token) {
      navigate('/', { replace: true });
    }
  }, [navigate]);

  const handleUploadSuccess = (data) => {
    const rows = data.results || [];
    const vendorRows = data.vendorwiseResults || [];
    const groupedVendors = data.vendorwiseGrouped || {};

    setResults(rows);
    setDocHeader(data.documentHeader || null);
    setVendorwiseResults(vendorRows);
    setVendorwiseGrouped(groupedVendors);

    setView('match');
  };

  const handleMenuSelect = (selectedView) => {
    setView(selectedView);
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
    <Box sx={{ minHeight: '100vh', backgroundColor: '#f4f7f9' }}>
      <style>
        {`
          @media print {
            .no-print,
            header,
            nav,
            button,
            .MuiButton-root,
            #upload-dropzone,
            #logout-button,
            .MuiAppBar-root {
              display: none !important;
            }

            body {
              background-color: white !important;
              padding: 0 !important;
              margin: 0 !important;
            }

            .MuiContainer-root {
              max-width: 100% !important;
              padding: 0 !important;
              margin: 0 !important;
            }

            .MuiPaper-root {
              box-shadow: none !important;
              border: none !important;
              padding: 0 !important;
            }

            #results-table {
              width: 100% !important;
              border-collapse: collapse !important;
              table-layout: auto !important;
            }

            #results-table thead {
              display: table-header-group !important;
            }

            #results-table th,
            #results-table td {
              border: 1px solid #ddd !important;
              font-size: 8pt !important;
              padding: 4px !important;
              word-break: break-word !important;
            }

            #results-table th {
              background-color: #f1f8fe !important;
              color: #01579b !important;
              font-weight: bold !important;
              text-transform: uppercase !important;
              position: static !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }

            .MuiTableContainer-root {
              max-height: none !important;
              overflow: visible !important;
            }

            @page {
              size: auto;
              margin: 10mm;
            }
          }
        `}
      </style>

      <Box className="no-print">
        <Navbar onMenuSelect={handleMenuSelect} />
      </Box>

      <Container maxWidth="xl" sx={{ py: 3 }}>
        {view === 'home' && (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Typography variant="h5" sx={{ fontWeight: 800, color: '#01579b', mb: 1 }}>
              E_MEDIX GYAN CENTER
            </Typography>
            <Typography variant="body2" sx={{ mb: 4, color: '#546e7a' }}>
              Select an option from the menu to continue.
            </Typography>

            <Box sx={{ maxWidth: 900, mx: 'auto' }}>
              <Upload onUploadSuccess={handleUploadSuccess} />
            </Box>
          </Box>
        )}

        {view === 'match' && (
          <>
            <Box sx={{ mb: 3 }} className="no-print">
              <Upload onUploadSuccess={handleUploadSuccess} />
            </Box>

            {majority && (
              <Typography
                variant="h4"
                sx={{
                  textAlign: 'center',
                  fontWeight: 900,
                  color: '#0288d1',
                  mb: 1.5,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                }}
              >
                YES/MAYBE REPORT
              </Typography>
            )}

            {docHeader && (docHeader.title || (docHeader.lines && docHeader.lines.length > 0)) && (
              <Paper
                elevation={0}
                sx={{
                  p: 1.5,
                  mb: 1.5,
                  borderRadius: '12px',
                  border: '1px solid',
                  borderColor: 'grey.200',
                  backgroundColor: '#fff',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.03)',
                  textAlign: 'center',
                }}
              >
                {docHeader.title && (
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: 900,
                      color: '#01579b',
                      mb: 1,
                      textTransform: 'uppercase',
                      letterSpacing: '0.02em',
                    }}
                  >
                    {docHeader.title}
                  </Typography>
                )}

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                  {docHeader.lines
                    ?.filter((line, index, arr) => {
                      if (index === 0 && line === docHeader.title) return false;
                      const lower = line.toLowerCase();
                      if (
                        index >= arr.length - 2 &&
                        (lower.includes('cst no') || lower.includes('d.l. no'))
                      ) {
                        return false;
                      }
                      return true;
                    })
                    .map((line, idx) => {
                      const isPurchaseOrder = line.toLowerCase().includes('purchase order');

                      return (
                        <Typography
                          key={idx}
                          variant="caption"
                          sx={{
                            color: isPurchaseOrder ? '#01579b' : '#1a1a1a',
                            fontWeight: isPurchaseOrder ? 900 : 700,
                            fontSize: isPurchaseOrder ? '0.85rem' : '0.75rem',
                            textTransform: isPurchaseOrder ? 'uppercase' : 'none',
                            lineHeight: 1.4,
                          }}
                        >
                          {line}
                        </Typography>
                      );
                    })}
                </Box>
              </Paper>
            )}

            {results.length > 0 && (
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                  <Typography
                    variant="subtitle2"
                    sx={{ fontWeight: 700, color: '#1a1a1a', flexGrow: 1 }}
                  >
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

        {view === 'vendorsearch' && (
          <>
            <Box sx={{ mb: 3 }} className="no-print">
              <Upload onUploadSuccess={handleUploadSuccess} />
            </Box>

            <VendorSearch
              results={results}
              documentHeader={docHeader}
            />
          </>
        )}
      </Container>
    </Box>
  );
};

export default Dashboard;
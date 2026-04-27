import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Container, Typography, Paper, Button } from '@mui/material';
import Navbar from '../components/Navbar';
import Upload from '../components/Upload';
import ResultsTable from '../components/Table';
import VendorSearch from './SearchVendor';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { getVendorwiseResults } from '../services/api';

const Dashboard = () => {
  const navigate = useNavigate();
  const reportRef = useRef(null);

  const [results, setResults] = useState([]);
  const [docHeader, setDocHeader] = useState(null);
  const [view, setView] = useState('home');
  const [showVendorwise, setShowVendorwise] = useState(false);
  const [vendorwiseResults, setVendorwiseResults] = useState([]);
  const [vendorwiseLoading, setVendorwiseLoading] = useState(false);

  useEffect(() => {
    const token = sessionStorage.getItem('token');
    if (!token) {
      navigate('/', { replace: true });
    }
  }, [navigate]);

  const handleUploadSuccess = (data) => {
    const rows = data.results || [];

    setResults(rows);
    setDocHeader(data.documentHeader || null);
    setShowVendorwise(false);
    setVendorwiseResults([]);
    setView('match');
  };

  const handleMenuSelect = (selectedView) => {
    setView(selectedView);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleVendorwiseToggle = async () => {
    if (showVendorwise) {
      setShowVendorwise(false);
      return;
    }

    if (vendorwiseResults.length > 0) {
      setShowVendorwise(true);
      return;
    }

    setVendorwiseLoading(true);

    try {
      const data = await getVendorwiseResults(results);
      setVendorwiseResults(data.vendorwiseResults || []);
      setShowVendorwise(true);
    } catch (error) {
      console.error('Vendorwise fetch failed:', error);
      alert('Vendorwise report failed. Please try again.');
    } finally {
      setVendorwiseLoading(false);
    }
  };

  const handleExportPDF = async () => {
    if (!reportRef.current) return;

    document.body.classList.add('export-mode');

    const scrollContainers = reportRef.current.querySelectorAll('.MuiTableContainer-root');

    scrollContainers.forEach((el) => {
      el.dataset.oldMaxHeight = el.style.maxHeight || '';
      el.dataset.oldHeight = el.style.height || '';
      el.dataset.oldOverflow = el.style.overflow || '';

      el.style.maxHeight = 'none';
      el.style.height = 'auto';
      el.style.overflow = 'visible';
    });

    await new Promise((resolve) => setTimeout(resolve, 700));

    const canvas = await html2canvas(reportRef.current, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      scrollX: 0,
      scrollY: 0,
      windowWidth: reportRef.current.scrollWidth,
      windowHeight: reportRef.current.scrollHeight,
      width: reportRef.current.scrollWidth,
      height: reportRef.current.scrollHeight,
    });

    scrollContainers.forEach((el) => {
      el.style.maxHeight = el.dataset.oldMaxHeight;
      el.style.height = el.dataset.oldHeight;
      el.style.overflow = el.dataset.oldOverflow;
    });

    document.body.classList.remove('export-mode');

    const imgData = canvas.toDataURL('image/png');

    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();

    const imgWidth = pdfWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pdfHeight;

    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight;
    }

    pdf.save(showVendorwise ? 'vendorwise-report.pdf' : 'yes-maybe-report.pdf');
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
          .export-mode .no-print,
          .export-mode button,
          .export-mode .MuiButton-root {
            display: none !important;
          }

          .export-mode .MuiTableContainer-root {
            max-height: none !important;
            height: auto !important;
            overflow: visible !important;
          }

          .export-mode table {
            width: 100% !important;
            border-collapse: collapse !important;
          }

          .export-mode th,
          .export-mode td {
            border: 1px solid #ddd !important;
            font-size: 8pt !important;
            padding: 4px !important;
            word-break: break-word !important;
          }

          .export-mode th {
            background-color: #f1f8fe !important;
            color: #01579b !important;
            font-weight: bold !important;
          }

          .export-mode .decision-badge {
            background-color: transparent !important;
            color: #000 !important;
            border-radius: 0 !important;
            padding: 0 !important;
            min-width: auto !important;
            font-weight: 800 !important;
            font-size: 8pt !important;
          }

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
            }

            table {
              width: 100% !important;
              border-collapse: collapse !important;
            }

            th,
            td {
              border: 1px solid #ddd !important;
              font-size: 8pt !important;
              padding: 4px !important;
              word-break: break-word !important;
            }

            th {
              background-color: #f1f8fe !important;
              color: #01579b !important;
              font-weight: bold !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }

            .decision-badge {
              background-color: transparent !important;
              color: #000 !important;
              border-radius: 0 !important;
              padding: 0 !important;
              min-width: auto !important;
              font-weight: 800 !important;
              font-size: 8pt !important;
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

            <Box ref={reportRef} sx={{ backgroundColor: '#fff', p: 1 }}>
              {majority && (
                <Typography
                  variant="h4"
                  sx={{
                    textAlign: 'center',
                    fontWeight: 900,
                    color: '#0288d1',
                    mb: 1.5,
                    textTransform: 'uppercase',
                  }}
                >
                  {showVendorwise ? 'VENDORWISE REPORT' : 'YES/MAYBE REPORT'}
                </Typography>
              )}

              {docHeader?.lines?.length > 0 && (
                <Paper
                  sx={{
                    p: 2,
                    mb: 2,
                    textAlign: 'center',
                    borderRadius: '10px',
                    border: '1px solid #e0e0e0',
                    boxShadow: 'none',
                  }}
                >
                  {docHeader.lines.map((line, index) => (
                    <Typography
                      key={index}
                      sx={{
                        fontWeight: index === 0 ? 900 : 600,
                        fontSize: index === 0 ? '1.1rem' : '0.8rem',
                        color: index === 0 ? '#01579b' : '#263238',
                        lineHeight: 1.6,
                        textTransform: index === 0 ? 'uppercase' : 'none',
                      }}
                    >
                      {line}
                    </Typography>
                  ))}
                </Paper>
              )}

              {results.length > 0 && (
                <Box>
                  <Box
                    className="no-print"
                    sx={{ display: 'flex', alignItems: 'center', mb: 1.5, gap: 1 }}
                  >
                    <Typography sx={{ fontWeight: 700, flexGrow: 1 }}>
                      {showVendorwise ? 'VENDORWISE REPORT' : 'MATCHED RESULTS'}
                    </Typography>

                    <Typography sx={{ fontSize: 12 }}>
                      TOTAL: {showVendorwise ? vendorwiseResults.length : results.length}
                    </Typography>

                    <Button variant="outlined" size="small" onClick={handlePrint}>
                      Print
                    </Button>

                    <Button
                      variant="contained"
                      size="small"
                      onClick={handleExportPDF}
                      sx={{ backgroundColor: '#2e7d32' }}
                    >
                      Export PDF
                    </Button>

                    <Button
                      variant="contained"
                      size="small"
                      onClick={handleVendorwiseToggle}
                      disabled={vendorwiseLoading}
                    >
                      {vendorwiseLoading
                        ? 'Loading Vendorwise...'
                        : showVendorwise
                          ? 'Show Normal Report'
                          : 'Show Vendorwise'}
                    </Button>
                  </Box>

                  {showVendorwise ? (
                    <VendorSearch results={vendorwiseResults} documentHeader={docHeader} />
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
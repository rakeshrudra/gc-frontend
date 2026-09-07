import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  Collapse,
  InputAdornment,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import SearchIcon from '@mui/icons-material/Search';
import { LifeLine } from 'react-loading-indicators';

import {
  uploadMasterData,
  getMasterUploadPage,
  getLatestMasterDate,
  getAllMasterRows,
} from '../services/api';

const formatDate = (value) => {
  if (!value) return '—';
  const parsed = new Date(value);
  if (isNaN(parsed.getTime())) return '—';
  return parsed.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const columns = [
  { key: 'product_name', label: 'Product Name' },
  { key: 'company', label: 'Company' },
  { key: 'vendor_name', label: 'Vendor Name' },
  { key: 'date', label: 'Date' },
  { key: 'billno', label: 'Bill No' },
  { key: 'vendor_pan', label: 'Vendor PAN' },
  { key: 'batch_no', label: 'Batch No' },
  { key: 'disc', label: 'Discount' },
  { key: 'mrp', label: 'MRP' },
  { key: 'vendor_gst', label: 'Vendor GST' },
];

const summaryItems = [
  { key: 'insertedCount', label: 'Inserted' },
  { key: 'skippedCount', label: 'Skipped (blank rows)' },
  { key: 'rejectedOldCount', label: 'Rejected (old dates)' },
];

const validExcelTypes = [
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
  'text/csv',
];

const MasterUpload = () => {
  const fileInputRef = useRef(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  const [uploadId, setUploadId] = useState(null);
  const [rows, setRows] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(50);
  const [searchInput, setSearchInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [tableLoading, setTableLoading] = useState(false);
  const [latestMasterDate, setLatestMasterDate] = useState(null);

  useEffect(() => {
    getLatestMasterDate()
      .then((data) => setLatestMasterDate(data.latestMasterDate))
      .catch(() => {});
  }, []);

  const validateAndSet = (file) => {
    setError('');

    const fileName = file.name.toLowerCase();
    const isValid =
      validExcelTypes.includes(file.type) ||
      fileName.endsWith('.xlsx') ||
      fileName.endsWith('.xls') ||
      fileName.endsWith('.csv');

    if (!isValid) {
      setSelectedFile(null);
      setError('Please select a valid CSV or Excel file (.csv, .xlsx or .xls)');
      return;
    }

    setSelectedFile(file);
  };

  const handleFileSelect = (event) => {
    const file = event.target.files?.[0];
    if (file) validateAndSet(file);
  };

  const handleDrag = (event) => {
    event.preventDefault();
    event.stopPropagation();

    if (event.type === 'dragenter' || event.type === 'dragover') {
      setDragActive(true);
    } else if (event.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (event) => {
    event.preventDefault();
    event.stopPropagation();
    setDragActive(false);

    const file = event.dataTransfer.files?.[0];
    if (file) validateAndSet(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Please select a file first');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const data = await uploadMasterData(selectedFile);
      setResult(data);
      setUploadId(data.uploadId);
      setRows(Array.isArray(data.data) ? data.data : []);
      setTotalCount(data.totalCount ?? 0);
      setLatestMasterDate(data.latestMasterDate);
      setPage(0);
      setSearchInput('');
      setSearchTerm('');
    } catch (err) {
      setError(err.response?.data?.message || 'Upload failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const normalizedInput = searchInput.trim();

    const debounceTimer = setTimeout(() => {
      setSearchTerm(normalizedInput);
      setPage(0);
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [searchInput]);

  useEffect(() => {
    let cancelled = false;
    setTableLoading(true);

    const fetchPage = uploadId
      ? getMasterUploadPage(uploadId, {
          page: page + 1,
          limit: rowsPerPage,
          search: searchTerm,
        })
      : getAllMasterRows({
          page: page + 1,
          limit: rowsPerPage,
          search: searchTerm,
        });

    fetchPage
      .then((data) => {
        if (cancelled) return;
        setRows(Array.isArray(data.data) ? data.data : []);
        setTotalCount(data.totalCount ?? 0);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err.response?.data?.message || 'Failed to load records.');
      })
      .finally(() => {
        if (!cancelled) setTableLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [uploadId, page, rowsPerPage, searchTerm]);

  const handleChangePage = (_event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  return (
    <Box sx={{ width: '100%', maxWidth: '100%', overflowX: 'hidden' }}>
      <Paper
        elevation={0}
        sx={{
          p: { xs: 1, sm: 1.5 },
          mb: { xs: 1.5, sm: 2 },
          borderRadius: '12px',
          border: '1px solid #d9f7ef',
          background: 'rgba(255,255,255,0.95)',
        }}
      >
        <Typography
          variant="subtitle1"
          sx={{ fontWeight: 700, mb: 0.5, color: '#2bb3b1' }}
        >
          Master Upload
        </Typography>

        <Typography variant="body2" sx={{ mb: 2, color: '#546e7a' }}>
          Records uploaded till: <strong>{formatDate(latestMasterDate)}</strong>. Only
          rows dated after this will be accepted in the next upload.
        </Typography>

        <Box
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          sx={{
            border: '2px dashed',
            borderColor: dragActive ? '#2bb3b1' : '#cbd5e1',
            borderRadius: '10px',
            p: { xs: 1.25, sm: 1.5 },
            textAlign: 'center',
            cursor: 'pointer',
            backgroundColor: dragActive
              ? 'rgba(111,231,221,0.15)'
              : 'rgba(0,0,0,0.01)',
          }}
        >
          <CloudUploadIcon
            sx={{
              fontSize: 28,
              color: dragActive ? '#2bb3b1' : '#94a3b8',
            }}
          />
          <Typography variant="body2">
            {dragActive ? 'Drop file here' : 'Drag & drop CSV/Excel file or click to browse'}
          </Typography>
        </Box>

        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.xlsx,.xls"
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />

        {selectedFile && (
          <Box
            sx={{
              mt: 2,
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              flexWrap: 'wrap',
              minWidth: 0,
            }}
          >
            <InsertDriveFileIcon sx={{ color: '#2bb3b1', flexShrink: 0 }} />
            <Typography sx={{ flexGrow: 1, minWidth: 0, overflowWrap: 'anywhere' }}>
              {selectedFile.name}
            </Typography>
            <Chip label={`${(selectedFile.size / 1024).toFixed(1)} KB`} size="small" />
          </Box>
        )}

        <Button
          variant="contained"
          onClick={handleUpload}
          disabled={!selectedFile || loading}
          fullWidth
          sx={{
            mt: 1.5,
            borderRadius: '8px',
            fontWeight: 700,
            background: 'linear-gradient(135deg, #2bb3b1, #3aaed8)',
            color: '#ffffff',
          }}
        >
          {loading ? <LifeLine size="small" color="#4ade80" /> : 'Upload'}
        </Button>

        <Collapse in={!!error}>
          <Alert severity="error" sx={{ mt: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        </Collapse>
      </Paper>

      {result && (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              sm: 'repeat(2, minmax(0, 1fr))',
            },
            gap: 1.5,
            mb: { xs: 1.5, sm: 2 },
            minWidth: 0,
          }}
        >
          {summaryItems.map((item) => (
            <Paper
              key={item.key}
              elevation={0}
              sx={{
                p: { xs: 1.25, sm: 1.5 },
                borderRadius: '10px',
                border: '1px solid #d9f7ef',
                background: '#ffffff',
              }}
            >
              <Typography variant="body2" sx={{ color: '#546e7a' }}>
                {item.label}
              </Typography>
              <Typography variant="h6" sx={{ color: '#0f9f9a', fontWeight: 800 }}>
                {result[item.key] ?? 0}
              </Typography>
            </Paper>
          ))}
        </Box>
      )}

      <>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 1,
            mb: 1,
          }}
        >
          <Typography variant="subtitle2" sx={{ color: '#37474f', fontWeight: 700 }}>
            {uploadId ? 'Uploaded File Records' : 'All Master Records'}
          </Typography>

          {uploadId && (
            <Button
              size="small"
              onClick={() => {
                setUploadId(null);
                setResult(null);
                setPage(0);
                setSearchInput('');
                setSearchTerm('');
              }}
              sx={{ textTransform: 'none', color: '#2bb3b1', fontWeight: 700 }}
            >
              Show all master records
            </Button>
          )}
        </Box>

        <TextField
            fullWidth
            size="small"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Search by starting text (product, company, vendor, bill no, batch)"
            sx={{
              mb: { xs: 1.5, sm: 2 },
              background: '#ffffff',
              '& .MuiOutlinedInput-root': {
                borderRadius: '10px',
              },
            }}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: '#2bb3b1' }} />
                  </InputAdornment>
                ),
              },
            }}
          />

          <TableContainer
            component={Paper}
            elevation={0}
            sx={{
              borderRadius: '12px',
              border: '1px solid #d9f7ef',
              overflowX: 'auto',
              maxWidth: '100%',
            }}
          >
            <Table size="small" sx={{ minWidth: { xs: 980, md: 1100 } }}>
              <TableHead>
                <TableRow>
                  {columns.map((column) => (
                    <TableCell
                      key={column.key}
                      sx={{
                        px: { xs: 1, sm: 1.5 },
                        py: { xs: 0.75, sm: 1 },
                        fontSize: { xs: '0.78rem', sm: '0.875rem' },
                        whiteSpace: 'normal',
                      }}
                    >
                      {column.label}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.length > 0 ? (
                  rows.map((row, index) => (
                    <TableRow key={row.id ?? `${row.batch_no || 'row'}-${index}`}>
                      {columns.map((column) => (
                        <TableCell
                          key={column.key}
                          sx={{
                            px: { xs: 1, sm: 1.5 },
                            py: { xs: 0.75, sm: 1 },
                            fontSize: { xs: '0.78rem', sm: '0.875rem' },
                            maxWidth: { xs: 180, sm: 240, md: 300 },
                            overflowWrap: 'anywhere',
                            whiteSpace: 'normal',
                            verticalAlign: 'top',
                          }}
                        >
                          {row[column.key] ?? ''}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={columns.length}
                      align="center"
                      sx={{
                        px: { xs: 1, sm: 1.5 },
                        py: { xs: 1.5, sm: 2 },
                        fontSize: { xs: '0.78rem', sm: '0.875rem' },
                      }}
                    >
                      {tableLoading ? 'Loading…' : 'No records found.'}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>

            <TablePagination
              component="div"
              count={totalCount}
              page={page}
              onPageChange={handleChangePage}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              rowsPerPageOptions={[25, 50, 100, 200]}
            />
          </TableContainer>
      </>
    </Box>
  );
};

export default MasterUpload;

import React, { useEffect, useMemo, useRef, useState } from 'react';
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
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import SearchIcon from '@mui/icons-material/Search';
import { LifeLine } from 'react-loading-indicators';

import { uploadExpiryReturn } from '../services/expiryReturn';

const columns = [
  { key: 'hsncode', label: 'HSN Code' },
  { key: 'particulars', label: 'Particulars' },
  { key: 'packing', label: 'Packing' },
  { key: 'company', label: 'Company' },
  { key: 'batchno', label: 'Batch No' },
  { key: 'invoiceDate', label: 'Invoice Date' },
  { key: 'expiry', label: 'Expiry' },
  { key: 'vendorName', label: 'Vendor Name' },
  { key: 'billNumber', label: 'Bill Number' },
  { key: 'status', label: 'Status' },
];

const summaryItems = [
  { key: 'totalRows', label: 'Total Rows' },
  { key: 'foundRows', label: 'Found' },
  { key: 'notFoundRows', label: 'Not Found' },
];

const searchableColumns = [
  'hsncode',
  'particulars',
  'company',
  'batchno',
  'vendorName',
  'billNumber',
  'status',
];

const validExcelTypes = [
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
];

const ExpiryReturn = () => {
  const fileInputRef = useRef(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [searchInput, setSearchInput] = useState('');
  const [filterTerm, setFilterTerm] = useState('');

  const validateAndSet = (file) => {
    setError('');

    const fileName = file.name.toLowerCase();
    const isExcel =
      validExcelTypes.includes(file.type) ||
      fileName.endsWith('.xlsx') ||
      fileName.endsWith('.xls');

    if (!isExcel) {
      setSelectedFile(null);
      setError('Please select a valid Excel file (.xlsx or .xls)');
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
      const data = await uploadExpiryReturn(selectedFile);
      setResult(data);
      setSearchInput('');
      setFilterTerm('');
    } catch (err) {
      setError(err.response?.data?.message || 'Upload failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const normalizedInput = searchInput.trim().toLowerCase();

    if (!normalizedInput) {
      setFilterTerm('');
      return undefined;
    }

    const debounceTimer = setTimeout(() => {
      setFilterTerm(normalizedInput);
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [searchInput]);

  const rows = Array.isArray(result?.data) ? result.data : [];
  const filteredRows = useMemo(() => {
    if (!filterTerm) {
      return rows;
    }

    return rows.filter((row) =>
      searchableColumns.some((column) =>
        String(row[column] ?? '').toLowerCase().includes(filterTerm),
      ),
    );
  }, [filterTerm, rows]);

  return (
    <Box>
      <Paper
        elevation={0}
        sx={{
          p: 1.5,
          mb: 2,
          borderRadius: '12px',
          border: '1px solid #d9f7ef',
          background: 'rgba(255,255,255,0.95)',
        }}
      >
        <Typography
          variant="subtitle1"
          sx={{ fontWeight: 700, mb: 2, color: '#2bb3b1' }}
        >
          Expiry Return Upload
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
            p: 1.5,
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
            {dragActive ? 'Drop file here' : 'Drag & drop Excel file or click to browse'}
          </Typography>
        </Box>

        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls"
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />

        {selectedFile && (
          <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <InsertDriveFileIcon sx={{ color: '#2bb3b1' }} />
            <Typography sx={{ flexGrow: 1 }}>{selectedFile.name}</Typography>
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
        <>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                sm: 'repeat(3, minmax(0, 1fr))',
              },
              gap: 1.5,
              mb: 2,
            }}
          >
            {summaryItems.map((item) => (
              <Paper
                key={item.key}
                elevation={0}
                sx={{
                  p: 1.5,
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

          <TextField
            fullWidth
            size="small"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Search uploaded results"
            sx={{
              mb: 2,
              background: '#ffffff',
              '& .MuiOutlinedInput-root': {
                borderRadius: '10px',
              },
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: '#2bb3b1' }} />
                </InputAdornment>
              ),
            }}
          />

          <TableContainer
            component={Paper}
            elevation={0}
            sx={{
              borderRadius: '12px',
              border: '1px solid #d9f7ef',
              overflowX: 'auto',
            }}
          >
            <Table size="small">
              <TableHead>
                <TableRow>
                  {columns.map((column) => (
                    <TableCell key={column.key}>{column.label}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredRows.length > 0 ? (
                  filteredRows.map((row, index) => (
                    <TableRow key={`${row.batchno || 'row'}-${index}`}>
                      {columns.map((column) => (
                        <TableCell key={column.key}>
                          {row[column.key] ?? ''}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={columns.length} align="center">
                      {rows.length > 0 ? 'No matching records found.' : 'No records found.'}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}
    </Box>
  );
};

export default ExpiryReturn;

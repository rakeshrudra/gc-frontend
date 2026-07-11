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
  { key: 'expiry', label: 'Expiry' },
  { key: 'vendorName', label: 'Vendor Name' },
  { key: 'billNumber', label: 'Bill Number' },
  { key: 'invoiceDate', label: 'Invoice Date' },
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

const getUniqueInvoices = (invoices = []) => {
  const seen = new Set();

  return invoices.filter((invoice) => {
    const invoiceNumber = String(invoice?.invoiceNumber ?? '').trim();

    if (!invoiceNumber || seen.has(invoiceNumber)) {
      return false;
    }

    seen.add(invoiceNumber);
    return true;
  });
};

const getVendorGroups = (row) => {
  if (Array.isArray(row?.vendors)) {
    if (row.vendors.length === 0) {
      return [{ vendorName: '-', invoices: [] }];
    }

    return row.vendors.map((vendor) => ({
      vendorName: vendor?.vendorName || '-',
      invoices: getUniqueInvoices(vendor?.invoices),
      isFlatFallback: false,
    }));
  }

  return [
    {
      vendorName: row?.vendorName || '-',
      invoices:
        row?.billNumber || row?.invoiceDate
          ? [{ invoiceNumber: row?.billNumber || '-', invoiceDate: row?.invoiceDate || '-' }]
          : [],
      isFlatFallback: true,
    },
  ];
};

const getVendorSearchValue = (row, column) => {
  if (column === 'vendorName') {
    return getVendorGroups(row)
      .map((vendor) => vendor.vendorName)
      .join(' ');
  }

  if (column === 'billNumber') {
    return getVendorGroups(row)
      .flatMap((vendor) => vendor.invoices.map((invoice) => invoice.invoiceNumber))
      .join(' ');
  }

  return row[column];
};

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
        String(getVendorSearchValue(row, column) ?? '')
          .toLowerCase()
          .includes(filterTerm),
      ),
    );
  }, [filterTerm, rows]);

  const renderVendorCell = (row) => (
    <Box>
      {getVendorGroups(row).map((vendor, index) => (
        <Box key={`${vendor.vendorName}-${index}`}>{vendor.vendorName}</Box>
      ))}
    </Box>
  );

  const renderBillNumberCell = (row) => (
    <Box>
      {getVendorGroups(row).map((vendor, index) => {
        const billNumbers = vendor.invoices.map((invoice) => invoice.invoiceNumber);

        return (
          <Box key={`${vendor.vendorName}-${index}`}>
            {billNumbers.length > 0 ? billNumbers.join(', ') : '-'}
          </Box>
        );
      })}
    </Box>
  );

  const renderInvoiceDateCell = (row) => (
    <Box>
      {getVendorGroups(row).map((vendor, vendorIndex) => {
        if (vendor.isFlatFallback) {
          return (
            <Box key={`${vendor.vendorName}-${vendorIndex}`}>
              {vendor.invoices[0]?.invoiceDate || '-'}
            </Box>
          );
        }

        if (vendor.invoices.length === 0) {
          return <Box key={`${vendor.vendorName}-${vendorIndex}`}>-</Box>;
        }

        return (
          <Box key={`${vendor.vendorName}-${vendorIndex}`}>
            {vendor.invoices.map((invoice, invoiceIndex) => (
              <Box key={`${invoice.invoiceNumber}-${invoiceIndex}`}>
                {invoice.invoiceNumber} — {invoice.invoiceDate || '-'}
              </Box>
            ))}
          </Box>
        );
      })}
    </Box>
  );

  const renderCellValue = (row, column) => {
    if (column.key === 'vendorName') {
      return renderVendorCell(row);
    }

    if (column.key === 'billNumber') {
      return renderBillNumberCell(row);
    }

    if (column.key === 'invoiceDate') {
      return renderInvoiceDateCell(row);
    }

    return row[column.key] ?? '';
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
        <>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                sm: 'repeat(3, minmax(0, 1fr))',
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

          <TextField
            fullWidth
            size="small"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Search uploaded results"
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
                {filteredRows.length > 0 ? (
                  filteredRows.map((row, index) => (
                    <TableRow key={`${row.batchno || 'row'}-${index}`}>
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
                          {renderCellValue(row, column)}
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

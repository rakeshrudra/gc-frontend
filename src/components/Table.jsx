import React from 'react';
import {
  Table as MuiTable,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Chip,
  Box,
  Button,
} from '@mui/material';
import InboxIcon from '@mui/icons-material/Inbox';
import * as XLSX from 'xlsx';

const columns = [
  { key: 'SNo', label: 'S.No', width: 60 },
  { key: 'Particulars', label: 'Particulars', minWidth: 180 },
  { key: 'Packing', label: 'Packing', width: 90 },
  { key: 'Company', label: 'Company', minWidth: 130 },
  { key: 'Qty.', label: 'Qty.', width: 70, align: 'right' },
  { key: 'matchedProduct', label: 'Matched Product', minWidth: 180 },
  { key: 'matchedCompany', label: 'Matched Company', minWidth: 130 },
  { key: 'decision', label: 'Status', width: 110, align: 'center' },
  { key: 'uniqueVendors', label: 'Vendors', minWidth: 140 },
];

const ResultsTable = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <Paper elevation={0} sx={{ p: 6, textAlign: 'center', borderRadius: '16px', border: '1px solid', borderColor: 'grey.200' }}>
        <InboxIcon sx={{ fontSize: 56, color: 'grey.300', mb: 2 }} />
        <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 500 }}>
          No results to display
        </Typography>
        <Typography variant="body2" color="text.disabled" sx={{ mt: 0.5 }}>
          Upload an Excel file to see matched results here.
        </Typography>
      </Paper>
    );
  }

  const getRowStyle = (decision) => {
    const decisionLower = decision?.toLowerCase();

    if (decisionLower === 'yes') {
      return { backgroundColor: '#e8f5e9', '&:hover': { backgroundColor: '#c8e6c9' }, transition: 'background-color 0.2s ease' };
    }

    if (decisionLower === 'maybe') {
      return { backgroundColor: '#fff9c4', '&:hover': { backgroundColor: '#fff59d' }, transition: 'background-color 0.2s ease' };
    }

    if (decisionLower === 'no') {
      return { backgroundColor: '#ffebee', '&:hover': { backgroundColor: '#ffcdd2' }, transition: 'background-color 0.2s ease' };
    }

    return { '&:hover': { backgroundColor: '#f5f5f5' }, transition: 'background-color 0.2s ease' };
  };

  const renderStatusChip = (decision) => {
    const value = String(decision || 'no').toLowerCase();

    let label = 'NO';
    let bg = '#d32f2f';

    if (value === 'yes') {
      label = 'YES';
      bg = '#2e7d32';
    }

    if (value === 'maybe') {
      label = 'MAYBE';
      bg = '#ed6c02';
    }

    return (
      <Box
        className="decision-badge"
        sx={{
          backgroundColor: bg,
          color: '#fff',
          fontWeight: 900,
          fontSize: '0.7rem',
          px: 1.2,
          py: 0.4,
          borderRadius: '14px',
          minWidth: 70,
          display: 'inline-block',
          textAlign: 'center',
          lineHeight: 1.4,
        }}
      >
        {label}
      </Box>
    );
  };

  const renderVendors = (v) => {
    if (!v) return '—';

    if (Array.isArray(v)) {
      return (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
          {v.map((x, i) => (
            <Chip key={i} label={x} size="small" variant="outlined" sx={{ fontSize: '0.7rem', height: 22 }} />
          ))}
        </Box>
      );
    }

    return String(v);
  };

  const exportToExcel = () => {
    const exportRows = data.map((row, index) => ({
      'S.No': index + 1,
      Particulars: row.Particulars || '',
      Packing: row.Packing || '',
      Company: row.Company || '',
      Qty: row['Qty.'] ?? row.Qty ?? row.qty ?? row.quantity ?? '',
      'Matched Product': row.matchedProduct || '',
      'Matched Company': row.matchedCompany || '',
      Status: String(row.decision || 'no').toUpperCase(),
      Vendors: Array.isArray(row.uniqueVendors)
        ? row.uniqueVendors.join(', ')
        : row.uniqueVendors || '',
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportRows);
    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Matched Results');
    XLSX.writeFile(workbook, 'yes-maybe-results.xlsx');
  };

  return (
    <Box>
      <Box className="no-print" sx={{ mb: 1.5, display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          variant="contained"
          size="small"
          onClick={exportToExcel}
          sx={{
            backgroundColor: '#2e7d32',
            textTransform: 'none',
            fontWeight: 700,
          }}
        >
          Export Excel
        </Button>
      </Box>

      <TableContainer
        component={Paper}
        elevation={0}
        sx={{
          borderRadius: '16px',
          border: '1px solid',
          borderColor: 'grey.200',
          overflow: 'auto',
          maxHeight: '85vh',
        }}
      >
        <MuiTable stickyHeader size="small" id="results-table">
          <TableHead>
            <TableRow>
              {columns.map((col, idx) => (
                <TableCell
                  key={col.key}
                  align={col.align || 'left'}
                  sx={{
                    fontWeight: 800,
                    fontSize: '0.7rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    color: '#01579b',
                    backgroundColor: '#f1f8fe',
                    borderBottom: '2px solid #e1f5fe',
                    borderRight: idx < columns.length - 1 ? '1px solid #e1f5fe' : 'none',
                    whiteSpace: 'nowrap',
                    width: col.width,
                    minWidth: col.minWidth,
                    py: 1,
                  }}
                >
                  {col.label}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>

          <TableBody>
            {data.map((row, rowIndex) => (
              <TableRow key={rowIndex} sx={getRowStyle(row.decision)}>
                <TableCell sx={{ fontWeight: 600, color: '#546e7a', borderRight: '1px solid #f0f0f0', borderBottom: '1px solid #f0f0f0' }}>
                  {rowIndex + 1}
                </TableCell>

                <TableCell sx={{ fontWeight: 700, color: '#1a1a1a', borderRight: '1px solid #f0f0f0', borderBottom: '1px solid #f0f0f0' }}>
                  {row.Particulars || '—'}
                </TableCell>

                <TableCell sx={{ color: '#2c3e50', fontWeight: 500, borderRight: '1px solid #f0f0f0', borderBottom: '1px solid #f0f0f0' }}>
                  {row.Packing || '—'}
                </TableCell>

                <TableCell sx={{ color: '#2c3e50', fontWeight: 500, borderRight: '1px solid #f0f0f0', borderBottom: '1px solid #f0f0f0' }}>
                  {row.Company || '—'}
                </TableCell>

                <TableCell align="right" sx={{ color: '#1a1a1a', fontWeight: 600, borderRight: '1px solid #f0f0f0', borderBottom: '1px solid #f0f0f0' }}>
                  {row['Qty.'] ?? row.Qty ?? row.qty ?? row.quantity ?? '—'}
                </TableCell>

                <TableCell sx={{ fontWeight: 700, color: '#01579b', borderRight: '1px solid #f0f0f0', borderBottom: '1px solid #f0f0f0' }}>
                  {row.matchedProduct || '—'}
                </TableCell>

                <TableCell
                  sx={{
                    fontWeight: row.Company !== row.matchedCompany ? 800 : 700,
                    color: row.Company !== row.matchedCompany ? '#0288d1' : '#01579b',
                    borderRight: '1px solid #f0f0f0',
                    borderBottom: '1px solid #f0f0f0',
                  }}
                >
                  {row.matchedCompany || '—'}
                </TableCell>

                <TableCell align="center" sx={{ borderRight: '1px solid #f0f0f0', borderBottom: '1px solid #f0f0f0' }}>
                  {renderStatusChip(row.decision)}
                </TableCell>

                <TableCell sx={{ borderRight: '1px solid #f0f0f0', borderBottom: '1px solid #f0f0f0' }}>
                  {renderVendors(row.uniqueVendors)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </MuiTable>
      </TableContainer>
    </Box>
  );
};

export default ResultsTable;
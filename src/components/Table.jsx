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
  { key: 'SNo', label: 'S.No' },
  { key: 'Particulars', label: 'Particulars' },
  { key: 'Packing', label: 'Packing' },
  { key: 'Company', label: 'Company' },
  { key: 'Qty.', label: 'Qty.', align: 'right' },
  { key: 'matchedProduct', label: 'Matched Product' },
  { key: 'matchedCompany', label: 'Matched Company' },
  { key: 'decision', label: 'Status', align: 'center' },
  { key: 'uniqueVendors', label: 'Vendors' },
];

const ResultsTable = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <Paper sx={{ p: 6, textAlign: 'center' }}>
        <InboxIcon sx={{ fontSize: 56, color: 'grey.300', mb: 2 }} />
        <Typography>No results to display</Typography>
      </Paper>
    );
  }

  const renderStatus = (decision) => (
    <Box
      className="decision-badge"
      sx={{
        backgroundColor:
          decision === 'yes'
            ? 'green'
            : decision === 'maybe'
              ? 'orange'
              : 'red',
        color: '#fff',
        px: 1,
        borderRadius: 2,
        textAlign: 'center',
        fontWeight: 800,
      }}
    >
      {String(decision || 'no').toUpperCase()}
    </Box>
  );

  const renderVendors = (v) => {
    if (!v || (Array.isArray(v) && v.length === 0)) return '—';

    if (Array.isArray(v)) {
      // Deduplicate: show only unique vendor names in the upload table
      const seen = new Set();
      const uniqueNames = [];
      for (const x of v) {
        const name = typeof x === 'string' ? x : (x?.vendor_name || '');
        if (name && !seen.has(name)) {
          seen.add(name);
          uniqueNames.push(name);
        }
      }
      if (uniqueNames.length === 0) return '—';
      return (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
          {uniqueNames.map((name, i) => (
            <Chip key={i} label={name} size="small" variant="outlined" />
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
      Qty: row['Qty.'] ?? row.Qty ?? '',
      'Matched Product': row.matchedProduct || '',
      'Matched Company': row.matchedCompany || '',
      Status: String(row.decision || 'no').toUpperCase(),
      Vendors: Array.isArray(row.uniqueVendors)
        ? row.uniqueVendors
            .map((x) => (typeof x === 'string' ? x : x?.vendor_name || ''))
            .filter(Boolean)
            .join(', ')
        : row.uniqueVendors || '',
    }));

    const ws = XLSX.utils.json_to_sheet(exportRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Results');
    XLSX.writeFile(wb, 'yes-maybe-results.xlsx');
  };

  return (
    <Box>
      <Box sx={{ mb: 1.5, display: 'flex', justifyContent: 'flex-end' }} className="no-print">
        <Button
          onClick={exportToExcel}
          variant="contained"
          size="small"
          sx={{
            backgroundColor: '#2e7d32',
            textTransform: 'none',
            fontWeight: 700,
          }}
        >
          Export Excel
        </Button>
      </Box>

      <TableContainer component={Paper} className="print-table-container">
        <MuiTable size="small" stickyHeader className="print-table">
          <TableHead>
            <TableRow>
              {columns.map((col) => (
                <TableCell key={col.key} align={col.align || 'left'}>
                  {col.label}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>

          <TableBody>
            {data.map((row, i) => (
              <TableRow key={i}>
                {/* ❌ NO HOVER STYLE AT ALL */}

                <TableCell>{i + 1}</TableCell>
                <TableCell>{row.Particulars}</TableCell>
                <TableCell>{row.Packing || '—'}</TableCell>
                <TableCell>{row.Company || '—'}</TableCell>
                <TableCell align="right">
                  {row['Qty.'] ?? row.Qty ?? '—'}
                </TableCell>
                <TableCell>{row.matchedProduct || '—'}</TableCell>
                <TableCell>{row.matchedCompany || '—'}</TableCell>
                <TableCell align="center">
                  {renderStatus(row.decision)}
                </TableCell>
                <TableCell>{renderVendors(row.uniqueVendors)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </MuiTable>
      </TableContainer>
    </Box>
  );
};

export default ResultsTable;
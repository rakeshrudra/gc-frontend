import React from 'react';
import {
  Table as MuiTable, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, Typography, Chip, Box,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import HelpOutlineIcon from '@mui/icons-material/HelpOutlined';
import InboxIcon from '@mui/icons-material/Inbox';

const columns = [
  { key: 'sno', label: 'S.No', width: 60 },
  { key: 'Particulars', label: 'Particulars', minWidth: 180 },
  { key: 'Company', label: 'Company', minWidth: 130 },
  { key: 'Qty', label: 'Qty', width: 70, align: 'right' },
  { key: 'Rate', label: 'Rate', width: 90, align: 'right' },
  { key: 'Amount', label: 'Amount', width: 100, align: 'right' },
  { key: 'matchedProduct', label: 'Matched Product', minWidth: 180 },
  { key: 'decision', label: 'Decision', width: 110, align: 'center' },
  { key: 'uniqueVendors', label: 'Unique Vendors', minWidth: 140 },
];

const ResultsTable = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <Paper elevation={0} sx={{ p: 6, textAlign: 'center', borderRadius: '16px', border: '1px solid', borderColor: 'grey.200' }}>
        <InboxIcon sx={{ fontSize: 56, color: 'grey.300', mb: 2 }} />
        <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 500 }}>No results to display</Typography>
        <Typography variant="body2" color="text.disabled" sx={{ mt: 0.5 }}>Upload an Excel file to see matched results here.</Typography>
      </Paper>
    );
  }

  const getRowStyle = (decision) => {
    const decisionLower = decision?.toLowerCase();
    if (decisionLower === 'yes') return { backgroundColor: '#e8f5e9', '&:hover': { backgroundColor: '#c8e6c9' }, transition: 'background-color 0.2s ease' };
    if (decisionLower === 'maybe') return { backgroundColor: '#fff9c4', '&:hover': { backgroundColor: '#fff59d' }, transition: 'background-color 0.2s ease' };
    return { '&:hover': { backgroundColor: '#f5f5f5' }, transition: 'background-color 0.2s ease' };
  };

  const renderDecisionChip = (decision) => {
    if (decision === 'yes') return <Chip icon={<CheckCircleIcon sx={{ fontSize: 16 }} />} label="YES" size="small" sx={{ backgroundColor: '#2e7d32', color: '#fff', fontWeight: 600, fontSize: '0.7rem' }} />;
    if (decision === 'maybe') return <Chip icon={<HelpOutlineIcon sx={{ fontSize: 16 }} />} label="MAYBE" size="small" sx={{ backgroundColor: '#f57f17', color: '#fff', fontWeight: 600, fontSize: '0.7rem' }} />;
    return <Typography variant="caption">{decision || '—'}</Typography>;
  };

  const fmt = (val) => {
    if (val == null || val === '') return '—';
    const n = Number(val);
    return isNaN(n) ? val : `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
  };

  const renderVendors = (v) => {
    if (!v) return '—';
    if (Array.isArray(v)) return <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>{v.map((x, i) => <Chip key={i} label={x} size="small" variant="outlined" sx={{ fontSize: '0.7rem', height: 22 }} />)}</Box>;
    return String(v);
  };

  return (
    <TableContainer component={Paper} elevation={0} sx={{ borderRadius: '16px', border: '1px solid', borderColor: 'grey.200', overflow: 'auto', maxHeight: '65vh' }}>
      <MuiTable stickyHeader size="small" id="results-table">
        <TableHead>
          <TableRow>
            {columns.map((col) => (
              <TableCell key={col.key} align={col.align || 'left'} sx={{ 
                  fontWeight: 800,
                  fontSize: '0.7rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: '#01579b',
                  backgroundColor: '#f1f8fe',
                  borderBottom: '2px solid #e1f5fe',
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
          {data.map((row, index) => (
            <TableRow key={index} sx={getRowStyle(row.decision)}>
              <TableCell sx={{ fontWeight: 600, color: '#546e7a' }}>{index + 1}</TableCell>
              <TableCell sx={{ fontWeight: 700, color: '#1a1a1a' }}>{row.Particulars || '—'}</TableCell>
              <TableCell sx={{ color: '#2c3e50', fontWeight: 500 }}>{row.Company || '—'}</TableCell>
              <TableCell align="right" sx={{ color: '#1a1a1a', fontWeight: 600 }}>
                {row['Qty.'] ?? row.Qty ?? row.qty ?? row.quantity ?? '—'}
              </TableCell>
              <TableCell align="right" sx={{ color: '#1a1a1a', fontWeight: 600 }}>
                {fmt(row.Rate ?? row.rate ?? row.price)}
              </TableCell>
              <TableCell align="right" sx={{ color: '#0277bd', fontWeight: 700 }}>
                {fmt(row.Amount ?? row.amount ?? row.amt)}
              </TableCell>
              <TableCell sx={{ fontWeight: 700, color: '#01579b' }}>{row.matchedProduct || '—'}</TableCell>
              <TableCell align="center">
                {renderDecisionChip(row.decision)}
              </TableCell>
              <TableCell>{renderVendors(row.uniqueVendors)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </MuiTable>
    </TableContainer>
  );
};

export default ResultsTable;

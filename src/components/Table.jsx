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
import * as XLSX from 'xlsx-js-style';

const columns = [
  { key: 'SNo', label: 'S.No' },
  { key: 'Particulars', label: 'Particulars' },
  { key: 'Packing', label: 'Packing' },
  { key: 'Company', label: 'Company' },
  { key: 'Qty.', label: 'Qty.', align: 'right' },
  { key: 'mrp', label: 'MRP', align: 'right' },
  { key: 'calculatedAmount', label: 'Amount', align: 'right' },
  { key: 'matchedProduct', label: 'Matched Product' },
  { key: 'matchedCompany', label: 'Matched Company' },
  { key: 'decision', label: 'Status', align: 'center' },
  { key: 'uniqueVendors', label: 'Vendors' },
];

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

const formatMoney = (value) => {
  const num = getNumberValue(value);

  if (num === null) return '—';

  return Number(num.toFixed(2));
};

/** YES/MAYBE Excel table column count (S.No … Vendors) */
const EXCEL_TABLE_COL_COUNT = 11;

const excelBlankRow = () => Array(EXCEL_TABLE_COL_COUNT).fill('');

const ResultsTable = ({ data, documentHeader }) => {
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

      const vendorPlainText = uniqueNames.join(', ');

      return (
        <Box>
          <Box
            className="vendors-screen"
            sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}
          >
            {uniqueNames.map((name, i) => (
              <Chip key={i} label={name} size="small" variant="outlined" />
            ))}
          </Box>
          <Box className="vendors-print">{vendorPlainText}</Box>
        </Box>
      );
    }

    return String(v);
  };

  const exportToExcel = () => {
    const headerLines = Array.isArray(documentHeader?.lines)
      ? documentHeader.lines.map((line) => (line == null ? '' : String(line)))
      : [];

    const tableHeader = [
      'S.No',
      'Particulars',
      'Packing',
      'Company',
      'Qty',
      'MRP',
      'Amount',
      'Matched Product',
      'Matched Company',
      'Status',
      'Vendors',
    ];

    const totalColumns = tableHeader.length;

    const tableData = data.map((row, index) => {
      const mrp = getRowMrp(row);
      const calculatedAmount = getCalculatedAmount(row);

      const vendorsText = Array.isArray(row.uniqueVendors)
        ? row.uniqueVendors
            .map((x) => (typeof x === 'string' ? x : x?.vendor_name || ''))
            .filter(Boolean)
            .join(', ')
        : row.uniqueVendors || '';

      return [
        index + 1,
        row.Particulars || '',
        row.Packing || '',
        row.Company || '',
        row['Qty.'] ?? row.Qty ?? '',
        mrp !== null ? Number(Number(mrp).toFixed(2)) : '',
        calculatedAmount !== null ? Number(calculatedAmount.toFixed(2)) : '',
        row.matchedProduct || '',
        row.matchedCompany || '',
        String(row.decision || 'no').toUpperCase(),
        vendorsText,
      ];
    });

    const docRowsForSheet = headerLines.map((line) => {
      const row = excelBlankRow();
      row[0] = line;
      return row;
    });

    const titleRow = excelBlankRow();
    titleRow[0] = 'YES/MAYBE REPORT';

    const worksheetData = [
      ...docRowsForSheet,
      excelBlankRow(),
      titleRow,
      excelBlankRow(),
      tableHeader,
      ...tableData,
    ];

    const ws = XLSX.utils.aoa_to_sheet(worksheetData);

    const docLineCount = headerLines.length;
    const reportTitleRowIndex = docLineCount + 1;
    const tableHeaderRowIndex = docLineCount + 3;
    const firstDataRowIndex = docLineCount + 4;
    const lastRowIndex = worksheetData.length - 1;

    const lastColIndex = totalColumns - 1;

    ws['!merges'] = [
      ...headerLines.map((_, index) => ({
        s: { r: index, c: 0 },
        e: { r: index, c: lastColIndex },
      })),
      {
        s: { r: reportTitleRowIndex, c: 0 },
        e: { r: reportTitleRowIndex, c: lastColIndex },
      },
    ];

    ws['!cols'] = [
      { wch: 8 },
      { wch: 28 },
      { wch: 14 },
      { wch: 22 },
      { wch: 8 },
      { wch: 12 },
      { wch: 14 },
      { wch: 28 },
      { wch: 24 },
      { wch: 10 },
      { wch: 55 },
    ];

    const styleDocHeaderCell = {
      font: { bold: true },
      alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
    };

    const styleTitleCell = {
      font: { bold: true, sz: 14 },
      alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
    };

    const styleTableHeaderCell = {
      font: { bold: true },
      alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
      fill: {
        patternType: 'solid',
        fgColor: { rgb: 'FFD9E1F2' },
      },
    };

    const vendorsColIndex = totalColumns - 1;

    for (let r = 0; r < docLineCount; r++) {
      for (let c = 0; c < totalColumns; c++) {
        const ref = XLSX.utils.encode_cell({ r, c });
        if (!ws[ref]) continue;
        ws[ref].s = { ...styleDocHeaderCell };
      }
    }

    for (let c = 0; c < totalColumns; c++) {
      const ref = XLSX.utils.encode_cell({ r: reportTitleRowIndex, c });
      if (!ws[ref]) continue;
      ws[ref].s = { ...styleTitleCell };
    }

    for (let c = 0; c < totalColumns; c++) {
      const ref = XLSX.utils.encode_cell({ r: tableHeaderRowIndex, c });
      if (!ws[ref]) continue;
      ws[ref].s = { ...styleTableHeaderCell };
    }

    for (let r = firstDataRowIndex; r <= lastRowIndex; r++) {
      const ref = XLSX.utils.encode_cell({ r, c: vendorsColIndex });
      if (!ws[ref]) continue;
      const prev = ws[ref].s || {};
      ws[ref].s = {
        ...prev,
        alignment: {
          ...prev.alignment,
          vertical: 'top',
          wrapText: true,
        },
      };
    }

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
        <MuiTable
          size="small"
          stickyHeader
          className="print-table"
          sx={{
            borderCollapse: 'collapse',
            '& th, & td': {
              border: '1px solid #eef3f4',
            },
            '& th': {
              backgroundColor: '#f8fbfc',
              fontWeight: 800,
            },
          }}
        >
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
            {data.map((row, i) => {
              const mrp = getRowMrp(row);
              const calculatedAmount = getCalculatedAmount(row);

              return (
                <TableRow key={i}>
                  <TableCell>{i + 1}</TableCell>
                  <TableCell>{row.Particulars}</TableCell>
                  <TableCell>{row.Packing || '—'}</TableCell>
                  <TableCell>{row.Company || '—'}</TableCell>
                  <TableCell align="right">
                    {row['Qty.'] ?? row.Qty ?? '—'}
                  </TableCell>
                  <TableCell align="right">
                    {mrp !== null ? `₹${formatMoney(mrp)}` : '—'}
                  </TableCell>
                  <TableCell align="right">
                    {calculatedAmount !== null
                      ? `₹${Number(calculatedAmount.toFixed(2))}`
                      : '—'}
                  </TableCell>
                  <TableCell>{row.matchedProduct || '—'}</TableCell>
                  <TableCell>{row.matchedCompany || '—'}</TableCell>
                  <TableCell align="center">
                    {renderStatus(row.decision)}
                  </TableCell>
                  <TableCell>{renderVendors(row.uniqueVendors)}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </MuiTable>
      </TableContainer>
    </Box>
  );
};

export default ResultsTable;
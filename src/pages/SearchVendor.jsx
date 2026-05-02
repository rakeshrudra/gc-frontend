import React, { useMemo, useState } from 'react';
import {
    Box,
    Paper,
    TextField,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Chip,
    MenuItem,
    Select,
    FormControl,
    Button,
    Typography,
} from '@mui/material';
import * as XLSX from 'xlsx-js-style';

const safeText = (value) => {
    if (value === null || value === undefined) return '—';
    const text = String(value).trim();
    return text === '' ? '—' : text;
};

const formatHumanDate = (value) => {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return safeText(value);
    return date.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    });
};

const getSortText = (value) => {
    if (value === null || value === undefined) return '';
    return String(value).trim().toLowerCase();
};

const getSortNumber = (value) => {
    if (value === null || value === undefined || value === '') return 0;

    const num = Number(String(value).replace(/[^\d.-]/g, ''));

    return Number.isNaN(num) ? 0 : num;
};

const getSortTime = (value) => {
    if (!value) return 0;

    if (value instanceof Date) {
        return Number.isNaN(value.getTime()) ? 0 : value.getTime();
    }

    if (typeof value === 'number') {
        return new Date((value - 25569) * 86400 * 1000).getTime();
    }

    const text = String(value).trim();

    const indianDateMatch = text.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);

    if (indianDateMatch) {
        const [, day, month, year] = indianDateMatch;
        return new Date(Number(year), Number(month) - 1, Number(day)).getTime();
    }

    const date = new Date(text);

    return Number.isNaN(date.getTime()) ? 0 : date.getTime();
};

const compareText = (a, b) => {
    return getSortText(a).localeCompare(getSortText(b), undefined, {
        numeric: true,
        sensitivity: 'base',
    });
};

/** Vendorwise Excel column count — order matches on-screen table */
const VENDORWISE_EXCEL_COLS = 12;

const vendorExcelBlankRow = () => Array(VENDORWISE_EXCEL_COLS).fill('');

const getExcelNumericCell = (value) => {
    if (value === null || value === undefined || value === '') return '';
    const num = Number(String(value).replace(/[^\d.-]/g, ''));
    return Number.isNaN(num) ? '' : Number(num.toFixed(2));
};

const excelDateString = (value) => {
    if (!value) return '';
    const formatted = formatHumanDate(value);
    return formatted === '—' ? '' : formatted;
};

const SearchVendor = ({ results = [], documentHeader = null }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState('vendor_asc');

    const tableRows = useMemo(() => {
        const query = searchQuery.trim().toLowerCase();

        let rows = results.filter((row) => {
            if (!query) return true;

            const searchableText = [
                row.vendor_name,
                row.Particulars,
                row.matchedProduct,
                row.Company,
                row.matchedCompany,
                row.mrp,
                row.disc,
                row.billno,
                row.batch_no,
                row.date,
                row.decision,
            ]
                .map((v) => String(v || '').toLowerCase())
                .join(' ');

            return searchableText.includes(query);
        });

        rows = [...rows].sort((a, b) => {
            let result = 0;

            if (sortBy === 'vendor_asc') {
                result = compareText(a.vendor_name, b.vendor_name);
            }

            if (sortBy === 'vendor_desc') {
                result = compareText(b.vendor_name, a.vendor_name);
            }

            if (sortBy === 'discount_high') {
                result = getSortNumber(b.disc) - getSortNumber(a.disc);
            }

            if (sortBy === 'discount_low') {
                result = getSortNumber(a.disc) - getSortNumber(b.disc);
            }

            if (sortBy === 'medicine_asc') {
                result = compareText(
                    a.matchedProduct || a.Particulars,
                    b.matchedProduct || b.Particulars
                );
            }

            if (sortBy === 'company_asc') {
                result = compareText(
                    a.matchedCompany || a.Company,
                    b.matchedCompany || b.Company
                );
            }

            if (sortBy === 'date_new') {
                result = getSortTime(b.date) - getSortTime(a.date);
            }

            if (sortBy === 'date_old') {
                result = getSortTime(a.date) - getSortTime(b.date);
            }

            if (result !== 0) return result;

            return (
                compareText(a.vendor_name, b.vendor_name) ||
                getSortNumber(a.SNo) - getSortNumber(b.SNo) ||
                compareText(a.Particulars, b.Particulars)
            );
        });

        return rows;
    }, [results, searchQuery, sortBy]);

    const vendorCount = useMemo(() => {
        return new Set(tableRows.map((row) => safeText(row.vendor_name))).size;
    }, [tableRows]);

    const exportToExcel = () => {
        const headerLines = Array.isArray(documentHeader?.lines)
            ? documentHeader.lines.map((line) => (line == null ? '' : String(line)))
            : [];

        const tableHeader = [
            'Vendor Name',
            'S.No',
            'Particulars',
            'Matched Product',
            'Company',
            'Matched Company',
            'MRP',
            'Discount',
            'Bill No',
            'Batch No',
            'Date',
            'Status',
        ];

        const totalColumns = tableHeader.length;

        const tableData = tableRows.map((row, index) => {
            const sNo =
                row.SNo !== undefined &&
                row.SNo !== null &&
                String(row.SNo).trim() !== ''
                    ? row.SNo
                    : index + 1;

            return [
                row.vendor_name || '',
                sNo,
                row.Particulars || '',
                row.matchedProduct || '',
                row.Company || '',
                row.matchedCompany || '',
                getExcelNumericCell(row.mrp),
                getExcelNumericCell(row.disc),
                row.billno || '',
                row.batch_no || '',
                excelDateString(row.date),
                String(row.decision || 'no').toUpperCase(),
            ];
        });

        const docRowsForSheet = headerLines.map((line) => {
            const row = vendorExcelBlankRow();
            row[0] = line;
            return row;
        });

        const titleRow = vendorExcelBlankRow();
        titleRow[0] = 'VENDORWISE REPORT';

        const worksheetData = [
            ...docRowsForSheet,
            vendorExcelBlankRow(),
            titleRow,
            vendorExcelBlankRow(),
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
            { wch: 24 },
            { wch: 8 },
            { wch: 28 },
            { wch: 28 },
            { wch: 18 },
            { wch: 22 },
            { wch: 12 },
            { wch: 12 },
            { wch: 14 },
            { wch: 14 },
            { wch: 12 },
            { wch: 10 },
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

        const wrapTextDataColumnIndexes = [0, 2, 3, 4, 5];

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
            for (const c of wrapTextDataColumnIndexes) {
                const ref = XLSX.utils.encode_cell({ r, c });
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
        }

        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, ws, 'Vendorwise Results');
        XLSX.writeFile(workbook, 'vendorwise-results.xlsx');
    };

    return (
        <Box>
            <Paper
                className="no-print"
                sx={{
                    p: { xs: 1.5, sm: 2 },
                    mb: 2,
                    borderRadius: 3,
                    boxShadow: 'none',
                    border: '1px solid #e0f2f1',
                    backgroundColor: '#fbfffe',
                }}
            >
                <Box
                    sx={{
                        display: 'flex',
                        alignItems: { xs: 'stretch', md: 'center' },
                        justifyContent: 'space-between',
                        gap: 1.2,
                        flexDirection: { xs: 'column', md: 'row' },
                    }}
                >
                    <Box sx={{ minWidth: { xs: '100%', md: 240 } }}>
                        <Typography
                            sx={{
                                fontWeight: 800,
                                color: '#113b4a',
                                fontSize: '0.92rem',
                                mb: 0.3,
                            }}
                        >
                            Search & Filter Vendors
                        </Typography>

                        <Typography
                            sx={{
                                color: '#607d8b',
                                fontSize: '0.76rem',
                            }}
                        >
                            Search vendor, medicine, company, bill no, or batch no.
                        </Typography>
                    </Box>

                    <Box
                        sx={{
                            display: 'grid',
                            gridTemplateColumns: {
                                xs: '1fr',
                                sm: '1fr 220px',
                                md: 'minmax(320px, 1fr) 220px auto auto auto',
                            },
                            alignItems: 'center',
                            gap: 1,
                            flexGrow: 1,
                            width: '100%',
                        }}
                    >
                        <TextField
                            size="small"
                            placeholder="Search vendor, medicine, company, bill no, batch..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            sx={{
                                width: '100%',
                                '& .MuiOutlinedInput-root': {
                                    backgroundColor: '#ffffff',
                                    borderRadius: 2,
                                },
                            }}
                        />

                        <FormControl size="small" sx={{ width: '100%' }}>
                            <Select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                sx={{
                                    backgroundColor: '#ffffff',
                                    borderRadius: 2,
                                }}
                            >
                                <MenuItem value="vendor_asc">Vendor A-Z</MenuItem>
                                <MenuItem value="vendor_desc">Vendor Z-A</MenuItem>
                                <MenuItem value="discount_high">Highest Discount</MenuItem>
                                <MenuItem value="discount_low">Lowest Discount</MenuItem>
                                <MenuItem value="medicine_asc">Medicine A-Z</MenuItem>
                                <MenuItem value="company_asc">Company A-Z</MenuItem>
                                <MenuItem value="date_new">Newest Date</MenuItem>
                                <MenuItem value="date_old">Oldest Date</MenuItem>
                            </Select>
                        </FormControl>

                        <Chip
                            label={`Vendors: ${vendorCount}`}
                            sx={{
                                fontWeight: 800,
                                backgroundColor: '#f1f3f4',
                                color: '#263238',
                            }}
                        />

                        <Chip
                            label={`Rows: ${tableRows.length}`}
                            sx={{
                                fontWeight: 800,
                                backgroundColor: '#f1f3f4',
                                color: '#263238',
                            }}
                        />

                        <Button
                            variant="contained"
                            size="small"
                            onClick={exportToExcel}
                            sx={{
                                backgroundColor: '#2e7d32',
                                textTransform: 'none',
                                fontWeight: 700,
                                px: 2,
                                whiteSpace: 'nowrap',
                                '&:hover': {
                                    backgroundColor: '#1b5e20',
                                },
                            }}
                        >
                            Export Excel
                        </Button>
                    </Box>
                </Box>
            </Paper>

            <TableContainer
                component={Paper}
                className="print-table-container"
                sx={{
                    borderRadius: 2,
                    boxShadow: 'none',
                    border: '1px solid #eef3f4',
                    overflowX: 'auto',
                }}
            >
                <Table
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
                            {[
                                'Vendor Name',
                                'S.No',
                                'Particulars',
                                'Matched Product',
                                'Company',
                                'Matched Company',
                                'MRP',
                                'Discount',
                                'Bill No',
                                'Batch No',
                                'Date',
                                'Status',
                            ].map((head) => (
                                <TableCell key={head}>{head}</TableCell>
                            ))}
                        </TableRow>
                    </TableHead>

                    <TableBody>
                        {tableRows.map((row, index) => (
                            <TableRow key={index}>
                                <TableCell>{safeText(row.vendor_name)}</TableCell>
                                <TableCell>{safeText(row.SNo)}</TableCell>
                                <TableCell>{safeText(row.Particulars)}</TableCell>
                                <TableCell>{safeText(row.matchedProduct)}</TableCell>
                                <TableCell>{safeText(row.Company)}</TableCell>
                                <TableCell>{safeText(row.matchedCompany)}</TableCell>
                                <TableCell>{safeText(row.mrp)}</TableCell>
                                <TableCell>{safeText(row.disc)}</TableCell>
                                <TableCell>{safeText(row.billno)}</TableCell>
                                <TableCell>{safeText(row.batch_no)}</TableCell>
                                <TableCell>{formatHumanDate(row.date)}</TableCell>

                                <TableCell>
                                    <Box
                                        className="decision-badge"
                                        sx={{
                                            backgroundColor:
                                                row.decision === 'yes'
                                                    ? 'green'
                                                    : row.decision === 'maybe'
                                                        ? 'orange'
                                                        : 'red',
                                            color: '#fff',
                                            px: 1,
                                            borderRadius: 2,
                                            textAlign: 'center',
                                            fontWeight: 800,
                                        }}
                                    >
                                        {String(row.decision || 'no').toUpperCase()}
                                    </Box>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
};

export default SearchVendor;
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
} from '@mui/material';
import * as XLSX from 'xlsx';

const safeText = (value) => {
    if (value === null || value === undefined) return '—';
    const text = String(value).trim();
    return text === '' ? '—' : text;
};

const formatDate = (value) => {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return safeText(value);
    return date.toLocaleDateString('en-IN');
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

const SearchVendor = ({ results = [] }) => {
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
        const exportRows = tableRows.map((row, index) => ({
            'S.No': index + 1,
            'Vendor Name': row.vendor_name || '',
            Particulars: row.Particulars || '',
            'Matched Product': row.matchedProduct || '',
            Company: row.Company || '',
            'Matched Company': row.matchedCompany || '',
            MRP: row.mrp ?? '',
            Discount: row.disc ?? '',
            'Bill No': row.billno || '',
            'Batch No': row.batch_no || '',
            Date: formatDate(row.date),
            Status: String(row.decision || 'no').toUpperCase(),
        }));

        const worksheet = XLSX.utils.json_to_sheet(exportRows);
        const workbook = XLSX.utils.book_new();

        XLSX.utils.book_append_sheet(workbook, worksheet, 'Vendorwise Results');
        XLSX.writeFile(workbook, 'vendorwise-results.xlsx');
    };

    return (
        <Box>
            <Paper
                sx={{
                    p: 2,
                    mb: 2,
                    borderRadius: 2,
                    boxShadow: 'none',
                    border: '1px solid #e0e0e0',
                }}
            >
                <Box
                    display="flex"
                    gap={1}
                    flexWrap="wrap"
                    alignItems="center"
                >
                    <TextField
                        size="small"
                        placeholder="Search vendor, medicine, company, bill no, batch..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        sx={{ minWidth: 420 }}
                    />

                    <FormControl size="small" sx={{ minWidth: 220 }}>
                        <Select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
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

                    <Chip label={`Vendors: ${vendorCount}`} />
                    <Chip label={`Rows: ${tableRows.length}`} />

                    <Button
                        variant="contained"
                        size="small"
                        onClick={exportToExcel}
                        sx={{
                            backgroundColor: '#2e7d32',
                            textTransform: 'none',
                            fontWeight: 700,
                            px: 2,
                            '&:hover': {
                                backgroundColor: '#1b5e20',
                            },
                        }}
                    >
                        Export Excel
                    </Button>
                </Box>
            </Paper>

            <TableContainer component={Paper}>
                <Table size="small" stickyHeader>
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
                                <TableCell>{formatDate(row.date)}</TableCell>

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

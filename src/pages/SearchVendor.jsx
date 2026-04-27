import React, { useMemo, useState } from 'react';
import {
    Box,
    Typography,
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
} from '@mui/material';

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
                row.cleanedParticulars,
                row.matchedProduct,
                row.Company,
                row.matchedCompany,
                row.mrp,
                row.disc,
                row.billno,
                row.bill_no,
                row.batch_no,
                row.date,
                row.decision,
                row.status,
            ]
                .map((value) => String(value || '').toLowerCase())
                .join(' ');

            return searchableText.includes(query);
        });

        rows = [...rows].sort((a, b) => {
            if (sortBy === 'vendor_asc') {
                return String(a.vendor_name || '').localeCompare(String(b.vendor_name || ''));
            }

            if (sortBy === 'vendor_desc') {
                return String(b.vendor_name || '').localeCompare(String(a.vendor_name || ''));
            }

            if (sortBy === 'discount_high') {
                return Number(b.disc || 0) - Number(a.disc || 0);
            }

            if (sortBy === 'discount_low') {
                return Number(a.disc || 0) - Number(b.disc || 0);
            }

            if (sortBy === 'medicine_asc') {
                return String(a.matchedProduct || a.Particulars || '').localeCompare(
                    String(b.matchedProduct || b.Particulars || '')
                );
            }

            if (sortBy === 'company_asc') {
                return String(a.matchedCompany || a.Company || '').localeCompare(
                    String(b.matchedCompany || b.Company || '')
                );
            }

            if (sortBy === 'date_new') {
                return new Date(b.date || 0) - new Date(a.date || 0);
            }

            if (sortBy === 'date_old') {
                return new Date(a.date || 0) - new Date(b.date || 0);
            }

            return 0;
        });

        return rows;
    }, [results, searchQuery, sortBy]);

    const vendorCount = useMemo(() => {
        return new Set(tableRows.map((row) => safeText(row.vendor_name))).size;
    }, [tableRows]);

    return (
        <Box>
            <Paper
                elevation={0}
                sx={{
                    p: 2,
                    mb: 2,
                    borderRadius: '12px',
                    border: '1px solid',
                    borderColor: 'grey.200',
                    backgroundColor: '#fff',
                }}
            >
                <Box
                    sx={{
                        display: 'flex',
                        gap: 2,
                        flexWrap: 'wrap',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                    }}
                >
                    <TextField
                        size="small"
                        placeholder="Search vendor, medicine, company, bill no, batch no, date..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        sx={{ minWidth: 420, backgroundColor: '#fff' }}
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

                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        <Chip
                            label={`Vendors: ${vendorCount}`}
                            sx={{ fontWeight: 700, backgroundColor: '#e3f2fd', color: '#01579b' }}
                        />
                        <Chip
                            label={`Rows: ${tableRows.length}`}
                            sx={{ fontWeight: 700, backgroundColor: '#f1f8fe', color: '#01579b' }}
                        />
                    </Box>
                </Box>
            </Paper>

            {tableRows.length === 0 ? (
                <Paper
                    elevation={0}
                    sx={{
                        p: 3,
                        borderRadius: '12px',
                        border: '1px solid',
                        borderColor: 'grey.200',
                        textAlign: 'center',
                        backgroundColor: '#fff',
                    }}
                >
                    <Typography variant="body2" sx={{ color: '#607d8b', fontWeight: 600 }}>
                        No vendor data found.
                    </Typography>
                </Paper>
            ) : (
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
                    <Table stickyHeader size="small">
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
                                    'Decision',
                                    'Status',
                                ].map((head) => (
                                    <TableCell
                                        key={head}
                                        sx={{
                                            fontWeight: 800,
                                            fontSize: '0.7rem',
                                            textTransform: 'uppercase',
                                            color: '#01579b',
                                            backgroundColor: '#f1f8fe',
                                            borderBottom: '2px solid #e1f5fe',
                                            whiteSpace: 'nowrap',
                                        }}
                                    >
                                        {head}
                                    </TableCell>
                                ))}
                            </TableRow>
                        </TableHead>

                        <TableBody>
                            {tableRows.map((row, index) => (
                                <TableRow key={`${row.vendor_name}-${row.SNo}-${index}`} hover>
                                    <TableCell sx={{ fontWeight: 800, color: '#01579b' }}>
                                        {safeText(row.vendor_name)}
                                    </TableCell>

                                    <TableCell>{safeText(row.SNo)}</TableCell>

                                    <TableCell sx={{ fontWeight: 700 }}>
                                        {safeText(row.Particulars)}
                                    </TableCell>

                                    <TableCell sx={{ fontWeight: 700, color: '#01579b' }}>
                                        {safeText(row.matchedProduct)}
                                    </TableCell>

                                    <TableCell>{safeText(row.Company)}</TableCell>

                                    <TableCell>{safeText(row.matchedCompany)}</TableCell>

                                    <TableCell>{safeText(row.mrp)}</TableCell>

                                    <TableCell sx={{ fontWeight: 900, color: '#2e7d32' }}>
                                        {safeText(row.disc)}
                                    </TableCell>

                                    <TableCell>{safeText(row.billno || row.bill_no)}</TableCell>

                                    <TableCell>{safeText(row.batch_no)}</TableCell>

                                    <TableCell>{formatDate(row.date)}</TableCell>

                                    <TableCell>
                                        <Box
                                            className="decision-badge"
                                            sx={{
                                                backgroundColor:
                                                    row.decision === 'yes'
                                                        ? '#2e7d32'
                                                        : row.decision === 'maybe'
                                                            ? '#ed6c02'
                                                            : '#d32f2f',
                                                color: '#fff',
                                                fontWeight: 900,
                                                fontSize: '0.7rem',
                                                px: 1.2,
                                                py: 0.4,
                                                borderRadius: '14px',
                                                minWidth: 70,
                                                display: 'inline-block',
                                                textAlign: 'center',
                                            }}
                                        >
                                            {String(row.decision || 'no').toUpperCase()}
                                        </Box>
                                    </TableCell>

                                    <TableCell>{safeText(row.status)}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}
        </Box>
    );
};

export default SearchVendor;
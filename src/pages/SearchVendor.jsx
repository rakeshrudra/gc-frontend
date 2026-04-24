import React, { useMemo, useState } from 'react';
import {
    Box,
    Typography,
    Paper,
    TextField,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Chip,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

const decisionColor = (decision) => {
    if (decision === 'yes') return 'success';
    if (decision === 'maybe') return 'warning';
    return 'error';
};

const safeText = (value) => {
    if (value === null || value === undefined) return '-';
    const text = String(value).trim();
    return text === '' ? '-' : text;
};

const SearchVendor = ({ results = [], documentHeader }) => {
    const [vendorQuery, setVendorQuery] = useState('');

    const groupedData = useMemo(() => {
        const grouped = {};

        results.forEach((row) => {
            const vendors =
                Array.isArray(row.uniqueVendors) && row.uniqueVendors.length > 0
                    ? row.uniqueVendors
                    : ['Unknown Vendor'];

            vendors.forEach((vendorName) => {
                const vendor = String(vendorName || 'Unknown Vendor').trim();

                if (!grouped[vendor]) {
                    grouped[vendor] = [];
                }

                grouped[vendor].push(row);
            });
        });

        return grouped;
    }, [results]);

    const filteredEntries = useMemo(() => {
        const query = vendorQuery.trim().toLowerCase();

        return Object.entries(groupedData)
            .filter(([vendorName, items]) => {
                if (!query) return true;

                const vendorMatch = vendorName.toLowerCase().includes(query);

                const itemMatch = items.some((row) =>
                    String(row.Particulars || '').toLowerCase().includes(query) ||
                    String(row.matchedProduct || '').toLowerCase().includes(query) ||
                    String(row.Company || '').toLowerCase().includes(query) ||
                    String(row.matchedCompany || '').toLowerCase().includes(query)
                );

                return vendorMatch || itemMatch;
            })
            .sort((a, b) => a[0].localeCompare(b[0]));
    }, [groupedData, vendorQuery]);

    const totalVendorCount = filteredEntries.length;
    const totalRowCount = filteredEntries.reduce((sum, [, items]) => sum + items.length, 0);

    return (
        <Box>
            <Typography
                variant="h5"
                sx={{
                    fontWeight: 800,
                    color: '#01579b',
                    mb: 2,
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                }}
            >
                Vendor Search
            </Typography>

            {documentHeader?.title && (
                <Paper
                    elevation={0}
                    sx={{
                        p: 1.5,
                        mb: 2,
                        borderRadius: '12px',
                        border: '1px solid',
                        borderColor: 'grey.200',
                        backgroundColor: '#fff',
                    }}
                >
                    <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#01579b' }}>
                        {documentHeader.title}
                    </Typography>

                    {documentHeader.lines
                        ?.filter((line, index) => !(index === 0 && line === documentHeader.title))
                        .slice(0, 4)
                        .map((line, idx) => (
                            <Typography
                                key={idx}
                                variant="caption"
                                sx={{
                                    display: 'block',
                                    color: '#455a64',
                                    fontWeight: 600,
                                    mt: 0.3,
                                }}
                            >
                                {line}
                            </Typography>
                        ))}
                </Paper>
            )}

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
                        placeholder="Search vendor or medicine..."
                        value={vendorQuery}
                        onChange={(e) => setVendorQuery(e.target.value)}
                        sx={{ minWidth: 280, backgroundColor: '#fff' }}
                    />

                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        <Chip
                            label={`Vendors: ${totalVendorCount}`}
                            sx={{ fontWeight: 700, backgroundColor: '#e3f2fd', color: '#01579b' }}
                        />
                        <Chip
                            label={`Rows: ${totalRowCount}`}
                            sx={{ fontWeight: 700, backgroundColor: '#f1f8fe', color: '#01579b' }}
                        />
                    </Box>
                </Box>
            </Paper>

            {filteredEntries.length === 0 ? (
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
                        No vendor data available. Upload and match a file first.
                    </Typography>
                </Paper>
            ) : (
                filteredEntries.map(([vendorName, items]) => (
                    <Accordion
                        key={vendorName}
                        disableGutters
                        elevation={0}
                        sx={{
                            mb: 1.5,
                            border: '1px solid',
                            borderColor: 'grey.200',
                            borderRadius: '12px !important',
                            overflow: 'hidden',
                            backgroundColor: '#fff',
                            '&:before': { display: 'none' },
                        }}
                    >
                        <AccordionSummary
                            expandIcon={<ExpandMoreIcon />}
                            sx={{
                                backgroundColor: '#f8fbfd',
                                borderBottom: '1px solid #eef2f5',
                            }}
                        >
                            <Box sx={{ width: '100%' }}>
                                <Typography
                                    variant="subtitle2"
                                    sx={{ fontWeight: 800, color: '#01579b', textTransform: 'uppercase' }}
                                >
                                    {vendorName}
                                </Typography>
                                <Typography variant="caption" sx={{ color: '#546e7a', fontWeight: 600 }}>
                                    {items.length} row{items.length > 1 ? 's' : ''}
                                </Typography>
                            </Box>
                        </AccordionSummary>

                        <AccordionDetails sx={{ p: 0 }}>
                            <TableContainer>
                                <Table size="small">
                                    <TableHead>
                                        <TableRow>
                                            <TableCell sx={{ fontWeight: 800 }}>S.No</TableCell>
                                            <TableCell sx={{ fontWeight: 800 }}>Particulars</TableCell>
                                            <TableCell sx={{ fontWeight: 800 }}>Packing</TableCell>
                                            <TableCell sx={{ fontWeight: 800 }}>Company</TableCell>
                                            <TableCell sx={{ fontWeight: 800 }}>Qty.</TableCell>
                                            <TableCell sx={{ fontWeight: 800 }}>Rate</TableCell>
                                            <TableCell sx={{ fontWeight: 800 }}>Amount</TableCell>
                                            <TableCell sx={{ fontWeight: 800 }}>Matched Product</TableCell>
                                            <TableCell sx={{ fontWeight: 800 }}>Matched Company</TableCell>
                                            <TableCell sx={{ fontWeight: 800 }}>Decision</TableCell>
                                            <TableCell sx={{ fontWeight: 800 }}>Status</TableCell>
                                        </TableRow>
                                    </TableHead>

                                    <TableBody>
                                        {items.map((row, idx) => (
                                            <TableRow key={`${vendorName}-${row.SNo ?? idx}-${idx}`} hover>
                                                <TableCell>{safeText(row.SNo)}</TableCell>
                                                <TableCell>{safeText(row.Particulars)}</TableCell>
                                                <TableCell>{safeText(row.Packing)}</TableCell>
                                                <TableCell>{safeText(row.Company)}</TableCell>
                                                <TableCell>{safeText(row['Qty.'])}</TableCell>
                                                <TableCell>{safeText(row.Rate)}</TableCell>
                                                <TableCell>{safeText(row.Amount)}</TableCell>
                                                <TableCell>{safeText(row.matchedProduct)}</TableCell>
                                                <TableCell>{safeText(row.matchedCompany)}</TableCell>
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
                                                            lineHeight: 1.4,
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
                        </AccordionDetails>
                    </Accordion>
                ))
            )}
        </Box>
    );
};

export default SearchVendor;
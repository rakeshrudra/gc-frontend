import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardActionArea,
  CardContent,
  CircularProgress,
  FormControl,
  MenuItem,
  Paper,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import { searchMasterMedicines } from '../services/api';

const formatHumanDate = (value) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

const MedicineVendorSearch = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [medicines, setMedicines] = useState([]);
  const [selectedMedicine, setSelectedMedicine] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sortBy, setSortBy] = useState('date_latest');

  const hasQuery = searchQuery.trim().length > 0;

  const runSearch = async (queryValue) => {
    const trimmed = queryValue.trim();
    if (!trimmed) {
      setMedicines([]);
      return;
    }

    try {
      setLoading(true);
      setError('');
      const data = await searchMasterMedicines(trimmed);
      setMedicines(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch master data. Please try again.');
      setMedicines([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const trimmed = searchQuery.trim();
    if (!trimmed) {
      setMedicines([]);
      setError('');
      setLoading(false);
      return undefined;
    }

    const timer = setTimeout(() => {
      runSearch(trimmed);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const vendors = useMemo(() => {
    const rawVendors =
      selectedMedicine && Array.isArray(selectedMedicine.vendors)
        ? selectedMedicine.vendors
        : [];

    const getTimeValue = (value) => {
      if (!value) return 0;
      const date = new Date(value);
      return Number.isNaN(date.getTime()) ? 0 : date.getTime();
    };

    const getDiscountValue = (value) => {
      if (value === null || value === undefined || value === '') return Number.NEGATIVE_INFINITY;
      const num = Number(value);
      return Number.isNaN(num) ? Number.NEGATIVE_INFINITY : num;
    };

    const sorted = [...rawVendors].sort((a, b) => {
      if (sortBy === 'date_latest') return getTimeValue(b.date) - getTimeValue(a.date);
      if (sortBy === 'date_oldest') return getTimeValue(a.date) - getTimeValue(b.date);
      if (sortBy === 'discount_highest') return getDiscountValue(b.disc) - getDiscountValue(a.disc);
      if (sortBy === 'discount_lowest') return getDiscountValue(a.disc) - getDiscountValue(b.disc);
      return 0;
    });

    return sorted;
  }, [selectedMedicine, sortBy]);

  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value);
    setSelectedMedicine(null);
  };

  const handleManualSearch = () => {
    setSelectedMedicine(null);
    runSearch(searchQuery);
  };

  const handleBackToResults = () => {
    setSelectedMedicine(null);
  };

  return (
    <Box sx={{ maxWidth: 1040, mx: 'auto' }}>
      <Paper
        sx={{
          p: { xs: 1.25, sm: 1.25 },
          borderRadius: 2,
          border: '1px solid #d1f0ed',
          mb: 1.5,
        }}
      >
        <Typography sx={{ fontWeight: 800, mb: 0.8, color: '#0f9f9a', fontSize: { xs: '0.9rem', sm: '0.92rem' }, textAlign: 'center' }}>
          Search medicines and vendor
        </Typography>

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={0.8} sx={{ maxWidth: 860, mx: 'auto' }}>
          <TextField
            fullWidth
            size="small"
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder="Type medicine or vendor name"
            sx={{
              '& .MuiInputBase-input': {
                fontSize: { xs: '0.8rem', sm: '0.82rem' },
                py: { xs: 1, sm: 0.8 },
              },
            }}
          />
          <Button
            variant="contained"
            onClick={handleManualSearch}
            disabled={loading || !hasQuery}
            sx={{
              width: { xs: 'fit-content', sm: 'fit-content' },
              minWidth: 66,
              maxWidth: 76,
              height: { xs: 34, sm: 31 },
              alignSelf: 'center',
              px: 1.2,
              py: 0.2,
              fontSize: { xs: '0.73rem', sm: '0.74rem' },
              textTransform: 'none',
              fontWeight: 700,
            }}
          >
            Search
          </Button>
        </Stack>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
          <CircularProgress size={28} />
        </Box>
      )}

      {!selectedMedicine && !loading && medicines.length > 0 && (
        <Box sx={{ mb: 1.5, maxWidth: 860, mx: 'auto' }}>
          <Typography sx={{ fontWeight: 700, mb: 0.7, fontSize: { xs: '0.84rem', sm: '0.86rem' } }}>Medicines</Typography>
          <Stack spacing={0.7}>
            {medicines.map((medicine, idx) => (
              <Card
                key={`${medicine.product_name}-${medicine.company || ''}-${idx}`}
                variant="outlined"
                sx={{
                  borderColor: '#d9ece9',
                  backgroundColor: '#fff',
                  borderRadius: 1.5,
                }}
              >
                <CardActionArea onClick={() => setSelectedMedicine(medicine)}>
                  <CardContent sx={{ py: 0.7, px: 1 }}>
                    <Typography sx={{ fontWeight: 700, fontSize: { xs: '0.8rem', sm: '0.83rem' } }}>
                      {medicine.product_name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.72rem', sm: '0.74rem' } }}>
                      {medicine.company || '-'}
                    </Typography>
                  </CardContent>
                </CardActionArea>
              </Card>
            ))}
          </Stack>
        </Box>
      )}

      {!selectedMedicine && !loading && hasQuery && medicines.length === 0 && !error && (
        <Alert severity="info">No records found in master table.</Alert>
      )}

      {selectedMedicine && (
        <Paper
          sx={{
            p: { xs: 1.25, sm: 1.25 },
            borderRadius: 2,
            border: '1px solid #d1f0ed',
            maxWidth: 980,
            mx: 'auto',
          }}
        >
          <Box sx={{ mb: 1.5 }}>
            <Button
              variant="outlined"
              size="small"
              onClick={handleBackToResults}
              sx={{ textTransform: 'none', fontWeight: 700, fontSize: { xs: '0.74rem', sm: '0.78rem' }, py: 0.3 }}
            >
              Back
            </Button>
          </Box>

          <Typography sx={{ fontWeight: 800, fontSize: { xs: '0.86rem', sm: '0.9rem' } }}>
            {selectedMedicine.product_name}
          </Typography>
          <Typography variant="body2" sx={{ mb: 1.1, fontSize: { xs: '0.74rem', sm: '0.76rem' } }}>
            Company: {selectedMedicine.company || '-'}
          </Typography>

          <Box sx={{ mb: 1.2 }}>
            <FormControl size="small" sx={{ width: { xs: '100%', sm: 240 } }}>
              <Select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                sx={{ fontSize: { xs: '0.76rem', sm: '0.78rem' } }}
              >
                <MenuItem value="date_latest">Date: Latest to Oldest</MenuItem>
                <MenuItem value="date_oldest">Date: Oldest to Newest</MenuItem>
                <MenuItem value="discount_highest">Discount: Highest to Lowest</MenuItem>
                <MenuItem value="discount_lowest">Discount: Lowest to Highest</MenuItem>
              </Select>
            </FormControl>
          </Box>

          <TableContainer>
            <Table size="small" sx={{ '& .MuiTableCell-root': { py: 0.5, px: 0.75, fontSize: { xs: '0.68rem', sm: '0.71rem' } } }}>
              <TableHead>
                <TableRow>
                  <TableCell>Bill No</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Discount</TableCell>
                  <TableCell>Vendor Name</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {vendors.length > 0 ? (
                  vendors.map((vendor, idx) => (
                    <TableRow key={`${vendor.vendor_name || 'vendor'}-${idx}`}>
                      <TableCell>{vendor.billno || '-'}</TableCell>
                      <TableCell>{formatHumanDate(vendor.date)}</TableCell>
                      <TableCell>{vendor.disc ?? '-'}</TableCell>
                      <TableCell>{vendor.vendor_name || '-'}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} align="center">
                      No vendor rows available.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}
    </Box>
  );
};

export default MedicineVendorSearch;

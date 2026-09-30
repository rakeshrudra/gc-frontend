import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  InputAdornment,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import SearchIcon from '@mui/icons-material/Search';
import AssignmentIndIcon from '@mui/icons-material/AssignmentInd';
import { getStoreFrmMappings, upsertStoreFrmMapping, getAssignees } from '../services/grievances';
import { getStores } from '../services/processedOrders';

const FRM_ROLE = 'emedix_op_admin';

const displayStoreName = (store) => store?.emedixName?.trim() || store?.storeName || '';

const StoreFrmMappings = () => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  const [stores, setStores] = useState([]);
  const [frmAdmins, setFrmAdmins] = useState([]);
  const [optionsLoading, setOptionsLoading] = useState(true);
  const [optionsError, setOptionsError] = useState('');

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRow, setEditingRow] = useState(null);
  const [selectedStore, setSelectedStore] = useState(null);
  const [selectedFrm, setSelectedFrm] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const [refreshKey, setRefreshKey] = useState(0);
  const refresh = () => setRefreshKey((prev) => prev + 1);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError('');
      try {
        const data = await getStoreFrmMappings();
        if (!cancelled) setRows(data ?? []);
      } catch (err) {
        if (!cancelled) {
          setError(err.response?.data?.message || 'Failed to load store-FRM mappings.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setOptionsLoading(true);
      setOptionsError('');
      try {
        const [storesData, frmAdminsData] = await Promise.all([
          getStores(),
          getAssignees({ role: FRM_ROLE }),
        ]);
        if (!cancelled) {
          setStores(storesData ?? []);
          setFrmAdmins(frmAdminsData ?? []);
        }
      } catch (err) {
        if (!cancelled) {
          setOptionsError(err.response?.data?.message || 'Failed to load stores/FRMs.');
        }
      } finally {
        if (!cancelled) setOptionsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const filteredRows = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return rows;
    return rows.filter((row) => displayStoreName(row.store).toLowerCase().includes(term));
  }, [rows, search]);

  const unmappedStores = useMemo(() => {
    const mappedStoreIds = new Set(rows.map((row) => row.storeId));
    return stores.filter((store) => !mappedStoreIds.has(store.id));
  }, [rows, stores]);

  const frmOptions = useMemo(
    () => (editingRow ? frmAdmins.filter((admin) => admin.id !== editingRow.frmAdminId) : frmAdmins),
    [frmAdmins, editingRow]
  );

  const openAddDialog = () => {
    setEditingRow(null);
    setSelectedStore(null);
    setSelectedFrm(null);
    setFormError('');
    setDialogOpen(true);
  };

  const openChangeDialog = (row) => {
    setEditingRow(row);
    setSelectedStore({ id: row.storeId, ...row.store });
    setSelectedFrm(null);
    setFormError('');
    setDialogOpen(true);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError('');

    if (!selectedStore || !selectedFrm) {
      setFormError('Please select both a store and an FRM.');
      return;
    }

    setSubmitting(true);
    try {
      await upsertStoreFrmMapping({ storeId: selectedStore.id, frmAdminId: selectedFrm.id });
      setDialogOpen(false);
      refresh();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to save mapping.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        flexWrap="wrap"
        sx={{ mb: 2, rowGap: 1.5, columnGap: 3 }}
      >
        <Stack direction="row" spacing={1.5} alignItems="center">
          <AssignmentIndIcon sx={{ color: '#0f9f9a', fontSize: 30 }} />
          <Typography sx={{ fontSize: '1.4rem', fontWeight: 900, color: '#007f7a' }}>
            Store → FRM Mappings
          </Typography>
        </Stack>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={openAddDialog}
          disabled={optionsLoading || unmappedStores.length === 0}
          sx={{ backgroundColor: '#0f9f9a', '&:hover': { backgroundColor: '#0c827e' } }}
        >
          Add Mapping
        </Button>
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid #a8d8d3', overflow: 'hidden', backgroundColor: '#ffffff' }}>
        <Box sx={{ p: 2, backgroundColor: '#fbfffe', borderBottom: '1px solid #d3e6e3' }}>
          <TextField
            size="small"
            placeholder="Search by store name"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            fullWidth
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2, backgroundColor: '#ffffff' } }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" sx={{ color: '#5a6b73' }} />
                </InputAdornment>
              ),
            }}
          />
        </Box>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Store</TableCell>
                <TableCell>FRM</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={3} align="center" sx={{ py: 4 }}>
                    <CircularProgress size={24} sx={{ color: '#0f9f9a' }} />
                  </TableCell>
                </TableRow>
              ) : filteredRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} align="center" sx={{ py: 4, color: '#5a6b73' }}>
                    {rows.length === 0 ? 'No mappings configured yet.' : 'No stores match your search.'}
                  </TableCell>
                </TableRow>
              ) : (
                filteredRows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell sx={{ color: '#113b4a' }}>{displayStoreName(row.store) || `Store #${row.storeId}`}</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#113b4a' }}>
                      {row.frm?.username ?? `Admin #${row.frmAdminId}`}
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="Change FRM">
                        <IconButton size="small" onClick={() => openChangeDialog(row)} aria-label="Change FRM">
                          <EditOutlinedIcon fontSize="small" sx={{ color: '#0f9f9a' }} />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>{editingRow ? 'Change FRM' : 'Add Mapping'}</DialogTitle>
        <Box component="form" onSubmit={handleSubmit}>
          <DialogContent>
            {formError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {formError}
              </Alert>
            )}
            {optionsError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {optionsError}
              </Alert>
            )}
            <Stack spacing={2}>
              {editingRow ? (
                <TextField
                  label="Store"
                  value={displayStoreName(selectedStore) || `Store #${selectedStore?.id}`}
                  slotProps={{ input: { readOnly: true } }}
                  sx={{
                    '& .MuiOutlinedInput-root': { backgroundColor: '#f1f8f7' },
                    '& .MuiInputBase-input': { color: '#113b4a', fontWeight: 700, WebkitTextFillColor: '#113b4a' },
                    '& .MuiInputLabel-root': { color: '#3f5a63' },
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: '#a8d8d3' },
                  }}
                />
              ) : (
                <Autocomplete
                  options={unmappedStores}
                  value={selectedStore}
                  onChange={(_e, value) => setSelectedStore(value)}
                  getOptionLabel={(option) => displayStoreName(option)}
                  isOptionEqualToValue={(option, value) => option.id === value.id}
                  loading={optionsLoading}
                  renderInput={(params) => <TextField {...params} label="Store" required />}
                />
              )}
              {editingRow && (
                <Typography sx={{ fontSize: '0.85rem', color: '#5a6b73' }}>
                  Current FRM: <strong>{editingRow.frm?.username ?? `Admin #${editingRow.frmAdminId}`}</strong>
                </Typography>
              )}
              <Autocomplete
                options={frmOptions}
                value={selectedFrm}
                onChange={(_e, value) => setSelectedFrm(value)}
                getOptionLabel={(option) => option.username ?? ''}
                isOptionEqualToValue={(option, value) => option.id === value.id}
                loading={optionsLoading}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label={editingRow ? 'New FRM' : 'FRM'}
                    required
                    helperText="Only admins with the FRM role are listed"
                  />
                )}
              />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button
              type="submit"
              variant="contained"
              disabled={submitting}
              sx={{ backgroundColor: '#0f9f9a', '&:hover': { backgroundColor: '#0c827e' } }}
            >
              {editingRow ? 'Change' : 'Save'}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
    </Box>
  );
};

export default StoreFrmMappings;

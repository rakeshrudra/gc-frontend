import React, { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Paper,
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
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlineOutlined';
import AssignmentIndIcon from '@mui/icons-material/AssignmentInd';
import {
  getStoreFrmMappings,
  upsertStoreFrmMapping,
  deactivateStoreFrmMapping,
} from '../services/grievances';

const emptyForm = { storeId: '', frmAdminId: '' };

const StoreFrmMappings = () => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
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

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError('');

    if (!form.storeId || !form.frmAdminId) {
      setFormError('Both Store ID and FRM Admin ID are required.');
      return;
    }

    setSubmitting(true);
    try {
      await upsertStoreFrmMapping({
        storeId: Number(form.storeId),
        frmAdminId: Number(form.frmAdminId),
      });
      setDialogOpen(false);
      setForm(emptyForm);
      refresh();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to save mapping.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeactivate = async (storeId) => {
    try {
      await deactivateStoreFrmMapping(storeId);
      refresh();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to deactivate mapping.');
    }
  };

  return (
    <Box sx={{ py: 3 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <AssignmentIndIcon sx={{ color: '#0f9f9a', fontSize: 30 }} />
          <Typography sx={{ fontSize: '1.4rem', fontWeight: 900, color: '#007f7a' }}>
            Store → FRM Mappings
          </Typography>
        </Stack>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => {
            setForm(emptyForm);
            setFormError('');
            setDialogOpen(true);
          }}
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
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Store</TableCell>
                <TableCell>FRM</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={4} align="center" sx={{ py: 4 }}>
                    <CircularProgress size={24} sx={{ color: '#0f9f9a' }} />
                  </TableCell>
                </TableRow>
              ) : rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} align="center" sx={{ py: 4, color: '#5a6b73' }}>
                    No mappings configured yet.
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>{row.store?.storeName ?? `Store #${row.storeId}`}</TableCell>
                    <TableCell>{row.frm?.username ?? `Admin #${row.frmAdminId}`}</TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={row.isActive ? 'Active' : 'Inactive'}
                        sx={{
                          backgroundColor: row.isActive ? '#e8f5e9' : '#eceff1',
                          color: row.isActive ? '#2e7d32' : '#5a6b73',
                          fontWeight: 700,
                        }}
                      />
                    </TableCell>
                    <TableCell align="right">
                      {row.isActive && (
                        <IconButton size="small" onClick={() => handleDeactivate(row.storeId)} aria-label="Deactivate mapping">
                          <DeleteOutlineIcon fontSize="small" sx={{ color: '#c62828' }} />
                        </IconButton>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>Add / Update Mapping</DialogTitle>
        <Box component="form" onSubmit={handleSubmit}>
          <DialogContent>
            {formError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {formError}
              </Alert>
            )}
            <Stack spacing={2}>
              <TextField
                label="Store ID"
                type="number"
                value={form.storeId}
                onChange={(e) => setForm((prev) => ({ ...prev, storeId: e.target.value }))}
                fullWidth
                required
              />
              <TextField
                label="FRM Admin ID"
                type="number"
                value={form.frmAdminId}
                onChange={(e) => setForm((prev) => ({ ...prev, frmAdminId: e.target.value }))}
                fullWidth
                required
                helperText="Must belong to an admin with the FRM (emedix_op_admin) role"
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
              Save
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
    </Box>
  );
};

export default StoreFrmMappings;

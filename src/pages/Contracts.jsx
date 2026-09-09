import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
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
import DescriptionIcon from '@mui/icons-material/Description';
import UploadFileIcon from '@mui/icons-material/UploadFile';

import { createContract, getContracts } from '../services/contracts';

const emptyForm = { remark: '', aadhaar: null, pan: null };

const Contracts = () => {
  const { clientId } = useParams();

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [dialogOpen, setDialogOpen] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const loadContracts = async () => {
    setLoading(true);
    setError('');

    try {
      const data = await getContracts();
      setRows(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load contracts.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const data = await getContracts();
        if (!cancelled) {
          setRows(Array.isArray(data) ? data : []);
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.response?.data?.message || 'Failed to load contracts.');
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleCloseDialog = () => {
    if (submitting) return;
    setDialogOpen(false);
  };

  const handleFileChange = (field) => (event) => {
    const file = event.target.files?.[0] || null;
    setForm((prev) => ({ ...prev, [field]: file }));
  };

  const handleSubmit = async () => {
    setFormError('');

    if (!form.remark.trim()) {
      setFormError('A remark is required.');
      return;
    }

    setSubmitting(true);

    try {
      await createContract(clientId, form);
      await loadContracts();
      setDialogOpen(false);
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to create contract entry.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(180deg, #f7f5ff 0%, #ffffff 260px)',
        p: { xs: 2, sm: 4 },
      }}
    >
      <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
        <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 3 }}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'linear-gradient(135deg, #6a5cff, #8f7bff)',
            }}
          >
            <DescriptionIcon sx={{ color: '#fff', fontSize: 22 }} />
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800, color: '#2b2560' }}>
              Contract Preparation
            </Typography>
            <Typography variant="body2" sx={{ color: '#8a86ad' }}>
              Upload documents and track contract-ready clients
            </Typography>
          </Box>
        </Stack>

        {error && (
          <Alert severity="error" sx={{ mb: 2, borderRadius: '10px' }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        <TableContainer
          sx={{
            borderRadius: '16px',
            border: '1px solid #ece9ff',
            backgroundColor: '#ffffff',
            boxShadow: '0 4px 20px rgba(106,92,255,0.06)',
            overflowX: 'auto',
          }}
        >
          <Table sx={{ minWidth: 900 }}>
            <TableHead>
              <TableRow>
                {['Client', 'City', 'Mobile Number', 'Location', 'Status', 'Action'].map((label) => (
                  <TableCell
                    key={label}
                    sx={{
                      py: 1.5,
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      letterSpacing: '0.06em',
                      textTransform: 'uppercase',
                      color: '#7a75b0',
                      backgroundColor: '#f8f7ff',
                      borderBottom: '1px solid #ece9ff',
                    }}
                  >
                    {label}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 5, border: 0 }}>
                    <CircularProgress size={24} sx={{ color: '#6a5cff' }} />
                  </TableCell>
                </TableRow>
              ) : rows.length > 0 ? (
                rows.map((row, index) => {
                  const isNew = row.status === 'pending_contract';
                  const client = row.onboardingCase || {};

                  return (
                    <TableRow
                      key={row.id}
                      sx={{
                        position: 'relative',
                        '&:hover': { backgroundColor: '#fbfaff' },
                        '& td': {
                          borderBottom:
                            index === rows.length - 1 ? 'none' : '1px solid #f1effc',
                        },
                      }}
                    >
                      <TableCell sx={{ py: 1.75, fontWeight: 600, color: '#2b2560' }}>
                        {client.name || '-'}
                      </TableCell>
                      <TableCell sx={{ py: 1.75, color: '#4a4670' }}>
                        {client.city || '-'}
                      </TableCell>
                      <TableCell sx={{ py: 1.75, color: '#4a4670' }}>
                        {client.mobileNo || '-'}
                      </TableCell>
                      <TableCell sx={{ py: 1.75, color: '#4a4670' }}>
                        {client.location || '-'}
                      </TableCell>
                      <TableCell sx={{ py: 1.75 }}>
                        <Chip
                          label={isNew ? 'Pending Contract' : 'Contract Generated'}
                          size="small"
                          sx={{
                            fontWeight: 700,
                            backgroundColor: isNew ? '#fff1e0' : '#e3f8ee',
                            color: isNew ? '#b56a00' : '#1e7e50',
                          }}
                        />
                      </TableCell>
                      <TableCell sx={{ py: 1.75 }}>
                        <Stack direction="row" alignItems="center" justifyContent="flex-end" spacing={1}>
                          {isNew && (
                            <Chip
                              label="NEW"
                              size="small"
                              sx={{
                                fontWeight: 800,
                                fontSize: '0.65rem',
                                height: 22,
                                backgroundColor: '#6a5cff',
                                color: '#fff',
                              }}
                            />
                          )}

                          <Button
                            size="small"
                            variant="contained"
                            sx={{
                              borderRadius: '999px',
                              fontWeight: 600,
                              fontSize: '0.78rem',
                              textTransform: 'none',
                              whiteSpace: 'nowrap',
                              px: 1.75,
                              py: 0.5,
                              minWidth: 0,
                              lineHeight: 1.4,
                              background: 'linear-gradient(135deg, #2bb3b1, #3aaed8)',
                              color: '#ffffff',
                              boxShadow: '0 2px 8px rgba(43,179,177,0.3)',
                              '&:hover': {
                                background: 'linear-gradient(135deg, #23a19f, #329bc7)',
                              },
                            }}
                          >
                            Prepare Contract
                          </Button>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 5, border: 0 }}>
                    <Typography variant="body2" sx={{ color: '#a29dcf' }}>
                      No contract entries yet.
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      <Dialog open={dialogOpen} onClose={handleCloseDialog} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontWeight: 700, color: '#2b2560' }}>
          Prepare Contract Documents
        </DialogTitle>

        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '20px !important' }}>
          {formError && <Alert severity="error">{formError}</Alert>}

          <Button
            component="label"
            variant="outlined"
            startIcon={<UploadFileIcon />}
            sx={{
              justifyContent: 'flex-start',
              borderRadius: '10px',
              textTransform: 'none',
              borderColor: form.aadhaar ? '#6a5cff' : '#e0ddfa',
              color: form.aadhaar ? '#6a5cff' : '#5a5580',
            }}
          >
            {form.aadhaar ? form.aadhaar.name : 'Upload Aadhaar Card'}
            <input
              type="file"
              accept="image/jpeg,image/png,application/pdf"
              hidden
              onChange={handleFileChange('aadhaar')}
            />
          </Button>

          <Button
            component="label"
            variant="outlined"
            startIcon={<UploadFileIcon />}
            sx={{
              justifyContent: 'flex-start',
              borderRadius: '10px',
              textTransform: 'none',
              borderColor: form.pan ? '#6a5cff' : '#e0ddfa',
              color: form.pan ? '#6a5cff' : '#5a5580',
            }}
          >
            {form.pan ? form.pan.name : 'Upload PAN Card'}
            <input
              type="file"
              accept="image/jpeg,image/png,application/pdf"
              hidden
              onChange={handleFileChange('pan')}
            />
          </Button>

          <TextField
            label="Remark"
            value={form.remark}
            onChange={(event) => setForm((prev) => ({ ...prev, remark: event.target.value }))}
            fullWidth
            required
            multiline
            minRows={3}
          />
        </DialogContent>

        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleCloseDialog} disabled={submitting}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={submitting}
            sx={{
              borderRadius: '10px',
              textTransform: 'none',
              fontWeight: 700,
              background: 'linear-gradient(135deg, #6a5cff, #8f7bff)',
            }}
          >
            {submitting ? <CircularProgress size={18} sx={{ color: '#fff' }} /> : 'Submit'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Contracts;

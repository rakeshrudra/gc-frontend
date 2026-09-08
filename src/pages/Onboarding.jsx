import React, { useContext, useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Collapse,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
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
import AddIcon from '@mui/icons-material/Add';
import AddAPhotoIcon from '@mui/icons-material/AddAPhoto';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutlined';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';

import { AuthContext } from '../context/AuthContext';
import {
  createOnboardingCase,
  getOnboardingCases,
  getOnboardingRemarks,
  updateOnboardingStatus,
} from '../services/onboarding';

const columns = [
  { key: 'name', label: 'Name' },
  { key: 'city', label: 'City' },
  { key: 'mobileNo', label: 'Mobile Number' },
  { key: 'location', label: 'Location' },
  { key: 'details', label: 'Details' },
  { key: 'status', label: 'Status' },
  { key: 'actions', label: 'Actions' },
];

const emptyForm = {
  name: '',
  city: '',
  mobileNo: '',
  location: '',
  details: '',
};

const statusLabels = {
  awaiting_approval: 'Awaiting Approval',
  approved: 'Approved',
  declined: 'Declined',
  site_visit_done: 'Site Visit Done',
};

const statusColors = {
  awaiting_approval: { bg: '#fff3cd', color: '#8a6d1a' },
  approved: { bg: '#d4edda', color: '#1e7e34' },
  declined: { bg: '#f8d7da', color: '#a71d2a' },
  site_visit_done: { bg: '#d6e4ff', color: '#1d4fa7' },
};

const statusOptions = ['awaiting_approval', 'approved', 'declined'];
const siteVisitOptions = ['approved', 'site_visit_done'];

const STATUS_PILL_HEIGHT = 32;
const STATUS_PILL_MIN_WIDTH = 168;

const renderStatusChip = (status) => {
  const palette = statusColors[status] || { bg: '#eee', color: '#555' };
  return (
    <Chip
      label={statusLabels[status] || status}
      sx={{
        height: STATUS_PILL_HEIGHT,
        minWidth: STATUS_PILL_MIN_WIDTH,
        justifyContent: 'center',
        backgroundColor: palette.bg,
        color: palette.color,
        fontWeight: 700,
        fontSize: '0.8rem',
        borderRadius: '999px',
        '& .MuiChip-label': { px: 2 },
      }}
    />
  );
};

const Onboarding = () => {
  const { adminRole } = useContext(AuthContext);
  const isSalesRole = adminRole === 'emedix_sales';
  const canApprove = ['emedix_op_admin', 'emedix_admin', 'emedix_superadmin'].includes(adminRole);

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const [statusUpdatingId, setStatusUpdatingId] = useState(null);

  const [declineCase, setDeclineCase] = useState(null);
  const [declineRemark, setDeclineRemark] = useState('');

  const [siteVisitCase, setSiteVisitCase] = useState(null);
  const [siteVisitRemark, setSiteVisitRemark] = useState('');
  const [siteVisitPhoto, setSiteVisitPhoto] = useState(null);
  const [siteVisitError, setSiteVisitError] = useState('');

  const [remarksCase, setRemarksCase] = useState(null);
  const [remarks, setRemarks] = useState([]);
  const [remarksLoading, setRemarksLoading] = useState(false);
  const [remarksError, setRemarksError] = useState('');

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      setError('');

      try {
        const data = await getOnboardingCases();
        if (!cancelled) setRows(Array.isArray(data) ? data : []);
      } catch (err) {
        if (!cancelled) {
          setError(err.response?.data?.message || 'Failed to load onboarding cases.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleOpenDialog = () => {
    setForm(emptyForm);
    setFormError('');
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    if (submitting) return;
    setDialogOpen(false);
  };

  const handleFieldChange = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleSubmit = async () => {
    setFormError('');

    if (!form.name.trim() || !form.city.trim() || !form.mobileNo.trim() || !form.location.trim()) {
      setFormError('Name, city, mobile number and location are required.');
      return;
    }

    if (!/^\d{10}$/.test(form.mobileNo.trim())) {
      setFormError('Mobile number must be a 10 digit number.');
      return;
    }

    setSubmitting(true);

    try {
      const created = await createOnboardingCase({
        name: form.name.trim(),
        city: form.city.trim(),
        mobileNo: form.mobileNo.trim(),
        location: form.location.trim(),
        details: form.details.trim() || undefined,
      });

      setRows((prev) => [created, ...prev]);
      setDialogOpen(false);
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to create onboarding case.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusSelect = (row, newStatus) => {
    if (newStatus === row.status) return;

    if (newStatus === 'declined') {
      setDeclineCase(row);
      setDeclineRemark('');
      return;
    }

    if (newStatus === 'site_visit_done') {
      setSiteVisitCase(row);
      setSiteVisitRemark('');
      setSiteVisitError('');
      return;
    }

    handleStatusChange(row.id, newStatus);
  };

  const handleStatusChange = async (id, status, remark) => {
    setStatusUpdatingId(id);
    setError('');

    try {
      const updated = await updateOnboardingStatus(id, status, remark);
      setRows((prev) => prev.map((row) => (row.id === id ? updated : row)));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update status.');
    } finally {
      setStatusUpdatingId(null);
    }
  };

  const handleCloseDecline = () => {
    if (statusUpdatingId) return;
    setDeclineCase(null);
    setDeclineRemark('');
  };

  const handleConfirmDecline = async () => {
    const id = declineCase.id;
    setStatusUpdatingId(id);
    setError('');

    try {
      const updated = await updateOnboardingStatus(id, 'declined', declineRemark.trim() || undefined);
      setRows((prev) => prev.map((row) => (row.id === id ? updated : row)));
      setDeclineCase(null);
      setDeclineRemark('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update status.');
    } finally {
      setStatusUpdatingId(null);
    }
  };

  const handleCloseSiteVisit = () => {
    if (statusUpdatingId) return;
    setSiteVisitCase(null);
    setSiteVisitRemark('');
    setSiteVisitPhoto(null);
    setSiteVisitError('');
  };

  const handleSiteVisitPhotoChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      setSiteVisitError('Only JPEG or PNG photos are allowed.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setSiteVisitError('Photo must be 5MB or smaller.');
      return;
    }

    setSiteVisitError('');
    setSiteVisitPhoto(file);
  };

  const handleConfirmSiteVisit = async () => {
    if (!siteVisitRemark.trim()) {
      setSiteVisitError('A remark is required to mark the site visit as done.');
      return;
    }

    const id = siteVisitCase.id;
    setStatusUpdatingId(id);
    setSiteVisitError('');

    try {
      const updated = await updateOnboardingStatus(
        id,
        'site_visit_done',
        siteVisitRemark.trim(),
        siteVisitPhoto,
      );
      setRows((prev) => prev.map((row) => (row.id === id ? updated : row)));
      setSiteVisitCase(null);
      setSiteVisitRemark('');
      setSiteVisitPhoto(null);
    } catch (err) {
      setSiteVisitError(err.response?.data?.message || 'Failed to update status.');
    } finally {
      setStatusUpdatingId(null);
    }
  };

  const handleOpenRemarks = async (row) => {
    setRemarksCase(row);
    setRemarksError('');
    setRemarksLoading(true);

    try {
      const data = await getOnboardingRemarks(row.id);
      setRemarks(Array.isArray(data) ? data : []);
    } catch (err) {
      setRemarksError(err.response?.data?.message || 'Failed to load remarks.');
    } finally {
      setRemarksLoading(false);
    }
  };

  const handleCloseRemarks = () => {
    setRemarksCase(null);
    setRemarks([]);
  };

  const renderStatusSelect = (row, options) => {
    const palette = statusColors[row.status] || { bg: '#eee', color: '#555' };
    const isUpdating = statusUpdatingId === row.id;

    return (
      <Select
        value={row.status}
        onChange={(event) => handleStatusSelect(row, event.target.value)}
        disabled={isUpdating}
        IconComponent={isUpdating ? 'span' : undefined}
        sx={{
          height: STATUS_PILL_HEIGHT,
          minWidth: STATUS_PILL_MIN_WIDTH,
          fontSize: '0.8rem',
          fontWeight: 700,
          backgroundColor: palette.bg,
          color: palette.color,
          borderRadius: '999px',
          transition: 'background-color 0.15s ease',
          '& .MuiSelect-select': {
            display: 'flex',
            alignItems: 'center',
            py: 0,
            pl: 2,
          },
          '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
          '&:hover': { backgroundColor: palette.bg, filter: 'brightness(0.97)' },
          '& .MuiSelect-icon': { color: palette.color },
          '&.Mui-disabled': { opacity: 0.7 },
        }}
      >
        {options.map((option) => {
          const optionPalette = statusColors[option] || { bg: '#eee', color: '#555' };
          return (
            <MenuItem
              key={option}
              value={option}
              sx={{
                fontSize: '0.8rem',
                fontWeight: 700,
                color: optionPalette.color,
                gap: 1,
              }}
            >
              <Box
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  backgroundColor: optionPalette.color,
                  mr: 1,
                  flexShrink: 0,
                }}
              />
              {statusLabels[option]}
            </MenuItem>
          );
        })}
      </Select>
    );
  };

  const renderStatusCell = (row) => {
    if (canApprove && row.status === 'awaiting_approval') {
      return renderStatusSelect(row, statusOptions);
    }

    if (isSalesRole && row.status === 'approved') {
      return renderStatusSelect(row, siteVisitOptions);
    }

    return renderStatusChip(row.status);
  };

  const renderActionsCell = (row) => (
    <Stack direction="row" spacing={1} alignItems="center">
      <Button
        size="small"
        variant="outlined"
        startIcon={<ChatBubbleOutlineIcon />}
        onClick={() => handleOpenRemarks(row)}
        sx={{
          borderRadius: '999px',
          textTransform: 'none',
          fontWeight: 600,
          borderColor: '#d9f7ef',
          color: '#0f9f9a',
          '&:hover': {
            borderColor: '#0f9f9a',
            backgroundColor: '#f0fdfb',
          },
        }}
      >
        View Remarks
      </Button>

      {row.status === 'site_visit_done' && (
        <Button
          size="small"
          variant="contained"
          endIcon={<ArrowForwardIcon sx={{ fontSize: 16 }} />}
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
            background: 'linear-gradient(135deg, #6a5cff, #8f7bff)',
            color: '#ffffff',
            boxShadow: '0 2px 8px rgba(106,92,255,0.3)',
            '&:hover': {
              background: 'linear-gradient(135deg, #5c4ef2, #8067ff)',
              boxShadow: '0 3px 10px rgba(106,92,255,0.4)',
            },
          }}
        >
          Move to Contract
        </Button>
      )}
    </Stack>
  );

  return (
    <Box sx={{ width: '100%', maxWidth: '100%', overflowX: 'hidden' }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: { xs: 1.5, sm: 2 },
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 700, color: '#0f9f9a' }}>
          Onboarding
        </Typography>

        {isSalesRole && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleOpenDialog}
            sx={{
              borderRadius: '8px',
              fontWeight: 700,
              background: 'linear-gradient(135deg, #2bb3b1, #3aaed8)',
              color: '#ffffff',
            }}
          >
            Add New
          </Button>
        )}
      </Box>

      <Collapse in={!!error}>
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      </Collapse>

      <TableContainer
        component={Paper}
        elevation={0}
        sx={{
          borderRadius: '16px',
          border: '1px solid #e3f4f1',
          boxShadow: '0 2px 12px rgba(15, 159, 154, 0.06)',
          overflowX: 'auto',
          maxWidth: '100%',
        }}
      >
        <Table sx={{ minWidth: 1150 }}>
          <TableHead>
            <TableRow>
              {columns.map((column) => (
                <TableCell
                  key={column.key}
                  sx={{
                    px: { xs: 1.5, sm: 2 },
                    py: 1.5,
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    color: '#5a8f8c',
                    backgroundColor: '#f4fbfa',
                    borderBottom: '1px solid #e3f4f1',
                    whiteSpace: 'normal',
                  }}
                >
                  {column.label}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={columns.length} align="center" sx={{ py: 5, border: 0 }}>
                  <CircularProgress size={24} sx={{ color: '#2bb3b1' }} />
                </TableCell>
              </TableRow>
            ) : rows.length > 0 ? (
              rows.map((row, index) => (
                <TableRow
                  key={row.id}
                  sx={{
                    transition: 'background-color 0.15s ease',
                    '&:hover': { backgroundColor: '#f7fdfc' },
                    '& td': {
                      borderBottom:
                        index === rows.length - 1 ? 'none' : '1px solid #eef7f6',
                    },
                  }}
                >
                  {columns.map((column) => (
                    <TableCell
                      key={column.key}
                      sx={{
                        px: { xs: 1.5, sm: 2 },
                        py: 1.75,
                        fontSize: '0.85rem',
                        color: '#2c3e50',
                        maxWidth:
                          column.key === 'actions'
                            ? 'none'
                            : { xs: 180, sm: 240, md: 300 },
                        overflowWrap: column.key === 'actions' ? 'normal' : 'anywhere',
                        whiteSpace: column.key === 'actions' ? 'nowrap' : 'normal',
                        verticalAlign: 'middle',
                      }}
                    >
                      {column.key === 'status' && renderStatusCell(row)}
                      {column.key === 'actions' && renderActionsCell(row)}
                      {column.key !== 'status' &&
                        column.key !== 'actions' &&
                        (row[column.key] || (
                          <Box component="span" sx={{ color: '#b0bec5' }}>
                            —
                          </Box>
                        ))}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} align="center" sx={{ py: 5, border: 0 }}>
                  <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                    No onboarding cases yet.
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={dialogOpen} onClose={handleCloseDialog} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontWeight: 700, color: '#0f9f9a' }}>
          Add New Onboarding Case
        </DialogTitle>

        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '20px !important' }}>
          {formError && (
            <Alert severity="error" onClose={() => setFormError('')}>
              {formError}
            </Alert>
          )}

          <TextField
            label="Name"
            value={form.name}
            onChange={handleFieldChange('name')}
            fullWidth
            required
          />

          <TextField
            label="City"
            value={form.city}
            onChange={handleFieldChange('city')}
            fullWidth
            required
          />

          <TextField
            label="Mobile Number"
            value={form.mobileNo}
            onChange={handleFieldChange('mobileNo')}
            fullWidth
            required
            inputProps={{ maxLength: 10 }}
          />

          <TextField
            label="Location"
            value={form.location}
            onChange={handleFieldChange('location')}
            fullWidth
            required
          />

          <TextField
            label="Details"
            value={form.details}
            onChange={handleFieldChange('details')}
            fullWidth
            multiline
            minRows={4}
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
              background: 'linear-gradient(135deg, #2bb3b1, #3aaed8)',
              color: '#ffffff',
              fontWeight: 700,
            }}
          >
            Submit
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!declineCase} onClose={handleCloseDecline} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontWeight: 700, color: '#a71d2a' }}>
          Decline {declineCase ? `— ${declineCase.name}` : ''}
        </DialogTitle>

        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <Typography variant="body2" sx={{ color: '#546e7a' }}>
            You can add a remark for declining this case (optional).
          </Typography>

          <TextField
            label="Remark (optional)"
            value={declineRemark}
            onChange={(event) => setDeclineRemark(event.target.value)}
            fullWidth
            multiline
            minRows={3}
          />
        </DialogContent>

        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleCloseDecline} disabled={statusUpdatingId === declineCase?.id}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleConfirmDecline}
            disabled={statusUpdatingId === declineCase?.id}
          >
            Confirm Decline
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!siteVisitCase} onClose={handleCloseSiteVisit} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontWeight: 700, color: '#1d4fa7' }}>
          Mark Site Visit Done {siteVisitCase ? `— ${siteVisitCase.name}` : ''}
        </DialogTitle>

        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '20px !important' }}>
          {siteVisitError && <Alert severity="error">{siteVisitError}</Alert>}

          <Box
            component="label"
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 1,
              p: 4,
              border: '2px dashed',
              borderColor: siteVisitPhoto ? '#2bb3b1' : '#cbd5e1',
              borderRadius: '12px',
              cursor: 'pointer',
              backgroundColor: siteVisitPhoto ? 'rgba(43,179,177,0.06)' : 'rgba(0,0,0,0.01)',
              textAlign: 'center',
            }}
          >
            <AddAPhotoIcon sx={{ fontSize: 64, color: siteVisitPhoto ? '#2bb3b1' : '#94a3b8' }} />
            <Typography sx={{ fontWeight: 700, color: siteVisitPhoto ? '#2bb3b1' : '#546e7a' }}>
              {siteVisitPhoto ? siteVisitPhoto.name : 'Click to upload a photo (optional)'}
            </Typography>
            <Typography variant="caption" sx={{ color: '#94a3b8' }}>
              JPEG or PNG, up to 5MB
            </Typography>
            <input
              type="file"
              accept="image/jpeg,image/png"
              hidden
              onChange={handleSiteVisitPhotoChange}
            />
          </Box>

          <TextField
            label="Remark"
            value={siteVisitRemark}
            onChange={(event) => setSiteVisitRemark(event.target.value)}
            fullWidth
            required
            multiline
            minRows={3}
          />
        </DialogContent>

        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleCloseSiteVisit} disabled={statusUpdatingId === siteVisitCase?.id}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleConfirmSiteVisit}
            disabled={statusUpdatingId === siteVisitCase?.id}
            sx={{
              background: 'linear-gradient(135deg, #2bb3b1, #3aaed8)',
              color: '#ffffff',
              fontWeight: 700,
            }}
          >
            Confirm
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!remarksCase} onClose={handleCloseRemarks} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontWeight: 700, color: '#0f9f9a' }}>
          Remarks {remarksCase ? `— ${remarksCase.name}` : ''}
        </DialogTitle>

        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '20px !important' }}>
          {remarksError && (
            <Alert severity="error" onClose={() => setRemarksError('')}>
              {remarksError}
            </Alert>
          )}

          {remarksLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
              <CircularProgress size={28} sx={{ color: '#2bb3b1' }} />
            </Box>
          ) : remarks.length > 0 ? (
            <Stack spacing={1.5} sx={{ maxHeight: 360, overflowY: 'auto', pr: 0.5 }}>
              {remarks.map((item) => {
                const palette = statusColors[item.status] || { bg: '#f4f6f8', color: '#546e7a' };
                return (
                  <Box
                    key={item.id}
                    sx={{
                      p: 1.5,
                      borderRadius: '10px',
                      backgroundColor: palette.bg,
                      borderLeft: `4px solid ${palette.color}`,
                    }}
                  >
                    {item.status && (
                      <Chip
                        label={statusLabels[item.status] || item.status}
                        size="small"
                        sx={{
                          mb: 0.75,
                          backgroundColor: '#ffffff',
                          color: palette.color,
                          fontWeight: 700,
                          border: `1px solid ${palette.color}33`,
                        }}
                      />
                    )}
                    <Typography
                      variant="body2"
                      sx={{ whiteSpace: 'pre-wrap', color: '#2c3e50', fontWeight: 500 }}
                    >
                      {item.remark}
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{ color: palette.color, fontWeight: 600, opacity: 0.85 }}
                    >
                      {item.createdByName} ({item.createdByRole}) —{' '}
                      {new Date(item.createdAt).toLocaleString()}
                    </Typography>
                  </Box>
                );
              })}
            </Stack>
          ) : (
            <Typography variant="body2" sx={{ color: '#94a3b8' }}>
              No remarks yet.
            </Typography>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleCloseRemarks}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Onboarding;

import React, { useContext, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
  Divider,
  IconButton,
  InputAdornment,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import DescriptionIcon from '@mui/icons-material/Description';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlineOutlined';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';

import { AuthContext } from '../context/AuthContext';
import {
  createContract,
  getContracts,
  getContractClientIds,
  prepareContract,
  downloadGeneratedContract,
  prepareLetter,
  downloadGeneratedLetter,
} from '../services/contracts';
import { sendPhoneOtp, confirmPhoneOtp, resetRecaptcha } from '../services/phoneOtp';
import { getReadableOtpError } from '../utils/otpError';

const emptyForm = { remark: '', aadhaar: null, pan: null };

const formatDateForContract = (value) => (value ? value.format('D MMMM YYYY') : '');

const getOrdinalSuffix = (day) => {
  if (day % 10 === 1 && day !== 11) return 'st';
  if (day % 10 === 2 && day !== 12) return 'nd';
  if (day % 10 === 3 && day !== 13) return 'rd';
  return 'th';
};

const formatAgreementDate = (value) => {
  if (!value) return '';
  const day = value.date();
  return `${day}${getOrdinalSuffix(day)} day of ${value.format('MMMM')} of the year ${value.format('YYYY')}`;
};

const emptyPayment = () => ({ label: '', amount: '', dueDate: null, paidDate: null });

const emptyPrepareForm = {
  agreementDate: null,
  franchiseeBusinessName: '',
  signatoryName: '',
  signatoryAadhaar: '',
  signatoryFatherName: '',
  businessAddress: '',
  state: '',
  appointmentDate: null,
  territory: '',
  franchiseFeeWords: '',
  franchiseFeeNumeric: '',
  renewalFee: '',
  exclusivityRadius: '',
  payments: [emptyPayment()],
};

const emptyLetterForm = {
  letterDate: dayjs(),
  clientNameEn: '',
  clientNameHi: '',
  cityEn: '',
  districtEn: '',
  cityHi: '',
  districtHi: '',
};

const Contracts = () => {
  const { clientId } = useParams();
  const navigate = useNavigate();
  const { admin } = useContext(AuthContext);

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [page, setPage] = useState(0);
  const [rowsPerPage] = useState(25);
  const [totalRows, setTotalRows] = useState(0);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');

  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const [prepareDialogRow, setPrepareDialogRow] = useState(null);
  const [prepareForm, setPrepareForm] = useState(emptyPrepareForm);
  const [preparing, setPreparing] = useState(false);
  const [prepareError, setPrepareError] = useState('');

  const [otpDialogOpen, setOtpDialogOpen] = useState(false);
  const [otpValue, setOtpValue] = useState('');
  const [otpConfirmation, setOtpConfirmation] = useState(null);
  const [otpSending, setOtpSending] = useState(false);
  const [otpVerifying, setOtpVerifying] = useState(false);
  const [otpError, setOtpError] = useState('');

  const [letterDialogRow, setLetterDialogRow] = useState(null);
  const [letterForm, setLetterForm] = useState(emptyLetterForm);
  const [preparingLetter, setPreparingLetter] = useState(false);
  const [letterError, setLetterError] = useState('');

  const [downloadingContractId, setDownloadingContractId] = useState(null);
  const [downloadingLetterId, setDownloadingLetterId] = useState(null);

  const loadContracts = async () => {
    setLoading(true);
    setError('');

    try {
      const result = await getContracts({ page: page + 1, limit: rowsPerPage, search });
      setRows(Array.isArray(result?.data) ? result.data : []);
      setTotalRows(result?.total ?? 0);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load contracts.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      setError('');

      try {
        const result = await getContracts({ page: page + 1, limit: rowsPerPage, search });
        if (!cancelled) {
          setRows(Array.isArray(result?.data) ? result.data : []);
          setTotalRows(result?.total ?? 0);
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
  }, [page, rowsPerPage, search]);

  useEffect(() => {
    if (!clientId) return;

    let cancelled = false;

    (async () => {
      try {
        const clientIds = await getContractClientIds();
        if (!cancelled) {
          const alreadyExists = clientIds.map(String).includes(String(clientId));
          if (!alreadyExists) {
            setDialogOpen(true);
          }
        }
      } catch {
        // Non-critical: fall through without auto-opening the dialog.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [clientId]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setPage(0);
      setSearch(searchInput.trim());
    }, 400);

    return () => clearTimeout(timeoutId);
  }, [searchInput]);

  const handlePageChange = (event, newPage) => {
    setPage(newPage);
  };

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

  const handleOpenPrepareDialog = async (row) => {
    if (row.status !== 'pending_contract') {
      if (downloadingContractId) return;
      setDownloadingContractId(row.id);
      try {
        await downloadGeneratedContract(row.id);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to download generated contract.');
      } finally {
        setDownloadingContractId(null);
      }
      return;
    }

    setPrepareError('');
    setPrepareForm(emptyPrepareForm);
    setPrepareDialogRow(row);
  };

  const handleClosePrepareDialog = () => {
    if (preparing) return;
    setPrepareDialogRow(null);
  };

  const handlePrepareFieldChange = (field) => (event) => {
    setPrepareForm((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleAadhaarChange = (event) => {
    const digitsOnly = event.target.value.replace(/\D/g, '').slice(0, 12);
    const formatted = digitsOnly.replace(/(\d{4})(?=\d)/g, '$1 ');
    setPrepareForm((prev) => ({ ...prev, signatoryAadhaar: formatted }));
  };

  const handleRenewalFeeChange = (event) => {
    const digitsOnly = event.target.value.replace(/\D/g, '');
    const formatted = digitsOnly ? `Rs ${digitsOnly}+GST` : '';
    setPrepareForm((prev) => ({ ...prev, renewalFee: formatted }));
  };

  const handleExclusivityRadiusChange = (event) => {
    const digitsOnly = event.target.value.replace(/\D/g, '');
    const formatted = digitsOnly ? `${digitsOnly} KM` : '';
    setPrepareForm((prev) => ({ ...prev, exclusivityRadius: formatted }));
  };

  const handlePrepareDateChange = (field) => (value) => {
    setPrepareForm((prev) => ({ ...prev, [field]: value }));
  };

  const handlePaymentFieldChange = (index, field) => (eventOrValue) => {
    const value = field === 'dueDate' || field === 'paidDate'
      ? eventOrValue
      : eventOrValue.target.value;

    setPrepareForm((prev) => ({
      ...prev,
      payments: prev.payments.map((payment, i) =>
        i === index ? { ...payment, [field]: value } : payment,
      ),
    }));
  };

  const handlePaymentAmountChange = (index) => (event) => {
    const digitsOnly = event.target.value.replace(/\D/g, '');
    const formatted = digitsOnly ? `INR ${digitsOnly}` : '';

    setPrepareForm((prev) => ({
      ...prev,
      payments: prev.payments.map((payment, i) =>
        i === index ? { ...payment, amount: formatted } : payment,
      ),
    }));
  };

  const handleAddPayment = () => {
    setPrepareForm((prev) => ({ ...prev, payments: [...prev.payments, emptyPayment()] }));
  };

  const handleRemovePayment = (index) => {
    setPrepareForm((prev) => ({
      ...prev,
      payments: prev.payments.filter((_, i) => i !== index),
    }));
  };

  const handlePrepareSubmit = async () => {
    setPrepareError('');

    const requiredFields = [
      ['agreementDate', 'Agreement date'],
      ['franchiseeBusinessName', 'Franchisee business name'],
      ['signatoryName', 'Signatory name'],
      ['signatoryAadhaar', 'Signatory Aadhaar number'],
      ['signatoryFatherName', "Signatory's father's name"],
      ['businessAddress', 'Business address'],
      ['state', 'State'],
      ['appointmentDate', 'Appointment date'],
      ['territory', 'Territory'],
      ['franchiseFeeWords', 'Franchise fee (in words)'],
      ['franchiseFeeNumeric', 'Franchise fee (numeric)'],
      ['renewalFee', 'Renewal fee'],
      ['exclusivityRadius', 'Exclusivity radius'],
    ];

    for (const [field, label] of requiredFields) {
      if (!prepareForm[field]) {
        setPrepareError(`${label} is required.`);
        return;
      }
    }

    if (!/^\d+$/.test(prepareForm.franchiseFeeNumeric.trim())) {
      setPrepareError('Franchise fee (numeric) must contain digits only.');
      return;
    }

    if (prepareForm.payments.length === 0) {
      setPrepareError('At least one payment row is required.');
      return;
    }

    for (const payment of prepareForm.payments) {
      if (!payment.label.trim() || !payment.amount.trim() || !payment.dueDate) {
        setPrepareError('Each payment row needs a label, amount, and due date.');
        return;
      }
    }

    if (!admin?.mobile_no) {
      setPrepareError('Your registered mobile number could not be found. Please re-login and try again.');
      return;
    }

    setOtpError('');
    setOtpValue('');
    setOtpSending(true);

    try {
      const confirmation = await sendPhoneOtp(admin.mobile_no, 'contract-otp-recaptcha');
      setOtpConfirmation(confirmation);
      setOtpDialogOpen(true);
    } catch (err) {
      setPrepareError(getReadableOtpError(err));
      resetRecaptcha();
    } finally {
      setOtpSending(false);
    }
  };

  const handleCloseOtpDialog = () => {
    if (otpVerifying) return;
    setOtpDialogOpen(false);
    setOtpConfirmation(null);
    setOtpValue('');
    setOtpError('');
  };

  const handleVerifyOtpAndGenerate = async () => {
    setOtpError('');

    if (!otpValue.trim()) {
      setOtpError('Please enter the OTP sent to your mobile number.');
      return;
    }

    setOtpVerifying(true);

    let otpToken;
    try {
      otpToken = await confirmPhoneOtp(otpConfirmation, otpValue.trim());
    } catch (err) {
      setOtpError(getReadableOtpError(err));
      setOtpVerifying(false);
      return;
    }

    setOtpDialogOpen(false);
    setOtpConfirmation(null);
    setOtpValue('');
    setOtpVerifying(false);

    setPreparing(true);
    setPrepareError('');

    try {
      await prepareContract(prepareDialogRow.id, {
        agreement_date: formatAgreementDate(prepareForm.agreementDate),
        franchisee_business_name: prepareForm.franchiseeBusinessName.trim(),
        signatory_name: prepareForm.signatoryName.trim(),
        signatory_aadhaar: prepareForm.signatoryAadhaar.trim(),
        signatory_father_name: prepareForm.signatoryFatherName.trim(),
        business_address: prepareForm.businessAddress.trim(),
        state: prepareForm.state.trim(),
        appointment_date: formatDateForContract(prepareForm.appointmentDate),
        territory: prepareForm.territory.trim(),
        franchise_fee: `INR ${prepareForm.franchiseFeeWords.trim()} (Rs ${Number(prepareForm.franchiseFeeNumeric).toLocaleString('en-US')}/-)`,
        renewal_fee: prepareForm.renewalFee.trim(),
        exclusivity_radius: prepareForm.exclusivityRadius.trim(),
        payments: prepareForm.payments.map((payment) => ({
          label: payment.label.trim(),
          amount: payment.amount.trim(),
          due_date: formatDateForContract(payment.dueDate),
          paid_date: payment.paidDate ? formatDateForContract(payment.paidDate) : '',
        })),
        otp_token: otpToken,
      });

      await loadContracts();
      setPrepareDialogRow(null);

      await downloadGeneratedContract(prepareDialogRow.id);
    } catch (err) {
      setPrepareError(err.response?.data?.message || 'Failed to generate contract.');
    } finally {
      setPreparing(false);
    }
  };

  const handleOpenLetterDialog = async (row) => {
    if (row.generatedLetterFileId) {
      if (downloadingLetterId) return;
      setDownloadingLetterId(row.id);
      try {
        await downloadGeneratedLetter(row.id);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to download generated letter.');
      } finally {
        setDownloadingLetterId(null);
      }
      return;
    }

    setLetterError('');
    setLetterForm(emptyLetterForm);
    setLetterDialogRow(row);
  };

  const handleCloseLetterDialog = () => {
    if (preparingLetter) return;
    setLetterDialogRow(null);
  };

  const handleLetterFieldChange = (field) => (event) => {
    setLetterForm((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleLetterDateChange = (value) => {
    setLetterForm((prev) => ({ ...prev, letterDate: value }));
  };

  const handlePrepareLetterSubmit = async () => {
    setLetterError('');

    const requiredFields = [
      ['letterDate', 'Date'],
      ['clientNameEn', "Client's name (English)"],
      ['clientNameHi', "Client's name (Hindi)"],
      ['cityEn', 'City (English)'],
      ['districtEn', 'District (English)'],
      ['cityHi', 'City (Hindi)'],
      ['districtHi', 'District (Hindi)'],
    ];

    for (const [field, label] of requiredFields) {
      if (!letterForm[field]) {
        setLetterError(`${label} is required.`);
        return;
      }
    }

    setPreparingLetter(true);

    try {
      await prepareLetter(letterDialogRow.id, {
        letter_date: formatDateForContract(letterForm.letterDate),
        client_name_en: letterForm.clientNameEn.trim(),
        client_name_hi: letterForm.clientNameHi.trim(),
        city_en: letterForm.cityEn.trim(),
        district_en: letterForm.districtEn.trim(),
        city_hi: letterForm.cityHi.trim(),
        district_hi: letterForm.districtHi.trim(),
      });

      await loadContracts();
      setLetterDialogRow(null);

      await downloadGeneratedLetter(letterDialogRow.id);
    } catch (err) {
      setLetterError(err.response?.data?.message || 'Failed to generate letter.');
    } finally {
      setPreparingLetter(false);
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="en-gb">
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(180deg, #f7f5ff 0%, #ffffff 260px)',
        p: { xs: 2, sm: 4 },
      }}
    >
      <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          spacing={1.5}
          sx={{ mb: 3, width: '100%' }}
        >
          <Stack direction="row" alignItems="center" spacing={1.5}>
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

          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon sx={{ fontSize: 18 }} />}
            onClick={() => navigate('/onboarding')}
            sx={{
              borderRadius: '999px',
              fontWeight: 700,
              textTransform: 'none',
              borderColor: '#6a5cff',
              color: '#6a5cff',
              whiteSpace: 'nowrap',
              '&:hover': {
                borderColor: '#5c4ef2',
                backgroundColor: 'rgba(106,92,255,0.06)',
              },
            }}
          >
            Back to Onboarding
          </Button>
        </Stack>

        {error && (
          <Alert severity="error" sx={{ mb: 2, borderRadius: '10px' }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        <Box sx={{ mb: 2 }}>
          <TextField
            size="small"
            placeholder="Search by client name"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            sx={{ minWidth: 280 }}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" />
                  </InputAdornment>
                ),
              },
            }}
          />
        </Box>

        <TableContainer
          sx={{
            borderRadius: '16px',
            border: '1px solid #ece9ff',
            backgroundColor: '#ffffff',
            boxShadow: '0 4px 20px rgba(106,92,255,0.06)',
            overflowX: 'auto',
          }}
        >
          <Table sx={{ minWidth: 1050 }}>
            <TableHead>
              <TableRow>
                {['Client', 'City', 'Mobile Number', 'Location', 'Contract Key', 'Status', 'Action'].map((label) => (
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
                  <TableCell colSpan={7} align="center" sx={{ py: 5, border: 0 }}>
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
                      <TableCell sx={{ py: 1.75, color: '#4a4670', fontFamily: 'monospace', fontSize: '0.78rem' }}>
                        {row.contractKey || '-'}
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
                      <TableCell sx={{ py: 1.75, pr: 3 }}>
                        <Stack direction="row" alignItems="center" justifyContent="flex-end" spacing={2.5}>
                          <Button
                            size="small"
                            variant="contained"
                            disabled={downloadingContractId === row.id}
                            onClick={() => handleOpenPrepareDialog(row)}
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
                              '&.Mui-disabled': {
                                background: 'linear-gradient(135deg, #2bb3b1, #3aaed8)',
                                opacity: 0.7,
                                color: '#ffffff',
                              },
                            }}
                          >
                            {downloadingContractId === row.id ? (
                              <CircularProgress size={16} sx={{ color: '#fff' }} />
                            ) : isNew ? 'Prepare Contract' : 'View Contract'}
                          </Button>

                          {!isNew && (
                            <Button
                              size="small"
                              variant="outlined"
                              disabled={downloadingLetterId === row.id}
                              onClick={() => handleOpenLetterDialog(row)}
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
                                borderColor: '#6a5cff',
                                color: '#6a5cff',
                                '&:hover': {
                                  borderColor: '#5c4ef2',
                                  backgroundColor: 'rgba(106,92,255,0.06)',
                                },
                              }}
                            >
                              {downloadingLetterId === row.id ? (
                                <CircularProgress size={16} sx={{ color: '#6a5cff' }} />
                              ) : row.generatedLetterFileId ? 'View Letter' : 'Prepare Letter'}
                            </Button>
                          )}

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
                        </Stack>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 5, border: 0 }}>
                    <Typography variant="body2" sx={{ color: '#a29dcf' }}>
                      No contract entries yet.
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          component="div"
          count={totalRows}
          page={page}
          onPageChange={handlePageChange}
          rowsPerPage={rowsPerPage}
          rowsPerPageOptions={[rowsPerPage]}
        />
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

      <Dialog
        open={Boolean(prepareDialogRow)}
        onClose={handleClosePrepareDialog}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle sx={{ fontWeight: 700, color: '#2b2560' }}>
          Prepare Contract — {prepareDialogRow?.onboardingCase?.name}
        </DialogTitle>

        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '20px !important' }}>
          {prepareError && <Alert severity="error">{prepareError}</Alert>}

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <DatePicker
              label="Agreement Date"
              format="DD/MM/YYYY"
              value={prepareForm.agreementDate}
              onChange={handlePrepareDateChange('agreementDate')}
              slotProps={{
                textField: {
                  fullWidth: true,
                  required: true,
                  helperText: prepareForm.agreementDate
                    ? `Will appear as: "This agreement is signed on this, the ${formatAgreementDate(prepareForm.agreementDate)}."`
                    : 'Will appear as: "This agreement is signed on this, the 28th day of December of the year 2023."',
                },
                popper: { sx: { zIndex: 1500 } },
              }}
            />
            <DatePicker
              label="Appointment Date"
              format="DD/MM/YYYY"
              value={prepareForm.appointmentDate}
              onChange={handlePrepareDateChange('appointmentDate')}
              slotProps={{
                textField: {
                  fullWidth: true,
                  required: true,
                  helperText: prepareForm.appointmentDate
                    ? `Will appear as: "EMEDIX appoints the Franchisee on ${formatDateForContract(prepareForm.appointmentDate)}..."`
                    : 'Will appear as: "EMEDIX appoints the Franchisee on 28 December 2023..."',
                },
                popper: { sx: { zIndex: 1500 } },
              }}
            />
          </Stack>

          <TextField
            label="Franchisee Business Name"
            value={prepareForm.franchiseeBusinessName}
            onChange={handlePrepareFieldChange('franchiseeBusinessName')}
            fullWidth
            required
            helperText="e.g. M/S Chandrashekhar Pharma"
          />

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField
              label="Signatory Name"
              value={prepareForm.signatoryName}
              onChange={handlePrepareFieldChange('signatoryName')}
              fullWidth
              required
              helperText="e.g. Mr Chandrashekhar Kumar"
            />
            <TextField
              label="Signatory's Father's Name"
              value={prepareForm.signatoryFatherName}
              onChange={handlePrepareFieldChange('signatoryFatherName')}
              fullWidth
              required
              helperText="e.g. Mr Ashesh Kumar"
            />
          </Stack>

          <TextField
            label="Signatory Aadhaar Number"
            value={prepareForm.signatoryAadhaar}
            onChange={handleAadhaarChange}
            fullWidth
            required
            helperText="e.g. 9493 9194 5701"
            inputProps={{ maxLength: 14 }}
          />

          <TextField
            label="Business Address"
            value={prepareForm.businessAddress}
            onChange={handlePrepareFieldChange('businessAddress')}
            fullWidth
            required
            multiline
            minRows={2}
            helperText={
              prepareForm.businessAddress.trim() && prepareForm.state.trim()
                ? `Will appear as: "The Franchisee will operate the franchised business from the following business address ${prepareForm.businessAddress.trim()} ${prepareForm.state.trim()}, maintaining uniform standard facilities..."`
                : 'Will appear as: "The Franchisee will operate the franchised business from the following business address Ward No -34 , Balua, Near Ugam Pandey College, Motihari - 845401 Bihar, maintaining uniform standard facilities..."'
            }
          />

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField
              label="State"
              value={prepareForm.state}
              onChange={handlePrepareFieldChange('state')}
              fullWidth
              required
              helperText="e.g. Bihar"
            />
            <TextField
              label="Territory / Locality"
              value={prepareForm.territory}
              onChange={handlePrepareFieldChange('territory')}
              fullWidth
              required
              helperText={
                prepareForm.territory.trim() && prepareForm.appointmentDate
                  ? `Will appear as: "2.1. EMEDIX appoints the Franchisee on ${formatDateForContract(prepareForm.appointmentDate)} in the ${prepareForm.territory.trim()}..."`
                  : 'Will appear as: "2.1. EMEDIX appoints the Franchisee on 28 December 2023 in the Ward No -34 , Balua locality..."'
              }
            />
          </Stack>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField
              label="Franchise Fee (in words)"
              placeholder="eight lakhs"
              value={prepareForm.franchiseFeeWords}
              onChange={handlePrepareFieldChange('franchiseFeeWords')}
              fullWidth
              required
              helperText="e.g. eight lakhs"
            />
            <TextField
              label="Franchise Fee (numeric)"
              placeholder="800000"
              value={prepareForm.franchiseFeeNumeric}
              onChange={handlePrepareFieldChange('franchiseFeeNumeric')}
              fullWidth
              required
              helperText="e.g. 800000 — digits only"
            />
          </Stack>

          {prepareForm.franchiseFeeWords.trim() && prepareForm.franchiseFeeNumeric.trim() && (
            <Typography variant="caption" sx={{ color: '#7a75b0', mt: -1 }}>
              Will appear as: INR {prepareForm.franchiseFeeWords.trim()} (Rs{' '}
              {(Number(prepareForm.franchiseFeeNumeric) || 0).toLocaleString('en-US')}/-)
            </Typography>
          )}

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField
              label="Renewal Fee"
              placeholder="Type digits only, e.g. 20000"
              value={prepareForm.renewalFee}
              onChange={handleRenewalFeeChange}
              fullWidth
              required
              helperText={
                prepareForm.renewalFee.trim()
                  ? `Will appear as: "5.3. Renewal fees of rupees twenty thousand + GST will be charged from the franchisee (${prepareForm.renewalFee.trim()})"`
                  : 'Type digits only — +GST is added automatically, e.g. Rs 20000+GST'
              }
            />
            <TextField
              label="Exclusivity Radius"
              placeholder="Type digits only, e.g. 1"
              value={prepareForm.exclusivityRadius}
              onChange={handleExclusivityRadiusChange}
              fullWidth
              required
              helperText={
                prepareForm.exclusivityRadius.trim()
                  ? `Will appear as: "6.10. The franchisor will not open any other Smart Pharmacy within ${prepareForm.exclusivityRadius.trim()} of the location..."`
                  : 'Type digits only — KM is added automatically, e.g. 1 KM'
              }
            />
          </Stack>

          <Divider sx={{ my: 1 }} />

          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#2b2560' }}>
            Payment Schedule
          </Typography>

          {prepareForm.payments.map((payment, index) => (
            <Stack
              key={index}
              direction={{ xs: 'column', sm: 'row' }}
              spacing={1.5}
              alignItems={{ sm: 'center' }}
              sx={{
                p: 1.5,
                borderRadius: '10px',
                border: '1px solid #ece9ff',
                backgroundColor: '#fbfaff',
              }}
            >
              <TextField
                label="Label"
                placeholder="Payment 1"
                value={payment.label}
                onChange={handlePaymentFieldChange(index, 'label')}
                size="small"
                sx={{ minWidth: 130 }}
              />
              <TextField
                label="Amount"
                placeholder="Digits only, e.g. 50000"
                helperText="INR is added automatically"
                value={payment.amount}
                onChange={handlePaymentAmountChange(index)}
                size="small"
                sx={{ minWidth: 140 }}
              />
              <DatePicker
                label="Due Date"
                format="DD/MM/YYYY"
                value={payment.dueDate}
                onChange={handlePaymentFieldChange(index, 'dueDate')}
                slotProps={{
                  textField: { size: 'small', sx: { minWidth: 160 } },
                  popper: { sx: { zIndex: 1500 } },
                }}
              />
              <DatePicker
                label="Paid Date (optional)"
                format="DD/MM/YYYY"
                value={payment.paidDate}
                onChange={handlePaymentFieldChange(index, 'paidDate')}
                slotProps={{
                  textField: { size: 'small', sx: { minWidth: 160 } },
                  popper: { sx: { zIndex: 1500 } },
                }}
              />
              <IconButton
                onClick={() => handleRemovePayment(index)}
                disabled={prepareForm.payments.length === 1}
                size="small"
              >
                <DeleteOutlineIcon fontSize="small" />
              </IconButton>
            </Stack>
          ))}

          <Button
            onClick={handleAddPayment}
            startIcon={<AddIcon />}
            sx={{ alignSelf: 'flex-start', textTransform: 'none', fontWeight: 600 }}
          >
            Add Payment
          </Button>
        </DialogContent>

        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleClosePrepareDialog} disabled={preparing || otpSending}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handlePrepareSubmit}
            disabled={preparing || otpSending}
            sx={{
              borderRadius: '10px',
              textTransform: 'none',
              fontWeight: 700,
              background: 'linear-gradient(135deg, #2bb3b1, #3aaed8)',
            }}
          >
            {(preparing || otpSending) ? (
              <CircularProgress size={18} sx={{ color: '#fff' }} />
            ) : (
              'Generate Contract'
            )}
          </Button>
        </DialogActions>
      </Dialog>

      <div id="contract-otp-recaptcha" />

      <Dialog open={otpDialogOpen} onClose={handleCloseOtpDialog} fullWidth maxWidth="xs">
        <DialogTitle sx={{ fontWeight: 700, color: '#2b2560' }}>
          Verify OTP
        </DialogTitle>

        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '20px !important' }}>
          {otpError && <Alert severity="error">{otpError}</Alert>}

          <Typography variant="body2" sx={{ color: '#5a5580' }}>
            An OTP has been sent to your registered mobile number ending in{' '}
            {admin?.mobile_no ? admin.mobile_no.slice(-4) : '----'}. Enter it below to generate the
            contract.
          </Typography>

          <TextField
            label="OTP"
            value={otpValue}
            onChange={(event) => setOtpValue(event.target.value)}
            fullWidth
            autoFocus
          />
        </DialogContent>

        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleCloseOtpDialog} disabled={otpVerifying}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleVerifyOtpAndGenerate}
            disabled={otpVerifying}
            sx={{
              borderRadius: '10px',
              textTransform: 'none',
              fontWeight: 700,
              background: 'linear-gradient(135deg, #2bb3b1, #3aaed8)',
            }}
          >
            {otpVerifying ? <CircularProgress size={18} sx={{ color: '#fff' }} /> : 'Verify & Generate'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(letterDialogRow)} onClose={handleCloseLetterDialog} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontWeight: 700, color: '#2b2560' }}>
          Prepare Letter — {letterDialogRow?.onboardingCase?.name}
        </DialogTitle>

        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '20px !important' }}>
          {letterError && <Alert severity="error">{letterError}</Alert>}

          <DatePicker
            label="Date"
            format="DD/MM/YYYY"
            value={letterForm.letterDate}
            onChange={handleLetterDateChange}
            slotProps={{
              textField: { fullWidth: true, required: true },
              popper: { sx: { zIndex: 1500 } },
            }}
          />

          <TextField
            label="Client's Name (English)"
            value={letterForm.clientNameEn}
            onChange={handleLetterFieldChange('clientNameEn')}
            fullWidth
            required
            helperText="e.g. Ravi Ranjan Kumar"
          />
          <TextField
            label="Client's Name (Hindi)"
            value={letterForm.clientNameHi}
            onChange={handleLetterFieldChange('clientNameHi')}
            fullWidth
            required
            helperText="e.g. रवि रंजन कुमार"
          />

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField
              label="City (English)"
              value={letterForm.cityEn}
              onChange={handleLetterFieldChange('cityEn')}
              fullWidth
              required
              helperText="e.g. Ekma"
            />
            <TextField
              label="District (English)"
              value={letterForm.districtEn}
              onChange={handleLetterFieldChange('districtEn')}
              fullWidth
              required
              helperText="e.g. Saran"
            />
          </Stack>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField
              label="City (Hindi)"
              value={letterForm.cityHi}
              onChange={handleLetterFieldChange('cityHi')}
              fullWidth
              required
              helperText="e.g. एकमा"
            />
            <TextField
              label="District (Hindi)"
              value={letterForm.districtHi}
              onChange={handleLetterFieldChange('districtHi')}
              fullWidth
              required
              helperText="e.g. सारण"
            />
          </Stack>
        </DialogContent>

        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleCloseLetterDialog} disabled={preparingLetter}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handlePrepareLetterSubmit}
            disabled={preparingLetter}
            sx={{
              borderRadius: '10px',
              textTransform: 'none',
              fontWeight: 700,
              background: 'linear-gradient(135deg, #2bb3b1, #3aaed8)',
            }}
          >
            {preparingLetter ? <CircularProgress size={18} sx={{ color: '#fff' }} /> : 'Generate Letter'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
    </LocalizationProvider>
  );
};

export default Contracts;

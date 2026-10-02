import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  FormControl,
  FormControlLabel,
  FormGroup,
  FormHelperText,
  FormLabel,
  IconButton,
  MenuItem,
  Paper,
  Radio,
  RadioGroup,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlineOutlined';
import PictureAsPdfOutlinedIcon from '@mui/icons-material/PictureAsPdfOutlined';

import {
  createEmployee,
  downloadJoiningForm,
  getDownloadErrorMessage,
  getEmployee,
  updateEmployee,
} from '../services/employees';

const MAX_ROWS = 5;

const DOCUMENTS_SUBMITTED = [
  { key: 'photographs', label: '2 Photographs' },
  { key: 'relieving_letter', label: 'Relieving Letter' },
  { key: 'experience_certificate', label: 'Experience Certificate' },
  { key: 'pay_slips', label: 'Pay Slips' },
  { key: 'pg_degree', label: 'PG Degree/Certificate' },
  { key: 'ug_degree', label: 'UG Degree/Certificate' },
  { key: 'marks_sheets', label: 'Marks Sheets' },
  { key: 'pan_card', label: 'PAN Card' },
  { key: 'address_proof_1', label: 'Address Proof 1' },
  { key: 'address_proof_2', label: 'Address Proof 2' },
  { key: 'driving_license', label: 'Driving License' },
  { key: 'other_docs', label: 'Other Docs' },
];

const SCALAR_KEYS = [
  'name', 'mobileNo', 'alternatePhone', 'email', 'bloodGroup', 'joiningDate', 'gender',
  'dateOfBirth', 'fatherName', 'motherName',
  'presentAddress', 'presentCity', 'presentDist', 'presentState', 'presentPin',
  'permanentAddress', 'permanentCity', 'permanentDist', 'permanentState', 'permanentPin',
  'emergencyContactName', 'emergencyContactNumber',
  'birthPlace', 'nationality', 'identificationMark', 'maritalStatus', 'spouseName',
  'height', 'weight',
  'bankName', 'bankAccountNumber', 'bankIfsc', 'bankBranchName', 'bankAccountHolderName',
  'bankAccountType',
  'identityProofType', 'identityProofNumber',
  'addressProof1Type', 'addressProof1Number',
  'addressProof2Type', 'addressProof2Number',
  'panNumber', 'otherDocsDescription', 'remarks',
];

const REQUIRED_FIELDS = {
  name: 'Name',
  mobileNo: 'Mobile number',
  gender: 'Gender',
  dateOfBirth: 'Date of birth',
  joiningDate: 'Joining date',
  fatherName: "Father's name",
  presentAddress: 'Present address',
  presentCity: 'City',
  presentDist: 'District',
  presentState: 'State',
  presentPin: 'PIN',
};

const PERMANENT_FROM_PRESENT = {
  permanentAddress: 'presentAddress',
  permanentCity: 'presentCity',
  permanentDist: 'presentDist',
  permanentState: 'presentState',
  permanentPin: 'presentPin',
};

const EMPTY_EDUCATION = { courseName: '', boardUniversity: '', passingYear: '', marks: '' };
const EMPTY_EMPLOYMENT = {
  employerName: '', city: '', designation: '', fromDate: '', toDate: '', duration: '',
};

const buildEmptyForm = () => ({
  ...Object.fromEntries(SCALAR_KEYS.map((key) => [key, ''])),
  confirmAccountNumber: '',
  education: [{ ...EMPTY_EDUCATION }],
  employment: [{ ...EMPTY_EMPLOYMENT }],
  documentsSubmitted: [],
});

const toForm = (employee) => {
  const form = buildEmptyForm();
  SCALAR_KEYS.forEach((key) => {
    form[key] = employee[key] ?? '';
  });
  form.joiningDate = String(employee.joiningDate ?? '').slice(0, 10);
  form.dateOfBirth = String(employee.dateOfBirth ?? '').slice(0, 10);
  form.confirmAccountNumber = employee.bankAccountNumber ?? '';
  form.education = employee.education?.length
    ? employee.education.map((row) => ({ ...EMPTY_EDUCATION, ...row }))
    : [{ ...EMPTY_EDUCATION }];
  form.employment = employee.employment?.length
    ? employee.employment.map((row) => ({ ...EMPTY_EMPLOYMENT, ...row }))
    : [{ ...EMPTY_EMPLOYMENT }];
  form.documentsSubmitted = employee.documentsSubmitted ?? [];
  return form;
};

const isSameAsPresent = (form) =>
  Boolean(form.presentAddress) &&
  Object.entries(PERMANENT_FROM_PRESENT).every(([permanent, present]) => form[permanent] === form[present]);

const compactRows = (rows) =>
  rows
    .map((row) =>
      Object.fromEntries(
        Object.entries(row)
          .map(([key, value]) => [key, String(value).trim()])
          .filter(([, value]) => value !== '')
      )
    )
    .filter((row) => Object.keys(row).length > 0);

const calculateAge = (dateOfBirth) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateOfBirth)) return null;
  const [year, month, day] = dateOfBirth.split('-').map(Number);
  const today = new Date();
  let age = today.getFullYear() - year;
  if (today.getMonth() + 1 < month || (today.getMonth() + 1 === month && today.getDate() < day)) {
    age -= 1;
  }
  return age >= 0 ? age : null;
};

const validate = (form, sameAsPresent) => {
  const errors = {};

  Object.entries(REQUIRED_FIELDS).forEach(([key, label]) => {
    if (!String(form[key]).trim()) errors[key] = `${label} is required`;
  });

  const pattern = (key, regex, message) => {
    const value = String(form[key]).trim();
    if (value && !regex.test(value)) errors[key] = message;
  };

  pattern('mobileNo', /^\d{10}$/, 'Must be a 10 digit number');
  pattern('alternatePhone', /^\d{10,15}$/, 'Must be 10 to 15 digits');
  pattern('emergencyContactNumber', /^\d{10,15}$/, 'Must be 10 to 15 digits');
  pattern('email', /^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Enter a valid email');
  pattern('presentPin', /^\d{6}$/, 'Must be a 6 digit PIN');
  if (!sameAsPresent) pattern('permanentPin', /^\d{6}$/, 'Must be a 6 digit PIN');
  pattern('panNumber', /^[A-Za-z]{5}\d{4}[A-Za-z]$/, 'Enter a valid PAN (e.g. ABCDE1234F)');
  pattern('bankIfsc', /^[A-Za-z]{4}0[A-Za-z0-9]{6}$/, 'Enter a valid IFSC code');
  pattern('bankAccountNumber', /^\d{9,18}$/, 'Must be 9 to 18 digits');

  if (
    String(form.bankAccountNumber).trim() &&
    form.bankAccountNumber.trim() !== form.confirmAccountNumber.trim()
  ) {
    errors.confirmAccountNumber = 'Account numbers do not match';
  }

  form.education.forEach((row, index) => {
    const hasData = Object.values(row).some((value) => String(value).trim());
    if (hasData && !row.courseName.trim()) {
      errors[`education.${index}.courseName`] = 'Course name is required';
    }
    if (row.passingYear.trim() && !/^\d{4}$/.test(row.passingYear.trim())) {
      errors[`education.${index}.passingYear`] = 'Use yyyy';
    }
  });

  form.employment.forEach((row, index) => {
    const hasData = Object.values(row).some((value) => String(value).trim());
    if (hasData && !row.employerName.trim()) {
      errors[`employment.${index}.employerName`] = 'Employer name is required';
    }
  });

  return errors;
};

const buildPayload = (form, sameAsPresent) => {
  const payload = {};

  SCALAR_KEYS.forEach((key) => {
    const source = sameAsPresent && PERMANENT_FROM_PRESENT[key] ? form[PERMANENT_FROM_PRESENT[key]] : form[key];
    const value = String(source ?? '').trim();
    payload[key] = value === '' ? null : value;
  });

  if (payload.panNumber) payload.panNumber = payload.panNumber.toUpperCase();
  if (payload.bankIfsc) payload.bankIfsc = payload.bankIfsc.toUpperCase();

  payload.education = compactRows(form.education);
  payload.employment = compactRows(form.employment);
  payload.documentsSubmitted = form.documentsSubmitted;
  if (!form.documentsSubmitted.includes('other_docs')) payload.otherDocsDescription = null;

  return payload;
};

const gridSx = {
  display: 'grid',
  gap: 2,
  gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' },
};

const fullRow = { gridColumn: '1 / -1' };

const Section = ({ title, children }) => (
  <Paper
    elevation={0}
    sx={{
      p: { xs: 2, sm: 3 },
      mb: 2.5,
      borderRadius: '16px',
      border: '1px solid #e3f4f1',
      boxShadow: '0 2px 12px rgba(15, 159, 154, 0.06)',
    }}
  >
    <Typography sx={{ fontWeight: 800, color: '#0f9f9a', mb: 2, fontSize: '1rem' }}>{title}</Typography>
    {children}
  </Paper>
);

const EmployeeForm = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const [form, setForm] = useState(buildEmptyForm);
  const [sameAsPresent, setSameAsPresent] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [success, setSuccess] = useState('');
  const [flashDismissed, setFlashDismissed] = useState(false);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (!isEdit) return undefined;

    let cancelled = false;

    (async () => {
      try {
        const employee = await getEmployee(id);
        if (!cancelled) {
          const loaded = toForm(employee);
          setForm(loaded);
          setSameAsPresent(isSameAsPresent(loaded));
        }
      } catch (err) {
        if (!cancelled) {
          setSubmitError(err.response?.data?.message || 'Failed to load employee.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [id, isEdit]);

  const handleDownload = async () => {
    setSubmitError('');
    setDownloading(true);
    try {
      await downloadJoiningForm(id, form.name);
    } catch (err) {
      setSubmitError((await getDownloadErrorMessage(err)) || 'Failed to generate the joining form. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  const setField = (name, value) => {
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => (prev[name] ? { ...prev, [name]: undefined } : prev));
  };

  const setRowField = (listName, index, name, value) => {
    setForm((prev) => ({
      ...prev,
      [listName]: prev[listName].map((row, rowIndex) => (rowIndex === index ? { ...row, [name]: value } : row)),
    }));
    setErrors((prev) => {
      const errorKey = `${listName}.${index}.${name}`;
      return prev[errorKey] ? { ...prev, [errorKey]: undefined } : prev;
    });
  };

  const addRow = (listName, emptyRow) => {
    setForm((prev) =>
      prev[listName].length >= MAX_ROWS ? prev : { ...prev, [listName]: [...prev[listName], { ...emptyRow }] }
    );
  };

  const removeRow = (listName, index) => {
    setForm((prev) => ({ ...prev, [listName]: prev[listName].filter((_, rowIndex) => rowIndex !== index) }));
  };

  const toggleDocument = (key) => {
    setForm((prev) => ({
      ...prev,
      documentsSubmitted: prev.documentsSubmitted.includes(key)
        ? prev.documentsSubmitted.filter((item) => item !== key)
        : [...prev.documentsSubmitted, key],
    }));
  };

  const textField = (name, label, extra = {}) => (
    <TextField
      size="small"
      fullWidth
      label={label}
      value={form[name]}
      onChange={(event) => setField(name, event.target.value)}
      error={Boolean(errors[name])}
      helperText={errors[name]}
      required={name in REQUIRED_FIELDS}
      {...extra}
    />
  );

  const permanentField = (name, label, extra = {}) =>
    textField(name, label, {
      required: false,
      disabled: sameAsPresent,
      ...(sameAsPresent ? { value: form[PERMANENT_FROM_PRESENT[name]] } : {}),
      ...extra,
    });

  const dateField = (name, label, extra = {}) =>
    textField(name, label, { type: 'date', slotProps: { inputLabel: { shrink: true } }, ...extra });

  const rowField = (listName, index, name, label, extra = {}) => {
    const errorKey = `${listName}.${index}.${name}`;
    return (
      <TextField
        size="small"
        fullWidth
        label={label}
        value={form[listName][index][name]}
        onChange={(event) => setRowField(listName, index, name, event.target.value)}
        error={Boolean(errors[errorKey])}
        helperText={errors[errorKey]}
        {...extra}
      />
    );
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitError('');
    setSuccess('');
    setFlashDismissed(true);

    const validationErrors = validate(form, sameAsPresent);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) {
      setSubmitError('Please fix the highlighted fields.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setSubmitting(true);
    try {
      const payload = buildPayload(form, sameAsPresent);
      if (isEdit) {
        await updateEmployee(id, payload);
        setSuccess('Employee updated.');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        const created = await createEmployee(payload);
        const message = 'Employee added. You can now download the joining form.';
        setSuccess(message);
        navigate(`/employees/${created.id}`, { replace: true, state: { saved: message } });
      }
    } catch (err) {
      const message = err.response?.data?.message;
      setSubmitError(
        Array.isArray(message) ? message.join(', ') : message || 'Failed to save employee. Please try again.'
      );
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress size={28} sx={{ color: '#2bb3b1' }} />
      </Box>
    );
  }

  const age = calculateAge(form.dateOfBirth);
  const banner = success || (flashDismissed ? '' : location.state?.saved || '');

  return (
    <Box component="form" onSubmit={handleSubmit} noValidate sx={{ maxWidth: 1100, mx: 'auto' }}>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 2, mb: 2 }}>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 700, color: '#0f9f9a', mb: 0.5 }}>
            {isEdit ? 'Edit Employee' : 'Add Employee'}
          </Typography>
          <Typography variant="body2">Employee joining form. Write NA where not applicable.</Typography>
        </Box>

        {isEdit && (
          <Button
            variant="outlined"
            startIcon={downloading ? <CircularProgress size={16} /> : <PictureAsPdfOutlinedIcon />}
            onClick={handleDownload}
            disabled={downloading || submitting}
            title="Generates the PDF from the saved details"
            sx={{ flexShrink: 0, whiteSpace: 'nowrap' }}
          >
            Download Joining Form
          </Button>
        )}
      </Box>

      {banner && (
        <Alert
          severity="success"
          sx={{ mb: 2 }}
          onClose={() => {
            setSuccess('');
            setFlashDismissed(true);
          }}
        >
          {banner}
        </Alert>
      )}

      {submitError && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setSubmitError('')}>
          {submitError}
        </Alert>
      )}

      <Section title="Employee Information">
        <Box sx={gridSx}>
          {textField('name', 'Name')}
          {textField('bloodGroup', 'Blood Group')}
          {dateField('joiningDate', 'Joining Date')}

          <FormControl error={Boolean(errors.gender)} required>
            <FormLabel sx={{ fontSize: '0.8rem' }}>Gender</FormLabel>
            <RadioGroup row value={form.gender} onChange={(event) => setField('gender', event.target.value)}>
              <FormControlLabel value="male" control={<Radio size="small" />} label="Male" />
              <FormControlLabel value="female" control={<Radio size="small" />} label="Female" />
            </RadioGroup>
            {errors.gender && <FormHelperText>{errors.gender}</FormHelperText>}
          </FormControl>
          {dateField('dateOfBirth', 'Date of Birth', {
            helperText: errors.dateOfBirth || (age !== null ? `Age: ${age}` : undefined),
          })}
          <Box />

          {textField('fatherName', "Father's Name")}
          {textField('motherName', "Mother's Name")}
          <Box />

          {textField('presentAddress', 'Present Address', { sx: fullRow })}
          {textField('presentCity', 'City')}
          {textField('presentDist', 'Dist')}
          {textField('presentState', 'State')}
          {textField('presentPin', 'PIN', { slotProps: { htmlInput: { maxLength: 6, inputMode: 'numeric' } } })}

          <FormControlLabel
            sx={fullRow}
            control={
              <Checkbox
                size="small"
                checked={sameAsPresent}
                onChange={(event) => setSameAsPresent(event.target.checked)}
              />
            }
            label="Permanent address is same as present address"
          />
          {permanentField('permanentAddress', 'Permanent Address', { sx: fullRow })}
          {permanentField('permanentCity', 'City')}
          {permanentField('permanentDist', 'Dist')}
          {permanentField('permanentState', 'State')}
          {permanentField('permanentPin', 'PIN', {
            slotProps: { htmlInput: { maxLength: 6, inputMode: 'numeric' } },
          })}

          {textField('mobileNo', 'Phone Number', {
            helperText: errors.mobileNo || 'Used as the employee login ID',
            slotProps: { htmlInput: { maxLength: 10, inputMode: 'numeric' } },
          })}
          {textField('alternatePhone', 'Alternate Phone Number')}
          {textField('email', 'Email', { type: 'email' })}

          {textField('emergencyContactName', 'Emergency Contact Person')}
          {textField('emergencyContactNumber', 'Emergency Number')}
        </Box>
      </Section>

      <Section title="Education Information (Starting from Highest Qualification)">
        <Stack spacing={2}>
          {form.education.map((row, index) => (
            <Box key={index} sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
              <Typography sx={{ width: 24, pt: 1, fontWeight: 700, color: '#5a8f8c' }}>{index + 1}</Typography>
              <Box
                sx={{
                  flex: 1,
                  display: 'grid',
                  gap: 2,
                  gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: '2fr 2fr 1fr 1fr' },
                }}
              >
                {rowField('education', index, 'courseName', 'Course Name')}
                {rowField('education', index, 'boardUniversity', 'Board/University')}
                {rowField('education', index, 'passingYear', 'Passing Year', {
                  slotProps: { htmlInput: { maxLength: 4, inputMode: 'numeric' } },
                })}
                {rowField('education', index, 'marks', 'Marks % or GPA')}
              </Box>
              <IconButton
                size="small"
                onClick={() => removeRow('education', index)}
                disabled={form.education.length === 1}
                aria-label="Remove education row"
              >
                <DeleteOutlineIcon fontSize="small" />
              </IconButton>
            </Box>
          ))}
          <Box>
            <Button
              size="small"
              startIcon={<AddIcon />}
              onClick={() => addRow('education', EMPTY_EDUCATION)}
              disabled={form.education.length >= MAX_ROWS}
            >
              Add Row
            </Button>
          </Box>
        </Stack>
      </Section>

      <Section title="Employment Details (Recent to Oldest)">
        <Stack spacing={2}>
          {form.employment.map((row, index) => (
            <Box key={index} sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
              <Typography sx={{ width: 24, pt: 1, fontWeight: 700, color: '#5a8f8c' }}>{index + 1}</Typography>
              <Box
                sx={{
                  flex: 1,
                  display: 'grid',
                  gap: 2,
                  gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' },
                }}
              >
                {rowField('employment', index, 'employerName', 'Name of the Employer')}
                {rowField('employment', index, 'city', 'City')}
                {rowField('employment', index, 'designation', 'Designation')}
                {rowField('employment', index, 'fromDate', 'From (mm/yy)', {
                  slotProps: { htmlInput: { maxLength: 5 } },
                })}
                {rowField('employment', index, 'toDate', 'To (mm/yy)', {
                  slotProps: { htmlInput: { maxLength: 5 } },
                })}
                {rowField('employment', index, 'duration', 'Years/Months')}
              </Box>
              <IconButton
                size="small"
                onClick={() => removeRow('employment', index)}
                disabled={form.employment.length === 1}
                aria-label="Remove employment row"
              >
                <DeleteOutlineIcon fontSize="small" />
              </IconButton>
            </Box>
          ))}
          <Box>
            <Button
              size="small"
              startIcon={<AddIcon />}
              onClick={() => addRow('employment', EMPTY_EMPLOYMENT)}
              disabled={form.employment.length >= MAX_ROWS}
            >
              Add Row
            </Button>
          </Box>
        </Stack>
      </Section>

      <Section title="Other Information">
        <Box sx={gridSx}>
          {textField('birthPlace', 'City and Country of Birth')}
          {textField('nationality', 'Nationality')}
          {textField('identificationMark', 'Identification Mark')}
          {textField('maritalStatus', 'Marital Status')}
          {textField('spouseName', 'Spouse Name')}
          <Box />
          {textField('height', 'Height (Ft/inch)')}
          {textField('weight', 'Weight (KG)')}
        </Box>
      </Section>

      <Section title="Bank Account Details">
        <Box sx={gridSx}>
          {textField('bankName', 'Name of the Bank', { sx: fullRow })}
          {textField('bankAccountNumber', 'Account Number', {
            slotProps: { htmlInput: { maxLength: 18, inputMode: 'numeric' } },
          })}
          <TextField
            size="small"
            fullWidth
            label="Confirm Account Number"
            value={form.confirmAccountNumber}
            onChange={(event) => setField('confirmAccountNumber', event.target.value)}
            error={Boolean(errors.confirmAccountNumber)}
            helperText={errors.confirmAccountNumber}
            slotProps={{ htmlInput: { maxLength: 18, inputMode: 'numeric' } }}
          />
          <Box />
          {textField('bankIfsc', 'IFSC', { slotProps: { htmlInput: { maxLength: 11 } } })}
          {textField('bankBranchName', 'Branch Name')}
          <Box />
          {textField('bankAccountHolderName', "Account Holder's Name")}
          {textField('bankAccountType', 'Account Type', {
            select: true,
            children: [
              <MenuItem key="" value="">
                <em>None</em>
              </MenuItem>,
              <MenuItem key="savings" value="savings">Savings</MenuItem>,
              <MenuItem key="current" value="current">Current</MenuItem>,
              <MenuItem key="other" value="other">Other</MenuItem>,
            ],
          })}
        </Box>
      </Section>

      <Section title="Documents Details">
        <Box sx={gridSx}>
          {textField('identityProofType', 'Identity Proof')}
          {textField('identityProofNumber', 'Document Number')}
          <Box />
          {textField('addressProof1Type', 'Address Proof 1')}
          {textField('addressProof1Number', 'Document Number')}
          <Box />
          {textField('addressProof2Type', 'Address Proof 2')}
          {textField('addressProof2Number', 'Document Number')}
          <Box />
          {textField('panNumber', 'PAN Card Number', { slotProps: { htmlInput: { maxLength: 10 } } })}
        </Box>
      </Section>

      <Section title="Documents Submitted (Self-Attested Copies)">
        <FormGroup sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' } }}>
          {DOCUMENTS_SUBMITTED.map((item) => (
            <FormControlLabel
              key={item.key}
              control={
                <Checkbox
                  size="small"
                  checked={form.documentsSubmitted.includes(item.key)}
                  onChange={() => toggleDocument(item.key)}
                />
              }
              label={item.label}
            />
          ))}
        </FormGroup>
        {form.documentsSubmitted.includes('other_docs') && (
          <Box sx={{ mt: 2, maxWidth: 420 }}>{textField('otherDocsDescription', 'Other Docs (specify)')}</Box>
        )}
      </Section>

      <Section title="Remarks">
        {textField('remarks', 'Remarks', { multiline: true, minRows: 3 })}
      </Section>

      <Stack direction="row" spacing={1.5} justifyContent="flex-end" sx={{ pb: 4 }}>
        <Button variant="outlined" onClick={() => navigate('/employees')} disabled={submitting}>
          Cancel
        </Button>
        <Button
          type="submit"
          variant="contained"
          disabled={submitting}
          sx={{ background: 'linear-gradient(135deg, #2bb3b1, #3aaed8)', color: '#ffffff', minWidth: 120 }}
        >
          {submitting ? <CircularProgress size={20} sx={{ color: '#ffffff' }} /> : isEdit ? 'Save Changes' : 'Add Employee'}
        </Button>
      </Stack>
    </Box>
  );
};

export default EmployeeForm;

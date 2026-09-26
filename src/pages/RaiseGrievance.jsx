import React, { useContext, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Checkbox,
  Chip,
  Collapse,
  Fade,
  FormControlLabel,
  Grow,
  MenuItem,
  Paper,
  Skeleton,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutlined';
import AssignmentIcon from '@mui/icons-material/Assignment';
import DescriptionIcon from '@mui/icons-material/Description';
import ForwardToInboxIcon from '@mui/icons-material/ForwardToInbox';
import { AuthContext } from '../context/AuthContext';
import { getGrievanceTopics, createGrievance } from '../services/grievances';

const DESCRIPTION_MAX_LENGTH = 4000;

function generateIdempotencyKey() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `grv-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

const SectionLabel = ({ index, icon, title }) => (
  <Stack direction="row" spacing={1.25} alignItems="center" sx={{ mb: 1.5 }}>
    <Avatar
      sx={{
        width: 28,
        height: 28,
        fontSize: '0.8rem',
        fontWeight: 800,
        backgroundColor: '#e0f7f5',
        color: '#0c7f7b',
      }}
    >
      {index}
    </Avatar>
    {icon}
    <Typography sx={{ fontSize: '0.92rem', fontWeight: 800, color: '#113b4a' }}>{title}</Typography>
  </Stack>
);

const RaiseGrievance = () => {
  const navigate = useNavigate();
  const { storeUser } = useContext(AuthContext);

  const [topics, setTopics] = useState([]);
  const [topicsError, setTopicsError] = useState('');
  const [topicsLoading, setTopicsLoading] = useState(true);

  const [topicId, setTopicId] = useState('');
  const [subtopicId, setSubtopicId] = useState('');
  const [description, setDescription] = useState('');
  const [ccGm, setCcGm] = useState(false);
  const [ccCoo, setCcCoo] = useState(false);
  const [ccCeo, setCcCeo] = useState(false);

  const [fieldErrors, setFieldErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [idempotencyKey, setIdempotencyKey] = useState(generateIdempotencyKey);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setTopicsLoading(true);
      setTopicsError('');
      try {
        const data = await getGrievanceTopics();
        if (!cancelled) setTopics(data ?? []);
      } catch (err) {
        if (!cancelled) {
          setTopicsError(err.response?.data?.message || 'Failed to load complaint topics.');
        }
      } finally {
        if (!cancelled) setTopicsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const selectedTopic = useMemo(
    () => topics.find((topic) => topic.id === topicId) ?? null,
    [topics, topicId]
  );

  const handleTopicChange = (event) => {
    setTopicId(event.target.value);
    setSubtopicId('');
    setFieldErrors((prev) => ({ ...prev, topicId: undefined, subtopicId: undefined }));
  };

  const handleSubtopicChange = (event) => {
    setSubtopicId(event.target.value);
    setFieldErrors((prev) => ({ ...prev, subtopicId: undefined }));
  };

  const validate = () => {
    const errors = {};
    if (!topicId) errors.topicId = 'Please select a complaint topic.';
    if (!subtopicId) errors.subtopicId = 'Please select a subtopic.';
    if (!description.trim()) {
      errors.description = 'Please describe the issue.';
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitError('');

    if (!validate()) return;

    setSubmitting(true);
    try {
      const created = await createGrievance({
        idempotencyKey,
        topicId,
        subtopicId,
        description: description.trim(),
        ccGm,
        ccCoo,
        ccCeo,
      });
      setResult(created);
    } catch (err) {
      setSubmitError(err.response?.data?.message || 'Failed to submit your grievance. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRaiseAnother = () => {
    setResult(null);
    setTopicId('');
    setSubtopicId('');
    setDescription('');
    setCcGm(false);
    setCcCoo(false);
    setCcCeo(false);
    setFieldErrors({});
    setSubmitError('');
    setIdempotencyKey(generateIdempotencyKey());
  };

  if (result) {
    return (
      <Box
        sx={{
          minHeight: 'calc(100vh - 120px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          px: { xs: 2, sm: 3 },
          py: { xs: 4, sm: 6 },
        }}
      >
        <Grow in timeout={500}>
          <Paper
            elevation={0}
            sx={{
              p: { xs: 3, sm: 5 },
              borderRadius: 5,
              border: '1px solid #a8d8d3',
              textAlign: 'center',
              maxWidth: 500,
              width: '100%',
              backgroundColor: '#ffffff',
              boxShadow: '0 20px 48px rgba(15, 159, 154, 0.14)',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <Box
              sx={{
                position: 'absolute',
                top: -70,
                left: '50%',
                transform: 'translateX(-50%)',
                width: 220,
                height: 220,
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(15,159,154,0.12) 0%, rgba(15,159,154,0) 70%)',
              }}
            />

            <Avatar
              sx={{
                width: 76,
                height: 76,
                mx: 'auto',
                mb: 2,
                backgroundColor: '#0f9f9a',
                boxShadow: '0 12px 24px rgba(15, 159, 154, 0.35)',
                position: 'relative',
              }}
            >
              <CheckCircleOutlineIcon sx={{ fontSize: 42 }} />
            </Avatar>

            <Typography sx={{ fontSize: '1.05rem', color: '#4b6470', mb: 0.5, position: 'relative' }}>
              Your grievance has been submitted
            </Typography>

            <Typography
              sx={{
                fontSize: { xs: '1.6rem', sm: '2rem' },
                fontWeight: 900,
                color: '#007f7a',
                mb: 2,
                letterSpacing: 0.5,
                position: 'relative',
              }}
            >
              {result.ticketNumber}
            </Typography>

            <Chip
              label={
                result.assignedFrmAdminId
                  ? 'Assigned to your Franchise Relationship Manager'
                  : 'Pending assignment — Operations has been notified'
              }
              sx={{
                mb: 3,
                py: 2,
                px: 0.5,
                backgroundColor: result.assignedFrmAdminId ? '#e6f7f5' : '#fff4e5',
                color: result.assignedFrmAdminId ? '#007f7a' : '#946200',
                fontWeight: 700,
                position: 'relative',
              }}
            />

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} justifyContent="center" sx={{ position: 'relative' }}>
              <Button
                variant="contained"
                onClick={() => navigate(`/grievances/${result.id}`)}
                sx={{ backgroundColor: '#0f9f9a', '&:hover': { backgroundColor: '#0c827e' } }}
              >
                View Ticket
              </Button>
              <Button variant="outlined" onClick={handleRaiseAnother} sx={{ borderColor: '#0f9f9a', color: '#0f9f9a' }}>
                Raise Another
              </Button>
              <Button variant="text" onClick={() => navigate('/home')} sx={{ color: '#5a6b73' }}>
                Back to Home
              </Button>
            </Stack>
          </Paper>
        </Grow>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: 'calc(100vh - 120px)',
        display: 'flex',
        justifyContent: 'center',
        px: { xs: 2, sm: 3 },
        py: { xs: 4, sm: 6 },
      }}
    >
      <Fade in timeout={400}>
        <Paper
          elevation={0}
          component="form"
          onSubmit={handleSubmit}
          sx={{
            borderRadius: 5,
            maxWidth: 680,
            width: '100%',
            backgroundColor: '#ffffff',
            boxShadow: '0 20px 48px rgba(15, 159, 154, 0.1)',
            overflow: 'hidden',
          }}
        >
          <Box
            sx={{
              p: { xs: 3, sm: 4 },
              background: 'linear-gradient(135deg, #0f9f9a 0%, #0c7f7b 100%)',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <Box
              sx={{
                position: 'absolute',
                top: -40,
                right: -40,
                width: 150,
                height: 150,
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.08)',
              }}
            />
            <Stack direction="row" spacing={1.5} alignItems="center" sx={{ position: 'relative' }}>
              <Avatar sx={{ backgroundColor: 'rgba(255,255,255,0.18)', width: 44, height: 44 }}>
                <SupportAgentIcon sx={{ color: '#ffffff' }} />
              </Avatar>
              <Box>
                <Typography sx={{ fontSize: { xs: '1.15rem', sm: '1.35rem' }, fontWeight: 900, color: '#ffffff' }}>
                  Raise a Grievance
                </Typography>
                <Typography sx={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.85)' }}>
                  Your Franchise Relationship Manager will be notified as soon as you submit.
                </Typography>
              </Box>
            </Stack>
          </Box>

          <Box sx={{ p: { xs: 3, sm: 4 } }}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 0.5 }}>
              <TextField
                label="Requester"
                value={storeUser?.person_name ?? ''}
                fullWidth
                size="small"
                slotProps={{ input: { readOnly: true } }}
                sx={{
                  '& .MuiInputLabel-root': { color: '#5a6b73' },
                  '& .MuiOutlinedInput-input': { color: '#113b4a', fontWeight: 600, WebkitTextFillColor: '#113b4a' },
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: '#a8d8d3' },
                  backgroundColor: '#fafffe',
                  borderRadius: 1,
                }}
              />
              <TextField
                label="Store"
                value={storeUser?.store_name ?? ''}
                fullWidth
                size="small"
                slotProps={{ input: { readOnly: true } }}
                sx={{
                  '& .MuiInputLabel-root': { color: '#5a6b73' },
                  '& .MuiOutlinedInput-input': { color: '#113b4a', fontWeight: 600, WebkitTextFillColor: '#113b4a' },
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: '#a8d8d3' },
                  backgroundColor: '#fafffe',
                  borderRadius: 1,
                }}
              />
            </Stack>

            <Typography sx={{ fontSize: '0.75rem', color: '#5a6b73', mb: 3 }}>
              Populated from your signed-in account.
            </Typography>

            <Collapse in={!!submitError}>
              <Alert severity="error" sx={{ mb: 2.5, borderRadius: 2 }} onClose={() => setSubmitError('')}>
                {submitError}
              </Alert>
            </Collapse>

            <Collapse in={!!topicsError}>
              <Alert severity="error" sx={{ mb: 2.5, borderRadius: 2 }}>
                {topicsError}
              </Alert>
            </Collapse>

            <Box sx={{ mb: 3.5 }}>
              <SectionLabel index={1} icon={<AssignmentIcon sx={{ color: '#0f9f9a', fontSize: 20 }} />} title="Classify your issue" />
              {topicsLoading ? (
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                  <Skeleton variant="rounded" height={56} sx={{ flex: 1, borderRadius: 2 }} />
                  <Skeleton variant="rounded" height={56} sx={{ flex: 1, borderRadius: 2 }} />
                </Stack>
              ) : (
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                  <TextField
                    select
                    label="Complaint Topic"
                    value={topicId}
                    onChange={handleTopicChange}
                    error={!!fieldErrors.topicId}
                    helperText={fieldErrors.topicId || ' '}
                    fullWidth
                    required
                  >
                    {topics.map((topic) => (
                      <MenuItem key={topic.id} value={topic.id}>
                        {topic.name}
                      </MenuItem>
                    ))}
                  </TextField>

                  <TextField
                    select
                    label="Subtopic"
                    value={subtopicId}
                    onChange={handleSubtopicChange}
                    error={!!fieldErrors.subtopicId}
                    helperText={fieldErrors.subtopicId || ' '}
                    disabled={!selectedTopic}
                    fullWidth
                    required
                  >
                    {(selectedTopic?.subtopics ?? []).map((subtopic) => (
                      <MenuItem key={subtopic.id} value={subtopic.id}>
                        {subtopic.name}
                      </MenuItem>
                    ))}
                  </TextField>
                </Stack>
              )}
            </Box>

            <Box sx={{ mb: 3.5 }}>
              <SectionLabel index={2} icon={<DescriptionIcon sx={{ color: '#0f9f9a', fontSize: 20 }} />} title="Explain what happened" />
              <TextField
                value={description}
                onChange={(event) => {
                  setDescription(event.target.value.slice(0, DESCRIPTION_MAX_LENGTH));
                  setFieldErrors((prev) => ({ ...prev, description: undefined }));
                }}
                error={!!fieldErrors.description}
                helperText={
                  fieldErrors.description ||
                  `${description.trim().length}/${DESCRIPTION_MAX_LENGTH} characters — please describe the issue clearly.`
                }
                multiline
                minRows={5}
                fullWidth
                required
                placeholder="What went wrong? When did it start? What have you already tried?"
              />
            </Box>

            <Box sx={{ mb: 3.5 }}>
              <SectionLabel index={3} icon={<ForwardToInboxIcon sx={{ color: '#0f9f9a', fontSize: 20 }} />} title="Copy management (optional)" />
              <Typography sx={{ fontSize: '0.78rem', color: '#5a6b73', mb: 1.25 }}>
                Selected recipients receive an email copy. This does not change who owns your ticket.
              </Typography>
              <Stack
                direction="row"
                flexWrap="wrap"
                sx={{
                  p: 1,
                  borderRadius: 2,
                  border: '1px solid #a8d8d3',
                  backgroundColor: '#fafffe',
                }}
              >
                <FormControlLabel
                  control={<Checkbox checked={ccGm} onChange={(e) => setCcGm(e.target.checked)} />}
                  label="CC General Manager"
                />
                <FormControlLabel
                  control={<Checkbox checked={ccCoo} onChange={(e) => setCcCoo(e.target.checked)} />}
                  label="CC Chief Operating Officer"
                />
                <FormControlLabel
                  control={<Checkbox checked={ccCeo} onChange={(e) => setCcCeo(e.target.checked)} />}
                  label="CC Chief Executive Officer"
                />
              </Stack>
            </Box>

            <Button
              type="submit"
              variant="contained"
              size="large"
              fullWidth
              disabled={submitting || topicsLoading}
              sx={{
                background: 'linear-gradient(135deg, #0f9f9a 0%, #0c7f7b 100%)',
                '&:hover': { background: 'linear-gradient(135deg, #0c8f8a 0%, #0a6b68 100%)' },
                py: 1.3,
                fontSize: '0.95rem',
                boxShadow: '0 10px 24px rgba(15, 159, 154, 0.3)',
              }}
            >
              {submitting ? 'Submitting…' : 'Submit Grievance'}
            </Button>
          </Box>
        </Paper>
      </Fade>
    </Box>
  );
};

export default RaiseGrievance;

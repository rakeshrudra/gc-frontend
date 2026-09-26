import React, { useContext, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Fade,
  FormControlLabel,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import LockIcon from '@mui/icons-material/Lock';
import ForumIcon from '@mui/icons-material/Forum';
import HistoryIcon from '@mui/icons-material/History';
import SendIcon from '@mui/icons-material/Send';
import { AuthContext } from '../context/AuthContext';
import {
  getGrievance,
  getGrievanceComments,
  getGrievanceHistory,
  addGrievanceComment,
  updateGrievanceStatus,
} from '../services/grievances';
import { getGrievanceStatusColor, getGrievanceStatusLabel } from '../utils/grievanceStatus';

const MANAGER_ROLES = ['emedix_admin', 'emedix_superadmin'];

const NEXT_STATUS_OPTIONS = {
  new: ['assigned'],
  assigned: ['acknowledged'],
  acknowledged: ['in_progress', 'waiting_for_requester', 'escalated'],
  in_progress: ['waiting_for_requester', 'escalated', 'resolved'],
  waiting_for_requester: ['in_progress', 'escalated', 'resolved'],
  escalated: ['in_progress', 'resolved'],
  resolved: ['closed', 'reopened'],
  closed: ['reopened'],
  reopened: ['in_progress'],
};

const JOURNEY_STEPS = ['new', 'assigned', 'acknowledged', 'in_progress', 'resolved', 'closed'];

function initialsOf(name) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase() || name[0].toUpperCase();
}

const StatusJourney = ({ status }) => {
  const activeIndex = JOURNEY_STEPS.indexOf(status);
  const isSideTrack = activeIndex === -1;

  return (
    <Stack direction="row" alignItems="center" sx={{ overflowX: 'auto', py: 0.5 }}>
      {JOURNEY_STEPS.map((step, index) => {
        const reached = !isSideTrack && index <= activeIndex;
        const isCurrent = !isSideTrack && index === activeIndex;
        return (
          <React.Fragment key={step}>
            {index > 0 && (
              <Box
                sx={{
                  height: 2,
                  flex: 1,
                  minWidth: 24,
                  backgroundColor: reached ? '#0f9f9a' : '#e0e0e0',
                  transition: 'background-color 0.3s ease',
                }}
              />
            )}
            <Stack alignItems="center" spacing={0.5} sx={{ minWidth: 68 }}>
              <Box
                sx={{
                  width: isCurrent ? 16 : 12,
                  height: isCurrent ? 16 : 12,
                  borderRadius: '50%',
                  backgroundColor: reached ? '#0f9f9a' : '#e0e0e0',
                  border: isCurrent ? '3px solid #a8d8d3' : 'none',
                  boxShadow: isCurrent ? '0 0 0 4px rgba(15,159,154,0.15)' : 'none',
                  transition: 'all 0.3s ease',
                }}
              />
              <Typography
                sx={{
                  fontSize: '0.68rem',
                  fontWeight: isCurrent ? 800 : 600,
                  color: reached ? '#0c7f7b' : '#5a6b73',
                  whiteSpace: 'nowrap',
                }}
              >
                {getGrievanceStatusLabel(step)}
              </Typography>
            </Stack>
          </React.Fragment>
        );
      })}
    </Stack>
  );
};

const GrievanceDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { role, adminRole } = useContext(AuthContext);
  const isStaff = role === 'admin';
  const isManager = MANAGER_ROLES.includes(adminRole);

  const [grievance, setGrievance] = useState(null);
  const [comments, setComments] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [message, setMessage] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [posting, setPosting] = useState(false);
  const [postError, setPostError] = useState('');

  const [statusDialogTarget, setStatusDialogTarget] = useState('');
  const [statusNote, setStatusNote] = useState('');
  const [statusSubmitting, setStatusSubmitting] = useState(false);
  const [statusError, setStatusError] = useState('');

  const [refreshKey, setRefreshKey] = useState(0);
  const refresh = () => setRefreshKey((prev) => prev + 1);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError('');
      try {
        const [grievanceData, commentsData, historyData] = await Promise.all([
          getGrievance(id),
          getGrievanceComments(id),
          getGrievanceHistory(id),
        ]);
        if (!cancelled) {
          setGrievance(grievanceData);
          setComments(commentsData ?? []);
          setHistory(historyData ?? []);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.response?.data?.message || 'Failed to load this grievance.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id, refreshKey]);

  const handlePostComment = async (event) => {
    event.preventDefault();
    if (!message.trim()) return;

    setPosting(true);
    setPostError('');
    try {
      await addGrievanceComment(id, { message: message.trim(), isInternal: isStaff && isInternal });
      setMessage('');
      setIsInternal(false);
      refresh();
    } catch (err) {
      setPostError(err.response?.data?.message || 'Failed to post your message.');
    } finally {
      setPosting(false);
    }
  };

  const openStatusDialog = (target) => {
    setStatusDialogTarget(target);
    setStatusNote('');
    setStatusError('');
  };

  const handleStatusSubmit = async () => {
    if ((statusDialogTarget === 'resolved' || statusDialogTarget === 'reopened') && statusNote.trim().length < 10) {
      setStatusError(
        statusDialogTarget === 'resolved'
          ? 'Please provide a resolution note of at least 10 characters.'
          : 'Please provide a reason of at least 10 characters.'
      );
      return;
    }

    setStatusSubmitting(true);
    setStatusError('');
    try {
      await updateGrievanceStatus(id, {
        status: statusDialogTarget,
        resolutionNote: statusDialogTarget === 'resolved' ? statusNote.trim() : undefined,
        reason: statusDialogTarget === 'reopened' ? statusNote.trim() : undefined,
      });
      setStatusDialogTarget('');
      refresh();
    } catch (err) {
      setStatusError(err.response?.data?.message || 'Failed to update status.');
    } finally {
      setStatusSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
        <CircularProgress sx={{ color: '#0f9f9a' }} />
      </Box>
    );
  }

  if (error || !grievance) {
    return (
      <Box sx={{ py: 3, maxWidth: 900, mx: 'auto' }}>
        <Alert severity="error" sx={{ borderRadius: 2 }}>{error || 'Grievance not found.'}</Alert>
      </Box>
    );
  }

  const color = getGrievanceStatusColor(grievance.status);
  const nextStatuses = NEXT_STATUS_OPTIONS[grievance.status] ?? [];
  const visibleNextStatuses = nextStatuses.filter((next) => {
    if (!isStaff) {
      return grievance.status === 'resolved' && (next === 'closed' || next === 'reopened');
    }
    return true;
  });

  return (
    <Fade in timeout={350}>
      <Box sx={{ py: 3, maxWidth: 900, mx: 'auto' }}>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/grievances')} sx={{ mb: 2, color: '#0f9f9a', fontWeight: 700 }}>
          Back to Grievances
        </Button>

        <Paper
          elevation={0}
          sx={{
            p: { xs: 2.5, sm: 3.5 },
            borderRadius: 4,
            border: '1px solid #a8d8d3',
            mb: 2.5,
            backgroundColor: '#ffffff',
            boxShadow: '0 12px 32px rgba(15, 159, 154, 0.08)',
          }}
        >
          <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'center' }} spacing={1}>
            <Typography sx={{ fontSize: '1.4rem', fontWeight: 900, color: '#113b4a' }}>
              {grievance.ticketNumber}
            </Typography>
            <Chip
              label={getGrievanceStatusLabel(grievance.status)}
              sx={{ backgroundColor: color.bg, color: color.fg, fontWeight: 800, px: 0.5 }}
            />
          </Stack>

          <Typography sx={{ fontSize: '0.8rem', color: '#5a6b73', mt: 0.5 }}>
            Submitted {new Date(grievance.createdAt).toLocaleString()}
          </Typography>

          <Box sx={{ my: 2.5 }}>
            <StatusJourney status={grievance.status} />
          </Box>

          <Divider sx={{ mb: 2 }} />

          <Typography sx={{ fontSize: '0.85rem', fontWeight: 800, color: '#113b4a', mb: 0.5 }}>
            Description
          </Typography>
          <Typography sx={{ fontSize: '0.9rem', color: '#455a64', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
            {grievance.description}
          </Typography>

          {grievance.resolutionNote && (
            <Box sx={{ mt: 2.5, p: 2, borderRadius: 2, backgroundColor: '#f1f8f2', border: '1px solid #d4ecd7' }}>
              <Typography sx={{ fontSize: '0.82rem', fontWeight: 800, color: '#2e7d32', mb: 0.5 }}>
                Resolution Note
              </Typography>
              <Typography sx={{ fontSize: '0.88rem', color: '#37474f', whiteSpace: 'pre-wrap' }}>
                {grievance.resolutionNote}
              </Typography>
            </Box>
          )}

          {visibleNextStatuses.length > 0 && (
            <>
              <Divider sx={{ my: 2 }} />
              <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap>
                {visibleNextStatuses.map((next) => (
                  <Button
                    key={next}
                    variant="outlined"
                    size="small"
                    onClick={() => openStatusDialog(next)}
                    sx={{
                      borderColor: '#0f9f9a',
                      color: '#0f9f9a',
                      fontWeight: 700,
                      borderRadius: 2,
                      '&:hover': { backgroundColor: '#e6f7f5', borderColor: '#0f9f9a' },
                    }}
                  >
                    Mark {getGrievanceStatusLabel(next)}
                  </Button>
                ))}
              </Stack>
            </>
          )}
        </Paper>

        <Paper
          elevation={0}
          sx={{ p: { xs: 2.5, sm: 3.5 }, borderRadius: 4, border: '1px solid #a8d8d3', backgroundColor: '#ffffff' }}
        >
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2.5 }}>
            <ForumIcon sx={{ color: '#0f9f9a', fontSize: 22 }} />
            <Typography sx={{ fontSize: '1.02rem', fontWeight: 800, color: '#113b4a' }}>
              Conversation
            </Typography>
          </Stack>

          <Stack spacing={2} sx={{ mb: 2.5 }}>
            {comments.length === 0 && (
              <Typography sx={{ color: '#5a6b73', fontSize: '0.85rem' }}>No messages yet.</Typography>
            )}
            {comments.map((comment) => (
              <Stack key={comment.id} direction="row" spacing={1.5} alignItems="flex-start">
                <Avatar
                  sx={{
                    width: 34,
                    height: 34,
                    fontSize: '0.75rem',
                    fontWeight: 800,
                    backgroundColor: comment.isInternal ? '#ffe0a3' : '#d1f0ed',
                    color: comment.isInternal ? '#946200' : '#0c7f7b',
                    mt: 0.25,
                  }}
                >
                  {initialsOf(comment.authorName)}
                </Avatar>
                <Box
                  sx={{
                    flex: 1,
                    p: 1.5,
                    borderRadius: 2.5,
                    backgroundColor: comment.isInternal ? '#fffaf0' : '#f8fffe',
                    border: `1px solid ${comment.isInternal ? '#ffe0a3' : '#a8d8d3'}`,
                  }}
                >
                  <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap">
                    <Stack direction="row" spacing={0.75} alignItems="center">
                      <Typography sx={{ fontWeight: 800, fontSize: '0.85rem', color: '#113b4a' }}>
                        {comment.authorName}
                      </Typography>
                      {comment.isInternal && (
                        <Chip
                          icon={<LockIcon sx={{ fontSize: '0.7rem !important' }} />}
                          label="Internal"
                          size="small"
                          sx={{ height: 20, backgroundColor: '#ffe0a3', color: '#946200', fontWeight: 700 }}
                        />
                      )}
                    </Stack>
                    <Typography sx={{ fontSize: '0.72rem', color: '#5a6b73' }}>
                      {new Date(comment.createdAt).toLocaleString()}
                    </Typography>
                  </Stack>
                  <Typography sx={{ fontSize: '0.88rem', color: '#37474f', mt: 0.5, whiteSpace: 'pre-wrap' }}>
                    {comment.message}
                  </Typography>
                </Box>
              </Stack>
            ))}
          </Stack>

          {grievance.status !== 'closed' && (
            <Box
              component="form"
              onSubmit={handlePostComment}
              sx={{ p: 1.5, borderRadius: 3, backgroundColor: '#fafffe', border: '1px solid #d3e6e3' }}
            >
              {postError && (
                <Alert severity="error" sx={{ mb: 1.5, borderRadius: 2 }} onClose={() => setPostError('')}>
                  {postError}
                </Alert>
              )}
              <TextField
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Write a message…"
                multiline
                minRows={2}
                fullWidth
                sx={{ mb: 1, '& .MuiOutlinedInput-root': { backgroundColor: '#ffffff', borderRadius: 2 } }}
              />
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                {isStaff ? (
                  <FormControlLabel
                    control={<Checkbox checked={isInternal} onChange={(e) => setIsInternal(e.target.checked)} size="small" />}
                    label={<Typography sx={{ fontSize: '0.82rem' }}>Internal note (staff only)</Typography>}
                  />
                ) : (
                  <span />
                )}
                <Button
                  type="submit"
                  variant="contained"
                  endIcon={<SendIcon sx={{ fontSize: '1rem !important' }} />}
                  disabled={posting || !message.trim()}
                  sx={{
                    backgroundColor: '#0f9f9a',
                    '&:hover': { backgroundColor: '#0c827e' },
                    borderRadius: 2,
                  }}
                >
                  {posting ? 'Sending…' : 'Send'}
                </Button>
              </Stack>
            </Box>
          )}
        </Paper>

        <Paper
          elevation={0}
          sx={{ p: { xs: 2.5, sm: 3.5 }, borderRadius: 4, border: '1px solid #a8d8d3', mt: 2.5, backgroundColor: '#ffffff' }}
        >
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
            <HistoryIcon sx={{ color: '#0f9f9a', fontSize: 22 }} />
            <Typography sx={{ fontSize: '1.02rem', fontWeight: 800, color: '#113b4a' }}>
              Activity History
            </Typography>
          </Stack>

          <Stack spacing={0}>
            {history.length === 0 && (
              <Typography sx={{ color: '#5a6b73', fontSize: '0.85rem' }}>No activity recorded yet.</Typography>
            )}
            {history.map((event, index) => (
              <Stack key={event.id} direction="row" spacing={1.5}>
                <Stack alignItems="center" sx={{ pt: 0.5 }}>
                  <Box sx={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#0f9f9a', flexShrink: 0 }} />
                  {index < history.length - 1 && (
                    <Box sx={{ width: 2, flex: 1, backgroundColor: '#a8d8d3', minHeight: 24, my: 0.25 }} />
                  )}
                </Stack>
                <Box sx={{ pb: 2, flex: 1 }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="baseline" spacing={2} flexWrap="wrap">
                    <Typography sx={{ fontSize: '0.85rem', color: '#37474f' }}>
                      <strong>{event.actorName}</strong>{' '}
                      {event.eventType === 'created' && 'raised this ticket'}
                      {event.eventType === 'assigned' && `assigned it to FRM #${event.newValue}`}
                      {event.eventType === 'reassigned' &&
                        `reassigned it from FRM #${event.oldValue ?? '—'} to FRM #${event.newValue}${
                          isManager && event.reason ? ` — ${event.reason}` : ''
                        }`}
                      {event.eventType === 'status_changed' &&
                        `changed status from ${getGrievanceStatusLabel(event.oldValue)} to ${getGrievanceStatusLabel(event.newValue)}`}
                    </Typography>
                    <Typography sx={{ fontSize: '0.72rem', color: '#5a6b73', whiteSpace: 'nowrap' }}>
                      {new Date(event.createdAt).toLocaleString()}
                    </Typography>
                  </Stack>
                </Box>
              </Stack>
            ))}
          </Stack>
        </Paper>

        <Dialog
          open={!!statusDialogTarget}
          onClose={() => setStatusDialogTarget('')}
          fullWidth
          maxWidth="sm"
          PaperProps={{ sx: { borderRadius: 4 } }}
        >
          <DialogTitle sx={{ fontWeight: 800, color: '#113b4a' }}>
            Mark as {getGrievanceStatusLabel(statusDialogTarget)}
          </DialogTitle>
          <DialogContent>
            {statusError && (
              <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
                {statusError}
              </Alert>
            )}
            {(statusDialogTarget === 'resolved' || statusDialogTarget === 'reopened') && (
              <TextField
                label={statusDialogTarget === 'resolved' ? 'Resolution note' : 'Reason for reopening'}
                value={statusNote}
                onChange={(e) => setStatusNote(e.target.value)}
                multiline
                minRows={3}
                fullWidth
                autoFocus
                required
              />
            )}
            {statusDialogTarget !== 'resolved' && statusDialogTarget !== 'reopened' && (
              <Typography sx={{ color: '#4b6470', fontSize: '0.9rem' }}>
                Confirm you want to move this ticket to {getGrievanceStatusLabel(statusDialogTarget)}.
              </Typography>
            )}
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2.5 }}>
            <Button onClick={() => setStatusDialogTarget('')} sx={{ color: '#5a6b73' }}>
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleStatusSubmit}
              disabled={statusSubmitting}
              sx={{ backgroundColor: '#0f9f9a', '&:hover': { backgroundColor: '#0c827e' }, borderRadius: 2 }}
            >
              Confirm
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Fade>
  );
};

export default GrievanceDetail;

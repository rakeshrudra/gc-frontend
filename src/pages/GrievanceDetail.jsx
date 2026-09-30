import React, { useContext, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Alert,
  Autocomplete,
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
import FlagIcon from '@mui/icons-material/Flag';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import AutorenewIcon from '@mui/icons-material/Autorenew';
import { AuthContext } from '../context/AuthContext';
import {
  getGrievance,
  getGrievanceComments,
  getGrievanceHistory,
  addGrievanceComment,
  updateGrievanceStatus,
  reassignGrievance,
  getAssignees,
} from '../services/grievances';
import { getGrievanceStatusColor, getGrievanceStatusLabel } from '../utils/grievanceStatus';

const MANAGER_ROLES = ['emedix_admin', 'emedix_superadmin'];

const NEXT_STATUS_OPTIONS = {
  assigned: ['acknowledged'],
  acknowledged: ['in_progress', 'waiting_for_requester', 'escalated'],
  in_progress: ['waiting_for_requester', 'escalated', 'resolved'],
  waiting_for_requester: ['in_progress', 'escalated', 'resolved'],
  escalated: ['in_progress', 'resolved'],
  resolved: ['closed', 'reopened'],
  closed: ['reopened'],
  reopened: ['in_progress'],
};

function historyEventVisual(event) {
  if (event.eventType === 'created') {
    return { icon: <FlagIcon sx={{ fontSize: 16 }} />, bg: '#0f9f9a', fg: '#ffffff' };
  }
  if (event.eventType === 'assigned') {
    return { icon: <PersonAddIcon sx={{ fontSize: 16 }} />, bg: '#1565c0', fg: '#ffffff' };
  }
  if (event.eventType === 'reassigned') {
    return { icon: <SwapHorizIcon sx={{ fontSize: 16 }} />, bg: '#8e24aa', fg: '#ffffff' };
  }
  if (event.eventType === 'status_changed') {
    const color = getGrievanceStatusColor(event.newValue);
    return { icon: <AutorenewIcon sx={{ fontSize: 16 }} />, bg: color.fg, fg: '#ffffff' };
  }
  return { icon: <FlagIcon sx={{ fontSize: 16 }} />, bg: '#5a6b73', fg: '#ffffff' };
}

const JOURNEY_STEPS = ['new', 'assigned', 'acknowledged', 'in_progress', 'resolved', 'closed'];

const SIDE_TRACK_PARENT = {
  waiting_for_requester: 'in_progress',
  escalated: 'in_progress',
  reopened: 'resolved',
};

function initialsOf(name) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase() || name[0].toUpperCase();
}

const StatusJourney = ({ status }) => {
  const sideTrackParent = SIDE_TRACK_PARENT[status];
  const isSideTrack = Boolean(sideTrackParent);
  const mainStatus = isSideTrack ? sideTrackParent : status;
  const activeIndex = JOURNEY_STEPS.indexOf(mainStatus);
  const stepCount = JOURNEY_STEPS.length;
  const firstDotPercent = 50 / stepCount;
  const lastDotPercent = 100 - firstDotPercent;
  const activeDotPercent = activeIndex === -1 ? firstDotPercent : ((activeIndex + 0.5) / stepCount) * 100;
  const sideTrackColor = getGrievanceStatusColor(status);

  return (
    <Box sx={{ overflowX: 'auto', py: 0.5 }}>
      <Box sx={{ position: 'relative', minWidth: stepCount * 84, pt: isSideTrack ? 4 : 0 }}>
        {isSideTrack && (
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: `${activeDotPercent}%`,
              transform: 'translateX(-50%)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            <Chip
              size="small"
              label={getGrievanceStatusLabel(status)}
              sx={{
                backgroundColor: sideTrackColor.bg,
                color: sideTrackColor.fg,
                fontWeight: 800,
                height: 22,
                mb: '2px',
              }}
            />
            <Box sx={{ width: 2, height: 12, backgroundColor: sideTrackColor.fg, opacity: 0.5 }} />
          </Box>
        )}

        <Stack direction="row" sx={{ position: 'relative' }}>
          <Box
            sx={{
              position: 'absolute',
              top: 10,
              left: `${firstDotPercent}%`,
              right: `${100 - lastDotPercent}%`,
              height: 3,
              borderRadius: 3,
              backgroundColor: '#e0e0e0',
              transform: 'translateY(-50%)',
            }}
          />
          <Box
            sx={{
              position: 'absolute',
              top: 10,
              left: `${firstDotPercent}%`,
              width: `${activeDotPercent - firstDotPercent}%`,
              height: 3,
              borderRadius: 3,
              backgroundColor: '#0f9f9a',
              transform: 'translateY(-50%)',
              transition: 'width 0.3s ease',
            }}
          />

          {JOURNEY_STEPS.map((step, index) => {
            const reached = index <= activeIndex;
            const isCurrent = !isSideTrack && index === activeIndex;
            return (
              <Box
                key={step}
                sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, minWidth: 0 }}
              >
                <Box sx={{ height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                  <Box
                    sx={{
                      width: isCurrent ? 16 : 14,
                      height: isCurrent ? 16 : 14,
                      borderRadius: '50%',
                      backgroundColor: reached ? '#0f9f9a' : '#e0e0e0',
                      boxShadow: isCurrent ? '0 0 0 6px rgba(15,159,154,0.3)' : 'none',
                      transition: 'all 0.3s ease',
                      flexShrink: 0,
                      zIndex: 1,
                    }}
                  />
                </Box>
                <Typography
                  sx={{
                    fontSize: '0.72rem',
                    fontWeight: isCurrent ? 800 : 600,
                    color: reached ? '#0c7f7b' : '#5a6b73',
                    whiteSpace: 'nowrap',
                    mt: 1,
                    textAlign: 'center',
                  }}
                >
                  {getGrievanceStatusLabel(step)}
                </Typography>
              </Box>
            );
          })}
        </Stack>
      </Box>
    </Box>
  );
};

const GrievanceDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { role, adminRole, admin } = useContext(AuthContext);
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

  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [assignTarget, setAssignTarget] = useState(null);
  const [assignReason, setAssignReason] = useState('');
  const [assignSubmitting, setAssignSubmitting] = useState(false);
  const [assignError, setAssignError] = useState('');
  const [assignees, setAssignees] = useState([]);
  const [assigneesLoading, setAssigneesLoading] = useState(false);
  const [assignNotice, setAssignNotice] = useState([]);

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

  const openAssignDialog = async () => {
    setAssignTarget(null);
    setAssignReason('');
    setAssignError('');
    setAssignNotice([]);
    setAssignDialogOpen(true);

    setAssigneesLoading(true);
    try {
      const data = await getAssignees();
      setAssignees((data ?? []).filter((person) => person.id !== grievance?.assignedFrmAdminId));
    } catch {
      setAssignError('Failed to load the list of people.');
    } finally {
      setAssigneesLoading(false);
    }
  };

  const finishAssign = () => {
    setAssignDialogOpen(false);
    setAssignNotice([]);
    if (isManager || assignTarget?.id === admin?.id) {
      refresh();
    } else {
      navigate('/grievances');
    }
  };

  const handleAssignSubmit = async () => {
    if (!assignTarget) {
      setAssignError('Please select who to assign this ticket to.');
      return;
    }

    const isReassignment = Boolean(grievance?.assignedFrmAdminId);
    if (isReassignment && assignReason.trim().length < 10) {
      setAssignError('Please provide a reason of at least 10 characters for reassigning.');
      return;
    }

    setAssignSubmitting(true);
    setAssignError('');
    try {
      const result = await reassignGrievance(id, {
        newFrmAdminId: assignTarget.id,
        reason: assignReason.trim() || undefined,
      });
      if (result?.emailWarnings?.length) {
        setAssignNotice(result.emailWarnings);
      } else {
        finishAssign();
      }
    } catch (err) {
      setAssignError(err.response?.data?.message || 'Failed to assign this ticket.');
    } finally {
      setAssignSubmitting(false);
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
      <Box sx={{ maxWidth: 900, mx: 'auto' }}>
        <Alert severity="error" sx={{ borderRadius: 2 }}>{error || 'Grievance not found.'}</Alert>
      </Box>
    );
  }

  const color = getGrievanceStatusColor(grievance.status);
  const nextStatuses = NEXT_STATUS_OPTIONS[grievance.status] ?? [];
  const visibleNextStatuses = nextStatuses.filter((next) => {
    const isCloseOrReopen = next === 'closed' || next === 'reopened';
    if (isCloseOrReopen) {
      return !isStaff;
    }
    return isStaff;
  });
  const canAssign = isStaff;
  const isReassignment = Boolean(grievance.assignedFrmAdminId);

  return (
    <Fade in timeout={350}>
      <Box sx={{ maxWidth: 900, mx: 'auto' }}>
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
            {grievance.storeName && (
              <Typography component="span" sx={{ fontSize: '0.8rem', color: '#0c7f7b', fontWeight: 800 }}>
                {grievance.storeName}
              </Typography>
            )}
            {grievance.storeName && ' · '}
            Submitted {new Date(grievance.createdAt).toLocaleString()}
          </Typography>

          <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 1.5 }}>
            <Typography sx={{ fontSize: '0.8rem', color: '#5a6b73', fontWeight: 700 }}>
              Assigned to:
            </Typography>
            {grievance.assignedFrmName ? (
              <Chip
                size="small"
                label={grievance.assignedFrmName}
                sx={{ backgroundColor: '#e0f7f5', color: '#0c7f7b', fontWeight: 700 }}
              />
            ) : (
              <Chip
                size="small"
                label="Unassigned"
                sx={{ backgroundColor: '#fff4e5', color: '#946200', fontWeight: 700 }}
              />
            )}
          </Stack>

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

          {(visibleNextStatuses.length > 0 || canAssign) && (
            <>
              <Divider sx={{ my: 2 }} />
              <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap>
                {canAssign && (
                  <Button
                    variant="contained"
                    size="small"
                    onClick={openAssignDialog}
                    sx={{
                      backgroundColor: '#0f9f9a',
                      fontWeight: 700,
                      borderRadius: 2,
                      '&:hover': { backgroundColor: '#0c827e' },
                    }}
                  >
                    {isReassignment ? 'Reassign' : 'Assign'}
                  </Button>
                )}
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
            {history.map((event, index) => {
              const visual = historyEventVisual(event);
              return (
                <Stack key={event.id} direction="row" spacing={1.75}>
                  <Box sx={{ width: 22, display: 'flex', flexDirection: 'column', alignItems: 'center', pt: 0.25 }}>
                    <Box
                      sx={{
                        width: 22,
                        height: 22,
                        borderRadius: '50%',
                        backgroundColor: visual.bg,
                        color: visual.fg,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: `0 3px 8px ${visual.bg}55`,
                        flexShrink: 0,
                        '& svg': { fontSize: 13 },
                      }}
                    >
                      {visual.icon}
                    </Box>
                    {index < history.length - 1 && (
                      <Box sx={{ width: 2, flex: 1, backgroundColor: '#d3e6e3', minHeight: 28, mt: 0.5 }} />
                    )}
                  </Box>
                  <Box
                    sx={{
                      pb: 2.5,
                      flex: 1,
                      minWidth: 0,
                      mt: 0.25,
                    }}
                  >
                    <Typography sx={{ fontSize: '0.85rem', color: '#37474f', lineHeight: 1.5 }}>
                      <strong>{event.actorName}</strong>{' '}
                      {event.eventType === 'created' && 'raised this ticket'}
                      {event.eventType === 'assigned' &&
                        `assigned it to ${event.newValueName ?? `FRM #${event.newValue}`}`}
                      {event.eventType === 'reassigned' &&
                        `reassigned it from ${event.oldValueName ?? `FRM #${event.oldValue ?? '—'}`} to ${
                          event.newValueName ?? `FRM #${event.newValue}`
                        }${isManager && event.reason ? ` — ${event.reason}` : ''}`}
                      {event.eventType === 'status_changed' &&
                        `changed status from ${getGrievanceStatusLabel(event.oldValue)} to ${getGrievanceStatusLabel(event.newValue)}`}
                    </Typography>
                    <Typography sx={{ fontSize: '0.72rem', color: '#5a6b73', mt: 0.25 }}>
                      {new Date(event.createdAt).toLocaleString()}
                    </Typography>
                  </Box>
                </Stack>
              );
            })}
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

        <Dialog
          open={assignDialogOpen}
          onClose={assignNotice.length ? finishAssign : () => setAssignDialogOpen(false)}
          fullWidth
          maxWidth="sm"
          PaperProps={{ sx: { borderRadius: 4 } }}
        >
          <DialogTitle sx={{ fontWeight: 800, color: '#113b4a' }}>
            {assignNotice.length ? 'Ticket Assigned' : isReassignment ? 'Reassign Ticket' : 'Assign Ticket'}
          </DialogTitle>
          <DialogContent>
            {assignNotice.length > 0 && (
              <Alert severity="warning" sx={{ borderRadius: 2 }}>
                <Typography sx={{ fontWeight: 700, mb: 0.5 }}>
                  The ticket was assigned, but an email could not be sent.
                </Typography>
                {assignNotice.map((notice) => (
                  <Typography key={notice} sx={{ fontSize: '0.9rem' }}>{notice}</Typography>
                ))}
                <Typography sx={{ fontSize: '0.9rem', mt: 0.5 }}>
                  Please inform them directly or add their email in the admin records.
                </Typography>
              </Alert>
            )}
            {!assignNotice.length && assignError && (
              <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
                {assignError}
              </Alert>
            )}
            {!assignNotice.length && (
            <Stack spacing={2}>
              <Autocomplete
                options={assignees}
                value={assignTarget}
                onChange={(_e, value) => setAssignTarget(value)}
                getOptionLabel={(option) =>
                  option.username ? `${option.username} (${option.role})${option.hasEmail ? '' : ' - no email'}` : ''
                }
                isOptionEqualToValue={(option, value) => option.id === value.id}
                loading={assigneesLoading}
                renderInput={(params) => (
                  <TextField {...params} label="Assign to" autoFocus required helperText={
                      assignTarget && !assignTarget.hasEmail
                        ? 'This person has no email on file and will not be notified by email'
                        : 'Any Emedix team member can be selected'
                    }
                  />
                )}
              />
              <TextField
                label={isReassignment ? 'Reason' : 'Note (optional)'}
                value={assignReason}
                onChange={(e) => setAssignReason(e.target.value)}
                multiline
                minRows={isReassignment ? 3 : 2}
                fullWidth
                required={isReassignment}
              />
            </Stack>
            )}
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2.5 }}>
            {assignNotice.length ? (
              <Button
                variant="contained"
                onClick={finishAssign}
                sx={{ backgroundColor: '#0f9f9a', '&:hover': { backgroundColor: '#0c827e' }, borderRadius: 2 }}
              >
                OK
              </Button>
            ) : (
              <>
                <Button onClick={() => setAssignDialogOpen(false)} sx={{ color: '#5a6b73' }}>
                  Cancel
                </Button>
                <Button
                  variant="contained"
                  onClick={handleAssignSubmit}
                  disabled={assignSubmitting}
                  sx={{ backgroundColor: '#0f9f9a', '&:hover': { backgroundColor: '#0c827e' }, borderRadius: 2 }}
                >
                  Confirm
                </Button>
              </>
            )}
          </DialogActions>
        </Dialog>
      </Box>
    </Fade>
  );
};

export default GrievanceDetail;

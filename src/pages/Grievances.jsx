import React, { useContext, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Fade,
  InputAdornment,
  MenuItem,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  Tabs,
  Tab,
  TextField,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';
import InboxIcon from '@mui/icons-material/Inbox';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { AuthContext } from '../context/AuthContext';
import { getGrievances } from '../services/grievances';
import { GRIEVANCE_STATUSES, getGrievanceStatusColor, getGrievanceStatusLabel } from '../utils/grievanceStatus';

const MANAGER_ROLES = ['emedix_admin', 'emedix_superadmin'];

const Grievances = () => {
  const navigate = useNavigate();
  const { role, adminRole } = useContext(AuthContext);
  const isManager = MANAGER_ROLES.includes(adminRole);

  const scopeTabs = useMemo(() => {
    if (role !== 'store' && isManager) {
      return [
        { value: 'all', label: 'All Tickets' },
        { value: 'unassigned', label: 'Unassigned' },
        { value: 'assigned', label: 'Assigned to Me' },
      ];
    }
    return [{ value: 'mine', label: 'My Tickets' }];
  }, [role, isManager]);

  const [scope, setScope] = useState(scopeTabs[0]?.value ?? 'mine');
  const [status, setStatus] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage] = useState(25);

  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const timeout = setTimeout(() => setSearch(searchInput), 400);
    return () => clearTimeout(timeout);
  }, [searchInput]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError('');
      try {
        const result = await getGrievances({ scope, page: page + 1, limit: rowsPerPage, status, search });
        if (!cancelled) {
          setRows(result?.data ?? []);
          setTotal(result?.total ?? 0);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.response?.data?.message || 'Failed to load grievances.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [scope, status, search, page, rowsPerPage]);

  return (
    <Fade in timeout={350}>
      <Box sx={{ maxWidth: 1300, mx: 'auto' }}>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          flexWrap="wrap"
          sx={{ mb: 3, rowGap: 1.5, columnGap: 3 }}
        >
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Avatar sx={{ backgroundColor: '#e0f7f5', color: '#0c7f7b', width: 44, height: 44 }}>
              <SupportAgentIcon />
            </Avatar>
            <Box>
              <Typography sx={{ fontSize: '1.4rem', fontWeight: 900, color: '#113b4a' }}>Grievances</Typography>
              <Typography sx={{ fontSize: '0.82rem', color: '#5a6b73' }}>
                {total} ticket{total === 1 ? '' : 's'} in this view
              </Typography>
            </Box>
          </Stack>

          {role === 'store' && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => navigate('/grievances/new')}
              sx={{
                background: 'linear-gradient(135deg, #0f9f9a 0%, #0c7f7b 100%)',
                '&:hover': { background: 'linear-gradient(135deg, #0c8f8a 0%, #0a6b68 100%)' },
                fontWeight: 700,
                borderRadius: 2,
              }}
            >
              Raise Ticket
            </Button>
          )}
        </Stack>

        <Paper
          elevation={0}
          sx={{ borderRadius: 4, border: '1px solid #a8d8d3', overflow: 'hidden', backgroundColor: '#ffffff' }}
        >
          <Tabs
            value={scope}
            onChange={(_e, value) => {
              setScope(value);
              setPage(0);
            }}
            sx={{
              borderBottom: '1px solid #d3e6e3',
              px: 2,
              minHeight: 52,
              '& .MuiTab-root': { minHeight: 52, fontWeight: 700, textTransform: 'none' },
              '& .Mui-selected': { color: '#0c7f7b !important' },
              '& .MuiTabs-indicator': { backgroundColor: '#0f9f9a', height: 3, borderRadius: 3 },
            }}
          >
            {scopeTabs.map((tab) => (
              <Tab key={tab.value} value={tab.value} label={tab.label} />
            ))}
          </Tabs>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ p: 2, backgroundColor: '#fbfffe' }}>
            <TextField
              size="small"
              placeholder="Search by ticket number"
              value={searchInput}
              onChange={(e) => {
                setSearchInput(e.target.value);
                setPage(0);
              }}
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
            <TextField
              select
              size="small"
              label="Status"
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(0);
              }}
              sx={{ minWidth: 200, '& .MuiOutlinedInput-root': { borderRadius: 2, backgroundColor: '#ffffff' } }}
            >
              <MenuItem value="">All statuses</MenuItem>
              {GRIEVANCE_STATUSES.map((value) => (
                <MenuItem key={value} value={value}>
                  {getGrievanceStatusLabel(value)}
                </MenuItem>
              ))}
            </TextField>
          </Stack>

          {error && (
            <Alert severity="error" sx={{ mx: 2, mb: 2, borderRadius: 2 }}>
              {error}
            </Alert>
          )}

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ '& th': { backgroundColor: '#f4fbfa', fontWeight: 800, color: '#0c7f7b', borderBottom: 'none' } }}>
                  <TableCell>Ticket No.</TableCell>
                  {role !== 'store' && <TableCell>Store</TableCell>}
                  <TableCell>Topic / Subtopic</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Assigned To</TableCell>
                  <TableCell>Created</TableCell>
                  <TableCell align="right" />
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} sx={{ py: 6, border: 'none' }}>
                      <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                        <CircularProgress size={28} sx={{ color: '#0f9f9a' }} />
                      </Box>
                    </TableCell>
                  </TableRow>
                ) : rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} sx={{ py: 7, border: 'none' }}>
                      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                        <InboxIcon sx={{ fontSize: 48, color: '#8a9997' }} />
                        <Typography sx={{ color: '#113b4a', fontWeight: 700, fontSize: '0.95rem' }}>
                          No grievances found
                        </Typography>
                        <Typography sx={{ color: '#5a6b73', fontSize: '0.85rem' }}>
                          There is nothing to show in this view yet.
                        </Typography>
                      </Box>
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((row) => {
                    const color = getGrievanceStatusColor(row.status);
                    return (
                      <TableRow
                        key={row.id}
                        hover
                        onClick={() => navigate(`/grievances/${row.id}`)}
                        sx={{
                          cursor: 'pointer',
                          transition: 'background-color 0.15s ease',
                          '&:hover': { backgroundColor: '#f4fbfa' },
                          '& td': { borderBottom: '1px solid #d3e6e3' },
                        }}
                      >
                        <TableCell sx={{ fontWeight: 700, color: '#113b4a' }}>{row.ticketNumber}</TableCell>
                        {role !== 'store' && (
                          <TableCell sx={{ color: '#37474f' }}>{row.storeName ?? `Store #${row.storeId}`}</TableCell>
                        )}
                        <TableCell sx={{ color: '#37474f' }}>
                          <Typography sx={{ fontSize: '0.85rem', fontWeight: 600, color: '#113b4a' }}>
                            {row.topicName ?? `Topic #${row.topicId}`}
                          </Typography>
                          <Typography sx={{ fontSize: '0.78rem', color: '#5a6b73' }}>
                            {row.subtopicName ?? `Subtopic #${row.subtopicId}`}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            size="small"
                            label={getGrievanceStatusLabel(row.status)}
                            sx={{ backgroundColor: color.bg, color: color.fg, fontWeight: 700 }}
                          />
                        </TableCell>
                        <TableCell sx={{ color: '#37474f' }}>
                          {row.assignedFrmName ?? (
                            <Typography component="span" sx={{ fontSize: '0.8rem', color: '#946200', fontWeight: 700 }}>
                              Unassigned
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell sx={{ color: '#5a6b73' }}>{new Date(row.createdAt).toLocaleString()}</TableCell>
                        <TableCell align="right">
                          <ChevronRightIcon sx={{ color: '#5a6b73' }} />
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>

          <TablePagination
            component="div"
            count={total}
            page={page}
            onPageChange={(_e, newPage) => setPage(newPage)}
            rowsPerPage={rowsPerPage}
            rowsPerPageOptions={[rowsPerPage]}
          />
        </Paper>
      </Box>
    </Fade>
  );
};

export default Grievances;

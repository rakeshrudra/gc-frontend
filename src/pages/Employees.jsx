import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Collapse,
  IconButton,
  InputAdornment,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import PictureAsPdfOutlinedIcon from '@mui/icons-material/PictureAsPdfOutlined';
import SearchIcon from '@mui/icons-material/Search';

import { downloadJoiningForm, getDownloadErrorMessage, getEmployees } from '../services/employees';

const formatDate = (value) => {
  if (!value) return '';
  const [year, month, day] = String(value).slice(0, 10).split('-');
  return `${day}/${month}/${year}`;
};

const columns = [
  { key: 'name', label: 'Name' },
  { key: 'mobileNo', label: 'Mobile' },
  { key: 'email', label: 'Email' },
  { key: 'joiningDate', label: 'Joining Date' },
  { key: 'presentCity', label: 'City' },
  { key: 'actions', label: '' },
];

const Employees = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(location.state?.saved || '');
  const [page, setPage] = useState(0);
  const [rowsPerPage] = useState(25);
  const [totalRows, setTotalRows] = useState(0);
  const [downloadingId, setDownloadingId] = useState(null);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      setError('');

      try {
        const result = await getEmployees({ page: page + 1, limit: rowsPerPage, search });
        if (!cancelled) {
          setRows(Array.isArray(result?.data) ? result.data : []);
          setTotalRows(result?.total ?? 0);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.response?.data?.message || 'Failed to load employees.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [page, rowsPerPage, search]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setPage(0);
      setSearch(searchInput.trim());
    }, 400);

    return () => clearTimeout(timeoutId);
  }, [searchInput]);

  const handleDownload = async (event, row) => {
    event.stopPropagation();
    setError('');
    setDownloadingId(row.id);
    try {
      await downloadJoiningForm(row.id, row.name);
    } catch (err) {
      setError((await getDownloadErrorMessage(err)) || 'Failed to generate the joining form.');
    } finally {
      setDownloadingId(null);
    }
  };

  const renderCell = (row, key) => {
    if (key === 'actions') {
      return (
        <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end' }}>
        <Tooltip title="Download joining form">
          <span>
            <IconButton
              size="small"
              onClick={(event) => handleDownload(event, row)}
              disabled={downloadingId === row.id}
            >
              {downloadingId === row.id ? (
                <CircularProgress size={18} />
              ) : (
                <PictureAsPdfOutlinedIcon fontSize="small" sx={{ color: '#0f9f9a' }} />
              )}
            </IconButton>
          </span>
        </Tooltip>
        <Tooltip title="View / edit">
          <IconButton size="small" onClick={() => navigate(`/employees/${row.id}`)}>
            <EditOutlinedIcon fontSize="small" sx={{ color: '#0f9f9a' }} />
          </IconButton>
        </Tooltip>
        </Box>
      );
    }

    const value = key === 'joiningDate' ? formatDate(row[key]) : row[key];
    return (
      value || (
        <Box component="span" sx={{ color: '#b0bec5' }}>
          —
        </Box>
      )
    );
  };

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
          Employees
        </Typography>

        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate('/employees/new')}
          sx={{
            borderRadius: '8px',
            fontWeight: 700,
            background: 'linear-gradient(135deg, #2bb3b1, #3aaed8)',
            color: '#ffffff',
          }}
        >
          Add Employee
        </Button>
      </Box>

      <Collapse in={!!success}>
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      </Collapse>

      <Collapse in={!!error}>
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      </Collapse>

      <Box sx={{ mb: 2 }}>
        <TextField
          size="small"
          placeholder="Search by name, mobile or email"
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
        <Table sx={{ minWidth: 700 }}>
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
                  hover
                  sx={{
                    cursor: 'pointer',
                    '& td': {
                      borderBottom: index === rows.length - 1 ? 'none' : '1px solid #eef7f6',
                    },
                  }}
                  onClick={() => navigate(`/employees/${row.id}`)}
                >
                  {columns.map((column) => (
                    <TableCell
                      key={column.key}
                      sx={{
                        px: { xs: 1.5, sm: 2 },
                        py: 1.5,
                        fontSize: '0.85rem',
                        color: '#2c3e50',
                        overflowWrap: 'anywhere',
                      }}
                    >
                      {renderCell(row, column.key)}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} align="center" sx={{ py: 5, border: 0 }}>
                  <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                    No employees yet.
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
        onPageChange={(event, newPage) => setPage(newPage)}
        rowsPerPage={rowsPerPage}
        rowsPerPageOptions={[rowsPerPage]}
      />
    </Box>
  );
};

export default Employees;

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';

import {
  Box,
  Paper,
  Typography,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
  Select,
  MenuItem,
  Alert,
  Button,
  TextField,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Tooltip,
} from '@mui/material';

import PrintIcon from '@mui/icons-material/Print';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';

import {
  getProcessedOrders,
  updateProcessedOrderStatus,
  createDispatchLabel,
  getDispatchLabel,
  createTransportDetails,
} from '../services/processedOrders';

const statuses = [
  'RECEIVED',
  'TO_GM_ROAD',
  'READY_TO_DISPATCH',
  'DISPATCHED',
  'DELIVERED',
  'PARTIALLY_COMPLETED',
  'UNABLE_TO_FULFILL',
];

const getStatusColor = (status) => {
  switch (status) {
    case 'RECEIVED':
      return '#ff9800';
    case 'TO_GM_ROAD':
      return '#1976d2';
    case 'READY_TO_DISPATCH':
      return '#7b1fa2';
    case 'DISPATCHED':
      return '#009688';
    case 'DELIVERED':
      return '#2e7d32';
    case 'PARTIALLY_COMPLETED':
      return '#ef6c00';
    case 'UNABLE_TO_FULFILL':
      return '#d32f2f';
    default:
      return '#607d8b';
  }
};

const todayDate = () => {
  const date = new Date();

  return date
    .toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
    .replace(/ /g, '-');
};

const ProcessedOrders = () => {
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [error, setError] = useState('');
  const [sort, setSort] = useState('newest');
  const [storeSearch, setStoreSearch] = useState('');

  const [openDispatchModal, setOpenDispatchModal] = useState(false);
  const [openTransportModal, setOpenTransportModal] = useState(false);

  const [selectedOrder, setSelectedOrder] = useState(null);

  const [dispatchForm, setDispatchForm] = useState({
    numberOfBoxes: '',
    bigName: '',
    toStore: '',
    dispatchDate: todayDate(),
  });

  const [transportForm, setTransportForm] = useState({
    busNo: '',
    mobileNumber: '',
    pickupLocation: '',
  });

  const loadOrders = async () => {
    try {
      setError('');
      const data = await getProcessedOrders(sort, storeSearch);
      setOrders(data || []);
    } catch (err) {
      setError('Failed to load processed orders');
    }
  };

  useEffect(() => {
    loadOrders();
  }, [sort, storeSearch]);

  const toggleSort = () => {
    setSort((prev) => (prev === 'newest' ? 'oldest' : 'newest'));
  };

  const openDispatchPopup = (order) => {
    setSelectedOrder(order);

    setDispatchForm({
      numberOfBoxes: '',
      bigName: '',
      toStore: order.selectedStoreName || '',
      dispatchDate: todayDate(),
    });

    setOpenDispatchModal(true);
  };

  const openTransportPopup = (order) => {
    setSelectedOrder(order);

    setTransportForm({
      busNo: '',
      mobileNumber: '',
      pickupLocation: '',
    });

    setOpenTransportModal(true);
  };

  const handleStatusChange = async (order, status) => {
    try {
      setError('');

      if (status === 'READY_TO_DISPATCH') {
        openDispatchPopup(order);
        return;
      }

      await updateProcessedOrderStatus(order.id, status);

      setOrders((prev) =>
        prev.map((item) =>
          item.id === order.id ? { ...item, status } : item
        )
      );

      if (status === 'DISPATCHED') {
        openTransportPopup(order);
      }
    } catch (err) {
      const message =
        err.response?.data?.message || 'Failed to update status';

      setError(message);
    }
  };

  const handlePrintClick = async (order) => {
    try {
      setError('');

      await getDispatchLabel(order.id);

      window.open(`/dispatch-labels/${order.id}`, '_blank');
    } catch (err) {
      openDispatchPopup(order);
    }
  };

  const handleTransportClick = async (order) => {
    try {
      setError('');

      await updateProcessedOrderStatus(order.id, 'DISPATCHED');

      setOrders((prev) =>
        prev.map((item) =>
          item.id === order.id
            ? { ...item, status: 'DISPATCHED' }
            : item
        )
      );

      openTransportPopup(order);
    } catch (err) {
      const message =
        err.response?.data?.message ||
        'Failed to update status to dispatched';

      setError(message);
    }
  };

  const handleDispatchInputChange = (e) => {
    const { name, value } = e.target;

    setDispatchForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleTransportInputChange = (e) => {
    const { name, value } = e.target;

    setTransportForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleDispatchSubmit = async () => {
    try {
      setError('');

      if (
        !dispatchForm.numberOfBoxes ||
        !dispatchForm.bigName.trim() ||
        !dispatchForm.toStore.trim() ||
        !dispatchForm.dispatchDate.trim()
      ) {
        setError('Please fill all dispatch label fields');
        return;
      }

      const payload = {
        numberOfBoxes: Number(dispatchForm.numberOfBoxes),
        bigName: dispatchForm.bigName.trim(),
        toStore: dispatchForm.toStore.trim(),
        dispatchDate: dispatchForm.dispatchDate.trim(),
      };

      await createDispatchLabel(selectedOrder.id, payload);

      setOrders((prev) =>
        prev.map((item) =>
          item.id === selectedOrder.id
            ? { ...item, status: 'READY_TO_DISPATCH' }
            : item
        )
      );

      setOpenDispatchModal(false);

      window.open(`/dispatch-labels/${selectedOrder.id}`, '_blank');
    } catch (err) {
      const message =
        err.response?.data?.message || 'Failed to create dispatch label';

      setError(message);
    }
  };

  const handleTransportSubmit = async () => {
    try {
      setError('');

      const payload = {
        busNo: transportForm.busNo.trim(),
        mobileNumber: transportForm.mobileNumber.trim(),
        pickupLocation: transportForm.pickupLocation.trim(),
      };

      await createTransportDetails(selectedOrder.id, payload);

      setOpenTransportModal(false);
    } catch (err) {
      const message =
        err.response?.data?.message || 'Failed to save transport details';

      setError(message);
    }
  };

  return (
    <>
    <Navbar />
    <Box sx={{ minHeight: '100vh', background: '#f4fdfc', p: 3 }}>
      <Typography
        variant="h4"
        sx={{
          fontWeight: 900,
          color: '#0f9f9a',
          mb: 3,
          textAlign: 'center',
        }}
      >
        Processed Orders
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 2 }}>
        <Button
          variant="contained"
          onClick={toggleSort}
          sx={{
            backgroundColor: '#0f9f9a',
            fontWeight: 800,
            '&:hover': {
              backgroundColor: '#0b7f7b',
            },
          }}
        >
          {sort === 'newest' ? 'Newest to Oldest' : 'Oldest to Newest'}
        </Button>

        <Button
          variant="outlined"
          onClick={() => navigate('/dashboard')}
          sx={{
            fontWeight: 700,
            borderColor: '#0f9f9a',
            color: '#0f9f9a',
            '&:hover': {
              borderColor: '#0b7f7b',
              backgroundColor: '#e6f7f6',
            },
          }}
        >
          Go To Report
        </Button>

        <TextField
          size="small"
          label="Search Store"
          placeholder="Enter store name"
          value={storeSearch}
          onChange={(e) => setStoreSearch(e.target.value)}
          sx={{ minWidth: 280, backgroundColor: '#fff' }}
        />
      </Stack>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Extracted Store</TableCell>
              <TableCell>Selected Store</TableCell>
              <TableCell>Order Number</TableCell>
              <TableCell>Order Date</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="center"></TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {orders.map((order) => (
              <TableRow key={order.id}>
                <TableCell>{order.id}</TableCell>
                <TableCell>{order.extractedStoreName}</TableCell>
                <TableCell>{order.selectedStoreName || '—'}</TableCell>
                <TableCell>{order.orderNumber}</TableCell>
                <TableCell>{order.orderDate}</TableCell>

                <TableCell>
                  <Select
                    size="small"
                    value={order.status}
                    onChange={(e) =>
                      handleStatusChange(order, e.target.value)
                    }
                    sx={{
                      minWidth: 190,
                      fontWeight: 800,
                      color: '#fff',
                      backgroundColor: getStatusColor(order.status),
                      '& .MuiSelect-icon': {
                        color: '#fff',
                      },
                    }}
                  >
                    {statuses.map((status) => (
                      <MenuItem key={status} value={status}>
                        {status}
                      </MenuItem>
                    ))}
                  </Select>
                </TableCell>
                <TableCell
                  sx={{
                    width: '70px',
                    pl: 0,
                    pr: 0,
                  }}
                >
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'flex-start',
                      alignItems: 'center',
                      gap: 1.5,
                      ml: -8,
                    }}
                  >
                  <Tooltip title="Print Dispatch Label">
                    <IconButton
                      onClick={() => handlePrintClick(order)}
                      sx={{
                        color: '#0f9f9a',
                        border: '1px solid #0f9f9a',
                        mr: 1,
                        ml: -4,
                        '&:hover': {
                          backgroundColor: '#e6f7f6',
                        },
                      }}
                    >
                      <PrintIcon />
                    </IconButton>
                  </Tooltip>

                    <Tooltip title="Add Transport Details">
                      <IconButton
                        onClick={() => handleTransportClick(order)}
                        sx={{
                          color: '#1976d2',
                          border: '1px solid #1976d2',
                          '&:hover': {
                            backgroundColor: '#e3f2fd',
                          },
                        }}
                      >
                        <LocalShippingIcon />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </TableCell>
              </TableRow>
            ))}

            {orders.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  No processed orders found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog
        open={openDispatchModal}
        onClose={() => setOpenDispatchModal(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Dispatch Label Details</DialogTitle>

        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Number of Boxes"
              name="numberOfBoxes"
              type="number"
              value={dispatchForm.numberOfBoxes}
              onChange={handleDispatchInputChange}
              fullWidth
            />

            <TextField
              label="Big Name"
              name="bigName"
              value={dispatchForm.bigName}
              onChange={handleDispatchInputChange}
              fullWidth
            />

            <TextField
              label="To Store"
              name="toStore"
              value={dispatchForm.toStore}
              onChange={handleDispatchInputChange}
              fullWidth
            />

            <TextField
              label="Dispatch Date"
              name="dispatchDate"
              value={dispatchForm.dispatchDate}
              onChange={handleDispatchInputChange}
              fullWidth
            />
          </Stack>
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setOpenDispatchModal(false)}>
            Cancel
          </Button>

          <Button variant="contained" onClick={handleDispatchSubmit}>
            Submit
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={openTransportModal}
        onClose={() => setOpenTransportModal(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Transport Details</DialogTitle>

        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Bus No"
              name="busNo"
              value={transportForm.busNo}
              onChange={handleTransportInputChange}
              fullWidth
            />

            <TextField
              label="Mobile Number"
              name="mobileNumber"
              value={transportForm.mobileNumber}
              onChange={handleTransportInputChange}
              fullWidth
            />

            <TextField
              label="Pickup Location"
              name="pickupLocation"
              value={transportForm.pickupLocation}
              onChange={handleTransportInputChange}
              fullWidth
            />
          </Stack>
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setOpenTransportModal(false)}>
            Skip
          </Button>

          <Button variant="contained" onClick={handleTransportSubmit}>
            Submit
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
    </>
  );
};

export default ProcessedOrders;
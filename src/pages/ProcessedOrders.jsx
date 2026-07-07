import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import ChatIcon from "@mui/icons-material/Chat";
import InfoIcon from "@mui/icons-material/Info";

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
  CircularProgress,
} from "@mui/material";

import PrintIcon from "@mui/icons-material/Print";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";

import {
  getProcessedOrders,
  updateProcessedOrderStatus,
  createDispatchLabel,
  getDispatchLabel,
  createTransportDetails,
  getTransportDetails,
  getStatusLogs,
  getAdmins,
  getProcessedOrderItems,
  createRemark,
} from "../services/processedOrders";

const statuses = [
  "RECEIVED",
  "TO_GM_ROAD",
  "READY_TO_DISPATCH",
  "DISPATCHED",
  "DELIVERED",
  "PARTIALLY_COMPLETED",
  "UNABLE_TO_FULFILL",
];

const isValidTransition = (currentStatus, newStatus) => {
  if (currentStatus === "UNABLE_TO_FULFILL") {
    return currentStatus === newStatus;
  }

  const allowedTransitions = {
    RECEIVED: ["TO_GM_ROAD", "UNABLE_TO_FULFILL"],
    TO_GM_ROAD: ["READY_TO_DISPATCH", "UNABLE_TO_FULFILL"],
    READY_TO_DISPATCH: ["DISPATCHED", "UNABLE_TO_FULFILL"],

    DISPATCHED: ["DELIVERED", "PARTIALLY_COMPLETED", "UNABLE_TO_FULFILL"],

    DELIVERED: ["PARTIALLY_COMPLETED", "UNABLE_TO_FULFILL"],

    PARTIALLY_COMPLETED: ["DELIVERED", "UNABLE_TO_FULFILL"],
  };

  return (
    currentStatus === newStatus ||
    allowedTransitions[currentStatus]?.includes(newStatus)
  );
};

const getStatusColor = (status) => {
  switch (status) {
    case "RECEIVED":
      return "#ff9800";
    case "TO_GM_ROAD":
      return "#1976d2";
    case "READY_TO_DISPATCH":
      return "#7b1fa2";
    case "DISPATCHED":
      return "#009688";
    case "DELIVERED":
      return "#2e7d32";
    case "PARTIALLY_COMPLETED":
      return "#ef6c00";
    case "UNABLE_TO_FULFILL":
      return "#d32f2f";
    default:
      return "#607d8b";
  }
};

const todayDate = () => {
  const date = new Date();

  return date
    .toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
    .replace(/ /g, "-");
};

const ProcessedOrders = () => {
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [error, setError] = useState("");
  const [sort, setSort] = useState("newest");
  const [storeSearch, setStoreSearch] = useState("");
  const [admins, setAdmins] = useState([]);
  const [page, setPage] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);
  const [openItemsModal, setOpenItemsModal] = useState(false);
  const [orderItems, setOrderItems] = useState([]);
  const [errorPopupOpen, setErrorPopupOpen] = useState(false);
  const [errorPopupMessage, setErrorPopupMessage] = useState("");

  const rowsPerPage = 50;

  const [openDispatchModal, setOpenDispatchModal] = useState(false);
  const [openTransportModal, setOpenTransportModal] = useState(false);
  const [openRemarksModal, setOpenRemarksModal] = useState(false);
  const [isRemarkOnly, setIsRemarkOnly] = useState(false);
  const [pendingStatus, setPendingStatus] = useState("");
  const [remarks, setRemarks] = useState("");
  const [statusLogs, setStatusLogs] = useState([]);
  const [isTransportReadonly, setIsTransportReadonly] = useState(false);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [itemsLoading, setItemsLoading] = useState(false);
  const [statusLogsLoading, setStatusLogsLoading] = useState(false);
  const [transportDetailsLoading, setTransportDetailsLoading] = useState(false);
  const [statusUpdateLoading, setStatusUpdateLoading] = useState(false);
  const [remarkSubmitLoading, setRemarkSubmitLoading] = useState(false);
  const [dispatchSubmitLoading, setDispatchSubmitLoading] = useState(false);
  const [transportSubmitLoading, setTransportSubmitLoading] = useState(false);
  const [dispatchLabelLoadingId, setDispatchLabelLoadingId] = useState(null);

  const [selectedOrder, setSelectedOrder] = useState(null);

  const [dispatchForm, setDispatchForm] = useState({
    numberOfBoxes: "",
    bigName: "",
    toStore: "",
    mobileNumber: "",
    dispatchDate: todayDate(),
    invoiceNumber: "",
    assignedTo: "",
  });

  const [transportForm, setTransportForm] = useState({
    busNo: "",
    mobileNumber: "",
    pickupLocation: "",
  });

  const loadOrders = async () => {
    try {
      setError("");
      setOrdersLoading(true);
      const result = await getProcessedOrders(
        sort,
        storeSearch,
        page,
        rowsPerPage,
      );

      setOrders(result.data || []);
      setTotalOrders(result.total || 0);
    } catch (err) {
      setError("Failed to load processed orders");
    } finally {
      setOrdersLoading(false);
    }
  };

  const getProcessingHours = (orderDate, dispatchDate) => {
    if (!orderDate || !dispatchDate) return "-";

    const diffMs = new Date(dispatchDate) - new Date(orderDate);
    const totalMinutes = Math.floor(diffMs / (1000 * 60));

    const days = Math.floor(totalMinutes / (60 * 24));
    const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
    const minutes = totalMinutes % 60;

    if (days > 0) return `${days} day(s) ${hours} hour(s) ${minutes} min(s)`;
    if (hours > 0) return `${hours} hour(s) ${minutes} min(s)`;
    return `${minutes} min(s)`;
  };

  useEffect(() => {
    loadOrders();
  }, [sort, storeSearch, page]);

  useEffect(() => {
    const loadAdmins = async () => {
      try {
        const data = await getAdmins();
        setAdmins(data || []);
      } catch (err) {
        setAdmins([]);
      }
    };

    loadAdmins();
  }, []);

  const toggleSort = () => {
    setPage(1);
    setSort((prev) => (prev === "newest" ? "oldest" : "newest"));
  };

  const openDispatchPopup = (order) => {
    setSelectedOrder(order);

    setDispatchForm({
      numberOfBoxes: "",
      bigName: "",
      toStore: order.selectedStoreName || "",
      mobileNumber: "",
      dispatchDate: todayDate(),
      invoiceNumber: "",
      assignedTo: "",
    });

    setOpenDispatchModal(true);
  };

  const openTransportPopup = async (order) => {
    setSelectedOrder(order);
    setOpenTransportModal(true);

    try {
      setTransportDetailsLoading(true);
      const details = await getTransportDetails(order.id);

      setTransportForm({
        busNo: details?.busNo || "",
        mobileNumber: details?.mobileNumber || "",
        pickupLocation: details?.pickupLocation || "",
      });
    } catch (err) {
      setTransportForm({
        busNo: "",
        mobileNumber: "",
        pickupLocation: "",
      });
    } finally {
      setTransportDetailsLoading(false);
    }
  };

  const handleStatusChange = async (order, status) => {
    if (!isValidTransition(order.status, status)) {
      const message = `Cannot change status from ${order.status} directly to ${status}`;

      setError(message);
      setErrorPopupMessage(message);
      setErrorPopupOpen(true);
      return;
    }

    setError("");
    setSelectedOrder(order);
    setPendingStatus(status);
    setIsRemarkOnly(false);
    setRemarks("");
    setStatusLogs([]);

    if (status === "READY_TO_DISPATCH") {
      openDispatchPopup(order);
    } else if (status === "DISPATCHED") {
      openTransportPopup(order);
    } else {
      setOpenRemarksModal(true);
    }

    try {
      setStatusLogsLoading(true);
      const logs = await getStatusLogs(order.id);
      setStatusLogs(logs || []);
    } catch (err) {
      setStatusLogs([]);
    } finally {
      setStatusLogsLoading(false);
    }
  };

  const handleRemarksSubmit = async () => {
    if (statusUpdateLoading || remarkSubmitLoading) return;

    try {
      setError("");

      if (!remarks.trim()) {
        setError("Remarks are required");
        return;
      }

      let response;

      if (isRemarkOnly) {
        setRemarkSubmitLoading(true);
        response = await createRemark(selectedOrder.id, remarks.trim());
      } else {
        setStatusUpdateLoading(true);
        response = await updateProcessedOrderStatus(
          selectedOrder.id,
          pendingStatus,
          remarks.trim(),
        );

        setOrders((prev) =>
          prev.map((item) =>
            item.id === selectedOrder.id
              ? { ...item, status: pendingStatus }
              : item,
          ),
        );
      }

      setStatusLogs(response.logs || []);
      setRemarks("");
      setOpenRemarksModal(false);
    } catch (err) {
      const message = err.response?.data?.message || "Failed to save remark";

      setError(message);
      setErrorPopupMessage(message);
      setErrorPopupOpen(true);
    } finally {
      setRemarkSubmitLoading(false);
      setStatusUpdateLoading(false);
    }
  };
  const handlePrintClick = async (order) => {
    if (dispatchLabelLoadingId === order.id) return;

    try {
      setError("");
      setDispatchLabelLoadingId(order.id);

      await getDispatchLabel(order.id);

      window.open(`/dispatch-labels/${order.id}`, "_blank");
    } catch (err) {
      openDispatchPopup(order);
    } finally {
      setDispatchLabelLoadingId(null);
    }
  };

  const handleViewItems = async (order) => {
    try {
      setError("");
      setSelectedOrder(order);
      setOrderItems([]);
      setOpenItemsModal(true);
      setItemsLoading(true);
      const data = await getProcessedOrderItems(order.id);
      setOrderItems(data || []);
    } catch (err) {
      setError("Failed to load order items");
    } finally {
      setItemsLoading(false);
    }
  };

  const handleViewRemarks = async (order) => {
    try {
      setError("");
      setSelectedOrder(order);
      setIsRemarkOnly(true);
      setRemarks("");
      setStatusLogs([]);
      setOpenRemarksModal(true);
      setStatusLogsLoading(true);

      const logs = await getStatusLogs(order.id);
      setStatusLogs(logs || []);
    } catch (err) {
      setError("Failed to load remarks history");
    } finally {
      setStatusLogsLoading(false);
    }
  };

  const handleTransportClick = (order) => {
    handleStatusChange(order, "DISPATCHED");
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
    if (dispatchSubmitLoading) return;

    try {
      setError("");

      if (
        !dispatchForm.numberOfBoxes ||
        !dispatchForm.bigName.trim() ||
        !dispatchForm.toStore.trim() ||
        !dispatchForm.mobileNumber.trim() ||
        !dispatchForm.dispatchDate.trim() ||
        !dispatchForm.invoiceNumber.trim() ||
        !dispatchForm.assignedTo.trim()
      ) {
        setError("Please fill all dispatch label fields");
        return;
      }

      const payload = {
        numberOfBoxes: Number(dispatchForm.numberOfBoxes),
        bigName: dispatchForm.bigName.trim(),
        toStore: dispatchForm.toStore.trim(),
        mobileNumber: dispatchForm.mobileNumber.trim(),
        dispatchDate: dispatchForm.dispatchDate.trim(),
        invoiceNumber: dispatchForm.invoiceNumber.trim(),
        assignedTo: dispatchForm.assignedTo.trim(),
      };

      if (!remarks.trim()) {
        setError("Remarks are required");
        return;
      }

      setDispatchSubmitLoading(true);
      await updateProcessedOrderStatus(
        selectedOrder.id,
        "READY_TO_DISPATCH",
        remarks.trim(),
      );

      await createDispatchLabel(selectedOrder.id, payload);

      setOrders((prev) =>
        prev.map((item) =>
          item.id === selectedOrder.id
            ? {
                ...item,
                status: "READY_TO_DISPATCH",
                assignedTo: dispatchForm.assignedTo.trim(),
              }
            : item,
        ),
      );

      setOpenDispatchModal(false);

      window.open(`/dispatch-labels/${selectedOrder.id}`, "_blank");
    } catch (err) {
      const message =
        err.response?.data?.message || "Failed to create dispatch label";

      setError(message);
    } finally {
      setDispatchSubmitLoading(false);
    }
  };

  const handleTransportSubmit = async () => {
    if (transportSubmitLoading) return;

    try {
      setError("");

      const payload = {
        busNo: transportForm.busNo.trim(),
        mobileNumber: transportForm.mobileNumber.trim(),
        pickupLocation: transportForm.pickupLocation.trim(),
      };

      if (
        !transportForm.busNo.trim() ||
        !transportForm.mobileNumber.trim() ||
        !transportForm.pickupLocation.trim() ||
        !remarks.trim()
      ) {
        setError("Please fill all transport details and remarks");
        return;
      }

      setTransportSubmitLoading(true);
      await updateProcessedOrderStatus(
        selectedOrder.id,
        "DISPATCHED",
        remarks.trim(),
      );

      await createTransportDetails(selectedOrder.id, payload);

      setOrders((prev) =>
        prev.map((item) =>
          item.id === selectedOrder.id
            ? { ...item, status: "DISPATCHED" }
            : item,
        ),
      );

      setOpenTransportModal(false);
    } catch (err) {
      const message =
        err.response?.data?.message || "Failed to save transport details";

      setError(message);
    } finally {
      setTransportSubmitLoading(false);
    }
  };

  const showAssignedToColumn = orders.some((order) => order.assignedTo);
  const showDispatchColumns = orders.some((order) => order.dispatchDate);
  const tableColumnCount =
    8 + (showDispatchColumns ? 2 : 0) + (showAssignedToColumn ? 1 : 0);

  return (
    <>
      <Navbar />
      <Box sx={{ minHeight: "100vh", background: "#f4fdfc", p: 3 }}>
        <Typography
          variant="h4"
          sx={{
            fontWeight: 900,
            color: "#0f9f9a",
            mb: 3,
            textAlign: "center",
          }}
        >
          Processed Orders
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={2}
          sx={{ mb: 2 }}
        >
          <Button
            variant="contained"
            onClick={toggleSort}
            sx={{
              backgroundColor: "#0f9f9a",
              fontWeight: 800,
              "&:hover": {
                backgroundColor: "#0b7f7b",
              },
            }}
          >
            {sort === "newest" ? "Newest to Oldest" : "Oldest to Newest"}
          </Button>

          <Button
            variant="outlined"
            onClick={() => navigate("/dashboard")}
            sx={{
              fontWeight: 700,
              borderColor: "#0f9f9a",
              color: "#0f9f9a",
              "&:hover": {
                borderColor: "#0b7f7b",
                backgroundColor: "#e6f7f6",
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
            onChange={(e) => {
              setPage(1);
              setStoreSearch(e.target.value);
            }}
            sx={{ minWidth: 280, backgroundColor: "#fff" }}
          />
        </Stack>

        <TableContainer component={Paper} sx={{ overflowX: "auto" }}>
          <Table sx={{ minWidth: 1400 }}>
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Extracted Store</TableCell>
                <TableCell>Selected Store</TableCell>
                <TableCell>Order Number</TableCell>
                <TableCell>PO Date</TableCell>
                <TableCell>Order Date</TableCell>
                {showDispatchColumns && <TableCell>Dispatch Date</TableCell>}
                {showDispatchColumns && <TableCell>Processing Hours</TableCell>}
                {showAssignedToColumn && <TableCell>Assigned To</TableCell>}
                <TableCell>Status</TableCell>
                <TableCell
                  align="center"
                  sx={{
                    width: 220,
                    minWidth: 220,
                  }}
                >
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {ordersLoading ? (
                <TableRow>
                  <TableCell colSpan={tableColumnCount} align="center">
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        gap: 1,
                        py: 3,
                      }}
                    >
                      <CircularProgress size={24} />
                      <Typography>Loading processed orders...</Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              ) : (
                orders.map((order) => (
                  <TableRow key={order.id}>
                  <TableCell
                    onClick={() => handleViewItems(order)}
                    sx={{
                      color: "#1976d2",
                      cursor: "pointer",
                      fontWeight: 700,
                      textDecoration: "underline",
                    }}
                  >
                    {order.id}
                  </TableCell>
                  <TableCell>{order.extractedStoreName}</TableCell>
                  <TableCell>{order.selectedStoreName || "—"}</TableCell>
                  <TableCell>{order.orderNumber}</TableCell>
                  <TableCell>
                    {order.poDate
                      ? new Date(order.poDate).toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                        })
                      : "-"}
                  </TableCell>
                  <TableCell>
                    {order.uploadDateTime
                      ? new Date(order.uploadDateTime).toLocaleString("en-IN", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                          hour12: true,
                        })
                      : order.orderDate}
                  </TableCell>
                  {showDispatchColumns && (
                    <TableCell>
                      {order.dispatchDate
                        ? new Date(order.dispatchDate).toLocaleString("en-IN", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                            hour12: true,
                          })
                        : "-"}
                    </TableCell>
                  )}

                  {showDispatchColumns && (
                    <TableCell>
                      {getProcessingHours(
                        order.uploadDateTime,
                        order.dispatchDate,
                      )}
                    </TableCell>
                  )}
                  {showAssignedToColumn && (
                    <TableCell>{order.assignedTo || "-"}</TableCell>
                  )}

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
                        color: "#fff",
                        backgroundColor: getStatusColor(order.status),
                        "& .MuiSelect-icon": {
                          color: "#fff",
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
                      width: 220,
                      minWidth: 220,
                      pl: 1,
                      pr: 1,
                    }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "flex-start",
                        alignItems: "center",
                        gap: 1,
                        flexWrap: "nowrap",
                        minWidth: 260,
                      }}
                    >
                      <Tooltip title="View Order Items">
                        <IconButton
                          onClick={() => handleViewItems(order)}
                          sx={{
                            color: "#317090",
                            border: "1px solid #317090",
                            mr: 1,
                            "&:hover": {
                              backgroundColor: "#e6f7f6",
                            },
                          }}
                        >
                          <InfoIcon />
                        </IconButton>
                      </Tooltip>

                      <Tooltip title={dispatchLabelLoadingId === order.id ? "Loading..." : "Print Dispatch Label"}>
                        <span>
                          <IconButton
                            onClick={() => handlePrintClick(order)}
                            disabled={dispatchLabelLoadingId === order.id}
                            sx={{
                              color: "#0f9f9a",
                              border: "1px solid #0f9f9a",
                              mr: 1,
                              "&:hover": {
                                backgroundColor: "#e6f7f6",
                              },
                            }}
                          >
                            {dispatchLabelLoadingId === order.id ? (
                              <CircularProgress size={18} color="inherit" />
                            ) : (
                              <PrintIcon />
                            )}
                          </IconButton>
                        </span>
                      </Tooltip>

                      <Tooltip title="View Remarks History">
                        <IconButton
                          onClick={() => handleViewRemarks(order)}
                          sx={{
                            color: "#6a1b9a",
                            border: "1px solid #6a1b9a",
                            mr: 1,
                            "&:hover": {
                              backgroundColor: "#f3e5f5",
                            },
                          }}
                        >
                          <ChatIcon />
                        </IconButton>
                      </Tooltip>

                      <Tooltip title="Add Transport Details">
                        <IconButton
                          onClick={() => handleTransportClick(order)}
                          sx={{
                            color: "#1976d2",
                            border: "1px solid #1976d2",
                            "&:hover": {
                              backgroundColor: "#e3f2fd",
                            },
                          }}
                        >
                          <LocalShippingIcon />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                  </TableRow>
                ))
              )}

              {!ordersLoading && orders.length === 0 && (
                <TableRow>
                  <TableCell colSpan={tableColumnCount} align="center">
                    No processed orders found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: 2,
            mt: 2,
          }}
        >
          <Button
            variant="outlined"
            disabled={page === 1 || ordersLoading}
            onClick={() => setPage(page - 1)}
          >
            Previous
          </Button>

          <Typography>
            Showing {totalOrders === 0 ? 0 : (page - 1) * rowsPerPage + 1}-
            {Math.min(page * rowsPerPage, totalOrders)} of {totalOrders}
          </Typography>

          <Button
            variant="outlined"
            disabled={page * rowsPerPage >= totalOrders || ordersLoading}
            onClick={() => setPage(page + 1)}
          >
            Next
          </Button>
        </Box>

        <Dialog
          open={openDispatchModal}
          onClose={() => setOpenDispatchModal(false)}
          fullWidth
          maxWidth="sm"
        >
          <DialogTitle>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Dispatch Label Details
            </Typography>

            <Typography variant="body2" color="text.secondary">
              ID: {selectedOrder?.id} | Store:{" "}
              {selectedOrder?.selectedStoreName} | Order:{" "}
              {selectedOrder?.orderNumber}
            </Typography>
          </DialogTitle>

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
                disabled
              />

              <TextField
                label="Mobile Number"
                name="mobileNumber"
                value={dispatchForm.mobileNumber}
                onChange={handleDispatchInputChange}
                fullWidth
              />

              <TextField
                label="Invoice Number"
                name="invoiceNumber"
                value={dispatchForm.invoiceNumber}
                onChange={handleDispatchInputChange}
                fullWidth
              />

              <TextField
                select
                label="Assign To"
                name="assignedTo"
                value={dispatchForm.assignedTo}
                onChange={handleDispatchInputChange}
                fullWidth
              >
                {admins.map((admin) => (
                  <MenuItem key={admin.id} value={admin.name}>
                    {admin.name}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                label="Dispatch Date"
                name="dispatchDate"
                value={dispatchForm.dispatchDate}
                onChange={handleDispatchInputChange}
                fullWidth
                disabled
              />
              <TextField
                label="Remarks"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                multiline
                rows={3}
                fullWidth
                required
              />

              {statusLogsLoading && (
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    gap: 1,
                    py: 1,
                  }}
                >
                  <CircularProgress size={20} />
                  <Typography variant="body2">Loading history...</Typography>
                </Box>
              )}

              {statusLogs.length > 0 && (
                <Box>
                  <Typography sx={{ fontWeight: 800, mb: 1 }}>
                    History
                  </Typography>

                  {statusLogs.map((log) => (
                    <Paper key={log.id} sx={{ p: 1.5, mb: 1 }}>
                      <Typography sx={{ fontWeight: 700 }}>
                        {log.status}
                      </Typography>
                      <Typography>{log.remarks}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {log.adminName} -{" "}
                        {new Date(log.createdAt).toLocaleString()}
                      </Typography>
                    </Paper>
                  ))}
                </Box>
              )}
            </Stack>
          </DialogContent>

          <DialogActions>
            <Button onClick={() => setOpenDispatchModal(false)}>Cancel</Button>

            <Button
              variant="contained"
              onClick={handleDispatchSubmit}
              disabled={dispatchSubmitLoading}
              startIcon={
                dispatchSubmitLoading ? (
                  <CircularProgress size={16} color="inherit" />
                ) : null
              }
            >
              {dispatchSubmitLoading ? "Submitting..." : "Submit"}
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog
          open={openTransportModal}
          onClose={() => setOpenTransportModal(false)}
          fullWidth
          maxWidth="sm"
        >
          <DialogTitle>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Transport Details
            </Typography>

            <Typography variant="body2" color="text.secondary">
              ID: {selectedOrder?.id} | Store:{" "}
              {selectedOrder?.selectedStoreName} | Order:{" "}
              {selectedOrder?.orderNumber}
            </Typography>
          </DialogTitle>

          <DialogContent>
            {transportDetailsLoading ? (
              <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
                <CircularProgress />
              </Box>
            ) : (
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

              <TextField
                label="Remarks"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                multiline
                rows={3}
                fullWidth
                required
                disabled={isTransportReadonly}
              />

                {statusLogsLoading && (
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      gap: 1,
                      py: 1,
                    }}
                  >
                    <CircularProgress size={20} />
                    <Typography variant="body2">Loading history...</Typography>
                  </Box>
                )}

                {statusLogs.length > 0 && (
                  <Box>
                    <Typography sx={{ fontWeight: 800, mb: 1 }}>
                      History
                    </Typography>

                    {statusLogs.map((log) => (
                      <Paper key={log.id} sx={{ p: 1.5, mb: 1 }}>
                        <Typography sx={{ fontWeight: 700 }}>
                          {log.status}
                        </Typography>
                        <Typography>{log.remarks}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {log.adminName} -{" "}
                          {new Date(log.createdAt).toLocaleString()}
                        </Typography>
                      </Paper>
                    ))}
                  </Box>
                )}
              </Stack>
            )}
          </DialogContent>

          <DialogActions>
            <Button onClick={() => setOpenTransportModal(false)}>Skip</Button>

            <Button
              variant="contained"
              onClick={handleTransportSubmit}
              disabled={transportSubmitLoading || transportDetailsLoading}
              startIcon={
                transportSubmitLoading ? (
                  <CircularProgress size={16} color="inherit" />
                ) : null
              }
            >
              {transportSubmitLoading ? "Saving..." : "Submit"}
            </Button>
          </DialogActions>
        </Dialog>
        <Dialog
          open={errorPopupOpen}
          onClose={() => setErrorPopupOpen(false)}
          maxWidth="xs"
          fullWidth
        >
          <DialogTitle>Status Change Error</DialogTitle>

          <DialogContent>
            <Typography color="error" sx={{ fontWeight: 700 }}>
              {errorPopupMessage}
            </Typography>
          </DialogContent>

          <DialogActions>
            <Button onClick={() => setErrorPopupOpen(false)}>OK</Button>
          </DialogActions>
        </Dialog>
        <Dialog
          open={openRemarksModal}
          onClose={() => setOpenRemarksModal(false)}
          fullWidth
          maxWidth="sm"
        >
          {/* <DialogTitle>Status Remarks</DialogTitle> */}
          <DialogTitle>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Status Remarks
            </Typography>

            <Typography variant="body2" color="text.secondary">
              ID: {selectedOrder?.id} | Store:{" "}
              {selectedOrder?.selectedStoreName} | Order:{" "}
              {selectedOrder?.orderNumber}
            </Typography>
          </DialogTitle>

          <DialogContent>
            {statusLogsLoading ? (
              <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
                <CircularProgress />
              </Box>
            ) : (
              <Stack spacing={2} sx={{ mt: 1 }}>
                <TextField
                  label="Remarks"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  multiline
                  rows={3}
                  fullWidth
                  required
                />

                {statusLogs.length > 0 && (
                  <Box>
                    <Typography sx={{ fontWeight: 800, mb: 1 }}>
                      History
                    </Typography>

                    {statusLogs.map((log) => (
                      <Paper key={log.id} sx={{ p: 1.5, mb: 1 }}>
                        <Typography sx={{ fontWeight: 700 }}>
                          {log.status}
                        </Typography>
                        <Typography>{log.remarks}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {log.adminName} -{" "}
                          {new Date(log.createdAt).toLocaleString()}
                        </Typography>
                      </Paper>
                    ))}
                  </Box>
                )}
              </Stack>
            )}
          </DialogContent>

          <DialogActions>
            <Button onClick={() => setOpenRemarksModal(false)}>Cancel</Button>

            <Button
              variant="contained"
              onClick={handleRemarksSubmit}
              disabled={statusUpdateLoading || remarkSubmitLoading}
              startIcon={
                statusUpdateLoading || remarkSubmitLoading ? (
                  <CircularProgress size={16} color="inherit" />
                ) : null
              }
            >
              {statusUpdateLoading || remarkSubmitLoading
                ? isRemarkOnly
                  ? "Saving..."
                  : "Updating..."
                : "Submit"}
            </Button>
          </DialogActions>
        </Dialog>
        <Dialog
          open={openItemsModal}
          onClose={() => setOpenItemsModal(false)}
          fullWidth
          maxWidth="lg"
        >
          <DialogTitle>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Order Items
            </Typography>

            <Typography variant="body2" color="text.secondary">
              ID: {selectedOrder?.id} | Store:{" "}
              {selectedOrder?.selectedStoreName} | Order:{" "}
              {selectedOrder?.orderNumber}
            </Typography>
          </DialogTitle>

          <DialogContent dividers sx={{ maxHeight: "70vh" }}>
            {itemsLoading ? (
              <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
                <CircularProgress />
              </Box>
            ) : (
              <TableContainer component={Paper}>
                <Table stickyHeader size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>S.No</TableCell>
                      <TableCell>Particulars</TableCell>
                      <TableCell>Packing</TableCell>
                      <TableCell>Company</TableCell>
                      <TableCell>Qty</TableCell>
                    </TableRow>
                  </TableHead>

                  <TableBody>
                    {orderItems.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>{item.s_no}</TableCell>
                        <TableCell>{item.particulars}</TableCell>
                        <TableCell>{item.packing}</TableCell>
                        <TableCell>{item.company}</TableCell>
                        <TableCell>{item.qty}</TableCell>
                      </TableRow>
                    ))}

                    {orderItems.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} align="center">
                          No items found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </DialogContent>

          <DialogActions>
            <Button onClick={() => setOpenItemsModal(false)}>Close</Button>
          </DialogActions>
        </Dialog>
      </Box>
    </>
  );
};

export default ProcessedOrders;

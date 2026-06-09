import React, { useEffect, useState } from "react";
import {
  Box,
  Paper,
  Typography,
  Button,
  MenuItem,
  TextField,
  Stack,
  Alert,
} from "@mui/material";
import { getStores, createProcessedOrder } from "../services/processedOrders";

const extractOrderDetails = (docHeader) => {
  const lines = docHeader?.lines || [];
  const text = lines.join(" ");

  const extractedStoreName = lines[0] || "";

  const gstinMatch = text.match(/GSTIN\s*:\s*([A-Z0-9]+)/i);
  const orderMatch = text.match(/Order No\s*\|\s*([A-Z0-9-]+)/i);
  const dateMatch = text.match(/Date:\s*\|\s*([0-9-]+)/i);
  const dlMatch = text.match(/D\.L\. No\s*:\s*([A-Z0-9/-]+)/i);

  return {
    extractedStoreName,
    gstin: gstinMatch?.[1] || "",
    orderNumber: orderMatch?.[1] || "",
    orderDate: dateMatch?.[1] || "",
    dlNumber: dlMatch?.[1] || "",
  };
};

const ProcessOrderCard = ({
  docHeader,
  totalRows,
  totalAmount,
  items = [],
  onClose,
  onSuccess,
}) => {
  const [stores, setStores] = useState([]);
  const [selectedStoreId, setSelectedStoreId] = useState("");
  const [confirmedStoreId, setConfirmedStoreId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const orderDetails = extractOrderDetails(docHeader);

  useEffect(() => {
    const loadStores = async () => {
      try {
        const data = await getStores();
        setStores(data || []);
      } catch (err) {
        setError("Failed to load stores");
      }
    };

    loadStores();
  }, []);

  const selectedStore = stores.find(
    (store) => String(store.id) === String(selectedStoreId),
  );

  const isStoreConfirmed =
    selectedStoreId && String(selectedStoreId) === String(confirmedStoreId);

  const handleStoreChange = (e) => {
    setSelectedStoreId(e.target.value);
    setConfirmedStoreId("");
    setError("");
  };

  const handleConfirmStore = () => {
    if (!selectedStoreId) {
      setError("Please select a store first.");
      return;
    }

    setConfirmedStoreId(selectedStoreId);
    setError("");
  };

  const handleSubmit = async () => {
    if (!selectedStoreId) {
      setError("Please select a store before submitting.");
      return;
    }

    if (!isStoreConfirmed) {
      setError("Please confirm the selected store before submitting.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const payload = {
        extractedStoreName: orderDetails.extractedStoreName,
        selectedStoreId: Number(selectedStoreId),
        gstin: orderDetails.gstin,
        dlNumber: orderDetails.dlNumber,
        orderNumber: orderDetails.orderNumber,
        orderDate: orderDetails.orderDate,
        items: items.map((item, index) => ({
          s_no: item.s_no || item.sNo || index + 1,
          particulars:
            item.particulars || item.Particulars || item["Particulars"] || "",
          packing: item.packing || item.Packing || item["Packing"] || "",
          company: item.company || item.Company || item["Company"] || "",
          qty: Number(item.qty || item.Qty || item["Qty."] || 0),
        })),
      };

      await createProcessedOrder(payload);

      onSuccess?.();
    } catch (err) {
      const message = err.response?.data?.message || "Failed to process order";

      if (
        message === "This order has already been processed for selected store"
      ) {
        onSuccess?.();
        return;
      }

      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper
      className="no-print"
      sx={{
        mt: 2,
        mb: 2,
        p: 2,
        borderRadius: 2,
        border: "1px solid #d1f0ed",
      }}
    >
      <Typography
        variant="h6"
        sx={{ fontWeight: 900, color: "#0f9f9a", mb: 2 }}
      >
        Process Order
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Stack spacing={2}>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              md: "repeat(3, 1fr)",
            },
            gap: 2,
          }}
        >
          <TextField
            label="Extracted Store Name"
            value={orderDetails.extractedStoreName}
            fullWidth
            InputProps={{ readOnly: true }}
          />

          <TextField
            label="Order Number"
            value={orderDetails.orderNumber}
            fullWidth
            InputProps={{ readOnly: true }}
          />

          <TextField
            label="Order Date"
            value={orderDetails.orderDate}
            fullWidth
            InputProps={{ readOnly: true }}
          />

          <TextField
            label="GSTIN"
            value={orderDetails.gstin}
            fullWidth
            InputProps={{ readOnly: true }}
          />

          <TextField
            label="DL Number"
            value={orderDetails.dlNumber}
            fullWidth
            InputProps={{ readOnly: true }}
          />

          <TextField
            label="Total Items"
            value={totalRows}
            fullWidth
            InputProps={{ readOnly: true }}
          />

          <TextField
            label="Total Amount"
            value={`₹${totalAmount}`}
            fullWidth
            InputProps={{ readOnly: true }}
          />

          <TextField
            select
            label="Select Store"
            value={selectedStoreId}
            onChange={handleStoreChange}
            fullWidth
            sx={{
              gridColumn: {
                xs: "auto",
                md: "span 2",
              },
            }}
          >
            {stores.map((store) => (
              <MenuItem key={store.id} value={store.id}>
                {store.storeName}
              </MenuItem>
            ))}
          </TextField>
        </Box>

        {selectedStore && !isStoreConfirmed && (
          <Alert
            severity="warning"
            action={
              <Button
                color="inherit"
                size="small"
                onClick={handleConfirmStore}
                sx={{ fontWeight: 800 }}
              >
                Confirm Store
              </Button>
            }
          >
            Are you sure you want to assign this purchase order to{" "}
            <strong>{selectedStore.storeName}</strong>?
          </Alert>
        )}

        {selectedStore && isStoreConfirmed && (
          <Alert severity="success">
            Store confirmed: <strong>{selectedStore.storeName}</strong>
          </Alert>
        )}

        <Box sx={{ display: "flex", gap: 1, justifyContent: "flex-end" }}>
          <Button onClick={onClose} variant="outlined">
            Cancel
          </Button>

          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={loading || !isStoreConfirmed}
            sx={{ backgroundColor: "#0f9f9a" }}
          >
            {loading ? "Opening Orders..." : "Submit Process Order"}
          </Button>
        </Box>
      </Stack>
    </Paper>
  );
};

export default ProcessOrderCard;

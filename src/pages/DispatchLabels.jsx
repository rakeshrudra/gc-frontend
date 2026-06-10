import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Box, Typography, CircularProgress } from "@mui/material";

import { getDispatchLabel } from "../services/processedOrders";

const DispatchLabels = () => {
  const { id } = useParams();

  const [labelData, setLabelData] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadDispatchLabel = async () => {
    try {
      const data = await getDispatchLabel(id);
      setLabelData(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDispatchLabel();
  }, []);

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!labelData) {
    return <Typography sx={{ p: 4 }}>No dispatch label found</Typography>;
  }

  const labels = [];

  for (let i = 1; i <= labelData.numberOfBoxes; i++) {
    labels.push(
      <Box
        key={i}
        className="print-label"
sx={{
  width: "4in",
  height: "6in",
  margin: "0 auto",
  padding: "12px",
  background: "#fff",
  fontFamily: '"Open Sans", sans-serif',
  fontSize: "16px",
  fontWeight: 600,
  color: "#111",
  boxSizing: "border-box",
  pageBreakAfter: "always", // ADD THIS
}}
      >
        <Box sx={{ height: "1.85in", display: "flex" }}>
          <Box sx={{ width: "50%" }}>
            <br />
            <br />

            <Typography
              sx={{ fontWeight: 800, fontSize: "16px", lineHeight: 1.35 }}
            >
              To
              <br />
              {labelData.toStore}
              <br />
              {labelData.mobileNumber || labelData.mobile_number || "-"}
            </Typography>
          </Box>

          <Box sx={{ width: "50%", textAlign: "center" }}>
            <img
              src="https://www.emedix.in/crm/assets/logo.png"
              alt="logo"
              style={{ width: "100%" }}
            />

            <br />
            <br />

            <Typography sx={{ fontWeight: 800, fontSize: "18px" }}>
              Date: {labelData.dispatchDate}
            </Typography>
          </Box>
        </Box>

        <Box
          sx={{
            height: "2.65in",
            textAlign: "center",
            paddingTop: "10px",
            letterSpacing: "3px",
          }}
        >
          <Typography
            sx={{
              fontWeight: 700,
              fontSize: "3.1rem",
              wordWrap: "break-word",
              lineHeight: 1.1,
              fontFamily: '"Open Sans", sans-serif',
            }}
          >
            {labelData.bigName}
          </Typography>

          <Typography
            sx={{
              fontWeight: 700,
              fontSize: "1.45rem",
              mt: 1.5,
              letterSpacing: "2px",
              fontFamily: '"Open Sans", sans-serif',
            }}
          >
            BOX {i} of {String(labelData.numberOfBoxes).padStart(2, "0")}
          </Typography>
        </Box>

        <Box sx={{ height: "1.5in", display: "flex", alignItems: "center" }}>
          <Box
            sx={{
              width: "66%",
              textAlign: "center",
              fontSize: "18px",
              lineHeight: 1.6,
            }}
          >
            <Typography sx={{ fontWeight: 700 }}>FROM</Typography>
            <Typography sx={{ fontWeight: 700 }}>
              EMEDIX WELLNESS PVT LTD
            </Typography>
            <Typography>Exhibition Road, Patna -</Typography>
            <Typography>800001</Typography>
          </Box>

          <Box sx={{ width: "34%", textAlign: "center" }}>
            <img
              src="https://www.emedix.in/crm/assets/qrcode.PNG"
              alt="qr"
              style={{ width: "100%" }}
            />
          </Box>
        </Box>
      </Box>,
    );
  }

  return (
    <>
     <style>
  {`
@media print {
  body * {
    visibility: visible !important;
  }

  @page {
    size: 4in 6in;
    margin: 0;
  }

  html, body, #root {
    margin: 0 !important;
    padding: 0 !important;
    background: white !important;
  }

  .labels-container {
    margin: 0 !important;
    padding: 0 !important;
    display: block !important;
  }

  .print-label {
    visibility: visible !important;
    width: 4in !important;
    height: 6in !important;
    margin: 0 !important;
    padding: 12px !important;
    background: white !important;
    box-sizing: border-box !important;
    display: block !important;
    page-break-after: always !important;
    break-after: page !important;
    overflow: hidden !important;
  }

  .print-label * {
    visibility: visible !important;
  }

  .print-label:last-child {
    page-break-after: auto !important;
    break-after: auto !important;
  }
}
  `}
</style>

      <Box
        className="labels-container"
        sx={{ background: "#ffffff", p: 0, m: 0 }}
      >
        {labels}
      </Box>
    </>
  );
};

export default DispatchLabels;

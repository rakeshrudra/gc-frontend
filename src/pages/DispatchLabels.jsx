import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Box, Typography, CircularProgress } from '@mui/material';

import { getDispatchLabel } from '../services/processedOrders';

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
      <Box sx={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
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
        sx={{
          width: '4in',
          height: '6in',
          margin: '20px auto',
          padding: '12px',
          background: '#fff',
          fontFamily: '"Open Sans", sans-serif',
          fontSize: '16px',
          fontWeight: 600,
          color: '#111',
          pageBreakAfter: 'always',
          boxSizing: 'border-box',
        }}
      >
        <Box sx={{ height: '1.85in', display: 'flex' }}>
          <Box sx={{ width: '50%' }}>
            <br />
            <br />

            <Typography sx={{ fontWeight: 800, fontSize: '16px', lineHeight: 1.35 }}>
              To
              <br />
              {labelData.toStore}
            </Typography>
          </Box>

          <Box sx={{ width: '50%', textAlign: 'center' }}>
            <img
              src="https://www.emedix.in/crm/assets/logo.png"
              alt="logo"
              style={{ width: '100%' }}
            />

            <br />
            <br />

            <Typography sx={{ fontWeight: 800, fontSize: '18px' }}>
              Date: {labelData.dispatchDate}
            </Typography>
          </Box>
        </Box>

        <Box
          sx={{
            height: '2.65in',
            textAlign: 'center',
            paddingTop: '10px',
            letterSpacing: '3px',
          }}
        >
          <Typography
            sx={{
              fontWeight: 700,
              fontSize: '3.1rem',
              wordWrap: 'break-word',
              lineHeight: 1.1,
              fontFamily: '"Open Sans", sans-serif',
            }}
          >
            {labelData.bigName}
          </Typography>

          <Typography
            sx={{
              fontWeight: 700,
              fontSize: '1.45rem',
              mt: 1.5,
              letterSpacing: '2px',
              fontFamily: '"Open Sans", sans-serif',
            }}
          >
            BOX {i} of {String(labelData.numberOfBoxes).padStart(2, '0')}
          </Typography>
        </Box>

        <Box sx={{ height: '1.5in', display: 'flex', alignItems: 'center' }}>
          <Box sx={{ width: '66%', textAlign: 'center', fontSize: '18px', lineHeight: 1.6 }}>
            <Typography sx={{ fontWeight: 700 }}>FROM</Typography>
            <Typography sx={{ fontWeight: 700 }}>EMEDIX WELLNESS PVT LTD</Typography>
            <Typography>Exhibition Road, Patna -</Typography>
            <Typography>800001</Typography>
          </Box>

          <Box sx={{ width: '34%', textAlign: 'center' }}>
            <img
              src="https://www.emedix.in/crm/assets/qrcode.PNG"
              alt="qr"
              style={{ width: '100%' }}
            />
          </Box>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', background: '#ffffff', py: 2 }}>
      {labels}
    </Box>
  );
};

export default DispatchLabels;
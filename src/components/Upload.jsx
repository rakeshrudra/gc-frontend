import React, { useRef, useState } from 'react';
import {
  Box,
  Button,
  Typography,
  Paper,
  Alert,
  Collapse,
  Chip,
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutlined';
import { uploadFile } from '../services/api';
import { LifeLine } from 'react-loading-indicators';

const Upload = ({ onUploadSuccess }) => {
  const fileInputRef = useRef(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) validateAndSet(file);
  };

  const validateAndSet = (file) => {
    setError('');
    setSuccess(false);
    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/csv',
    ];
    if (
      !validTypes.includes(file.type) &&
      !file.name.endsWith('.xlsx') &&
      !file.name.endsWith('.csv')
    ) {
      setError('Please select a valid Excel or CSV file (.xlsx, .csv)');
      return;
    }
    setSelectedFile(file);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    else if (e.type === 'dragleave') setDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSet(e.dataTransfer.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Please select a file first');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      const data = await uploadFile(selectedFile);
      setSuccess(true);
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      onUploadSuccess(data);
    } catch (err) {
      const message =
        err.response?.data?.message || 'Upload failed. Please try again.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper
      elevation={0}
      sx={{
        p: 1.5,
        mb: 2,
        borderRadius: '12px',
        border: '1px solid #d9f7ef',
        background: 'rgba(255,255,255,0.95)',
      }}
    >
      <Typography
        variant="subtitle1"
        sx={{ fontWeight: 700, mb: 2, color: '#2bb3b1' }}
      >
        Upload File (Excel or CSV)
      </Typography>

      {!success && (
        <Box
          id="upload-dropzone"
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          sx={{
            border: '2px dashed',
            borderColor: dragActive ? '#2bb3b1' : '#cbd5e1',
            borderRadius: '10px',
            p: 1.5,
            textAlign: 'center',
            cursor: 'pointer',
            backgroundColor: dragActive
              ? 'rgba(111,231,221,0.15)'
              : 'rgba(0,0,0,0.01)',
          }}
        >
          <CloudUploadIcon
            sx={{
              fontSize: 28,
              color: dragActive ? '#2bb3b1' : '#94a3b8',
            }}
          />
          <Typography variant="body2">
            {dragActive ? 'Drop file here' : 'Drag & drop file or click to browse'}
          </Typography>
        </Box>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls,.csv"
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />

      {selectedFile && (
        <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
          <InsertDriveFileIcon sx={{ color: '#2bb3b1' }} />
          <Typography sx={{ flexGrow: 1 }}>{selectedFile.name}</Typography>
          <Chip label={`${(selectedFile.size / 1024).toFixed(1)} KB`} size="small" />
        </Box>
      )}

      {!success && (
        <Button
          variant="contained"
          onClick={handleUpload}
          disabled={!selectedFile || loading}
          fullWidth
          sx={{
            mt: 1.5,
            borderRadius: '8px',
            fontWeight: 700,
            background: 'linear-gradient(135deg, #2bb3b1, #3aaed8)',
            color: '#ffffff',
          }}
        >
          {loading ? (
            <LifeLine
              size="small"
              color="#4ade80"   // ✅ single light green
            />
          ) : (
            'Upload & Match'
          )}
        </Button>
      )}

      {/* ❌ REMOVED LinearProgress */}

      <Collapse in={!!error}>
        <Alert severity="error" sx={{ mt: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      </Collapse>

      <Collapse in={success}>
        <Alert
          severity="success"
          icon={<CheckCircleOutlineIcon />}
          sx={{ mt: 2 }}
          action={
            <Button
              color="inherit"
              size="small"
              onClick={() => setSuccess(false)}
              sx={{ fontWeight: 800, fontSize: '0.7rem' }}
            >
              RE-UPLOAD
            </Button>
          }
        >
          File processed successfully! Results are shown below.
        </Alert>
      </Collapse>
    </Paper>
  );
};

export default Upload;
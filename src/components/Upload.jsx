import React, { useRef, useState } from 'react';
import {
  Box,
  Button,
  Typography,
  Paper,
  LinearProgress,
  Alert,
  Collapse,
  Chip,
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutlined';
import { uploadFile } from '../services/api';

const Upload = ({ onUploadSuccess }) => {
  const fileInputRef = useRef(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      validateAndSet(file);
    }
  };

  const validateAndSet = (file) => {
    setError('');
    setSuccess(false);
    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
    ];
    if (!validTypes.includes(file.type) && !file.name.endsWith('.xlsx')) {
      setError('Please select a valid Excel file (.xlsx)');
      return;
    }
    setSelectedFile(file);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
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
        p: 3,
        mb: 3,
        borderRadius: '16px',
        border: '1px solid',
        borderColor: 'grey.200',
        background: '#fff',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
      }}
    >
      <Typography
        variant="subtitle1"
        sx={{ fontWeight: 600, mb: 2, color: 'grey.800' }}
      >
        Upload Excel File
      </Typography>

      {/* Drop zone */}
      <Box
        id="upload-dropzone"
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        sx={{
          border: '2px dashed',
          borderColor: dragActive ? 'primary.main' : 'grey.300',
          borderRadius: '12px',
          p: 4,
          textAlign: 'center',
          cursor: 'pointer',
          transition: 'all 0.25s ease',
          backgroundColor: dragActive
            ? 'rgba(26,35,126,0.04)'
            : 'rgba(0,0,0,0.01)',
          '&:hover': {
            borderColor: 'primary.main',
            backgroundColor: 'rgba(26,35,126,0.04)',
          },
        }}
      >
        <CloudUploadIcon
          sx={{
            fontSize: 44,
            color: dragActive ? 'primary.main' : 'grey.400',
            mb: 1,
            transition: 'color 0.25s ease',
          }}
        />
        <Typography variant="body1" color="text.secondary" sx={{ mb: 0.5 }}>
          {dragActive
            ? 'Drop your file here'
            : 'Drag & drop your Excel file here'}
        </Typography>
        <Typography variant="caption" color="text.disabled">
          or click to browse • .xlsx files only
        </Typography>
      </Box>

      <input
        ref={fileInputRef}
        id="file-input"
        type="file"
        accept=".xlsx,.xls"
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />

      {/* Selected file indicator */}
      {selectedFile && (
        <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
          <InsertDriveFileIcon sx={{ color: 'primary.main', fontSize: 20 }} />
          <Typography variant="body2" sx={{ fontWeight: 500, flexGrow: 1 }}>
            {selectedFile.name}
          </Typography>
          <Chip
            label={`${(selectedFile.size / 1024).toFixed(1)} KB`}
            size="small"
            variant="outlined"
            sx={{ fontSize: '0.7rem' }}
          />
        </Box>
      )}

      {/* Upload button */}
      <Button
        id="upload-button"
        variant="contained"
        onClick={handleUpload}
        disabled={!selectedFile || loading}
        fullWidth
        sx={{
          mt: 2,
          py: 1.2,
          borderRadius: '10px',
          textTransform: 'none',
          fontWeight: 600,
          fontSize: '0.95rem',
          background: 'linear-gradient(135deg, #0288d1, #29b6f6)',
          boxShadow: '0 4px 14px rgba(2,136,209,0.3)',
          '&:hover': {
            background: 'linear-gradient(135deg, #01579b, #0288d1)',
            boxShadow: '0 6px 20px rgba(2,136,209,0.4)',
          },
          '&:disabled': {
            background: 'grey.300',
          },
        }}
      >
        {loading ? 'Uploading…' : 'Upload & Match'}
      </Button>

      {/* Progress bar */}
      <Collapse in={loading}>
        <LinearProgress
          sx={{
            mt: 2,
            borderRadius: 4,
            height: 6,
            '& .MuiLinearProgress-bar': {
              background: 'linear-gradient(90deg, #0288d1, #29b6f6)',
            },
          }}
        />
      </Collapse>

      {/* Error / success alerts */}
      <Collapse in={!!error}>
        <Alert
          id="upload-error"
          severity="error"
          sx={{ mt: 2, borderRadius: '10px' }}
          onClose={() => setError('')}
        >
          {error}
        </Alert>
      </Collapse>

      <Collapse in={success}>
        <Alert
          id="upload-success"
          severity="success"
          icon={<CheckCircleOutlineIcon />}
          sx={{ mt: 2, borderRadius: '10px' }}
        >
          File processed successfully! Results are shown below.
        </Alert>
      </Collapse>
    </Paper>
  );
};

export default Upload;

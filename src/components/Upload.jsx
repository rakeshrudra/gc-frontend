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
        p: 1.5,
        mb: 2,
        borderRadius: '12px',
        border: '1px solid',
        borderColor: 'grey.200',
        background: '#fff',
        boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
      }}
    >
      <Typography
        variant="subtitle1"
        sx={{ fontWeight: 600, mb: 2, color: 'grey.800' }}
      >
        Upload File (Excel or CSV)
      </Typography>

      {/* Drop zone */}
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
            borderColor: dragActive ? 'primary.main' : 'grey.300',
            borderRadius: '10px',
            p: 1.5,
            textAlign: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
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
              fontSize: 28,
              color: dragActive ? 'primary.main' : 'grey.400',
              mb: 0.5,
            }}
          />
          <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
            {dragActive ? 'Drop file here' : 'Drag & drop file or click to browse'}
          </Typography>
          <Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.7rem' }}>
            .xlsx, .xls, or .csv
          </Typography>
        </Box>
      )}

      <input
        ref={fileInputRef}
        id="file-input"
        type="file"
        accept=".xlsx,.xls,.csv"
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
      {!success && (
        <Button
          id="upload-button"
          variant="contained"
          onClick={handleUpload}
          disabled={!selectedFile || loading}
          fullWidth
          size="small"
          sx={{
            mt: 1.5,
            py: 1,
            borderRadius: '8px',
            textTransform: 'none',
            fontWeight: 700,
            background: 'linear-gradient(135deg, #0288d1, #29b6f6)',
            boxShadow: '0 2px 8px rgba(2,136,209,0.2)',
          }}
        >
          {loading ? 'Uploading…' : 'Upload & Match'}
        </Button>
      )}

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
          action={
            <Button color="inherit" size="small" onClick={() => setSuccess(false)} sx={{ fontWeight: 800, fontSize: '0.7rem' }}>
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

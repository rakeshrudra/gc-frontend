import api from './api';

export const uploadExpiryReturn = async (file) => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await api.post('/expiry-return/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

  return response.data;
};

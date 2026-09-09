import api from './api';

export const getContracts = async () => {
  const response = await api.get('/contracts');
  return response.data;
};

export const createContract = async (clientId, { remark, aadhaar, pan }) => {
  const formData = new FormData();
  formData.append('remark', remark);
  if (aadhaar) formData.append('aadhaar', aadhaar);
  if (pan) formData.append('pan', pan);

  const response = await api.post(`/contracts/${clientId}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

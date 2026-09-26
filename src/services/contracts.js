import api from './api';

export const getContracts = async ({ page = 1, limit = 25, search = '' } = {}) => {
  const response = await api.get('/contracts', {
    params: { page, limit, search: search || undefined },
  });
  return response.data;
};

export const getContractClientIds = async () => {
  const response = await api.get('/contracts/client-ids');
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

export const prepareContract = async (contractId, fields) => {
  const response = await api.post(`/contracts/${contractId}/prepare`, fields);
  return response.data;
};

const extractFilename = (response, fallback) => {
  const header = response.headers['content-disposition'];
  if (!header) return fallback;

  const utf8Match = header.match(/filename\*=UTF-8''([^;]+)/);
  if (utf8Match) return decodeURIComponent(utf8Match[1]);

  const plainMatch = header.match(/filename="([^"]+)"/);
  if (plainMatch) return plainMatch[1];

  return fallback;
};

export const downloadGeneratedContract = async (contractId) => {
  const response = await api.get(`/contracts/${contractId}/file`, {
    responseType: 'blob',
  });
  const filename = extractFilename(response, `contract-${contractId}.pdf`);
  const blobUrl = URL.createObjectURL(response.data);

  const link = document.createElement('a');
  link.href = blobUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(blobUrl);
};

export const prepareLetter = async (contractId, fields) => {
  const response = await api.post(`/contracts/${contractId}/letter`, fields);
  return response.data;
};

export const downloadGeneratedLetter = async (contractId) => {
  const response = await api.get(`/contracts/${contractId}/letter/file`, {
    responseType: 'blob',
  });
  const filename = extractFilename(response, `letter-${contractId}.docx`);
  const blobUrl = URL.createObjectURL(response.data);

  const link = document.createElement('a');
  link.href = blobUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(blobUrl);
};

import api from './api';

export const createOnboardingCase = async (payload) => {
  const response = await api.post('/onboarding', payload);
  return response.data;
};

export const getOnboardingCases = async () => {
  const response = await api.get('/onboarding');
  return response.data;
};

export const updateOnboardingStatus = async (id, status, remark, photo) => {
  if (photo) {
    const formData = new FormData();
    formData.append('status', status);
    if (remark) formData.append('remark', remark);
    formData.append('photo', photo);

    const response = await api.patch(`/onboarding/${id}/status`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  }

  const response = await api.patch(`/onboarding/${id}/status`, { status, remark });
  return response.data;
};

export const getOnboardingRemarks = async (id) => {
  const response = await api.get(`/onboarding/${id}/remarks`);
  return response.data;
};

export const getOnboardingDocuments = async (id) => {
  const response = await api.get(`/onboarding/${id}/documents`);
  return response.data;
};

export const getOnboardingDocumentBlobUrl = async (documentId) => {
  const response = await api.get(`/onboarding/documents/${documentId}/file`, {
    responseType: 'blob',
  });
  return URL.createObjectURL(response.data);
};

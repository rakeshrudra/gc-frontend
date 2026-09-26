import api from './api';

export const getGrievanceTopics = async () => {
  const response = await api.get('/grievances/topics');
  return response.data;
};

export const createGrievance = async ({ idempotencyKey, topicId, subtopicId, description, ccGm, ccCoo, ccCeo }) => {
  const response = await api.post('/grievances', {
    idempotencyKey,
    topicId,
    subtopicId,
    description,
    ccGm,
    ccCoo,
    ccCeo,
  });
  return response.data;
};

export const getGrievances = async ({ scope = 'mine', page = 1, limit = 25, status = '', search = '' } = {}) => {
  const response = await api.get('/grievances', {
    params: { scope, page, limit, status: status || undefined, search: search || undefined },
  });
  return response.data;
};

export const getGrievance = async (id) => {
  const response = await api.get(`/grievances/${id}`);
  return response.data;
};

export const getGrievanceHistory = async (id) => {
  const response = await api.get(`/grievances/${id}/history`);
  return response.data;
};

export const getGrievanceComments = async (id) => {
  const response = await api.get(`/grievances/${id}/comments`);
  return response.data;
};

export const addGrievanceComment = async (id, { message, isInternal }) => {
  const response = await api.post(`/grievances/${id}/comments`, { message, isInternal });
  return response.data;
};

export const updateGrievanceStatus = async (id, { status, resolutionNote, reason }) => {
  const response = await api.patch(`/grievances/${id}/status`, { status, resolutionNote, reason });
  return response.data;
};

export const reassignGrievance = async (id, { newFrmAdminId, reason }) => {
  const response = await api.patch(`/grievances/${id}/reassign`, { newFrmAdminId, reason });
  return response.data;
};

export const getStoreFrmMappings = async () => {
  const response = await api.get('/store-frm-mappings');
  return response.data;
};

export const upsertStoreFrmMapping = async ({ storeId, frmAdminId }) => {
  const response = await api.post('/store-frm-mappings', { storeId, frmAdminId });
  return response.data;
};

export const deactivateStoreFrmMapping = async (storeId) => {
  const response = await api.delete(`/store-frm-mappings/${storeId}`);
  return response.data;
};

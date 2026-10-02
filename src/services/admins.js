import api from './api';

export const getAdmins = async (role) => {
  const response = await api.get('/admins', { params: role ? { role } : undefined });
  return response.data;
};

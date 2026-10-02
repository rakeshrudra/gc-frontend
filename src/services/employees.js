import api from './api';

export const createEmployee = async (payload) => {
  const response = await api.post('/employees', payload);
  return response.data;
};

export const getEmployees = async ({ page = 1, limit = 25, search = '' } = {}) => {
  const response = await api.get('/employees', {
    params: { page, limit, search: search || undefined },
  });
  return response.data;
};

export const getEmployee = async (id) => {
  const response = await api.get(`/employees/${id}`);
  return response.data;
};

export const updateEmployee = async (id, payload) => {
  const response = await api.patch(`/employees/${id}`, payload);
  return response.data;
};

export const downloadJoiningForm = async (id, name) => {
  const response = await api.get(`/employees/${id}/joining-form`, { responseType: 'blob' });

  const fileName = `Joining Form - ${(name || `Employee ${id}`).replace(/[\\/:*?"<>|]/g, '')}.pdf`;
  const url = URL.createObjectURL(response.data);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

export const getDownloadErrorMessage = async (error) => {
  const data = error.response?.data;
  if (data instanceof Blob) {
    try {
      return JSON.parse(await data.text()).message;
    } catch {
      return null;
    }
  }
  return data?.message;
};

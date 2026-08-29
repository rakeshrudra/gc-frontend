import api from './api';

export const getStores = async () => {
  const response = await api.get('/stores');
  return response.data;
};

export const createProcessedOrder = async (payload) => {
  const response = await api.post('/processed-orders', payload);
  return response.data;
};

export const getProcessedOrders = async (
  sort = 'newest',
  store = '',
  page = 1,
  limit = 50,
  basePath = '/processed-orders'
) => {
  const response = await api.get(basePath, {
    params: {
      sort,
      store,
      page,
      limit,
    },
  });

  return response.data;
};

export const updateProcessedOrderStatus = async (id, status, remarks) => {
  const response = await api.patch(`/processed-orders/${id}/status`, {
    status,
    remarks,
  });

  return response.data;
};

export const getStatusLogs = async (id, basePath = '/processed-orders') => {
  const response = await api.get(`${basePath}/${id}/status-logs`);
  return response.data;
};

export const createDispatchLabel = async (id, payload) => {
  const response = await api.post(
    `/processed-orders/${id}/dispatch-label`,
    payload
  );
  return response.data;
};

export const getDispatchLabel = async (id, basePath = '/processed-orders') => {
  const response = await api.get(`${basePath}/${id}/dispatch-label`);
  return response.data;
};

export const getTransportDetails = async (id, basePath = '/processed-orders') => {
  const response = await api.get(
    `${basePath}/${id}/transport-details`
  );
  return response.data;
};

export const createTransportDetails = async (id, payload) => {
  const response = await api.post(
    `/processed-orders/${id}/transport-details`,
    payload
  );
  return response.data;
};

export const getAdmins = async () => {
  const response = await api.get('/admins');
  return response.data;
};

export const getProcessedOrderItems = async (id, basePath = '/processed-orders') => {
  const response = await api.get(`${basePath}/${id}/items`);
  return response.data;
};

export const createRemark = async (id, remarks) => {
  const response = await api.post(`/processed-orders/${id}/remarks`, {
    remarks,
  });

  return response.data;
};

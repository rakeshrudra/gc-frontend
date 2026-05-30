import api from './api';

export const getStores = async () => {
  const response = await api.get('/stores');
  return response.data;
};

export const createProcessedOrder = async (payload) => {
  const response = await api.post('/processed-orders', payload);
  return response.data;
};

export const getProcessedOrders = async (sort = 'newest', store = '') => {
  const response = await api.get('/processed-orders', {
    params: {
      sort,
      store,
    },
  });

  return response.data;
};

export const updateProcessedOrderStatus = async (id, status) => {
  const response = await api.patch(`/processed-orders/${id}/status`, {
    status,
  });

  return response.data;
};

export const createDispatchLabel = async (id, payload) => {
  const response = await api.post(
    `/processed-orders/${id}/dispatch-label`,
    payload
  );
  return response.data;
};

export const getDispatchLabel = async (id) => {
  const response = await api.get(`/processed-orders/${id}/dispatch-label`);
  return response.data;
};

export const createTransportDetails = async (id, payload) => {
  const response = await api.post(
    `/processed-orders/${id}/transport-details`,
    payload
  );
  return response.data;
};
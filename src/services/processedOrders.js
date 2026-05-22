import api from './api';

export const getStores = async () => {
  const response = await api.get('/stores');
  return response.data;
};

export const createProcessedOrder = async (payload) => {
  const response = await api.post('/processed-orders', payload);
  return response.data;
};

export const getProcessedOrders = async () => {
  const response = await api.get('/processed-orders');
  return response.data;
};

export const updateProcessedOrderStatus = async (id, status) => {
  const response = await api.patch(`/processed-orders/${id}/status`, {
    status,
  });

  return response.data;
};
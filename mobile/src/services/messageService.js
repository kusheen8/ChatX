import api from '../config/api';

export const getMessages = async (userId) => {
  const response = await api.get(`/conversations/${userId}/messages`);
  return response.data;
};


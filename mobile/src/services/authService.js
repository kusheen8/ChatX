import api from '../config/api';

export const register = async (username, email, password) => {
  try {
    const response = await api.post('/auth/register', { username, email, password });
    return {
      success: true,
      data: response.data, // token + user
    };
  } catch (error) {
    return {
      success: false,
      message:
        error.response?.data?.message ||
        'Something went wrong. Please try again.',
    };
  }
};

export const login = async (email, password) => {
  try {
    const response = await api.post('/auth/login', { email, password });
    return {
      success: true,
      data: response.data, // token + user
    };
  } catch (error) {
    return {
      success: false,
      message:
        error.response?.data?.message ||
        'Something went wrong. Please try again.',
    };
  }
};

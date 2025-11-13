import axios from 'axios';
import Constants from 'expo-constants';

// Get environment variables from expo-constants or use defaults
const getEnvVar = (name, defaultValue) => {
  return Constants.expoConfig?.extra?.[name] || process.env[name] || defaultValue;
};

const API_URL = getEnvVar('API_URL', 'http://192.168.43.42:5000/api'); 
const SERVER_URL = getEnvVar('SERVER_URL', 'http://192.168.43.42:5000');

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, 
});

// Add request interceptor for debugging
api.interceptors.request.use(
  (config) => {
    console.log('📤 API Request:', config.method.toUpperCase(), config.url);
    return config;
  },
  (error) => {
    console.error(' Request Error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for debugging
api.interceptors.response.use(
  (response) => {
    console.log(' API Response:', response.config.url, response.status);
    return response;
  },
  (error) => {
    console.error(' API Error:', error.response?.status, error.message);
    return Promise.reject(error);
  }
);

export const setAuthToken = (token) => {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    console.log(' Auth token set');
  } else {
    delete api.defaults.headers.common['Authorization'];
    console.log(' Auth token removed');
  }
};

export { SERVER_URL };
export default api;
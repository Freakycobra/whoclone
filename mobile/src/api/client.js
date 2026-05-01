import axios from 'axios';
import { API_BASE_URL } from '../constants';

const client = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach auth token
client.interceptors.request.use((config) => {
  // Token injected by auth store — import dynamically to avoid circular
  const { token } = require('../store/authStore').useAuthStore.getState();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401
client.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      require('../store/authStore').useAuthStore.getState().logout();
    }
    return Promise.reject(err);
  }
);

export default client;

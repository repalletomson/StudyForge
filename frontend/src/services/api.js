import axios from 'axios';
import toast from 'react-hot-toast';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (!error.response) {
      toast.error('Network error. Please check your connection.');
      return Promise.reject(error);
    }
    const { status, data } = error.response;

    if (status === 401) {
      localStorage.removeItem('token');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
      return Promise.reject(error);
    }

    if (status === 400 && data.code === 'VALIDATION_ERROR') {
      if (data.details && Array.isArray(data.details)) {
        data.details.forEach(detail => {
          toast.error(`${detail.field}: ${detail.message}`);
        });
      } else {
        toast.error(data.message || 'Validation error');
      }
      return Promise.reject(error);
    }

    if (status >= 500) {
      toast.error('Server error. Please try again later.');
    } else if (data.message) {
      toast.error(data.message);
    }
    return Promise.reject(error);
  }
);
export default api;

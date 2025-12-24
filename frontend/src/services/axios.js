import axios from 'axios';
import toast from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: `${API_URL}/api`,
  timeout: 30000, // 30 seconds timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - automatically add auth token
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

// Response interceptor - handle common errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const { response } = error;
    
    if (!response) {
      // Network error
      toast.error('Network error. Please check your connection.');
      return Promise.reject(error);
    }

    switch (response.status) {
      case 401:
        // Unauthorized - token expired or invalid
        if (response.data?.message?.includes('expired') || 
            response.data?.message?.includes('Invalid')) {
          localStorage.removeItem('token');
          // Only redirect if not already on login page
          if (!window.location.pathname.includes('/login')) {
            toast.error('Session expired. Please login again.');
            window.location.href = '/login';
          }
        }
        break;
      case 403:
        // Forbidden - access denied
        toast.error('Access denied. You do not have permission.');
        break;
      case 429:
        // Rate limited
        toast.error('Too many requests. Please wait a moment.');
        break;
      case 500:
        // Server error
        toast.error('Server error. Please try again later.');
        break;
      default:
        break;
    }
    
    return Promise.reject(error);
  }
);

export default api;

// Export the base URL for cases where full URL is needed
export const BASE_URL = API_URL;

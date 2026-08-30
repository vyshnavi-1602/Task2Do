import axios from 'axios';
import { env } from '../config/env';

export const apiClient = axios.create({
  baseURL: env.API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Interceptor to uniformly unpack the { success, data, error } backend format
apiClient.interceptors.response.use(
  (response) => {
    // If backend returns 200, we unpack response.data.data
    return response.data.data;
  },
  (error) => {
    // Standardize error rejection
    const backendError = error.response?.data?.error?.message || error.message || 'Unknown network error';
    return Promise.reject(new Error(backendError));
  }
);

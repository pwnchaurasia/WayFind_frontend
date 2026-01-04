import axios from 'axios';
import Constants from 'expo-constants';
import { getAccessToken, getRefreshToken, setToken, removeToken } from '@/src/utils/token';

const ENV = Constants.expoConfig?.extra?.env || 'dev';

const baseURLs = {
  dev: process.env.EXPO_PUBLIC_API_BASE_URL_DEV,
  sit: process.env.EXPO_PUBLIC_API_BASE_URL_SIT,
  prod: process.env.EXPO_PUBLIC_API_BASE_URL_PROD,
};

console.log(baseURLs[ENV], 'baseURL for axios');

const API = axios.create({
  baseURL: baseURLs[ENV],
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Flag to prevent multiple simultaneous refresh attempts
let isRefreshing = false;
let failedQueue = [];

// Process queued requests after token refresh
const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Request interceptor - add access token to all requests
API.interceptors.request.use(
  async (config) => {
    const token = await getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle token refresh on 401
API.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If error is not 401 or request has already been retried, reject
    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    // Check if the error message indicates token expiration
    const errorMessage = error.response?.data?.message || error.response?.data?.detail || '';
    const isTokenExpired = errorMessage.toLowerCase().includes('expired') ||
      errorMessage.toLowerCase().includes('token') ||
      error.response?.status === 401;

    if (!isTokenExpired) {
      return Promise.reject(error);
    }

    // If already refreshing, queue this request
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      }).then(token => {
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return API(originalRequest);
      }).catch(err => {
        return Promise.reject(err);
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const refreshToken = await getRefreshToken();

      if (!refreshToken) {
        // No refresh token - user needs to login
        console.log('No refresh token available, user needs to login');
        await handleLogout();
        return Promise.reject(new Error('Session expired. Please login again.'));
      }

      console.log('Attempting to refresh access token...');

      // Call refresh endpoint with refresh token
      const refreshResponse = await axios.post(
        `${baseURLs[ENV]}/v1/auth/refresh-token`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${refreshToken}`,
            'Content-Type': 'application/json',
          }
        }
      );

      if (refreshResponse.data?.status === 'success' && refreshResponse.data?.access_token) {
        const newAccessToken = refreshResponse.data.access_token;
        const newRefreshToken = refreshResponse.data.refresh_token;

        console.log('Token refresh successful');

        // Save new tokens
        await setToken({
          access_token: newAccessToken,
          refresh_token: newRefreshToken
        });

        // Update the default header
        API.defaults.headers.Authorization = `Bearer ${newAccessToken}`;

        // Process queued requests with new token
        processQueue(null, newAccessToken);

        // Retry original request with new token
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return API(originalRequest);
      } else {
        // Refresh failed - logout user
        console.log('Token refresh failed - response not successful');
        await handleLogout();
        processQueue(new Error('Session expired'), null);
        return Promise.reject(new Error('Session expired. Please login again.'));
      }
    } catch (refreshError) {
      console.log('Token refresh error:', refreshError.response?.status, refreshError.message);

      // If refresh token is also expired (401), logout
      if (refreshError.response?.status === 401) {
        console.log('Refresh token expired, logging out user');
        await handleLogout();
      }

      processQueue(refreshError, null);
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

// Handle logout - clear tokens and trigger auth state update
const handleLogout = async () => {
  try {
    await removeToken();
    // Emit event for AuthContext to pick up
    if (typeof global !== 'undefined') {
      global.authSessionExpired = true;
    }
  } catch (e) {
    console.error('Error during logout:', e);
  }
};

export default API;

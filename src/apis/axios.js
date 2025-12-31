import axios from 'axios';
import Constants from 'expo-constants';
import { getAccessToken } from '@/src/utils/token';

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

// Add token or other interceptors if needed
API.interceptors.request.use(
  async (config) => {
    const token = await getAccessToken();
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

export default API;

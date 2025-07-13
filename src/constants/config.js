// src/config.js
import Constants from 'expo-constants';

const ENV = Constants.manifest?.extra?.env || 'dev';

const CONFIG = {
  dev: {
    API_URL: 'https://dev-api.example.com',
  },
  sit: {
    API_URL: 'https://sit-api.example.com',
  },
  prod: {
    API_URL: 'https://api.example.com',
  },
};

export default CONFIG[ENV];

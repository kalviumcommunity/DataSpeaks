// API configuration based on environment
export const API_BASE_URL = import.meta.env.MODE === 'production' 
  ? 'https://dataspeaks.onrender.com'
  : 'http://localhost:3000';

export const getApiUrl = (endpoint) => `${API_BASE_URL}${endpoint}`;

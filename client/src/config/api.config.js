// API Configuration
export const API_CONFIG = {
  BASE_URL: import.meta.env.MODE === 'production' 
    ? 'https://dataspeaks.onrender.com'
    : 'http://localhost:3000',
  TIMEOUT: 30000,
  HEADERS: {
    'Content-Type': 'application/json',
  }
};

// API Endpoints
export const API_ENDPOINTS = {
  MONGO: {
    TEST: '/api/mongo/test',
    CONNECT: '/api/mongo/connect',
    COLLECTIONS: (id) => `/api/mongo/${id}/collections`,
    QUERY: (id) => `/api/mongo/${id}/query`,
    STATUS: (id) => `/api/mongo/${id}/status`,
    DISCONNECT: (id) => `/api/mongo/${id}`,
    SAMPLES: (id) => `/api/mongo/${id}/samples`
  },
  SQL: {
    TEST: '/api/sql/test',
    CONNECT: '/api/sql/connect',
    TABLES: (id) => `/api/sql/${id}/tables`,
    SCHEMA: (id) => `/api/sql/${id}/schema`,
    QUERY: (id) => `/api/sql/${id}/query`,
    EXECUTE: (id) => `/api/sql/${id}/execute`,
    SAMPLES: (id) => `/api/sql/${id}/sample-questions`,
    INFO: (id) => `/api/sql/${id}/info`,
    DISCONNECT: (id) => `/api/sql/${id}/disconnect`,
    LIST: '/api/sql/connections/list'
  },
  RAG: {
    UPLOAD: '/api/rag/upload',
    QUERY: '/api/rag/query',
    STATS: '/api/rag/stats'
  }
};

// Helper function to get full API URL
export const getApiUrl = (endpoint) => {
  return `${API_CONFIG.BASE_URL}${endpoint}`;
};

// Helper function for API calls
export const apiCall = async (endpoint, options = {}) => {
  const url = getApiUrl(endpoint);
  const config = {
    ...options,
    headers: {
      ...API_CONFIG.HEADERS,
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, config);
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('API Call Error:', error);
    throw error;
  }
};

export default {
  API_CONFIG,
  API_ENDPOINTS,
  getApiUrl,
  apiCall
};

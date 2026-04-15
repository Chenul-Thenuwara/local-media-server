import axios from 'axios';

const getBaseUrl = () => {
  const tunnelUrl = localStorage.getItem('tunnelUrl');
  if (tunnelUrl) {
    return `${tunnelUrl}/api`;
  }
  return import.meta.env.VITE_API_URL || '/api';
};

const api = axios.create({
  baseURL: getBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to attach the token if it exists
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Dynamically update baseURL if tunnelUrl was just set during this session
    const tunnelUrl = localStorage.getItem('tunnelUrl');
    // Allow login endpoints to bypass tunnel to hit the central discovery server
    const isAuthEndpoint = config.url && config.url.includes('/auth/login') || config.url?.includes('discovery');
    
    if (tunnelUrl && !isAuthEndpoint) {
      config.baseURL = `${tunnelUrl}/api`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

export default api;

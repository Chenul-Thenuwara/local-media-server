import axios from 'axios';

export const getBaseUrl = () => {
  const tunnelUrl = localStorage.getItem('tunnelUrl');
  if (tunnelUrl) {
    return `${tunnelUrl}/api`;
  }
  return import.meta.env.VITE_API_URL || '/api';
};

export const getStreamUrl = (mediaId: string): string => {
  const token = localStorage.getItem('token') || '';
  const tunnelUrl = localStorage.getItem('tunnelUrl');
  const base = tunnelUrl ? `${tunnelUrl}/api` : (import.meta.env.VITE_API_URL || '/api');
  return `${base}/stream/${mediaId}${token ? `?token=${token}` : ''}`;
};

const api = axios.create({
  baseURL: getBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
    'Bypass-Tunnel-Reminder': 'true'
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
    // Allow public utility endpoints to bypass tunnel and hit Vercel directly
    const isPublicEndpoint = config.url && (
      config.url.includes('/auth/login') ||
      config.url.includes('/auth/register') ||
      config.url.includes('/auth/profiles') ||
      config.url.includes('discovery') || 
      config.url.includes('/tmdb/trending') ||
      config.url.includes('/spotify/')
    );
    
    if (isPublicEndpoint) {
      config.baseURL = import.meta.env.VITE_API_URL || '/api';
    } else if (tunnelUrl) {
      config.baseURL = `${tunnelUrl}/api`;
    } else {
      config.baseURL = import.meta.env.VITE_API_URL || '/api';
    }

    return config;
  },
  (error) => Promise.reject(error)
);

export default api;

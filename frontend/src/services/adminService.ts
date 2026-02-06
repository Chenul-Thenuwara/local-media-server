import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return { headers: { Authorization: `Bearer ${token}` } };
};

export const adminService = {
  getStats: async () => {
    const response = await axios.get(`${API_URL}/admin/stats`, getAuthHeader());
    return response.data;
  },

  getUsers: async () => {
    const response = await axios.get(`${API_URL}/admin/users`, getAuthHeader());
    return response.data;
  },

  createUser: async (userData: any) => {
    const response = await axios.post(`${API_URL}/admin/users`, userData, getAuthHeader());
    return response.data;
  }
};

import api from '../lib/api';

export const adminService = {
  getStats: async () => {
    const response = await api.get('/admin/stats');
    return response.data;
  },

  getUsers: async () => {
    const response = await api.get('/admin/users');
    return response.data;
  },

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  createUser: async (userData: any) => {
    const response = await api.post('/admin/users', userData);
    return response.data;
  },

  deleteUser: async (id: string) => {
    const response = await api.delete(`/admin/users/${id}`);
    return response.data;
  },

  updateUserRole: async (id: string, role: string) => {
    const response = await api.patch(`/admin/users/${id}/role`, { role });
    return response.data;
  },

  // Library Management
  getLibraries: async () => {
    const response = await api.get('/libraries');
    return response.data;
  },

  createLibrary: async (libraryData: { name: string; path: string; type: string }) => {
    const response = await api.post('/libraries', libraryData);
    return response.data;
  },

  refreshLibrary: async (id: string) => {
    const response = await api.post(`/libraries/${id}/refresh`);
    return response.data;
  },

  // System Settings
  getSettings: async () => {
    const response = await api.get('/settings');
    return response.data;
  },

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  updateSettings: async (settings: any) => {
    const response = await api.put('/settings', settings);
    return response.data;
  }
};

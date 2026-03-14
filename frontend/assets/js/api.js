// frontend/assets/js/api.js
const API = {
  baseURL: process.env.NODE_ENV === 'production' 
    ? 'https://api.autolive.com/v1' 
    : 'http://localhost:3000/api/v1',
  
  headers: {
    'Content-Type': 'application/json',
  },

  // Auth endpoints
  auth: {
    login: (credentials) => API.post('/auth/login', credentials),
    register: (userData) => API.post('/auth/register', userData),
    logout: () => API.post('/auth/logout'),
    refreshToken: () => API.post('/auth/refresh-token'),
    verifyEmail: (token) => API.post('/auth/verify-email', { token }),
    forgotPassword: (email) => API.post('/auth/forgot-password', { email }),
    resetPassword: (token, password) => API.post('/auth/reset-password', { token, password }),
  },

  // User endpoints
  users: {
    getProfile: () => API.get('/users/profile'),
    updateProfile: (data) => API.put('/users/profile', data),
    uploadAvatar: (file) => {
      const formData = new FormData();
      formData.append('avatar', file);
      return API.upload('/users/avatar', formData);
    },
    changePassword: (data) => API.post('/auth/change-password', data),
    getSessions: () => API.get('/users/sessions'),
    revokeSession: (sessionId) => API.delete(`/users/sessions/${sessionId}`),
    revokeAllSessions: () => API.post('/users/sessions/revoke-all'),
    enable2FA: () => API.post('/users/2fa/enable'),
    verify2FA: (code) => API.post('/users/2fa/verify', { code }),
    disable2FA: () => API.post('/users/2fa/disable'),
    getBackupCodes: () => API.get('/users/2fa/backup-codes'),
    downloadData: () => API.get('/users/export-data', { responseType: 'blob' }),
    deactivateAccount: () => API.post('/users/deactivate'),
    deleteAccount: (password) => API.delete('/users', { password }),
  },

  // Channel endpoints
  channels: {
    getAll: () => API.get('/channels'),
    getById: (id) => API.get(`/channels/${id}`),
    connect: (platform, data) => API.post(`/channels/${platform}/connect`, data),
    disconnect: (id) => API.delete(`/channels/${id}`),
    update: (id, data) => API.put(`/channels/${id}`, data),
    getStats: (id) => API.get(`/channels/${id}/stats`),
    getVideos: (id, params) => API.get(`/channels/${id}/videos`, { params }),
  },

  // Video endpoints
  videos: {
    getAll: (params) => API.get('/videos', { params }),
    getById: (id) => API.get(`/videos/${id}`),
    upload: (file, data) => {
      const formData = new FormData();
      formData.append('video', file);
      Object.keys(data).forEach(key => formData.append(key, data[key]));
      return API.upload('/videos/upload', formData);
    },
    update: (id, data) => API.put(`/videos/${id}`, data),
    delete: (id) => API.delete(`/videos/${id}`),
    schedule: (id, scheduleTime) => API.post(`/videos/${id}/schedule`, { scheduleTime }),
    getAnalytics: (id) => API.get(`/videos/${id}/analytics`),
  },

  // Workflow endpoints
  workflows: {
    getAll: () => API.get('/workflows'),
    getById: (id) => API.get(`/workflows/${id}`),
    create: (data) => API.post('/workflows', data),
    update: (id, data) => API.put(`/workflows/${id}`, data),
    delete: (id) => API.delete(`/workflows/${id}`),
    execute: (id) => API.post(`/workflows/${id}/execute`),
    pause: (id) => API.post(`/workflows/${id}/pause`),
    resume: (id) => API.post(`/workflows/${id}/resume`),
    getLogs: (id) => API.get(`/workflows/${id}/logs`),
  },

  // Upload endpoints
  uploads: {
    getAll: (params) => API.get('/uploads', { params }),
    getById: (id) => API.get(`/uploads/${id}`),
    getStats: () => API.get('/uploads/stats'),
    retry: (id) => API.post(`/uploads/${id}/retry`),
    cancel: (id) => API.post(`/uploads/${id}/cancel`),
    delete: (id) => API.delete(`/uploads/${id}`),
  },

  // Reports endpoints
  reports: {
    getAll: (params) => API.get('/reports', { params }),
    getById: (id) => API.get(`/reports/${id}`),
    generate: (data) => API.post('/reports/generate', data),
    download: (id, format) => API.get(`/reports/${id}/download`, { params: { format }, responseType: 'blob' }),
    delete: (id) => API.delete(`/reports/${id}`),
    schedule: (data) => API.post('/reports/schedule', data),
  },

  // Analytics endpoints
  analytics: {
    getOverview: (params) => API.get('/analytics/overview', { params }),
    getUploadStats: (params) => API.get('/analytics/uploads', { params }),
    getChannelStats: (params) => API.get('/analytics/channels', { params }),
    getEngagementStats: (params) => API.get('/analytics/engagement', { params }),
    getViralStats: (params) => API.get('/analytics/viral', { params }),
    exportData: (params) => API.get('/analytics/export', { params, responseType: 'blob' }),
  },

  // Viral discovery endpoints
  viral: {
    getTrending: (platform, params) => API.get(`/viral/${platform}/trending`, { params }),
    getSuggestions: (params) => API.get('/viral/suggestions', { params }),
    analyzeVideo: (url) => API.post('/viral/analyze', { url }),
    getHashtags: (query) => API.get('/viral/hashtags', { params: { query } }),
    getTitles: (keywords) => API.post('/viral/titles', { keywords }),
  },

  // Settings endpoints
  settings: {
    getNotifications: () => API.get('/settings/notifications'),
    updateNotifications: (data) => API.put('/settings/notifications', data),
    getPrivacy: () => API.get('/settings/privacy'),
    updatePrivacy: (data) => API.put('/settings/privacy', data),
    getIntegrations: () => API.get('/settings/integrations'),
    updateIntegration: (platform, data) => API.put(`/settings/integrations/${platform}`, data),
  },

  // Admin endpoints
  admin: {
    getUsers: (params) => API.get('/admin/users', { params }),
    getUserById: (id) => API.get(`/admin/users/${id}`),
    updateUser: (id, data) => API.put(`/admin/users/${id}`, data),
    deleteUser: (id) => API.delete(`/admin/users/${id}`),
    getSystemStats: () => API.get('/admin/stats'),
    getLogs: (params) => API.get('/admin/logs', { params }),
    getJobs: () => API.get('/admin/jobs'),
    retryJob: (id) => API.post(`/admin/jobs/${id}/retry`),
  },

  // Helper methods
  get: async (endpoint, config = {}) => {
    const response = await fetch(API.baseURL + endpoint, {
      method: 'GET',
      headers: API.getHeaders(),
      ...config
    });
    return API.handleResponse(response);
  },

  post: async (endpoint, data, config = {}) => {
    const response = await fetch(API.baseURL + endpoint, {
      method: 'POST',
      headers: API.getHeaders(),
      body: JSON.stringify(data),
      ...config
    });
    return API.handleResponse(response);
  },

  put: async (endpoint, data, config = {}) => {
    const response = await fetch(API.baseURL + endpoint, {
      method: 'PUT',
      headers: API.getHeaders(),
      body: JSON.stringify(data),
      ...config
    });
    return API.handleResponse(response);
  },

  delete: async (endpoint, data = {}, config = {}) => {
    const response = await fetch(API.baseURL + endpoint, {
      method: 'DELETE',
      headers: API.getHeaders(),
      body: JSON.stringify(data),
      ...config
    });
    return API.handleResponse(response);
  },

  upload: async (endpoint, formData, config = {}) => {
    const response = await fetch(API.baseURL + endpoint, {
      method: 'POST',
      headers: {
        'Authorization': API.getHeaders().Authorization
      },
      body: formData,
      ...config
    });
    return API.handleResponse(response);
  },

  getHeaders: () => {
    const token = localStorage.getItem('authToken');
    return {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : '',
      ...API.headers
    };
  },

  handleResponse: async (response) => {
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || 'API request failed');
    }
    
    // Check if response is blob
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return response.json();
    } else {
      return response.blob();
    }
  },

  setAuthToken: (token) => {
    localStorage.setItem('authToken', token);
  },

  removeAuthToken: () => {
    localStorage.removeItem('authToken');
  },

  isAuthenticated: () => {
    return !!localStorage.getItem('authToken');
  }
};

export default API;

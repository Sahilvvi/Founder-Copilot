import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL;

// Helper to get user ID from localStorage
export const getUserId = () => {
  const user = localStorage.getItem('user');
  if (user) {
    try {
      const parsed = JSON.parse(user);
      // Use email as user ID (unique identifier)
      return parsed.email ? parsed.email.replace(/[^a-zA-Z0-9]/g, '_') : null;
    } catch {
      return null;
    }
  }
  return null;
};

// ============================================
// TEAM MEMBER API
// ============================================
export const teamApi = {
  getAll: async (userId) => {
    const response = await axios.get(`${API_URL}/api/team/${userId}`);
    return response.data;
  },

  create: async (userId, member) => {
    const response = await axios.post(`${API_URL}/api/team/${userId}`, member);
    return response.data;
  },

  update: async (userId, memberId, updates) => {
    const response = await axios.put(`${API_URL}/api/team/${userId}/${memberId}`, updates);
    return response.data;
  },

  delete: async (userId, memberId) => {
    const response = await axios.delete(`${API_URL}/api/team/${userId}/${memberId}`);
    return response.data;
  }
};

// ============================================
// TASK API
// ============================================
export const taskApi = {
  getAll: async (userId) => {
    const response = await axios.get(`${API_URL}/api/tasks/${userId}`);
    return response.data;
  },

  create: async (userId, task) => {
    const response = await axios.post(`${API_URL}/api/tasks/${userId}`, task);
    return response.data;
  },

  update: async (userId, taskId, updates) => {
    const response = await axios.put(`${API_URL}/api/tasks/${userId}/${taskId}`, updates);
    return response.data;
  },

  delete: async (userId, taskId) => {
    const response = await axios.delete(`${API_URL}/api/tasks/${userId}/${taskId}`);
    return response.data;
  },

  addComment: async (userId, taskId, text, userName) => {
    const response = await axios.post(`${API_URL}/api/tasks/${userId}/${taskId}/comments`, {
      text,
      user_name: userName
    });
    return response.data;
  }
};

// ============================================
// SEED DATA API
// ============================================
export const seedApi = {
  seedUserData: async (userId) => {
    const response = await axios.post(`${API_URL}/api/seed/${userId}`);
    return response.data;
  }
};

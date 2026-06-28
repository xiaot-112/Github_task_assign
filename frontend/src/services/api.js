import axios from 'axios';

const API_BASE_URL = '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 仓库管理
export const repositoryAPI = {
  getAll: () => api.get('/repositories'),
  save: (data) => api.post('/repositories', data),
  delete: (id) => api.delete(`/repositories/${encodeURIComponent(id)}`),
};

// 贡献者管理
export const contributorAPI = {
  getAll: () => api.get('/contributors'),
  save: (data) => api.post('/contributors', data),
  update: (id, data) => api.put(`/contributors/${id}`, data),
  delete: (id) => api.delete(`/contributors/${id}`),
};

// 模型配置
export const modelAPI = {
  getAll: () => api.get('/models'),
  save: (data) => api.post('/models', data),
  delete: (id) => api.delete(`/models/${id}`),
  test: (data) => api.post('/models/test', data),
};

// 提示词模板
export const promptAPI = {
  getAll: () => api.get('/prompts'),
  save: (data) => api.post('/prompts', data),
  update: (id, data) => api.put(`/prompts/${id}`, data),
  delete: (id) => api.delete(`/prompts/${id}`),
};

// 任务管理
export const taskAPI = {
  extract: (data) => api.post('/tasks/extract', data),
  getAll: () => api.get('/tasks'),
  match: () => api.post('/tasks/match'),
};

// 分配结果
export const assignmentAPI = {
  getAll: () => api.get('/assignments'),
};

// 系统设置
export const settingsAPI = {
  get: () => api.get('/settings'),
  update: (data) => api.put('/settings', data),
};

export default api;

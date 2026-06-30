import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 会话管理
export const conversationsAPI = {
  // 获取会话列表
  list: () => api.get('/conversations'),
  
  // 创建新会话
  create: (title) => api.post('/conversations', { title }),
  
  // 获取会话详情（含消息）
  get: (id) => api.get(`/conversations/${id}`),
  
  // 删除会话
  delete: (id) => api.delete(`/conversations/${id}`),
  
  // 发送消息（SSE 流式）
  sendMessage: (conversationId, content) => 
    api.post(`/conversations/${conversationId}/stream`, { content }, {
      responseType: 'text',
    }),
};

// 仓库配置
export const repositoriesAPI = {
  list: () => api.get('/repositories'),
  create: (data) => api.post('/repositories', data),
  update: (id, data) => api.put(`/repositories/${id}`, data),
  delete: (id) => api.delete(`/repositories/${id}`),
};

// 贡献者管理
export const contributorsAPI = {
  list: () => api.get('/contributors'),
  create: (data) => api.post('/contributors', data),
  update: (id, data) => api.put(`/contributors/${id}`, data),
  delete: (id) => api.delete(`/contributors/${id}`),
};

// 模型配置
export const modelsAPI = {
  list: () => api.get('/models'),
  create: (data) => api.post('/models', data),
  delete: (id) => api.delete(`/models/${id}`),
  test: (data) => api.post('/models/test', data),
};

// 任务管理
export const tasksAPI = {
  list: () => api.get('/tasks'),
  extract: (repositoryId) => api.post('/tasks/extract', { repository_id: repositoryId }),
};

// 分配结果
export const assignmentsAPI = {
  list: () => api.get('/assignments'),
};

export default api;

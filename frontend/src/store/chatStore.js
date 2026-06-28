import { create } from 'zustand';
import axios from 'axios';

const API_BASE = 'http://localhost:8000/api';

export const useChatStore = create((set, get) => ({
  // 状态
  conversations: [],
  currentConversationId: null,
  messages: [],
  isLoading: false,
  isStreaming: false,
  
  // 获取会话列表
  fetchConversations: async () => {
    try {
      const response = await axios.get(`${API_BASE}/conversations`);
      set({ conversations: response.data });
    } catch (error) {
      console.error('获取会话列表失败:', error);
    }
  },
  
  // 创建新会话
  createConversation: async (title = '新会话') => {
    try {
      const response = await axios.post(`${API_BASE}/conversations`, { title });
      const newConv = response.data;
      set(state => ({
        conversations: [newConv, ...state.conversations],
        currentConversationId: newConv.id,
        messages: []
      }));
      return newConv;
    } catch (error) {
      console.error('创建会话失败:', error);
      throw error;
    }
  },
  
  // 选择会话
  selectConversation: async (convId) => {
    if (convId === get().currentConversationId) return;
    
    set({ currentConversationId: convId, isLoading: true });
    try {
      const response = await axios.get(`${API_BASE}/conversations/${convId}/messages`);
      set({ messages: response.data, isLoading: false });
    } catch (error) {
      console.error('获取消息失败:', error);
      set({ isLoading: false });
    }
  },
  
  // 删除会话
  deleteConversation: async (convId) => {
    try {
      await axios.delete(`${API_BASE}/conversations/${convId}`);
      set(state => ({
        conversations: state.conversations.filter(c => c.id !== convId),
        currentConversationId: state.currentConversationId === convId ? null : state.currentConversationId,
        messages: state.currentConversationId === convId ? [] : state.messages
      }));
    } catch (error) {
      console.error('删除会话失败:', error);
    }
  },
  
  // 发送消息（SSE 流式）
  sendMessage: async (content) => {
    const { currentConversationId } = get();
    if (!currentConversationId) {
      throw new Error('请先创建或选择会话');
    }
    
    // 添加用户消息到本地
    const userMessage = {
      id: Date.now(),
      role: 'user',
      content,
      created_at: new Date().toISOString()
    };
    
    set(state => ({
      messages: [...state.messages, userMessage],
      isStreaming: true
    }));
    
    // 创建 AI 消息占位符
    const aiMessageId = Date.now() + 1;
    set(state => ({
      messages: [...state.messages, {
        id: aiMessageId,
        role: 'assistant',
        content: '',
        created_at: new Date().toISOString()
      }]
    }));
    
    // SSE 流式请求
    const eventSource = new EventSource(
      `${API_BASE}/conversations/${currentConversationId}/stream?content=${encodeURIComponent(content)}`
    );
    
    let fullContent = '';
    
    return new Promise((resolve, reject) => {
      eventSource.onmessage = (event) => {
        if (event.data === '[DONE]') {
          eventSource.close();
          set({ isStreaming: false });
          resolve(fullContent);
          return;
        }
        
        try {
          const data = JSON.parse(event.data);
          
          if (data.type === 'text') {
            fullContent += data.data;
            set(state => ({
              messages: state.messages.map(m => 
                m.id === aiMessageId ? { ...m, content: fullContent } : m
              )
            }));
          } else if (data.type === 'tool_call') {
            set(state => ({
              messages: [...state.messages, {
                id: Date.now(),
                role: 'tool',
                tool_call: data.data,
                created_at: new Date().toISOString()
              }]
            }));
          } else if (data.type === 'tool_result') {
            set(state => ({
              messages: [...state.messages, {
                id: Date.now(),
                role: 'tool_result',
                content: JSON.stringify(data.data),
                created_at: new Date().toISOString()
              }]
            }));
          } else if (data.type === 'error') {
            eventSource.close();
            set({ isStreaming: false });
            reject(new Error(data.data));
          }
        } catch (e) {
          console.error('解析 SSE 数据失败:', e);
        }
      };
      
      eventSource.onerror = (error) => {
        eventSource.close();
        set({ isStreaming: false });
        reject(error);
      };
    });
  },
  
  // 清空当前会话
  clearCurrentConversation: () => {
    set({ currentConversationId: null, messages: [] });
  }
}));

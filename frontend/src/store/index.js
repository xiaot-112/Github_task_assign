import { create } from 'zustand';

const useStore = create((set) => ({
  // 仓库配置
  repositories: [],
  setRepositories: (repos) => set({ repositories: repos }),
  
  // 贡献者
  contributors: [],
  setContributors: (contributors) => set({ contributors }),
  
  // 模型配置
  models: [],
  setModels: (models) => set({ models }),
  selectedModel: null,
  setSelectedModel: (model) => set({ selectedModel: model }),
  
  // 提示词模板
  prompts: [],
  setPrompts: (prompts) => set({ prompts }),
  selectedPrompt: null,
  setSelectedPrompt: (prompt) => set({ selectedPrompt: prompt }),
  
  // 任务
  tasks: [],
  setTasks: (tasks) => set({ tasks }),
  
  // 分配结果
  assignments: [],
  setAssignments: (assignments) => set({ assignments }),
  
  // 系统设置
  settings: {
    auto_fetch_interval: 3600,
    max_tasks_per_contributor: 5,
    notification_enabled: true,
    language: 'zh-CN',
  },
  setSettings: (settings) => set({ settings }),
  
  // UI状态
  loading: false,
  setLoading: (loading) => set({ loading }),
}));

export default useStore;

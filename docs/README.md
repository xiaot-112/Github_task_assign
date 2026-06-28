# AI 任务分配代理系统

## 系统概述

AI 任务分配代理系统是一个基于 GitHub Issue 和 Pull Request 的智能任务分配平台。该系统能够自动从代码仓库中提取任务信息，并根据贡献者的技能、经验等因素进行智能匹配，为团队提供最优的任务分配方案。

## 技术栈

### 后端
- **框架**: FastAPI (Python)
- **数据存储**: JSON 文件（可扩展为数据库）
- **HTTP 客户端**: httpx
- **数据验证**: Pydantic

### 前端
- **框架**: React 18
- **UI 组件库**: Ant Design 5
- **状态管理**: Zustand
- **HTTP 客户端**: Axios
- **构建工具**: Vite

## 功能模块

### 1. 仓库连接配置
- 支持配置多个 GitHub 仓库
- 可设置 GitHub Token 访问私有仓库
- 实时获取 Issues 和 Pull Requests

### 2. 贡献者信息管理
- 维护贡献者技能列表
- 记录经验水平（初级/中级/高级/专家）
- 设置可用性（全职/兼职/周末/灵活）
- 指定偏好编程语言

### 3. AI 模型配置
- 兼容 OpenAI API 协议
- 支持自定义 API 端点
- 可配置温度参数和最大 Token 数
- 支持多模型切换
- 连接测试功能

### 4. 提示词模板管理
- 创建和编辑提示词模板
- 支持变量插入（如 `{task_description}`, `{contributor_skills}`）
- 自动解析模板变量
- 多模板管理

### 5. 任务提取与分析
- 自动从 GitHub Issues 提取任务
- 自动从 Pull Requests 提取任务
- 识别任务优先级和标签
- 记录任务来源 URL

### 6. 任务匹配算法
- 基于技能的匹配度计算
- AI 辅助分析推荐理由
- 匹配度排序展示
- 可视化匹配结果

### 7. 系统设置
- 自动获取间隔配置
- 每人最大任务数限制
- 通知开关
- 界面语言设置

## 快速开始

### 环境要求
- Python 3.9+
- Node.js 16+
- npm 或 yarn

### 后端启动

```bash
cd backend

# 安装依赖
pip install -r requirements.txt

# 启动服务
python main.py
# 或使用 uvicorn
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

后端服务将在 `http://localhost:8000` 启动
API 文档地址：`http://localhost:8000/docs`

### 前端启动

```bash
cd frontend

# 安装依赖
npm install

# 开发模式
npm run dev

# 生产构建
npm run build
```

前端服务将在 `http://localhost:3000` 启动

## API 接口

### 仓库管理
- `GET /api/repositories` - 获取所有仓库配置
- `POST /api/repositories` - 保存仓库配置
- `DELETE /api/repositories/{repo_id}` - 删除仓库配置

### 贡献者管理
- `GET /api/contributors` - 获取所有贡献者
- `POST /api/contributors` - 添加贡献者
- `PUT /api/contributors/{id}` - 更新贡献者
- `DELETE /api/contributors/{id}` - 删除贡献者

### 模型配置
- `GET /api/models` - 获取所有模型配置
- `POST /api/models` - 保存模型配置
- `DELETE /api/models/{id}` - 删除模型配置
- `POST /api/models/test` - 测试模型连接

### 提示词模板
- `GET /api/prompts` - 获取所有模板
- `POST /api/prompts` - 保存模板
- `PUT /api/prompts/{id}` - 更新模板
- `DELETE /api/prompts/{id}` - 删除模板

### 任务管理
- `POST /api/tasks/extract` - 从仓库提取任务
- `GET /api/tasks` - 获取所有任务
- `POST /api/tasks/match` - 执行任务匹配

### 分配结果
- `GET /api/assignments` - 获取分配结果

### 系统设置
- `GET /api/settings` - 获取系统设置
- `PUT /api/settings` - 更新系统设置

## 数据模型

### RepositoryConfig
```json
{
  "repo_owner": "octocat",
  "repo_name": "hello-world",
  "github_token": "ghp_xxx"
}
```

### Contributor
```json
{
  "name": "张三",
  "skills": ["JavaScript", "Python", "React"],
  "experience_level": "senior",
  "availability": "full_time",
  "description": "资深全栈开发者",
  "preferred_languages": ["Chinese", "English"]
}
```

### ModelConfig
```json
{
  "endpoint": "https://api.openai.com/v1",
  "api_key": "sk-xxx",
  "model_name": "gpt-3.5-turbo",
  "temperature": 0.7,
  "max_tokens": 2048
}
```

### PromptTemplate
```json
{
  "name": "任务匹配模板",
  "description": "用于任务与贡献者匹配的提示词",
  "template": "你是一个任务分配助手...\n任务：{task_description}\n贡献者技能：{skills}",
  "variables": ["task_description", "skills"]
}
```

## 使用流程

1. **配置仓库**: 在"仓库连接配置"模块添加需要监控的 GitHub 仓库
2. **添加贡献者**: 在"贡献者信息"模块录入团队成员及其技能
3. **配置 AI 模型**: 在"AI 模型配置"模块设置使用的 AI 模型
4. **创建提示词**: 在"提示词模板管理"模块设计匹配逻辑
5. **提取任务**: 点击"提取任务"按钮从 GitHub 获取最新任务
6. **执行匹配**: 点击"执行匹配"按钮生成任务分配方案
7. **查看结果**: 在"任务分配结果"模块查看匹配度和推荐理由

## 安全注意事项

- GitHub Token 仅存储在服务器端，前端显示时会脱敏
- API 密钥在存储和传输时都会进行保护
- 建议在生产环境使用 HTTPS
- 定期更新和轮换敏感凭据

## 扩展开发

### 添加新的 AI 模型提供商

修改 `backend/main.py` 中的 `AIService` 类，添加对新 API 的支持：

```python
class AIService:
    async def call_model(self, prompt, config):
        # 添加对新模型的支持
        if config.endpoint.includes("custom-provider"):
            return await self.call_custom_provider(prompt, config)
```

### 集成数据库

将 JSON 存储替换为数据库：

```python
# 替换 load_json/save_json 为数据库操作
from sqlalchemy import create_engine

engine = create_engine("sqlite:///tasks.db")
```

## 故障排除

### 常见问题

1. **无法连接 GitHub API**
   - 检查网络连接
   - 确认 GitHub Token 有效
   - 检查 API 速率限制

2. **AI 模型连接失败**
   - 验证 API 端点正确
   - 确认 API 密钥有效
   - 检查模型名称是否正确

3. **前端无法连接后端**
   - 确认后端服务已启动
   - 检查端口配置（默认 8000）
   - 查看浏览器控制台错误

## 许可证

MIT License

## 贡献

欢迎提交 Issue 和 Pull Request！

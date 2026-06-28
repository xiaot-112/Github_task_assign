"""
AI任务分配代理系统 - 后端服务
基于FastAPI构建，提供RESTful API接口
"""

from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import json
import os
from datetime import datetime
import httpx

app = FastAPI(
    title="AI Task Assignment Agent System",
    description="基于GitHub Issue和PR的任务分配系统",
    version="1.0.0"
)

# CORS配置
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==================== 数据模型 ====================

class RepositoryConfig(BaseModel):
    """仓库连接配置"""
    repo_owner: str = Field(..., description="仓库所有者")
    repo_name: str = Field(..., description="仓库名称")
    github_token: Optional[str] = Field(None, description="GitHub Token")
    
class Contributor(BaseModel):
    """贡献者信息"""
    id: Optional[str] = None
    name: str
    skills: List[str]
    experience_level: str
    availability: str
    description: str
    preferred_languages: List[str] = []
    
class ModelConfig(BaseModel):
    """AI模型配置"""
    endpoint: str = Field(..., description="API端点")
    api_key: str = Field(..., description="API密钥")
    model_name: str = Field(..., description="模型名称")
    temperature: float = Field(0.7, ge=0, le=2, description="温度参数")
    max_tokens: int = Field(2048, ge=100, le=8192, description="最大token数")
    
class PromptTemplate(BaseModel):
    """提示词模板"""
    id: Optional[str] = None
    name: str
    description: str
    template: str
    variables: List[str] = []
    created_at: Optional[str] = None
    
class TaskInfo(BaseModel):
    """任务信息"""
    id: str
    title: str
    description: str
    source_type: str  # "issue" or "pr"
    source_url: str
    skills_required: List[str] = []
    priority: str = "medium"
    deadline: Optional[str] = None
    labels: List[str] = []
    created_at: str
    
class TaskAssignment(BaseModel):
    """任务分配结果"""
    task_id: str
    contributor_id: str
    match_score: float
    reasons: List[str]
    assigned_at: str
    
class SystemSettings(BaseModel):
    """系统设置"""
    auto_fetch_interval: int = 3600  # 自动获取间隔（秒）
    max_tasks_per_contributor: int = 5
    notification_enabled: bool = True
    language: str = "zh-CN"

# ==================== 数据存储 ====================

DATA_DIR = os.path.join(os.path.dirname(__file__), "data")
os.makedirs(DATA_DIR, exist_ok=True)

def load_json(filename: str, default: Any = None) -> Any:
    """加载JSON文件"""
    filepath = os.path.join(DATA_DIR, filename)
    if os.path.exists(filepath):
        with open(filepath, 'r', encoding='utf-8') as f:
            return json.load(f)
    return default if default is not None else {}

def save_json(filename: str, data: Any) -> None:
    """保存JSON文件"""
    filepath = os.path.join(DATA_DIR, filename)
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

# ==================== GitHub服务 ====================

class GitHubService:
    """GitHub API服务"""
    
    def __init__(self, token: Optional[str] = None):
        self.base_url = "https://api.github.com"
        self.headers = {
            "Accept": "application/vnd.github.v3+json",
            "User-Agent": "AI-Task-Assistant/1.0"
        }
        if token:
            self.headers["Authorization"] = f"token {token}"
    
    async def fetch_issues(self, owner: str, repo: str) -> List[Dict]:
        """获取仓库Issues"""
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.base_url}/repos/{owner}/{repo}/issues",
                headers=self.headers,
                params={"state": "open"}
            )
            response.raise_for_status()
            return response.json()
    
    async def fetch_pull_requests(self, owner: str, repo: str) -> List[Dict]:
        """获取仓库Pull Requests"""
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.base_url}/repos/{owner}/{repo}/pulls",
                headers=self.headers,
                params={"state": "open"}
            )
            response.raise_for_status()
            return response.json()

github_service = GitHubService()

# ==================== AI模型服务 ====================

class AIService:
    """AI模型服务"""
    
    def __init__(self, config: ModelConfig):
        self.config = config
    
    async def extract_tasks(self, content: str, prompt_template: str) -> List[TaskInfo]:
        """从内容中提取任务信息"""
        # 模拟AI调用，实际应调用配置的AI模型
        return []
    
    async def match_tasks(self, tasks: List[TaskInfo], contributors: List[Contributor], 
                          prompt_template: str) -> List[TaskAssignment]:
        """匹配任务与贡献者"""
        # 模拟AI匹配逻辑
        assignments = []
        for task in tasks:
            for contributor in contributors:
                # 计算匹配度（简化版本）
                skill_match = len(set(task.skills_required) & set(contributor.skills))
                match_score = min(1.0, skill_match / max(1, len(task.skills_required)))
                
                if match_score > 0.3:  # 阈值
                    assignments.append(TaskAssignment(
                        task_id=task.id,
                        contributor_id=contributor.id or contributor.name,
                        match_score=match_score,
                        reasons=[f"技能匹配：{skill_match}项"],
                        assigned_at=datetime.now().isoformat()
                    ))
        
        # 按匹配度排序
        assignments.sort(key=lambda x: x.match_score, reverse=True)
        return assignments

# ==================== API路由 ====================

@app.get("/")
async def root():
    """根路径"""
    return {"message": "AI任务分配代理系统API", "version": "1.0.0"}

# --- 仓库配置管理 ---

@app.post("/api/repositories")
async def save_repository(config: RepositoryConfig):
    """保存仓库配置"""
    repos = load_json("repositories.json", [])
    if not isinstance(repos, list):
        repos = []
    
    repo_id = f"{config.repo_owner}/{config.repo_name}"
    # 检查是否已存在
    existing = next((r for r in repos if f"{r['repo_owner']}/{r['repo_name']}" == repo_id), None)
    if existing:
        raise HTTPException(status_code=400, detail="仓库配置已存在")
    
    config_dict = config.dict()
    config_dict['id'] = repo_id
    config_dict['created_at'] = datetime.now().isoformat()
    repos.append(config_dict)
    save_json("repositories.json", repos)
    return {"status": "success", "data": config_dict}

@app.get("/api/repositories")
async def get_repositories():
    """获取所有仓库配置"""
    repos = load_json("repositories.json", [])
    if not isinstance(repos, list):
        repos = []
    # 移除敏感信息
    sanitized = [{**r, "github_token": "***"} if r.get("github_token") else r for r in repos]
    return {"data": sanitized}

@app.delete("/api/repositories/{repo_id}")
async def delete_repository(repo_id: str):
    """删除仓库配置"""
    repos = load_json("repositories.json", [])
    if not isinstance(repos, list):
        repos = []
    repos = [r for r in repos if f"{r['repo_owner']}/{r['repo_name']}" != repo_id]
    save_json("repositories.json", repos)
    return {"status": "success"}

# --- 贡献者管理 ---

@app.post("/api/contributors")
async def save_contributor(contributor: Contributor):
    """保存贡献者信息"""
    contributors = load_json("contributors.json", [])
    if not isinstance(contributors, list):
        contributors = []
    
    contributor_dict = contributor.dict()
    if not contributor_dict.get('id'):
        contributor_dict['id'] = f"contrib_{datetime.now().timestamp()}"
    contributor_dict['created_at'] = datetime.now().isoformat()
    contributors.append(contributor_dict)
    save_json("contributors.json", contributors)
    return {"status": "success", "data": contributor_dict}

@app.get("/api/contributors")
async def get_contributors():
    """获取所有贡献者"""
    contributors = load_json("contributors.json", [])
    if not isinstance(contributors, list):
        contributors = []
    return {"data": contributors}

@app.put("/api/contributors/{contributor_id}")
async def update_contributor(contributor_id: str, contributor: Contributor):
    """更新贡献者信息"""
    contributors = load_json("contributors.json", [])
    if not isinstance(contributors, list):
        contributors = []
    
    for i, c in enumerate(contributors):
        if c.get('id') == contributor_id:
            contributor_dict = contributor.dict()
            contributor_dict['id'] = contributor_id
            contributor_dict['updated_at'] = datetime.now().isoformat()
            contributors[i] = contributor_dict
            save_json("contributors.json", contributors)
            return {"status": "success", "data": contributor_dict}
    
    raise HTTPException(status_code=404, detail="贡献者不存在")

@app.delete("/api/contributors/{contributor_id}")
async def delete_contributor(contributor_id: str):
    """删除贡献者"""
    contributors = load_json("contributors.json", [])
    if not isinstance(contributors, list):
        contributors = []
    contributors = [c for c in contributors if c.get('id') != contributor_id]
    save_json("contributors.json", contributors)
    return {"status": "success"}

# --- 模型配置管理 ---

@app.post("/api/models")
async def save_model_config(config: ModelConfig):
    """保存模型配置"""
    models = load_json("models.json", [])
    if not isinstance(models, list):
        models = []
    
    config_dict = config.dict()
    config_dict['id'] = f"model_{datetime.now().timestamp()}"
    config_dict['created_at'] = datetime.now().isoformat()
    models.append(config_dict)
    save_json("models.json", models)
    return {"status": "success", "data": config_dict}

@app.get("/api/models")
async def get_model_configs():
    """获取所有模型配置"""
    models = load_json("models.json", [])
    if not isinstance(models, list):
        models = []
    # 移除敏感信息
    sanitized = [{**m, "api_key": "***"} if m.get("api_key") else m for m in models]
    return {"data": sanitized}

@app.delete("/api/models/{model_id}")
async def delete_model_config(model_id: str):
    """删除模型配置"""
    models = load_json("models.json", [])
    if not isinstance(models, list):
        models = []
    models = [m for m in models if m.get('id') != model_id]
    save_json("models.json", models)
    return {"status": "success"}

@app.post("/api/models/test")
async def test_model_connection(config: ModelConfig):
    """测试模型连接"""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{config.endpoint}/chat/completions",
                headers={
                    "Authorization": f"Bearer {config.api_key}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": config.model_name,
                    "messages": [{"role": "user", "content": "Hello"}],
                    "max_tokens": 10
                },
                timeout=30.0
            )
            response.raise_for_status()
            return {"status": "success", "message": "连接成功"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"连接失败：{str(e)}")

# --- 提示词模板管理 ---

@app.post("/api/prompts")
async def save_prompt_template(template: PromptTemplate):
    """保存提示词模板"""
    templates = load_json("prompts.json", [])
    if not isinstance(templates, list):
        templates = []
    
    template_dict = template.dict()
    if not template_dict.get('id'):
        template_dict['id'] = f"prompt_{datetime.now().timestamp()}"
    template_dict['created_at'] = datetime.now().isoformat()
    templates.append(template_dict)
    save_json("prompts.json", templates)
    return {"status": "success", "data": template_dict}

@app.get("/api/prompts")
async def get_prompt_templates():
    """获取所有提示词模板"""
    templates = load_json("prompts.json", [])
    if not isinstance(templates, list):
        templates = []
    return {"data": templates}

@app.put("/api/prompts/{prompt_id}")
async def update_prompt_template(prompt_id: str, template: PromptTemplate):
    """更新提示词模板"""
    templates = load_json("prompts.json", [])
    if not isinstance(templates, list):
        templates = []
    
    for i, t in enumerate(templates):
        if t.get('id') == prompt_id:
            template_dict = template.dict()
            template_dict['id'] = prompt_id
            template_dict['updated_at'] = datetime.now().isoformat()
            templates[i] = template_dict
            save_json("prompts.json", templates)
            return {"status": "success", "data": template_dict}
    
    raise HTTPException(status_code=404, detail="模板不存在")

@app.delete("/api/prompts/{prompt_id}")
async def delete_prompt_template(prompt_id: str):
    """删除提示词模板"""
    templates = load_json("prompts.json", [])
    if not isinstance(templates, list):
        templates = []
    templates = [t for t in templates if t.get('id') != prompt_id]
    save_json("prompts.json", templates)
    return {"status": "success"}

# --- 任务提取与匹配 ---

@app.post("/api/tasks/extract")
async def extract_tasks(repo_config: RepositoryConfig):
    """从仓库提取任务"""
    try:
        gh = GitHubService(repo_config.github_token)
        
        # 获取Issues和PRs
        issues = await gh.fetch_issues(repo_config.repo_owner, repo_config.repo_name)
        prs = await gh.fetch_pull_requests(repo_config.repo_owner, repo_config.repo_name)
        
        tasks = []
        
        # 处理Issues
        for issue in issues:
            if 'pull_request' not in issue:  # 排除PR转换的issue
                task = TaskInfo(
                    id=f"issue_{issue['number']}",
                    title=issue['title'],
                    description=issue.get('body', '')[:500],
                    source_type="issue",
                    source_url=issue['html_url'],
                    skills_required=[],  # 需要AI提取
                    priority="medium",
                    labels=[label['name'] for label in issue.get('labels', [])],
                    created_at=issue['created_at']
                )
                tasks.append(task)
        
        # 处理PRs
        for pr in prs:
            task = TaskInfo(
                id=f"pr_{pr['number']}",
                title=pr['title'],
                description=pr.get('body', '')[:500],
                source_type="pr",
                source_url=pr['html_url'],
                skills_required=[],
                priority="medium",
                labels=[label['name'] for label in pr.get('labels', [])],
                created_at=pr['created_at']
            )
            tasks.append(task)
        
        # 保存任务
        existing_tasks = load_json("tasks.json", [])
        if not isinstance(existing_tasks, list):
            existing_tasks = []
        
        all_tasks = existing_tasks + [t.dict() for t in tasks]
        save_json("tasks.json", all_tasks)
        
        return {"status": "success", "data": [t.dict() for t in tasks], "count": len(tasks)}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"提取任务失败：{str(e)}")

@app.get("/api/tasks")
async def get_tasks():
    """获取所有任务"""
    tasks = load_json("tasks.json", [])
    if not isinstance(tasks, list):
        tasks = []
    return {"data": tasks}

@app.post("/api/tasks/match")
async def match_tasks():
    """执行任务匹配"""
    try:
        # 获取任务和贡献者
        tasks_data = load_json("tasks.json", [])
        if not isinstance(tasks_data, list):
            tasks_data = []
        
        contributors_data = load_json("contributors.json", [])
        if not isinstance(contributors_data, list):
            contributors_data = []
        
        if not tasks_data or not contributors_data:
            return {"status": "success", "data": [], "message": "没有足够的任务或贡献者数据"}
        
        # 转换为模型对象
        tasks = [TaskInfo(**t) for t in tasks_data]
        contributors = [Contributor(**c) for c in contributors_data]
        
        # 获取默认模型配置
        models = load_json("models.json", [])
        if not models:
            # 使用简化的本地匹配逻辑
            ai_service = AIService(ModelConfig(
                endpoint="",
                api_key="",
                model_name=""
            ))
        else:
            ai_service = AIService(**models[0])
        
        # 执行匹配
        assignments = await ai_service.match_tasks(tasks, contributors, "")
        
        # 保存匹配结果
        save_json("assignments.json", [a.dict() for a in assignments])
        
        return {"status": "success", "data": [a.dict() for a in assignments]}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"匹配失败：{str(e)}")

@app.get("/api/assignments")
async def get_assignments():
    """获取任务分配结果"""
    assignments = load_json("assignments.json", [])
    if not isinstance(assignments, list):
        assignments = []
    return {"data": assignments}

# --- 系统设置 ---

@app.get("/api/settings")
async def get_settings():
    """获取系统设置"""
    settings = load_json("settings.json", {
        "auto_fetch_interval": 3600,
        "max_tasks_per_contributor": 5,
        "notification_enabled": True,
        "language": "zh-CN"
    })
    return {"data": settings}

@app.put("/api/settings")
async def update_settings(settings: SystemSettings):
    """更新系统设置"""
    save_json("settings.json", settings.dict())
    return {"status": "success", "data": settings.dict()}

# --- 历史记录 ---

@app.get("/api/history")
async def get_history(limit: int = 50):
    """获取操作历史"""
    history = load_json("history.json", [])
    if not isinstance(history, list):
        history = []
    return {"data": history[-limit:]}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

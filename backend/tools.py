"""工具注册系统 - 将业务功能封装为可调用工具"""
import httpx
from typing import Dict, Any, List, Optional, Callable
from datetime import datetime
import json


class ToolRegistry:
    """工具注册表"""
    
    def __init__(self):
        self.tools: Dict[str, Dict[str, Any]] = {}
    
    def register(self, name: str, description: str, parameters: Dict[str, Any]):
        """注册一个工具"""
        def decorator(func: Callable):
            self.tools[name] = {
                "name": name,
                "description": description,
                "parameters": parameters,
                "function": func
            }
            return func
        return decorator
    
    def get_tool(self, name: str) -> Optional[Dict[str, Any]]:
        """获取工具"""
        return self.tools.get(name)
    
    def list_tools(self) -> List[Dict[str, Any]]:
        """列出所有工具"""
        return [
            {
                "name": tool["name"],
                "description": tool["description"],
                "parameters": tool["parameters"]
            }
            for tool in self.tools.values()
        ]
    
    async def execute(self, name: str, **kwargs) -> Dict[str, Any]:
        """执行工具"""
        tool = self.get_tool(name)
        if not tool:
            return {"error": f"Tool {name} not found"}
        
        try:
            result = await tool["function"](**kwargs)
            return {"success": True, "result": result}
        except Exception as e:
            return {"success": False, "error": str(e)}


# 创建全局工具注册表
tool_registry = ToolRegistry()


@tool_registry.register(
    name="fetch_github_tasks",
    description="从 GitHub 仓库提取 Issues 和 Pull Requests 作为任务",
    parameters={
        "type": "object",
        "properties": {
            "repository_id": {"type": "integer", "description": "仓库 ID"}
        },
        "required": ["repository_id"]
    }
)
async def fetch_github_tasks(repository_id: int, db=None) -> Dict[str, Any]:
    """从 GitHub 提取任务"""
    from .models import Repository, Task
    from sqlalchemy.orm import Session
    
    if not db:
        return {"error": "Database session required"}
    
    # 获取仓库配置
    repo = db.query(Repository).filter(Repository.id == repository_id).first()
    if not repo:
        return {"error": "Repository not found"}
    
    # 调用 GitHub API
    headers = {"Authorization": f"token {repo.token}"}
    tasks = []
    
    async with httpx.AsyncClient() as client:
        # 获取 Issues
        try:
            response = await client.get(
                f"https://api.github.com/repos/{repo.owner}/{repo.name}/issues",
                headers=headers,
                params={"state": "open", "per_page": 50}
            )
            if response.status_code == 200:
                issues = response.json()
                for issue in issues[:20]:  # 限制数量
                    task = Task(
                        github_id=issue["id"],
                        title=issue["title"],
                        description=issue.get("body", ""),
                        type="issue",
                        labels=[label["name"] for label in issue.get("labels", [])],
                        url=issue.get("html_url", ""),
                        status="open"
                    )
                    db.add(task)
                    tasks.append({
                        "id": task.github_id,
                        "title": task.title,
                        "type": "issue",
                        "url": task.url
                    })
        except Exception as e:
            pass
        
        # 获取 Pull Requests
        try:
            response = await client.get(
                f"https://api.github.com/repos/{repo.owner}/{repo.name}/pulls",
                headers=headers,
                params={"state": "open", "per_page": 50}
            )
            if response.status_code == 200:
                prs = response.json()
                for pr in prs[:20]:
                    task = Task(
                        github_id=pr["id"],
                        title=pr["title"],
                        description=pr.get("body", ""),
                        type="pull_request",
                        labels=[label["name"] for label in pr.get("labels", [])],
                        url=pr.get("html_url", ""),
                        status="open"
                    )
                    db.add(task)
                    tasks.append({
                        "id": task.github_id,
                        "title": task.title,
                        "type": "pull_request",
                        "url": task.url
                    })
        except Exception as e:
            pass
        
        db.commit()
    
    return {"tasks": tasks, "count": len(tasks)}


@tool_registry.register(
    name="list_contributors",
    description="获取所有贡献者列表",
    parameters={
        "type": "object",
        "properties": {},
        "required": []
    }
)
async def list_contributors(db=None) -> Dict[str, Any]:
    """列出贡献者"""
    from .models import Contributor
    from sqlalchemy.orm import Session
    
    if not db:
        return {"error": "Database session required"}
    
    contributors = db.query(Contributor).all()
    return {
        "contributors": [
            {
                "id": c.id,
                "name": c.name,
                "skills": c.skills,
                "experience_level": c.experience_level
            }
            for c in contributors
        ],
        "count": len(contributors)
    }


@tool_registry.register(
    name="add_contributor",
    description="添加新的贡献者",
    parameters={
        "type": "object",
        "properties": {
            "name": {"type": "string", "description": "贡献者姓名"},
            "skills": {"type": "string", "description": "技能列表，逗号分隔"},
            "experience_level": {"type": "string", "description": "经验水平"},
            "description": {"type": "string", "description": "详细描述"}
        },
        "required": ["name"]
    }
)
async def add_contributor(
    name: str,
    skills: Optional[str] = None,
    experience_level: Optional[str] = None,
    description: Optional[str] = None,
    db=None
) -> Dict[str, Any]:
    """添加贡献者"""
    from .models import Contributor
    from sqlalchemy.orm import Session
    
    if not db:
        return {"error": "Database session required"}
    
    contributor = Contributor(
        name=name,
        skills=skills,
        experience_level=experience_level,
        description=description
    )
    db.add(contributor)
    db.commit()
    db.refresh(contributor)
    
    return {
        "id": contributor.id,
        "name": contributor.name,
        "skills": contributor.skills,
        "message": f"成功添加贡献者：{name}"
    }


@tool_registry.register(
    name="match_tasks",
    description="AI 匹配任务与贡献者，返回匹配度排序结果",
    parameters={
        "type": "object",
        "properties": {
            "contributor_id": {"type": "integer", "description": "贡献者 ID"},
            "limit": {"type": "integer", "description": "返回结果数量", "default": 10}
        },
        "required": []
    }
)
async def match_tasks(
    contributor_id: Optional[int] = None,
    limit: int = 10,
    db=None
) -> Dict[str, Any]:
    """匹配任务"""
    from .models import Contributor, Task, Assignment, ModelConfig
    from sqlalchemy.orm import Session
    
    if not db:
        return {"error": "Database session required"}
    
    # 获取贡献者
    if contributor_id:
        contributor = db.query(Contributor).filter(Contributor.id == contributor_id).first()
        if not contributor:
            return {"error": "Contributor not found"}
        contributor_desc = f"姓名:{contributor.name}, 技能:{contributor.skills}, 经验:{contributor.experience_level}, 描述:{contributor.description}"
    else:
        contributor_desc = "未指定贡献者"
    
    # 获取任务
    tasks = db.query(Task).filter(Task.status == "open").limit(limit).all()
    
    # 简单匹配逻辑（基于技能关键词）
    matches = []
    if contributor and contributor.skills:
        skills_lower = [s.strip().lower() for s in contributor.skills.split(",")]
        
        for task in tasks:
            score = 0.5  # 基础分
            reason_parts = []
            
            # 检查标题匹配
            task_text = (task.title + " " + (task.description or "")).lower()
            matched_skills = [s for s in skills_lower if s in task_text]
            
            if matched_skills:
                score += len(matched_skills) * 0.15
                reason_parts.append(f"匹配技能：{', '.join(matched_skills)}")
            
            # 检查标签匹配
            if task.labels:
                matched_labels = [l for l in task.labels if any(s in l.lower() for s in skills_lower)]
                if matched_labels:
                    score += len(matched_labels) * 0.1
                    reason_parts.append(f"相关标签：{', '.join(matched_labels)}")
            
            score = min(score, 1.0)
            
            matches.append({
                "task_id": task.id,
                "task_title": task.title,
                "task_type": task.type,
                "contributor_id": contributor.id if contributor else None,
                "match_score": round(score, 2),
                "reason": "; ".join(reason_parts) if reason_parts else "基于任务内容的一般匹配"
            })
    
    # 按匹配度排序
    matches.sort(key=lambda x: x["match_score"], reverse=True)
    
    return {
        "matches": matches,
        "contributor": contributor_desc,
        "count": len(matches)
    }


@tool_registry.register(
    name="get_task_assignments",
    description="获取任务分配结果",
    parameters={
        "type": "object",
        "properties": {},
        "required": []
    }
)
async def get_task_assignments(db=None) -> Dict[str, Any]:
    """获取分配结果"""
    from .models import Assignment, Task, Contributor
    from sqlalchemy.orm import Session
    
    if not db:
        return {"error": "Database session required"}
    
    assignments = db.query(Assignment).all()
    
    return {
        "assignments": [
            {
                "id": a.id,
                "task_title": a.task.title if a.task else "Unknown",
                "contributor_name": a.contributor.name if a.contributor else "Unknown",
                "match_score": a.match_score,
                "status": a.status
            }
            for a in assignments
        ],
        "count": len(assignments)
    }


@tool_registry.register(
    name="configure_repository",
    description="配置 GitHub 仓库连接信息",
    parameters={
        "type": "object",
        "properties": {
            "owner": {"type": "string", "description": "仓库所有者"},
            "name": {"type": "string", "description": "仓库名称"},
            "token": {"type": "string", "description": "GitHub API Token"}
        },
        "required": ["owner", "name", "token"]
    }
)
async def configure_repository(
    owner: str,
    name: str,
    token: str,
    db=None
) -> Dict[str, Any]:
    """配置仓库"""
    from .models import Repository
    from sqlalchemy.orm import Session
    
    if not db:
        return {"error": "Database session required"}
    
    # 检查是否已存在
    existing = db.query(Repository).filter(
        Repository.owner == owner,
        Repository.name == name
    ).first()
    
    if existing:
        existing.token = token
        existing.updated_at = datetime.utcnow()
        db.commit()
        return {
            "id": existing.id,
            "message": f"更新仓库配置：{owner}/{name}"
        }
    else:
        repo = Repository(owner=owner, name=name, token=token)
        db.add(repo)
        db.commit()
        db.refresh(repo)
        return {
            "id": repo.id,
            "message": f"成功配置仓库：{owner}/{name}"
        }


@tool_registry.register(
    name="list_repositories",
    description="列出已配置的 GitHub 仓库",
    parameters={
        "type": "object",
        "properties": {},
        "required": []
    }
)
async def list_repositories(db=None) -> Dict[str, Any]:
    """列出仓库"""
    from .models import Repository
    from sqlalchemy.orm import Session
    
    if not db:
        return {"error": "Database session required"}
    
    repos = db.query(Repository).all()
    
    return {
        "repositories": [
            {
                "id": r.id,
                "owner": r.owner,
                "name": r.name,
                "full_name": f"{r.owner}/{r.name}"
            }
            for r in repos
        ],
        "count": len(repos)
    }


@tool_registry.register(
    name="configure_model",
    description="配置 AI 模型服务端点和 API 密钥",
    parameters={
        "type": "object",
        "properties": {
            "name": {"type": "string", "description": "模型名称"},
            "endpoint": {"type": "string", "description": "API 端点 URL"},
            "api_key": {"type": "string", "description": "API 密钥"},
            "temperature": {"type": "number", "description": "温度参数", "default": 0.7}
        },
        "required": ["name", "endpoint", "api_key"]
    }
)
async def configure_model(
    name: str,
    endpoint: str,
    api_key: str,
    temperature: float = 0.7,
    db=None
) -> Dict[str, Any]:
    """配置模型"""
    from .models import ModelConfig
    from sqlalchemy.orm import Session
    
    if not db:
        return {"error": "Database session required"}
    
    model = ModelConfig(
        name=name,
        endpoint=endpoint,
        api_key=api_key,
        temperature=temperature
    )
    db.add(model)
    db.commit()
    db.refresh(model)
    
    return {
        "id": model.id,
        "name": model.name,
        "message": f"成功配置模型：{name}"
    }


@tool_registry.register(
    name="list_models",
    description="列出已配置的 AI 模型",
    parameters={
        "type": "object",
        "properties": {},
        "required": []
    }
)
async def list_models(db=None) -> Dict[str, Any]:
    """列出模型"""
    from .models import ModelConfig
    from sqlalchemy.orm import Session
    
    if not db:
        return {"error": "Database session required"}
    
    models = db.query(ModelConfig).all()
    
    return {
        "models": [
            {
                "id": m.id,
                "name": m.name,
                "endpoint": m.endpoint,
                "is_default": bool(m.is_default)
            }
            for m in models
        ],
        "count": len(models)
    }

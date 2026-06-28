"""Pydantic 请求/响应模型"""
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime


# Repository schemas
class RepositoryBase(BaseModel):
    owner: str
    name: str
    token: str


class RepositoryCreate(RepositoryBase):
    pass


class RepositoryResponse(RepositoryBase):
    id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


# Contributor schemas
class ContributorBase(BaseModel):
    name: str
    email: Optional[str] = None
    skills: Optional[str] = None
    experience_level: Optional[str] = None
    description: Optional[str] = None


class ContributorCreate(ContributorBase):
    pass


class ContributorUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    skills: Optional[str] = None
    experience_level: Optional[str] = None
    description: Optional[str] = None


class ContributorResponse(ContributorBase):
    id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


# ModelConfig schemas
class ModelConfigBase(BaseModel):
    name: str
    endpoint: str
    api_key: str
    temperature: Optional[float] = 0.7
    max_tokens: Optional[int] = 2048
    is_default: Optional[bool] = False


class ModelConfigCreate(ModelConfigBase):
    pass


class ModelConfigResponse(ModelConfigBase):
    id: int
    created_at: datetime
    
    class Config:
        from_attributes = True


class ModelTestRequest(BaseModel):
    endpoint: str
    api_key: str
    model: str
    prompt: Optional[str] = "Hello"


# PromptTemplate schemas
class PromptTemplateBase(BaseModel):
    name: str
    content: str
    variables: Optional[List[str]] = []


class PromptTemplateCreate(PromptTemplateBase):
    pass


class PromptTemplateUpdate(BaseModel):
    name: Optional[str] = None
    content: Optional[str] = None
    variables: Optional[List[str]] = None


class PromptTemplateResponse(PromptTemplateBase):
    id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


# Task schemas
class TaskBase(BaseModel):
    title: str
    description: Optional[str] = None
    type: Optional[str] = "issue"
    labels: Optional[List[str]] = []
    priority: Optional[str] = None
    status: Optional[str] = "open"
    url: Optional[str] = None


class TaskResponse(TaskBase):
    id: int
    github_id: Optional[int] = None
    created_at: datetime
    extracted_at: datetime
    
    class Config:
        from_attributes = True


class TaskExtractRequest(BaseModel):
    repository_id: int


# Assignment schemas
class AssignmentBase(BaseModel):
    task_id: int
    contributor_id: int
    match_score: Optional[float] = None
    reason: Optional[str] = None
    status: Optional[str] = "pending"


class AssignmentResponse(AssignmentBase):
    id: int
    created_at: datetime
    task: Optional[TaskResponse] = None
    contributor: Optional[ContributorResponse] = None
    
    class Config:
        from_attributes = True


class TaskMatchRequest(BaseModel):
    contributor_id: Optional[int] = None
    task_ids: Optional[List[int]] = None
    limit: Optional[int] = 10


# Conversation schemas
class ConversationBase(BaseModel):
    title: Optional[str] = "新会话"
    role: Optional[str] = "user"


class ConversationCreate(ConversationBase):
    pass


class ConversationResponse(ConversationBase):
    id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


# Message schemas
class MessageBase(BaseModel):
    role: str
    content: str
    tool_call: Optional[Dict[str, Any]] = None


class MessageCreate(MessageBase):
    conversation_id: int


class MessageResponse(MessageBase):
    id: int
    conversation_id: int
    created_at: datetime
    
    class Config:
        from_attributes = True


class ChatMessageRequest(BaseModel):
    content: str


class SSEEvent(BaseModel):
    type: str  # text, tool_call, tool_result, done, error
    data: Any


# SystemSettings schemas
class SystemSettingsBase(BaseModel):
    key: str
    value: Optional[str] = None


class SystemSettingsResponse(SystemSettingsBase):
    id: int
    updated_at: datetime
    
    class Config:
        from_attributes = True

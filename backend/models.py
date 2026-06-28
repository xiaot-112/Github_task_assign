"""数据模型定义"""
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Float, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from .database import Base


class Repository(Base):
    """GitHub 仓库配置"""
    __tablename__ = "repositories"
    
    id = Column(Integer, primary_key=True, index=True)
    owner = Column(String(100), nullable=False)
    name = Column(String(100), nullable=False)
    token = Column(String(100), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class Contributor(Base):
    """贡献者信息"""
    __tablename__ = "contributors"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(100))
    skills = Column(Text)
    experience_level = Column(String(50))
    description = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class ModelConfig(Base):
    """AI 模型配置"""
    __tablename__ = "model_configs"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    endpoint = Column(String(500), nullable=False)
    api_key = Column(String(200), nullable=False)
    temperature = Column(Float, default=0.7)
    max_tokens = Column(Integer, default=2048)
    is_default = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)


class PromptTemplate(Base):
    """提示词模板"""
    __tablename__ = "prompt_templates"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    content = Column(Text, nullable=False)
    variables = Column(JSON, default=list)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class Task(Base):
    """从 GitHub 提取的任务"""
    __tablename__ = "tasks"
    
    id = Column(Integer, primary_key=True, index=True)
    github_id = Column(Integer, unique=True)
    title = Column(String(500), nullable=False)
    description = Column(Text)
    type = Column(String(20))  # issue or pull_request
    labels = Column(JSON, default=list)
    priority = Column(String(20))
    status = Column(String(50), default="open")
    url = Column(String(500))
    created_at = Column(DateTime, default=datetime.utcnow)
    extracted_at = Column(DateTime, default=datetime.utcnow)


class Assignment(Base):
    """任务分配结果"""
    __tablename__ = "assignments"
    
    id = Column(Integer, primary_key=True, index=True)
    task_id = Column(Integer, ForeignKey("tasks.id"))
    contributor_id = Column(Integer, ForeignKey("contributors.id"))
    match_score = Column(Float)
    reason = Column(Text)
    status = Column(String(50), default="pending")
    created_at = Column(DateTime, default=datetime.utcnow)
    
    task = relationship("Task")
    contributor = relationship("Contributor")


class Conversation(Base):
    """聊天会话"""
    __tablename__ = "conversations"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), default="新会话")
    role = Column(String(50), default="user")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    messages = relationship("Message", back_populates="conversation", cascade="all, delete-orphan")


class Message(Base):
    """聊天消息"""
    __tablename__ = "messages"
    
    id = Column(Integer, primary_key=True, index=True)
    conversation_id = Column(Integer, ForeignKey("conversations.id"), nullable=False)
    role = Column(String(20), nullable=False)  # user, assistant, system, tool, tool_result
    content = Column(Text, nullable=False)
    tool_call = Column(JSON)  # 工具调用信息
    created_at = Column(DateTime, default=datetime.utcnow)
    
    conversation = relationship("Conversation", back_populates="messages")


class SystemSettings(Base):
    """系统设置"""
    __tablename__ = "system_settings"
    
    id = Column(Integer, primary_key=True, index=True)
    key = Column(String(100), unique=True, nullable=False)
    value = Column(Text)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

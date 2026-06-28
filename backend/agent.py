"""AI Agent 核心 - 处理 LLM 流式交互和工具调用"""
import json
import re
from typing import AsyncGenerator, Dict, Any, List, Optional
from sqlalchemy.orm import Session


class Agent:
    """AI Agent 核心类"""
    
    def __init__(self, db: Session, model_config: Dict[str, Any], tools: List[Dict[str, Any]]):
        self.db = db
        self.model_config = model_config
        self.tools = tools
        self.tool_names = [t["name"] for t in tools]
    
    def build_system_prompt(self) -> str:
        """构建系统提示词"""
        tools_desc = "\n".join([
            f"- {t['name']}: {t['description']}\n  参数：{json.dumps(t['parameters'], ensure_ascii=False)}"
            for t in self.tools
        ])
        
        return f"""你是一个 GitHub 任务分配助手，帮助用户管理开源项目贡献者任务。

## 可用工具
{tools_desc}

## 工具调用格式
当需要调用工具时，请在回复中使用以下格式：
TOOL_CALL: {{
    "name": "tool_name",
    "arguments": {{
        "param1": "value1",
        "param2": "value2
    }}
}}

## 工作流程
1. 理解用户需求
2. 如需获取数据或执行操作，调用相应工具
3. 根据工具返回结果，给用户清晰的回复
4. 支持多轮对话，记住上下文

## 注意事项
- 如果用户没有配置仓库，先引导用户配置
- 如果用户没有添加贡献者，先引导用户添加
- 匹配任务时，优先推荐匹配度高的任务
- 用简洁清晰的语言回复，重要信息使用列表展示
"""
    
    def parse_tool_call(self, text: str) -> Optional[Dict[str, Any]]:
        """解析工具调用"""
        pattern = r'TOOL_CALL:\s*({[\s\S]*?})'
        match = re.search(pattern, text)
        
        if match:
            try:
                tool_call = json.loads(match.group(1))
                return tool_call
            except json.JSONDecodeError:
                return None
        return None
    
    async def chat_stream(
        self, 
        messages: List[Dict[str, Any]], 
        conversation_id: int
    ) -> AsyncGenerator[Dict[str, Any], None]:
        """流式聊天"""
        from .models import Message
        import httpx
        
        # 保存用户消息
        user_msg = Message(
            conversation_id=conversation_id,
            role="user",
            content=messages[-1]["content"]
        )
        self.db.add(user_msg)
        self.db.commit()
        
        # 构建 API 请求
        system_prompt = self.build_system_prompt()
        api_messages = [
            {"role": "system", "content": system_prompt},
            *messages
        ]
        
        payload = {
            "model": self.model_config.get("model", "gpt-3.5-turbo"),
            "messages": api_messages,
            "temperature": self.model_config.get("temperature", 0.7),
            "stream": True
        }
        
        headers = {
            "Authorization": f"Bearer {self.model_config['api_key']}",
            "Content-Type": "application/json"
        }
        
        full_response = ""
        tool_calls = []
        
        try:
            async with httpx.AsyncClient(timeout=60.0) as client:
                async with client.stream(
                    "POST",
                    self.model_config["endpoint"],
                    json=payload,
                    headers=headers
                ) as response:
                    if response.status_code != 200:
                        error_text = await response.aread()
                        yield {
                            "type": "error",
                            "data": f"API 请求失败：{response.status_code} - {error_text.decode()}"
                        }
                        return
                    
                    async for line in response.aiter_lines():
                        if line.startswith("data: "):
                            data = line[6:]
                            if data.strip() == "[DONE]":
                                break
                            
                            try:
                                chunk = json.loads(data)
                                delta = chunk.get("choices", [{}])[0].get("delta", {})
                                content = delta.get("content", "")
                                
                                if content:
                                    full_response += content
                                    yield {
                                        "type": "text",
                                        "data": content
                                    }
                            except json.JSONDecodeError:
                                continue
        except Exception as e:
            yield {
                "type": "error",
                "data": f"请求异常：{str(e)}"
            }
            return
        
        # 检查是否有工具调用
        tool_call = self.parse_tool_call(full_response)
        
        if tool_call and tool_call.get("name") in self.tool_names:
            # 发送工具调用通知
            yield {
                "type": "tool_call",
                "data": tool_call
            }
            
            # 执行工具
            from .tools import tool_registry
            tool_name = tool_call["name"]
            tool_args = tool_call.get("arguments", {})
            tool_args["db"] = self.db
            
            result = await tool_registry.execute(tool_name, **tool_args)
            
            # 发送工具结果
            yield {
                "type": "tool_result",
                "data": {
                    "tool_name": tool_name,
                    "result": result
                }
            }
            
            # 将工具调用和结果添加到对话历史
            tool_msg = Message(
                conversation_id=conversation_id,
                role="tool",
                content=json.dumps(tool_call, ensure_ascii=False),
                tool_call=tool_call
            )
            self.db.add(tool_msg)
            
            result_msg = Message(
                conversation_id=conversation_id,
                role="tool_result",
                content=json.dumps(result, ensure_ascii=False)
            )
            self.db.add(result_msg)
            self.db.commit()
            
            # 基于工具结果生成最终回复
            final_messages = [
                {"role": "system", "content": system_prompt},
                *messages,
                {"role": "assistant", "content": full_response},
                {"role": "tool", "content": f"工具 {tool_name} 执行结果：{json.dumps(result, ensure_ascii=False)}"}
            ]
            
            final_payload = {
                "model": self.model_config.get("model", "gpt-3.5-turbo"),
                "messages": final_messages,
                "temperature": self.model_config.get("temperature", 0.7),
                "stream": True
            }
            
            full_final_response = ""
            
            try:
                async with httpx.AsyncClient(timeout=60.0) as client:
                    async with client.stream(
                        "POST",
                        self.model_config["endpoint"],
                        json=final_payload,
                        headers=headers
                    ) as final_response:
                        if final_response.status_code == 200:
                            async for line in final_response.aiter_lines():
                                if line.startswith("data: "):
                                    data = line[6:]
                                    if data.strip() == "[DONE]":
                                        break
                                    
                                    try:
                                        chunk = json.loads(data)
                                        delta = chunk.get("choices", [{}])[0].get("delta", {})
                                        content = delta.get("content", "")
                                        
                                        if content:
                                            full_final_response += content
                                            yield {
                                                "type": "text",
                                                "data": content
                                            }
                                    except json.JSONDecodeError:
                                        continue
            except Exception as e:
                pass
        
        # 保存 AI 回复
        assistant_msg = Message(
            conversation_id=conversation_id,
            role="assistant",
            content=full_response + ("\n\n" + full_final_response if full_final_response else "")
        )
        self.db.add(assistant_msg)
        self.db.commit()
        
        # 更新会话时间
        from .models import Conversation
        conv = self.db.query(Conversation).filter(Conversation.id == conversation_id).first()
        if conv:
            conv.updated_at = None  # 触发 onupdate
            self.db.commit()
        
        yield {
            "type": "done",
            "data": {}
        }

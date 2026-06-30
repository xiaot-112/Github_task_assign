import React, { useRef, useEffect } from 'react';
import { Typography } from 'antd';
import MessageBubble from './MessageBubble';
import ChatInput from './ChatInput';
import './ChatContainer.css';

const { Title } = Typography;

const ChatContainer = ({ messages, onSendMessage, isLoading }) => {
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <div className="chat-container">
      <div className="messages-container">
        {messages.length === 0 ? (
          <div className="welcome-message">
            <Title level={2}>👋 欢迎使用 AI 任务分配助手</Title>
            <p>我可以帮你：</p>
            <ul>
              <li>从 GitHub 仓库提取 Issues 和 Pull Requests</li>
              <li>根据贡献者的技能和经验匹配最适合的任务</li>
              <li>管理贡献者信息和任务分配记录</li>
            </ul>
            <p>试试说：<br />
              "我有一个熟悉 React 和 Node.js 的贡献者，请帮我找适合的任务"<br />
              或者点击下方的快捷按钮开始
            </p>
          </div>
        ) : (
          messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>
      
      <ChatInput onSend={onSendMessage} isLoading={isLoading} />
    </div>
  );
};

export default ChatContainer;

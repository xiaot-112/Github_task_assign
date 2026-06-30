import React, { useState } from 'react';
import { Input, Button, Tooltip } from 'antd';
import { SendOutlined, ThunderboltOutlined, IssuesCloseOutlined, PullRequestOutlined, UserOutlined } from '@ant-design/icons';
import './ChatInput.css';

const { TextArea } = Input;

const ChatInput = ({ onSend, isLoading }) => {
  const [value, setValue] = useState('');

  const handleSend = () => {
    if (value.trim() && !isLoading) {
      onSend(value);
      setValue('');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const quickActions = [
    { label: '提取任务', icon: <IssuesCloseOutlined />, prompt: '从 GitHub 仓库提取最新的开放任务' },
    { label: '匹配贡献者', icon: <UserOutlined />, prompt: '帮我分析当前贡献者并推荐适合的任务' },
    { label: '查看仓库', icon: <ThunderboltOutlined />, prompt: '显示当前配置的 GitHub 仓库信息' },
    { label: '查看 PR', icon: <PullRequestOutlined />, prompt: '列出当前的 Pull Requests' },
  ];

  return (
    <div className="chat-input-container">
      <div className="quick-actions">
        {quickActions.map((action, index) => (
          <Tooltip key={index} title={action.prompt}>
            <Button
              size="small"
              icon={action.icon}
              onClick={() => {
                setValue(action.prompt);
              }}
            >
              {action.label}
            </Button>
          </Tooltip>
        ))}
      </div>
      
      <div className="input-wrapper">
        <TextArea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="描述贡献者的能力和偏好，AI 将自动匹配任务... (Shift+Enter 换行，Enter 发送)"
          autoSize={{ minRows: 2, maxRows: 6 }}
          disabled={isLoading}
          className="chat-textarea"
        />
        <Button
          type="primary"
          icon={<SendOutlined />}
          onClick={handleSend}
          loading={isLoading}
          className="send-button"
          disabled={!value.trim() || isLoading}
        >
          发送
        </Button>
      </div>
    </div>
  );
};

export default ChatInput;

import React from 'react';
import { Typography, Spin } from 'antd';
import { ToolOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import './MessageBubble.css';

const { Text, Paragraph } = Typography;

const MessageBubble = ({ message }) => {
  const { role, content, tool_name, tool_args, tool_result, is_streaming } = message;

  // 用户消息
  if (role === 'user') {
    return (
      <div className="message-bubble user-message">
        <div className="message-content">{content}</div>
      </div>
    );
  }

  // 工具调用卡片
  if (role === 'tool' && tool_name) {
    return (
      <div className="message-bubble tool-message">
        <div className="tool-card">
          <div className="tool-header">
            <ToolOutlined spin={is_streaming} />
            <Text strong>{tool_name}</Text>
            {is_streaming && <Text type="secondary" style={{ fontSize: 12 }}>运行中...</Text>}
          </div>
          {tool_args && (
            <div className="tool-args">
              <Text type="secondary" style={{ fontSize: 12 }}>参数:</Text>
              <pre>{JSON.stringify(tool_args, null, 2)}</pre>
            </div>
          )}
        </div>
      </div>
    );
  }

  // 工具结果卡片
  if (role === 'tool_result' && tool_name) {
    const isSuccess = !tool_result?.error;
    return (
      <div className="message-bubble tool-result-message">
        <div className={`tool-result-card ${isSuccess ? 'success' : 'error'}`}>
          <div className="tool-header">
            {isSuccess ? <CheckCircleOutlined style={{ color: '#52c41a' }} /> : <CloseCircleOutlined style={{ color: '#ff4d4f' }} />}
            <Text strong>{tool_name}</Text>
            <Text type={isSuccess ? 'success' : 'danger'} style={{ fontSize: 12 }}>
              {isSuccess ? '成功' : '失败'}
            </Text>
          </div>
          {tool_result && (
            <div className="tool-result-content">
              <pre>{JSON.stringify(tool_result, null, 2)}</pre>
            </div>
          )}
        </div>
      </div>
    );
  }

  // AI 助手消息
  if (role === 'assistant') {
    return (
      <div className="message-bubble assistant-message">
        <div className="message-content">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              code({ node, inline, className, children, ...props }) {
                const match = /language-(\w+)/.exec(className || '');
                return !inline && match ? (
                  <SyntaxHighlighter
                    style={vscDarkPlus}
                    language={match[1]}
                    PreTag="div"
                    {...props}
                  >
                    {String(children).replace(/\n$/, '')}
                  </SyntaxHighlighter>
                ) : (
                  <code className={className} {...props}>
                    {children}
                  </code>
                );
              }
            }}
          >
            {content + (is_streaming ? '▌' : '')}
          </ReactMarkdown>
        </div>
      </div>
    );
  }

  return null;
};

export default MessageBubble;

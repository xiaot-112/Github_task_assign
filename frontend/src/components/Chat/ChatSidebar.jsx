import React from 'react';
import { List, Button, Typography, Badge } from 'antd';
import { PlusOutlined, DeleteOutlined, MessageOutlined } from '@ant-design/icons';
import './ChatSidebar.css';

const { Text } = Typography;

const ChatSidebar = ({ conversations, currentConversationId, onSelectConversation, onNewConversation, onDeleteConversation, collapsed }) => {
  return (
    <div className={`chat-sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        {!collapsed && <Text strong>会话列表</Text>}
        <Button 
          type="primary" 
          icon={<PlusOutlined />} 
          onClick={onNewConversation}
          size="small"
        >
          {!collapsed && '新建'}
        </Button>
      </div>
      
      <div className="sidebar-content">
        <List
          dataSource={conversations}
          renderItem={(conversation) => (
            <List.Item
              className={`conversation-item ${conversation.id === currentConversationId ? 'active' : ''}`}
              onClick={() => onSelectConversation(conversation.id)}
              actions={[
                <Button
                  key="delete"
                  type="text"
                  danger
                  icon={<DeleteOutlined />}
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteConversation(conversation.id);
                  }}
                />
              ]}
            >
              <div className="conversation-content">
                <MessageOutlined style={{ marginRight: 8 }} />
                {!collapsed && (
                  <div className="conversation-info">
                    <Text ellipsis>{conversation.title || '新会话'}</Text>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {new Date(conversation.updated_at).toLocaleDateString()}
                    </Text>
                  </div>
                )}
              </div>
            </List.Item>
          )}
          locale={{ emptyText: '暂无会话' }}
        />
      </div>
    </div>
  );
};

export default ChatSidebar;

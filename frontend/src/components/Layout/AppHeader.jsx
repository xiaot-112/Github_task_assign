import React from 'react';
import { Layout, Button, Dropdown, Space, Typography } from 'antd';
import { MenuOutlined, SettingOutlined, PlusOutlined, ThunderboltOutlined } from '@ant-design/icons';
import './AppHeader.css';

const { Header } = Layout;
const { Title } = Typography;

const AppHeader = ({ onMenuClick, onNewConversation, onSettingsClick, role, onRoleChange }) => {
  const roles = [
    { key: 'maintainer', label: '项目维护者' },
    { key: 'contributor', label: '贡献者' },
    { key: 'observer', label: '观察者' },
  ];

  const handleRoleChange = ({ key }) => {
    onRoleChange(key);
  };

  return (
    <Header className="app-header">
      <div className="header-left">
        <Button 
          type="text" 
          icon={<MenuOutlined />} 
          onClick={onMenuClick}
          className="menu-button"
        />
        <div className="logo">
          <ThunderboltOutlined style={{ fontSize: 24, color: '#1890ff', marginRight: 8 }} />
          <Title level={4} style={{ margin: 0, color: 'white' }}>AI 任务分配助手</Title>
        </div>
      </div>

      <div className="header-center">
        <Dropdown
          menu={{ items: roles, selectedKeys: [role], onClick: handleRoleChange }}
          trigger={['click']}
        >
          <Button type="primary" ghost>
            {roles.find(r => r.key === role)?.label || '角色'}
          </Button>
        </Dropdown>
      </div>

      <div className="header-right">
        <Button 
          type="primary" 
          icon={<PlusOutlined />} 
          onClick={onNewConversation}
        >
          新建会话
        </Button>
        <Button 
          type="text" 
          icon={<SettingOutlined />} 
          onClick={onSettingsClick}
          style={{ color: 'white', fontSize: 18 }}
        />
      </div>
    </Header>
  );
};

export default AppHeader;

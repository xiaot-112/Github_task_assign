import React from 'react';
import { Layout, Drawer, Tabs, Form, Input, Button, Space, message } from 'antd';
import { CloseOutlined } from '@ant-design/icons';
import RepositorySection from '../RepositorySection';
import ContributorSection from '../ContributorSection';
import ModelSection from '../ModelSection';
import PromptSection from '../PromptSection';
import SettingsSection from '../SettingsSection';
import './SettingsDrawer.css';

const { Content } = Layout;

const SettingsDrawer = ({ visible, onClose }) => {
  const items = [
    {
      key: 'repository',
      label: '仓库配置',
      children: <RepositorySection />,
    },
    {
      key: 'contributor',
      label: '贡献者管理',
      children: <ContributorSection />,
    },
    {
      key: 'model',
      label: '模型配置',
      children: <ModelSection />,
    },
    {
      key: 'prompt',
      label: '提示词模板',
      children: <PromptSection />,
    },
    {
      key: 'settings',
      label: '系统设置',
      children: <SettingsSection />,
    },
  ];

  return (
    <Drawer
      title="系统设置"
      placement="right"
      width={720}
      onClose={onClose}
      open={visible}
      closeIcon={<CloseOutlined />}
      className="settings-drawer"
    >
      <Tabs defaultActiveKey="repository" items={items} />
    </Drawer>
  );
};

export default SettingsDrawer;

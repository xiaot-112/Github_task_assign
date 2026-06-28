import React from 'react';
import { Layout, Typography, Space } from 'antd';
import { 
  GithubOutlined, 
  UserOutlined, 
  RobotOutlined, 
  FileTextOutlined, 
  ThunderboltOutlined, 
  CheckCircleOutlined, 
  SettingOutlined 
} from '@ant-design/icons';
import RepositorySection from './components/RepositorySection';
import ContributorSection from './components/ContributorSection';
import ModelSection from './components/ModelSection';
import PromptSection from './components/PromptSection';
import TaskSection from './components/TaskSection';
import AssignmentSection from './components/AssignmentSection';
import SettingsSection from './components/SettingsSection';

const { Header, Content, Footer } = Layout;
const { Title, Text } = Typography;

const App = () => {
  return (
    <Layout className="app-container">
      <Header style={{ 
        background: '#fff', 
        padding: '0 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        <Space size="large">
          <Space>
            <GithubOutlined style={{ fontSize: 24, color: '#1890ff' }} />
            <Title level={3} style={{ margin: 0 }}>AI任务分配代理系统</Title>
          </Space>
        </Space>
        <Space>
          <Text type="secondary">v1.0.0</Text>
        </Space>
      </Header>

      <Content className="main-content">
        {/* 仓库连接配置 */}
        <section aria-label="仓库配置">
          <RepositorySection />
        </section>

        {/* 贡献者信息 */}
        <section aria-label="贡献者管理">
          <ContributorSection />
        </section>

        {/* AI模型配置 */}
        <section aria-label="模型配置">
          <ModelSection />
        </section>

        {/* 提示词模板 */}
        <section aria-label="提示词管理">
          <PromptSection />
        </section>

        {/* 任务列表与提取 */}
        <section aria-label="任务管理">
          <TaskSection />
        </section>

        {/* 任务分配结果 */}
        <section aria-label="分配结果">
          <AssignmentSection />
        </section>

        {/* 系统设置 */}
        <section aria-label="系统设置">
          <SettingsSection />
        </section>
      </Content>

      <Footer style={{ 
        textAlign: 'center', 
        background: '#f5f5f5',
        marginTop: 24
      }}>
        <Space direction="vertical" size="small">
          <Text type="secondary">
            AI任务分配代理系统 © 2024 | 基于 FastAPI + React 构建
          </Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            支持 OpenAI API 协议 | GitHub Issue & Pull Request 任务提取
          </Text>
        </Space>
      </Footer>
    </Layout>
  );
};

export default App;

import React, { useState } from 'react';
import { Card, Button, Space, message, Table, Tag, Typography, Empty, Row, Col, Statistic } from 'antd';
import { SyncOutlined, ThunderboltOutlined, IssueAddOutlined, PullRequestOutlined } from '@ant-design/icons';
import useStore from '../store';
import { taskAPI, repositoryAPI } from '../services/api';

const { Text, Link } = Typography;

const TaskSection = () => {
  const { tasks, setTasks, repositories } = useStore();
  const [extracting, setExtracting] = useState(false);
  const [matching, setMatching] = useState(false);

  const loadTasks = async () => {
    try {
      const res = await taskAPI.getAll();
      setTasks(res.data.data || []);
    } catch (error) {
      message.error('加载任务失败');
    }
  };

  React.useEffect(() => {
    loadTasks();
  }, []);

  const handleExtract = async () => {
    if (!repositories || repositories.length === 0) {
      message.warning('请先配置仓库');
      return;
    }

    setExtracting(true);
    try {
      // 使用第一个配置的仓库
      const repo = repositories[0];
      const res = await taskAPI.extract({
        repo_owner: repo.repo_owner,
        repo_name: repo.repo_name,
        github_token: repo.github_token,
      });
      message.success(`成功提取 ${res.data.count} 个任务`);
      loadTasks();
    } catch (error) {
      message.error(`提取失败：${error.response?.data?.detail || '未知错误'}`);
    } finally {
      setExtracting(false);
    }
  };

  const handleMatch = async () => {
    setMatching(true);
    try {
      const res = await taskAPI.match();
      message.success('匹配完成');
      // 触发分配结果刷新（通过事件或状态）
      window.dispatchEvent(new CustomEvent('assignments-updated'));
    } catch (error) {
      message.error(`匹配失败：${error.response?.data?.detail || '未知错误'}`);
    } finally {
      setMatching(false);
    }
  };

  const columns = [
    {
      title: '类型',
      dataIndex: 'source_type',
      key: 'source_type',
      render: (type) => {
        const config = {
          issue: { icon: <IssueAddOutlined />, color: 'green', text: 'Issue' },
          pr: { icon: <PullRequestOutlined />, color: 'blue', text: 'PR' },
        };
        const c = config[type] || config.issue;
        return <Tag icon={c.icon} color={c.color}>{c.text}</Tag>;
      },
    },
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      ellipsis: true,
    },
    {
      title: '优先级',
      dataIndex: 'priority',
      key: 'priority',
      render: (priority) => {
        const colorMap = { low: 'default', medium: 'blue', high: 'orange', urgent: 'red' };
        return <Tag color={colorMap[priority]}>{priority}</Tag>;
      },
    },
    {
      title: '标签',
      dataIndex: 'labels',
      key: 'labels',
      render: (labels) => (
        <Space wrap>
          {(labels || []).slice(0, 3).map((label, i) => (
            <Tag key={i}>{label}</Tag>
          ))}
          {(labels || []).length > 3 && <Tag>+{labels.length - 3}</Tag>}
        </Space>
      ),
    },
    {
      title: '来源',
      dataIndex: 'source_url',
      key: 'source_url',
      render: (url) => <Link href={url} target="_blank">查看</Link>,
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (text) => text ? new Date(text).toLocaleDateString() : '-',
    },
  ];

  const issueCount = tasks.filter(t => t.source_type === 'issue').length;
  const prCount = tasks.filter(t => t.source_type === 'pr').length;

  return (
    <Card 
      className="card-section" 
      title={<><ThunderboltOutlined /> 任务列表</>}
      extra={
        <Space>
          <Button 
            icon={<SyncOutlined spin={extracting} />} 
            onClick={handleExtract}
            loading={extracting}
            disabled={!repositories || repositories.length === 0}
          >
            提取任务
          </Button>
          <Button 
            type="primary" 
            icon={<ThunderboltOutlined />} 
            onClick={handleMatch}
            loading={matching}
            disabled={tasks.length === 0}
          >
            执行匹配
          </Button>
        </Space>
      }
    >
      {!repositories || repositories.length === 0 && (
        <div style={{ marginBottom: 16, padding: '12px', background: '#fffbe6', border: '1px solid #ffe58f', borderRadius: 4 }}>
          ⚠️ 请先在上方配置 GitHub 仓库
        </div>
      )}

      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={8}>
          <Statistic title="总任务数" value={tasks.length} />
        </Col>
        <Col span={8}>
          <Statistic title="Issues" value={issueCount} valueStyle={{ color: '#3f8600' }} />
        </Col>
        <Col span={8}>
          <Statistic title="Pull Requests" value={prCount} valueStyle={{ color: '#1890ff' }} />
        </Col>
      </Row>

      {tasks.length === 0 ? (
        <Empty description='暂无任务，点击"提取任务"按钮从 GitHub 仓库获取' />
      ) : (
        <Table
          columns={columns}
          dataSource={tasks}
          rowKey="id"
          pagination={{ pageSize: 10, showSizeChanger: true }}
          scroll={{ x: 1000 }}
        />
      )}
    </Card>
  );
};

export default TaskSection;

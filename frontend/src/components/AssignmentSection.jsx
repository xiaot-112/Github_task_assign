import React, { useState, useEffect } from 'react';
import { Card, Table, Tag, Progress, Space, Typography, Empty, Divider, Badge } from 'antd';
import { CheckCircleOutlined, TrophyOutlined } from '@ant-design/icons';
import useStore from '../store';
import { assignmentAPI, contributorAPI } from '../services/api';

const { Text, Paragraph } = Typography;

const AssignmentSection = () => {
  const { assignments, setAssignments, contributors } = useStore();
  const [loading, setLoading] = useState(false);

  const loadAssignments = async () => {
    setLoading(true);
    try {
      const res = await assignmentAPI.getAll();
      setAssignments(res.data.data || []);
    } catch (error) {
      console.error('加载分配结果失败', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAssignments();
    
    // 监听任务匹配完成事件
    const handleAssignmentUpdate = () => loadAssignments();
    window.addEventListener('assignments-updated', handleAssignmentUpdate);
    
    return () => {
      window.removeEventListener('assignments-updated', handleAssignmentUpdate);
    };
  }, []);

  // 获取贡献者名称映射
  const getContributorName = (id) => {
    const contributor = contributors.find(c => c.id === id);
    return contributor?.name || id;
  };

  const columns = [
    {
      title: '排名',
      key: 'rank',
      width: 80,
      render: (_, __, index) => {
        if (index === 0) return <TrophyOutlined style={{ color: '#gold', fontSize: 20, color: '#faad14' }} />;
        if (index === 1) return <TrophyOutlined style={{ fontSize: 18, color: '#bfbfbf' }} />;
        if (index === 2) return <TrophyOutlined style={{ fontSize: 16, color: '#d46b08' }} />;
        return <Text>{index + 1}</Text>;
      },
    },
    {
      title: '任务',
      dataIndex: 'task_id',
      key: 'task_id',
      ellipsis: true,
    },
    {
      title: '贡献者',
      dataIndex: 'contributor_id',
      key: 'contributor_id',
      render: (id) => <Tag color="blue">{getContributorName(id)}</Tag>,
    },
    {
      title: '匹配度',
      dataIndex: 'match_score',
      key: 'match_score',
      width: 200,
      render: (score) => {
        const percentage = Math.round(score * 100);
        let color = 'success';
        if (percentage < 50) color = 'exception';
        else if (percentage < 70) color = 'normal';
        
        return (
          <Progress 
            percent={percentage} 
            strokeColor={percentage >= 80 ? '#52c41a' : percentage >= 50 ? '#1890ff' : '#ff4d4f'}
            format={() => `${percentage}%`}
          />
        );
      },
    },
    {
      title: '推荐理由',
      dataIndex: 'reasons',
      key: 'reasons',
      render: (reasons) => (
        <Space direction="vertical" size={4}>
          {(reasons || []).map((reason, i) => (
            <Text key={i} style={{ fontSize: 12 }}>{reason}</Text>
          ))}
        </Space>
      ),
    },
    {
      title: '分配时间',
      dataIndex: 'assigned_at',
      key: 'assigned_at',
      render: (text) => text ? new Date(text).toLocaleString() : '-',
    },
  ];

  // 统计信息
  const highMatchCount = assignments.filter(a => a.match_score >= 0.8).length;
  const mediumMatchCount = assignments.filter(a => a.match_score >= 0.5 && a.match_score < 0.8).length;
  const lowMatchCount = assignments.filter(a => a.match_score < 0.5).length;

  return (
    <Card 
      className="card-section" 
      title={<><CheckCircleOutlined /> 任务分配结果</>}
    >
      <Space style={{ marginBottom: 16 }}>
        <Badge count={highMatchCount} style={{ backgroundColor: '#52c41a' }}>
          <Tag color="green">高匹配 ({highMatchCount})</Tag>
        </Badge>
        <Badge count={mediumMatchCount} style={{ backgroundColor: '#1890ff' }}>
          <Tag color="blue">中匹配 ({mediumMatchCount})</Tag>
        </Badge>
        <Badge count={lowMatchCount} style={{ backgroundColor: '#ff4d4f' }}>
          <Tag color="red">低匹配 ({lowMatchCount})</Tag>
        </Badge>
      </Space>

      {assignments.length === 0 ? (
        <Empty description="暂无分配结果，请先提取任务并执行匹配" />
      ) : (
        <Table
          columns={columns}
          dataSource={assignments}
          rowKey={(record, index) => `${record.task_id}-${record.contributor_id}-${index}`}
          pagination={{ pageSize: 10, showSizeChanger: true }}
          loading={loading}
          scroll={{ x: 1000 }}
        />
      )}

      {assignments.length > 0 && (
        <>
          <Divider />
          <Paragraph style={{ color: '#666', fontSize: 13 }}>
            💡 <strong>说明：</strong>匹配度基于贡献者技能与任务需求的相似度计算。
            建议优先处理匹配度高于 80% 的分配方案。系统会根据 AI 模型分析给出详细推荐理由。
          </Paragraph>
        </>
      )}
    </Card>
  );
};

export default AssignmentSection;

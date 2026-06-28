import React, { useState } from 'react';
import { Card, Form, Input, Button, Space, message, Table, Modal, Popconfirm } from 'antd';
import { PlusOutlined, DeleteOutlined, EditOutlined, GithubOutlined } from '@ant-design/icons';
import useStore from '../store';
import { repositoryAPI } from '../services/api';

const RepositorySection = () => {
  const { repositories, setRepositories } = useStore();
  const [form] = Form.useForm();
  const [modalVisible, setModalVisible] = useState(false);
  const [editingRepo, setEditingRepo] = useState(null);

  const loadRepositories = async () => {
    try {
      const res = await repositoryAPI.getAll();
      setRepositories(res.data.data || []);
    } catch (error) {
      message.error('加载仓库配置失败');
    }
  };

  React.useEffect(() => {
    loadRepositories();
  }, []);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (editingRepo) {
        // 删除旧的，添加新的（简化处理）
        await repositoryAPI.delete(editingRepo.id);
      }
      await repositoryAPI.save(values);
      message.success('保存成功');
      setModalVisible(false);
      form.resetFields();
      setEditingRepo(null);
      loadRepositories();
    } catch (error) {
      if (error.response?.data?.detail) {
        message.error(error.response.data.detail);
      } else {
        message.error('保存失败');
      }
    }
  };

  const handleEdit = (repo) => {
    setEditingRepo(repo);
    form.setFieldsValue({
      repo_owner: repo.repo_owner,
      repo_name: repo.repo_name,
      github_token: repo.github_token,
    });
    setModalVisible(true);
  };

  const handleDelete = async (id) => {
    try {
      await repositoryAPI.delete(id);
      message.success('删除成功');
      loadRepositories();
    } catch (error) {
      message.error('删除失败');
    }
  };

  const columns = [
    {
      title: '仓库',
      dataIndex: 'repo_owner',
      key: 'repo',
      render: (_, record) => `${record.repo_owner}/${record.repo_name}`,
    },
    {
      title: 'Token',
      dataIndex: 'github_token',
      key: 'github_token',
      render: (text) => text ? '已配置' : '未配置',
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (text) => text ? new Date(text).toLocaleString() : '-',
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space>
          <Button type="link" icon={<EditOutlined />} onClick={() => handleEdit(record)} />
          <Popconfirm
            title="确定删除此仓库配置？"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="link" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Card className="card-section" title={<><GithubOutlined /> 仓库连接配置</>} extra={
      <Button type="primary" icon={<PlusOutlined />} onClick={() => {
        setEditingRepo(null);
        form.resetFields();
        setModalVisible(true);
      }}>
        添加仓库
      </Button>
    }>
      <Table
        columns={columns}
        dataSource={repositories}
        rowKey="id"
        pagination={{ pageSize: 5 }}
      />

      <Modal
        title={editingRepo ? '编辑仓库配置' : '添加仓库配置'}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
          setEditingRepo(null);
        }}
        onOk={handleSubmit}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="repo_owner"
            label="仓库所有者"
            rules={[{ required: true, message: '请输入仓库所有者' }]}
          >
            <Input placeholder="例如：octocat" />
          </Form.Item>
          <Form.Item
            name="repo_name"
            label="仓库名称"
            rules={[{ required: true, message: '请输入仓库名称' }]}
          >
            <Input placeholder="例如：hello-world" />
          </Form.Item>
          <Form.Item
            name="github_token"
            label="GitHub Token（可选）"
            tooltip="用于访问私有仓库或提高API限额"
          >
            <Input.Password placeholder="ghp_xxx" />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
};

export default RepositorySection;

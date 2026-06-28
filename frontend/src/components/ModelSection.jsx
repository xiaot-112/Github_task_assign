import React, { useState } from 'react';
import { Card, Form, Input, Button, Space, message, Table, Modal, Popconfirm, Slider, Tag } from 'antd';
import { PlusOutlined, DeleteOutlined, EditOutlined, RobotOutlined, ThunderOutlined } from '@ant-design/icons';
import useStore from '../store';
import { modelAPI } from '../services/api';

const ModelSection = () => {
  const { models, setModels, selectedModel, setSelectedModel } = useStore();
  const [form] = Form.useForm();
  const [modalVisible, setModalVisible] = useState(false);
  const [testingModel, setTestingModel] = useState(null);

  const loadModels = async () => {
    try {
      const res = await modelAPI.getAll();
      setModels(res.data.data || []);
    } catch (error) {
      message.error('加载模型配置失败');
    }
  };

  React.useEffect(() => {
    loadModels();
  }, []);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      await modelAPI.save(values);
      message.success('保存成功');
      setModalVisible(false);
      form.resetFields();
      loadModels();
    } catch (error) {
      message.error('保存失败');
    }
  };

  const handleTest = async (model) => {
    setTestingModel(model.id);
    try {
      await modelAPI.test(model);
      message.success('连接测试成功！');
    } catch (error) {
      message.error(`连接测试失败：${error.response?.data?.detail || '未知错误'}`);
    } finally {
      setTestingModel(null);
    }
  };

  const handleDelete = async (id) => {
    try {
      await modelAPI.delete(id);
      if (selectedModel?.id === id) {
        setSelectedModel(null);
      }
      message.success('删除成功');
      loadModels();
    } catch (error) {
      message.error('删除失败');
    }
  };

  const handleSelect = (model) => {
    setSelectedModel(model);
    message.success(`已选择模型：${model.model_name}`);
  };

  const columns = [
    {
      title: '模型名称',
      dataIndex: 'model_name',
      key: 'model_name',
      render: (text, record) => (
        <Space>
          <span>{text}</span>
          {selectedModel?.id === record.id && <Tag color="green">使用中</Tag>}
        </Space>
      ),
    },
    {
      title: '端点',
      dataIndex: 'endpoint',
      key: 'endpoint',
      ellipsis: true,
    },
    {
      title: '温度',
      dataIndex: 'temperature',
      key: 'temperature',
      render: (temp) => temp?.toFixed(1),
    },
    {
      title: 'Max Tokens',
      dataIndex: 'max_tokens',
      key: 'max_tokens',
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space>
          <Button 
            type="link" 
            icon={<ThunderOutlined />} 
            onClick={() => handleTest(record)}
            loading={testingModel === record.id}
          >
            测试
          </Button>
          <Button 
            type={selectedModel?.id === record.id ? 'default' : 'primary'} 
            size="small"
            onClick={() => handleSelect(record)}
          >
            {selectedModel?.id === record.id ? '当前使用' : '选择'}
          </Button>
          <Popconfirm
            title="确定删除此模型配置？"
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
    <Card className="card-section" title={<><RobotOutlined /> AI模型配置</>} extra={
      <Button type="primary" icon={<PlusOutlined />} onClick={() => {
        form.resetFields();
        setModalVisible(true);
      }}>
        添加模型
      </Button>
    }>
      <Table
        columns={columns}
        dataSource={models}
        rowKey="id"
        pagination={{ pageSize: 5 }}
      />

      <Modal
        title="添加AI模型配置"
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
        }}
        onOk={handleSubmit}
        width={600}
      >
        <Form form={form} layout="vertical" initialValues={{ temperature: 0.7, max_tokens: 2048 }}>
          <Form.Item
            name="endpoint"
            label="API端点"
            rules={[{ required: true, message: '请输入API端点' }]}
            tooltip="例如：https://api.openai.com/v1"
          >
            <Input placeholder="https://api.example.com/v1" />
          </Form.Item>
          <Form.Item
            name="api_key"
            label="API密钥"
            rules={[{ required: true, message: '请输入API密钥' }]}
          >
            <Input.Password placeholder="sk-xxx" />
          </Form.Item>
          <Form.Item
            name="model_name"
            label="模型名称"
            rules={[{ required: true, message: '请输入模型名称' }]}
            tooltip="例如：gpt-3.5-turbo, gpt-4, claude-3"
          >
            <Input placeholder="gpt-3.5-turbo" />
          </Form.Item>
          <Form.Item
            name="temperature"
            label={`温度参数：${form.getFieldValue('temperature') || 0.7}`}
            tooltip="越高越随机，越低越确定"
          >
            <Slider min={0} max={2} step={0.1} marks={{ 0: '0', 1: '1', 2: '2' }} />
          </Form.Item>
          <Form.Item
            name="max_tokens"
            label="最大Token数"
            tooltip="单次响应的最大token数量"
          >
            <Slider min={100} max={8192} step={100} marks={{ 100: '100', 4096: '4K', 8192: '8K' }} />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
};

export default ModelSection;

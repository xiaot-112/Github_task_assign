import React, { useState } from 'react';
import { Card, Form, Input, Button, Space, message, Table, Modal, Popconfirm, Tag, Typography } from 'antd';
import { PlusOutlined, DeleteOutlined, EditOutlined, FileTextOutlined } from '@ant-design/icons';
import useStore from '../store';
import { promptAPI } from '../services/api';

const { Paragraph } = Typography;

const PromptSection = () => {
  const { prompts, setPrompts, selectedPrompt, setSelectedPrompt } = useStore();
  const [form] = Form.useForm();
  const [modalVisible, setModalVisible] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState(null);

  const loadPrompts = async () => {
    try {
      const res = await promptAPI.getAll();
      setPrompts(res.data.data || []);
    } catch (error) {
      message.error('加载提示词模板失败');
    }
  };

  React.useEffect(() => {
    loadPrompts();
  }, []);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      // 解析变量
      const variableMatches = values.template.match(/\{(\w+)\}/g) || [];
      values.variables = [...new Set(variableMatches.map(v => v.replace(/[{}]/g, '')))];
      
      if (editingPrompt) {
        await promptAPI.update(editingPrompt.id, values);
        message.success('更新成功');
      } else {
        await promptAPI.save(values);
        message.success('保存成功');
      }
      setModalVisible(false);
      form.resetFields();
      setEditingPrompt(null);
      loadPrompts();
    } catch (error) {
      message.error('保存失败');
    }
  };

  const handleEdit = (prompt) => {
    setEditingPrompt(prompt);
    form.setFieldsValue({
      name: prompt.name,
      description: prompt.description,
      template: prompt.template,
    });
    setModalVisible(true);
  };

  const handleDelete = async (id) => {
    try {
      await promptAPI.delete(id);
      if (selectedPrompt?.id === id) {
        setSelectedPrompt(null);
      }
      message.success('删除成功');
      loadPrompts();
    } catch (error) {
      message.error('删除失败');
    }
  };

  const handleSelect = (prompt) => {
    setSelectedPrompt(prompt);
    message.success(`已选择模板：${prompt.name}`);
  };

  const columns = [
    {
      title: '模板名称',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <Space>
          <span>{text}</span>
          {selectedPrompt?.id === record.id && <Tag color="green">使用中</Tag>}
        </Space>
      ),
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: '变量',
      dataIndex: 'variables',
      key: 'variables',
      render: (vars) => (
        <Space wrap>
          {(vars || []).map((v, i) => (
            <Tag key={i} color="orange">{`{${v}}`}</Tag>
          ))}
        </Space>
      ),
    },
    {
      title: '预览',
      key: 'preview',
      render: (_, record) => (
        <Paragraph ellipsis={{ rows: 2 }} style={{ maxWidth: 300, marginBottom: 0 }}>
          {record.template}
        </Paragraph>
      ),
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space>
          <Button 
            type={selectedPrompt?.id === record.id ? 'default' : 'primary'} 
            size="small"
            onClick={() => handleSelect(record)}
          >
            {selectedPrompt?.id === record.id ? '当前使用' : '选择'}
          </Button>
          <Button type="link" icon={<EditOutlined />} onClick={() => handleEdit(record)} />
          <Popconfirm
            title="确定删除此模板？"
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
    <Card className="card-section" title={<><FileTextOutlined /> 提示词模板管理</>} extra={
      <Button type="primary" icon={<PlusOutlined />} onClick={() => {
        setEditingPrompt(null);
        form.resetFields();
        setModalVisible(true);
      }}>
        添加模板
      </Button>
    }>
      <Table
        columns={columns}
        dataSource={prompts}
        rowKey="id"
        pagination={{ pageSize: 5 }}
        scroll={{ x: 1000 }}
      />

      <Modal
        title={editingPrompt ? '编辑提示词模板' : '添加提示词模板'}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
          setEditingPrompt(null);
        }}
        onOk={handleSubmit}
        width={800}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label="模板名称"
            rules={[{ required: true, message: '请输入模板名称' }]}
          >
            <Input placeholder="例如：任务提取模板" />
          </Form.Item>
          <Form.Item
            name="description"
            label="描述"
          >
            <Input placeholder="简要描述此模板的用途" />
          </Form.Item>
          <Form.Item
            name="template"
            label="模板内容"
            rules={[{ required: true, message: '请输入模板内容' }]}
            tooltip="使用 {variable} 格式插入变量，如：{task_description}, {contributor_skills}"
          >
            <Input.TextArea 
              rows={8} 
              placeholder={`示例：
你是一个任务分配助手。请根据以下信息进行分析：

任务描述：{task_description}
所需技能：{required_skills}

贡献者技能：{contributor_skills}
经验水平：{experience_level}

请分析匹配度并给出推荐理由。`} 
            />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="dashed" onClick={() => {
                const vars = ['task_description', 'required_skills', 'contributor_skills', 'experience_level', 'availability'];
                const current = form.getFieldValue('template') || '';
                form.setFieldValue('template', current + `\n{${vars[Math.floor(Math.random() * vars.length)]}}`);
              }}>
                插入变量
              </Button>
              <span style={{ color: '#999', fontSize: '12px' }}>使用 {'{'}变量名{'}'} 格式在模板中引用变量</span>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
};

export default PromptSection;

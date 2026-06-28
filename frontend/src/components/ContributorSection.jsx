import React, { useState } from 'react';
import { Card, Form, Input, Button, Space, message, Table, Modal, Popconfirm, Select, Tag } from 'antd';
import { PlusOutlined, DeleteOutlined, EditOutlined, UserOutlined } from '@ant-design/icons';
import useStore from '../store';
import { contributorAPI } from '../services/api';

const ContributorSection = () => {
  const { contributors, setContributors } = useStore();
  const [form] = Form.useForm();
  const [modalVisible, setModalVisible] = useState(false);
  const [editingContributor, setEditingContributor] = useState(null);

  const loadContributors = async () => {
    try {
      const res = await contributorAPI.getAll();
      setContributors(res.data.data || []);
    } catch (error) {
      message.error('加载贡献者失败');
    }
  };

  React.useEffect(() => {
    loadContributors();
  }, []);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (editingContributor) {
        await contributorAPI.update(editingContributor.id, values);
        message.success('更新成功');
      } else {
        await contributorAPI.save(values);
        message.success('添加成功');
      }
      setModalVisible(false);
      form.resetFields();
      setEditingContributor(null);
      loadContributors();
    } catch (error) {
      message.error('保存失败');
    }
  };

  const handleEdit = (contributor) => {
    setEditingContributor(contributor);
    form.setFieldsValue({
      name: contributor.name,
      skills: contributor.skills,
      experience_level: contributor.experience_level,
      availability: contributor.availability,
      description: contributor.description,
      preferred_languages: contributor.preferred_languages,
    });
    setModalVisible(true);
  };

  const handleDelete = async (id) => {
    try {
      await contributorAPI.delete(id);
      message.success('删除成功');
      loadContributors();
    } catch (error) {
      message.error('删除失败');
    }
  };

  const columns = [
    {
      title: '姓名',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '技能',
      dataIndex: 'skills',
      key: 'skills',
      render: (skills) => (
        <Space wrap>
          {(skills || []).slice(0, 5).map((skill, i) => (
            <Tag key={i} color="blue">{skill}</Tag>
          ))}
          {(skills || []).length > 5 && <Tag>+{skills.length - 5}</Tag>}
        </Space>
      ),
    },
    {
      title: '经验水平',
      dataIndex: 'experience_level',
      key: 'experience_level',
      render: (level) => {
        const colorMap = { junior: 'green', mid: 'blue', senior: 'purple', expert: 'red' };
        const labelMap = { junior: '初级', mid: '中级', senior: '高级', expert: '专家' };
        return <Tag color={colorMap[level]}>{labelMap[level] || level}</Tag>;
      },
    },
    {
      title: '可用性',
      dataIndex: 'availability',
      key: 'availability',
      render: (avail) => {
        const labelMap = { full_time: '全职', part_time: '兼职', weekends: '周末', flexible: '灵活' };
        return labelMap[avail] || avail;
      },
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space>
          <Button type="link" icon={<EditOutlined />} onClick={() => handleEdit(record)} />
          <Popconfirm
            title="确定删除此贡献者？"
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
    <Card className="card-section" title={<><UserOutlined /> 贡献者信息</>} extra={
      <Button type="primary" icon={<PlusOutlined />} onClick={() => {
        setEditingContributor(null);
        form.resetFields();
        setModalVisible(true);
      }}>
        添加贡献者
      </Button>
    }>
      <Table
        columns={columns}
        dataSource={contributors}
        rowKey="id"
        pagination={{ pageSize: 5 }}
        scroll={{ x: 800 }}
      />

      <Modal
        title={editingContributor ? '编辑贡献者' : '添加贡献者'}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
          setEditingContributor(null);
        }}
        onOk={handleSubmit}
        width={700}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label="姓名"
            rules={[{ required: true, message: '请输入姓名' }]}
          >
            <Input placeholder="贡献者姓名" />
          </Form.Item>
          <Form.Item
            name="skills"
            label="技能列表（逗号分隔）"
            rules={[{ required: true, message: '请输入技能' }]}
          >
            <Input placeholder="例如：JavaScript, Python, React" />
          </Form.Item>
          <Form.Item
            name="experience_level"
            label="经验水平"
            rules={[{ required: true, message: '请选择经验水平' }]}
          >
            <Select>
              <Select.Option value="junior">初级</Select.Option>
              <Select.Option value="mid">中级</Select.Option>
              <Select.Option value="senior">高级</Select.Option>
              <Select.Option value="expert">专家</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="availability"
            label="可用性"
            rules={[{ required: true, message: '请选择可用性' }]}
          >
            <Select>
              <Select.Option value="full_time">全职</Select.Option>
              <Select.Option value="part_time">兼职</Select.Option>
              <Select.Option value="weekends">周末</Select.Option>
              <Select.Option value="flexible">灵活</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="preferred_languages"
            label="偏好语言（逗号分隔）"
          >
            <Input placeholder="例如：English, Chinese" />
          </Form.Item>
          <Form.Item
            name="description"
            label="个人描述"
          >
            <Input.TextArea rows={3} placeholder="简要描述贡献者的背景和特长" />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
};

export default ContributorSection;

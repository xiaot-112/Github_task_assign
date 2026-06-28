import React, { useState } from 'react';
import { Card, Form, InputNumber, Switch, Button, message, Select, Divider } from 'antd';
import { SettingOutlined, SaveOutlined } from '@ant-design/icons';
import useStore from '../store';
import { settingsAPI } from '../services/api';

const SettingsSection = () => {
  const { settings, setSettings } = useStore();
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);

  React.useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const res = await settingsAPI.get();
      const data = res.data.data || {};
      setSettings(data);
      form.setFieldsValue(data);
    } catch (error) {
      console.error('加载设置失败', error);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const values = await form.validateFields();
      await settingsAPI.update(values);
      setSettings(values);
      message.success('设置已保存');
    } catch (error) {
      message.error('保存失败');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="card-section" title={<><SettingOutlined /> 系统设置</>}>
      <Form form={form} layout="vertical" initialValues={settings}>
        <Divider orientation="left">任务获取设置</Divider>
        
        <Form.Item
          name="auto_fetch_interval"
          label="自动获取间隔（秒）"
          tooltip="系统自动从GitHub获取新任务的间隔时间，0表示禁用自动获取"
        >
          <InputNumber 
            min={0} 
            max={86400} 
            step={300}
            style={{ width: '100%' }}
            addonAfter="秒"
          />
        </Form.Item>

        <Form.Item
          name="max_tasks_per_contributor"
          label="每人最大任务数"
          tooltip="每个贡献者同时可分配的最大任务数量"
        >
          <InputNumber 
            min={1} 
            max={20} 
            style={{ width: '100%' }}
            addonAfter="个"
          />
        </Form.Item>

        <Divider orientation="left">通知设置</Divider>

        <Form.Item
          name="notification_enabled"
          label="启用通知"
          valuePropName="checked"
        >
          <Switch checkedChildren="开启" unCheckedChildren="关闭" />
        </Form.Item>

        <Divider orientation="left">界面设置</Divider>

        <Form.Item
          name="language"
          label="界面语言"
        >
          <Select>
            <Select.Option value="zh-CN">简体中文</Select.Option>
            <Select.Option value="en-US">English</Select.Option>
          </Select>
        </Form.Item>

        <Form.Item>
          <Button 
            type="primary" 
            icon={<SaveOutlined />} 
            onClick={handleSave}
            loading={saving}
          >
            保存设置
          </Button>
        </Form.Item>
      </Form>

      <Divider />
      
      <div style={{ color: '#666', fontSize: 13 }}>
        <p><strong>提示：</strong></p>
        <ul style={{ paddingLeft: 20 }}>
          <li>自动获取间隔设置为 0 时，系统将不会自动从 GitHub 获取新任务</li>
          <li>修改设置后需要点击"保存设置"按钮才能生效</li>
          <li>系统设置会持久化存储到本地，下次启动时自动加载</li>
        </ul>
      </div>
    </Card>
  );
};

export default SettingsSection;

'use client';

import { useState, useEffect } from 'react';
import { Card, Select, Form, InputNumber, Button, Tabs, message, Input, Spin } from 'antd';
import { SaveOutlined, ReloadOutlined } from '@ant-design/icons';
import ModelViewer from './ModelViewer';
import MaterialSelector from './MaterialSelector';

const { TabPane } = Tabs;
const { Option } = Select;

export default function TemplateTestPage() {
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [parameters, setParameters] = useState({});
  const [modelId, setModelId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [configName, setConfigName] = useState('');
  const [configs, setConfigs] = useState([]);
  const [selectedConfigId, setSelectedConfigId] = useState(null);
  const [form] = Form.useForm();

  // 加载模板列表
  useEffect(() => {
    const fetchTemplates = async () => {
      setLoading(true);
      try {
        console.log('Fetching templates from API...');
        const response = await fetch('/api/templates');
        if (response.ok) {
          const data = await response.json();
          console.log('Loaded templates:', data);

          // 检查是否有门、窗户和墙模板
          const doorTemplate = data.find(t => t.id === 'door');
          const windowTemplate = data.find(t => t.id === 'window');
          const wallTemplate = data.find(t => t.id === 'wall');

          console.log('Door template:', doorTemplate ? 'Found' : 'Not found');
          console.log('Window template:', windowTemplate ? 'Found' : 'Not found');
          console.log('Wall template:', wallTemplate ? 'Found' : 'Not found');

          setTemplates(data);

          // 默认选择第一个模板
          if (data.length > 0) {
            setSelectedTemplate(data[0]);

            // 设置默认参数
            const defaultParams = {};
            const schema = typeof data[0].parameterSchema === 'string'
              ? JSON.parse(data[0].parameterSchema)
              : data[0].parameterSchema;

            Object.entries(schema).forEach(([key, value]) => {
              defaultParams[key] = value.default;
            });

            setParameters(defaultParams);
            form.setFieldsValue(defaultParams);
          }
        }
      } catch (error) {
        console.error('Error fetching templates:', error);
        message.error('加载模板失败');
      } finally {
        setLoading(false);
      }
    };

    fetchTemplates();
  }, [form]);

  // 处理模板选择
  const handleTemplateChange = (templateId) => {
    const template = templates.find(t => t.id === templateId);
    setSelectedTemplate(template);

    // 重置参数
    const defaultParams = {};
    const schema = typeof template.parameterSchema === 'string'
      ? JSON.parse(template.parameterSchema)
      : template.parameterSchema;

    Object.entries(schema).forEach(([key, value]) => {
      defaultParams[key] = value.default;
    });

    setParameters(defaultParams);
    form.setFieldsValue(defaultParams);
    setModelId(null);
  };

  // 处理参数变化
  const handleParameterChange = (changedValues, allValues) => {
    setParameters(allValues);
  };

  // 生成模型
  const handleGenerateModel = async () => {
    if (!selectedTemplate) return;

    setGenerating(true);

    try {
      // 模拟生成模型
      setTimeout(() => {
        // 生成一个随机 ID
        const randomId = Math.random().toString(36).substring(2, 15);
        setModelId(randomId);
        message.success('模型生成成功');

        // 初始化空的配置列表
        setConfigs([]);
        setGenerating(false);
      }, 1000);
    } catch (error) {
      console.error('Error generating model:', error);
      message.error(error.message);
      setGenerating(false);
    }
  };

  // 加载配置列表
  const loadConfigurations = async (id) => {
    try {
      const response = await fetch(`/api/models/${id}/configs`);
      if (response.ok) {
        const data = await response.json();
        setConfigs(data);
      }
    } catch (error) {
      console.error('Error loading configurations:', error);
    }
  };

  // 保存配置
  const handleSaveConfig = async () => {
    if (!modelId) {
      message.warning('请先生成模型');
      return;
    }

    if (!configName) {
      message.warning('请输入配置名称');
      return;
    }

    try {
      // 模拟保存配置
      setTimeout(() => {
        // 生成一个随机 ID
        const randomId = Math.random().toString(36).substring(2, 15);

        // 添加到配置列表
        const newConfig = {
          id: randomId,
          name: configName,
          modelId: modelId,
          createdAt: new Date().toISOString()
        };

        setConfigs(prev => [...prev, newConfig]);
        message.success('配置保存成功');
        setConfigName('');
      }, 500);
    } catch (error) {
      console.error('Error saving configuration:', error);
      message.error(error.message);
    }
  };

  // 选择配置
  const handleConfigSelect = (configId) => {
    setSelectedConfigId(configId);
  };

  // 渲染参数表单
  const renderParameterForm = () => {
    if (!selectedTemplate) return null;

    const schema = typeof selectedTemplate.parameterSchema === 'string'
      ? JSON.parse(selectedTemplate.parameterSchema)
      : selectedTemplate.parameterSchema;

    return (
      <Form
        form={form}
        layout="vertical"
        initialValues={parameters}
        onValuesChange={handleParameterChange}
      >
        {Object.entries(schema).map(([key, value]) => (
          <Form.Item
            key={key}
            name={key}
            label={`${value.description || key} (${value.min} - ${value.max})`}
            rules={[{ required: value.required, message: '此参数为必填项' }]}
          >
            <InputNumber
              min={value.min}
              max={value.max}
              step={0.01}
              style={{ width: '100%' }}
            />
          </Form.Item>
        ))}

        <Form.Item>
          <Button
            type="primary"
            onClick={handleGenerateModel}
            loading={generating}
            icon={<ReloadOutlined />}
          >
            生成模型
          </Button>
        </Form.Item>
      </Form>
    );
  };

  return (
    <div className="template-test-page" style={{ padding: '20px' }}>
      <h1>参数化模型模板测试</h1>

      <div style={{ display: 'flex', gap: '20px' }}>
        <div style={{ width: '300px' }}>
          <Card title="模板选择" style={{ marginBottom: '20px' }}>
            <Select
              style={{ width: '100%' }}
              placeholder="选择模板"
              onChange={handleTemplateChange}
              value={selectedTemplate?.id}
              loading={loading}
            >
              {templates.map(template => (
                <Option key={template.id} value={template.id}>
                  {template.name}
                </Option>
              ))}
            </Select>
          </Card>

          <Card title="参数设置">
            {loading ? (
              <div style={{ textAlign: 'center', padding: '20px' }}>
                <Spin />
              </div>
            ) : (
              renderParameterForm()
            )}
          </Card>

          {modelId && (
            <Card title="保存配置" style={{ marginTop: '20px' }}>
              <Input
                placeholder="配置名称"
                value={configName}
                onChange={e => setConfigName(e.target.value)}
                style={{ marginBottom: '10px' }}
              />
              <Button
                type="primary"
                onClick={handleSaveConfig}
                icon={<SaveOutlined />}
                block
              >
                保存当前配置
              </Button>

              {configs.length > 0 && (
                <div style={{ marginTop: '20px' }}>
                  <h4>已保存的配置</h4>
                  <Select
                    style={{ width: '100%' }}
                    placeholder="选择配置"
                    onChange={handleConfigSelect}
                    value={selectedConfigId}
                  >
                    {configs.map(config => (
                      <Option key={config.id} value={config.id}>
                        {config.name}
                      </Option>
                    ))}
                  </Select>
                </div>
              )}
            </Card>
          )}
        </div>

        <div style={{ flex: 1 }}>
          <Card style={{ height: '100%' }}>
            <Tabs defaultActiveKey="model">
              <TabPane tab="模型预览" key="model">
                <div style={{ height: '500px', position: 'relative' }}>
                  {modelId ? (
                    <ModelViewer modelId={modelId} configId={selectedConfigId} />
                  ) : (
                    <div style={{
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      height: '100%',
                      backgroundColor: '#f5f5f5',
                      borderRadius: '4px'
                    }}>
                      <p>请选择模板并生成模型</p>
                    </div>
                  )}
                </div>
              </TabPane>

              <TabPane tab="材质编辑" key="materials" disabled={!modelId}>
                {modelId && (
                  <MaterialSelector modelId={modelId} configId={selectedConfigId} />
                )}
              </TabPane>
            </Tabs>
          </Card>
        </div>
      </div>
    </div>
  );
}

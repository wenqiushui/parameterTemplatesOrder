'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, Row, Col, Button, Spin, Form, InputNumber, Slider, Select, Checkbox, Input, message, Tabs, Modal, Pagination } from 'antd'; // Added Pagination import
import { AppstoreOutlined, SettingOutlined, EyeOutlined, DownloadOutlined, SaveOutlined, UserOutlined } from '@ant-design/icons';
import { templateLoaderService } from '@/lib/services/templateLoaderService';
import { templateCacheService, TemplateMetadata } from '@/lib/services/templateCacheService';
import { templateModelService } from '@/lib/services/templateModelService';
import { useSession } from 'next-auth/react';
import LazyModelPreview from '@/components/LazyModelPreview';
import UserModelList from '@/components/UserModelList';
import ModelInstancePreview from '@/components/ModelInstancePreview';
import EnvironmentSelector from '@/components/environment/EnvironmentSelector';

export default function OptimizedModelsPage() {
  // 会话信息
  const { data: session } = useSession();

  // 标签页状态
  const [activeTab, setActiveTab] = useState('templates');

  // 模板相关状态
  const [templates, setTemplates] = useState<TemplateMetadata[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateMetadata | null>(null);
  const [parameters, setParameters] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [form] = Form.useForm();
  const modelPreviewRef = useRef<{ setShouldLoadModel: (value: boolean) => void } | null>(null);
  const [currentPage, setCurrentPage] = useState(1); // Added currentPage state
  const [pageSize, setPageSize] = useState(6); // Added pageSize state (adjust as needed)
  // 缩略图加载状态管理
  const [thumbnailLoadStatus, setThumbnailLoadStatus] = useState<Record<string, boolean>>({});

  // 模型实例相关状态
  const [selectedModelId, setSelectedModelId] = useState<string | null>(null);
  const [saveModalVisible, setSaveModalVisible] = useState(false);
  const [modelName, setModelName] = useState('');

  // 加载模板列表
  useEffect(() => {
    const loadTemplates = async () => {
      try {
        setInitialLoading(true);
        console.log('模型库页面: 正在加载模板元数据...');
        const metadata = await templateLoaderService.loadTemplateMetadata();
        console.log('模型库页面: 加载到的模板:', metadata.map(t => ({ id: t.id, name: t.name })));

        // 检查是否有门、窗户和墙模板
        const doorTemplate = metadata.find(t => t.id === 'door');
        const windowTemplate = metadata.find(t => t.id === 'window');
        const wallTemplate = metadata.find(t => t.id === 'wall');

        console.log('模型库页面: 门模板:', doorTemplate ? '找到' : '未找到');
        console.log('模型库页面: 窗户模板:', windowTemplate ? '找到' : '未找到');
        console.log('模型库页面: 墙模板:', wallTemplate ? '找到' : '未找到');

        setTemplates(metadata);

        // 如果有模板，默认选择第一个
        if (metadata.length > 0) {
          handleSelectTemplate(metadata[0]);
        }
      } catch (error) {
        console.error('Error loading templates:', error);
        message.error('加载模板列表失败');
      } finally {
        setInitialLoading(false);
      }
    };

    loadTemplates();
  }, []);

  // 选择模板
  const handleSelectTemplate = async (template: TemplateMetadata) => {
    setSelectedTemplate(template);

    // 初始化参数
    const initialParams = { ...template.defaultParameters };
    setParameters(initialParams);
    form.setFieldsValue(initialParams);

    // 检查模板代码是否已缓存
    try {
      // 检查缓存
      let cachedCode = await templateCacheService.getTemplateCode(template.id, template.version);
      if (!cachedCode) {
        // 如果缓存未命中，则从服务器请求模板代码
        cachedCode = await templateLoaderService.loadTemplateCode(template.id, template.version);
        if (cachedCode) {
          // 获取到代码后写入缓存
          await templateCacheService.setTemplateCode(template.id, template.version, cachedCode);
        }
      }
      if (cachedCode) {
        console.log(`Template ${template.id} code is already cached or已缓存`);
        // 记录模板使用
        await templateCacheService.recordTemplateUsage(template.id);
        // 预加载模板到注册表
        try {
          // 导入客户端模板管理器
          const { getTemplateRegistry } = await import('@/lib/templates/registry/templateRegistryFactory');
          const registry = getTemplateRegistry();
          // 检查模板是否已加载到注册表
          if (registry.has(template.id)) {
            console.log(`Template ${template.id} already loaded in registry`);
          } else {
            console.log(`Loading template ${template.id} from cache to registry...`);
            await registry.get(template.id);
          }
        } catch (e) {
          console.warn(`Failed to load template ${template.id} to registry:`, e);
        }
      } else {
        console.log(`Template ${template.id} code is not cached and未获取到代码`);
      }
    } catch (error) {
      console.warn(`Failed to check template cache for ${template.id}:`, error);
    }
  };

  // 参数变更
  const handleParameterChange = (_changedValues: any, allValues: Record<string, any>) => {
    // 更新参数状态，但不自动更新预览
    // 处理参数类型转换
    const processedParams = { ...allValues };

    // 将字符串数字转换为数字类型
    Object.entries(processedParams).forEach(([key, value]) => {
      if (typeof value === 'string' && !isNaN(Number(value))) {
        processedParams[key] = Number(value);
      }
    });

    setParameters(processedParams);
  };

  // 生成模型
  const handleGenerateModel = async () => {
    if (!selectedTemplate) return;

    setLoading(true);

    try {
      // 获取表单中的最新值
      const formValues = form.getFieldsValue();

      // 处理参数类型转换
      const processedParams = { ...formValues };

      // 将字符串数字转换为数字类型
      Object.entries(processedParams).forEach(([key, value]) => {
        if (typeof value === 'string' && !isNaN(Number(value))) {
          processedParams[key] = Number(value);
        }
      });

      // 更新参数状态
      setParameters(processedParams);

      // 触发 LazyModelPreview 组件中的模型加载
      if (modelPreviewRef.current) {
        modelPreviewRef.current.setShouldLoadModel(true);
      }

      message.success('模型生成中...');
    } catch (error: any) {
      console.error('Error generating model:', error);
      message.error('生成模型失败');
    } finally {
      setLoading(false);
    }
  };

  // 下载模型
  const handleDownload = async () => {
    if (!selectedTemplate) return;

    setLoading(true);

    try {
      // 获取表单中的最新值
      const formValues = form.getFieldsValue();

      // 处理参数类型转换
      const processedParams = { ...formValues };

      // 将字符串数字转换为数字类型
      Object.entries(processedParams).forEach(([key, value]) => {
        if (typeof value === 'string' && !isNaN(Number(value))) {
          processedParams[key] = Number(value);
        }
      });

      // 更新参数状态
      setParameters(processedParams);

      const queryParams = new URLSearchParams();
      Object.entries(processedParams).forEach(([key, value]) => {
        if (typeof value === 'object') {
          queryParams.append(key, JSON.stringify(value));
        } else {
          queryParams.append(key, String(value));
        }
      });

      const downloadUrl = `/api/models/generate/${selectedTemplate.id}/download?${queryParams.toString()}`;
      window.open(downloadUrl, '_blank');
      message.success('模型下载已开始');
    } catch (error: any) {
      console.error('Error downloading model:', error);
      message.error(`下载模型失败: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // 保存模型实例
  const handleSaveModel = () => {
    if (!selectedTemplate) return;
    setModelName(`${selectedTemplate.name} Instance`); // 默认名称
    setSaveModalVisible(true);
  };

  const handleConfirmSave = async () => {
    if (!selectedTemplate || !session?.user?.id || !modelName) return;

    setLoading(true);
    setSaveModalVisible(false);

    try {
      // 获取表单中的最新值
      const formValues = form.getFieldsValue();

      // 处理参数类型转换
      const processedParams = { ...formValues };

      // 将字符串数字转换为数字类型
      Object.entries(processedParams).forEach(([key, value]) => {
        if (typeof value === 'string' && !isNaN(Number(value))) {
          processedParams[key] = Number(value);
        }
      });

      // 更新参数状态
      setParameters(processedParams);

      const modelData = {
        name: modelName,
        templateId: selectedTemplate.id,
        parameters: processedParams,
        userId: session.user.id,
      };

      await templateModelService.saveModelInstance(modelData);
      message.success('模型实例保存成功');
      // 可以选择切换到“我的模型”标签页
      // setActiveTab('myModels');
    } catch (error: any) {
      console.error('Error saving model instance:', error);
      message.error(`保存模型实例失败: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // 渲染参数表单项
  const renderFormItem = (key: string, schema: any) => {
    const label = schema.title || key;
    const type = schema.type;

    switch (type) {
      case 'number':
      case 'integer':
        if (schema.minimum !== undefined && schema.maximum !== undefined) {
          return (
            <Form.Item key={key} name={key} label={label}>
              <Slider min={schema.minimum} max={schema.maximum} step={schema.step || (type === 'integer' ? 1 : 0.1)} />
            </Form.Item>
          );
        } else {
          return (
            <Form.Item key={key} name={key} label={label}>
              <InputNumber step={schema.step || (type === 'integer' ? 1 : 0.1)} style={{ width: '100%' }} />
            </Form.Item>
          );
        }
      case 'string':
        if (schema.enum) {
          return (
            <Form.Item key={key} name={key} label={label}>
              <Select>
                {schema.enum.map((option: string) => (
                  <Select.Option key={option} value={option}>{option}</Select.Option>
                ))}
              </Select>
            </Form.Item>
          );
        } else if (schema.format === 'color') {
          return (
            <Form.Item key={key} name={key} label={label}>
              <Input type="color" />
            </Form.Item>
          );
        } else {
          return (
            <Form.Item key={key} name={key} label={label}>
              <Input />
            </Form.Item>
          );
        }
      case 'boolean':
        return (
          <Form.Item key={key} name={key} label={label} valuePropName="checked">
            <Checkbox />
          </Form.Item>
        );
      case 'object':
        // 简单处理 object 类型，可以根据需要扩展
        return (
          <Form.Item key={key} name={key} label={label}>
            <Input.TextArea rows={3} />
          </Form.Item>
        );
      default:
        return null;
    }
  };

  // 渲染参数表单
  const renderParameterForm = () => {
    if (!selectedTemplate || !selectedTemplate.parameterSchema) {
      return <p>选择一个模板以查看参数。</p>;
    }

    // 兼容不同的 parameterSchema 结构
    let properties: Record<string, any> = {};
    if (selectedTemplate.parameterSchema.properties && typeof selectedTemplate.parameterSchema.properties === 'object') {
      properties = selectedTemplate.parameterSchema.properties;
    } else if (typeof selectedTemplate.parameterSchema === 'object') {
      // 直接就是属性对象
      properties = selectedTemplate.parameterSchema;
    }

    if (!properties || Object.keys(properties).length === 0) {
      return <p>该模板没有可编辑参数。</p>;
    }

    return (
      <Form
        form={form}
        layout="vertical"
        initialValues={parameters}
        onValuesChange={handleParameterChange}
      >
        {Object.entries(properties).map(([key, schema]) => renderFormItem(key, schema))}
      </Form>
    );
  };

  // 处理分页变化
  const handlePageChange = (page: number, pageSize?: number) => {
    setCurrentPage(page);
    if (pageSize) {
      setPageSize(pageSize);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <Tabs activeKey={activeTab} onChange={setActiveTab}>
        <Tabs.TabPane tab={<span><AppstoreOutlined /> 模板库</span>} key="templates">
          <Row gutter={16}>
            {/* 模板列表 */}
            <Col xs={24} sm={8} md={6}>
              <Card title="模板列表">
                {initialLoading ? (
                  <div className="text-center"><Spin /></div>
                ) : templates.length > 0 ? (
                  <>
                    <div className="templates-list" style={{ maxHeight: 'calc(100vh - 300px)', overflowY: 'auto' }}>
                      {templates.slice((currentPage - 1) * pageSize, currentPage * pageSize).map(template => (
                        <Card
                          hoverable
                          key={template.id}
                          className={`template-card mb-2 ${selectedTemplate?.id === template.id ? 'border-blue-500 border-2' : ''}`}
                          onClick={() => handleSelectTemplate(template)}
                          cover={
                            <img
                              alt={template.name}
                              src={template.thumbnailUrl || '/placeholder-thumbnail.png'}
                              data-loaded={thumbnailLoadStatus[template.id] ? 'true' : 'false'}
                              style={{ height: '100px', objectFit: 'cover' }}
                              loading="lazy"
                              onError={(e) => {
                                const img = e.target as HTMLImageElement;
                                // 已经是占位图时不再处理
                                if (img.src === '/placeholder-thumbnail.png') return;
                                
                                // 首次加载失败时切换为占位图
                                if (!thumbnailLoadStatus[template.id]) {
                                  setThumbnailLoadStatus(prev => ({ ...prev, [template.id]: true }));
                                  img.src = '/placeholder-thumbnail.png';
                                  img.dataset.loaded = 'true';
                                  img.onerror = null;
                                }
                              }}
                              onLoad={(e) => {
                                const img = e.target as HTMLImageElement;
                                // 首次成功加载时更新状态
                                if (img.src !== '/placeholder-thumbnail.png' && !thumbnailLoadStatus[template.id]) {
                                  setThumbnailLoadStatus(prev => ({ ...prev, [template.id]: true }));
                                  img.dataset.loaded = 'true';
                                }
                              }}
                            />
                          }
                        >
                          <Card.Meta title={template.name} description={template.description?.substring(0, 50) + '...'} />
                        </Card>
                      ))}
                    </div>
                    <Pagination
                      current={currentPage}
                      pageSize={pageSize}
                      total={templates.length}
                      onChange={handlePageChange}
                      showSizeChanger
                      pageSizeOptions={['6', '12', '24']}
                      style={{ marginTop: '16px', textAlign: 'center' }}
                    />
                  </>
                ) : (
                  <p>没有可用的模板。</p>
                )}
              </Card>
            </Col>

            {/* 参数配置 */}
            <Col xs={24} sm={8} md={6}>
              <Card title={<span><SettingOutlined /> 参数配置</span>}>
                {/* 新增：环境贴图选择 */}
                <div style={{ marginBottom: 16 }}>
                  <span style={{ fontWeight: 500 }}>环境贴图：</span>
                  <EnvironmentSelector
                    sceneId={null}
                    onChange={scene => {
                      setParameters(prev => ({ ...prev, environmentMapId: scene.environmentMapId }));
                      form.setFieldsValue({ ...form.getFieldsValue(), environmentMapId: scene.environmentMapId });
                    }}
                  />
                </div>
                {selectedTemplate ? (
                  <div style={{ maxHeight: 'calc(100vh - 250px)', overflowY: 'auto' }}>
                    {renderParameterForm()}
                    <Button
                      type="primary"
                      icon={<EyeOutlined />}
                      onClick={handleGenerateModel}
                      loading={loading}
                      style={{ marginTop: 16, width: '100%' }}
                      disabled={!selectedTemplate}
                    >
                      更新预览
                    </Button>
                    <Button
                      icon={<DownloadOutlined />}
                      onClick={handleDownload}
                      loading={loading}
                      style={{ marginTop: 8, width: '100%' }}
                      disabled={!selectedTemplate}
                    >
                      下载模型 (GLB)
                    </Button>
                    {session && (
                      <Button
                        icon={<SaveOutlined />}
                        onClick={handleSaveModel}
                        style={{ marginTop: 8, width: '100%' }}
                        disabled={!selectedTemplate}
                      >
                        保存模型实例
                      </Button>
                    )}
                  </div>
                ) : (
                  <p>请先选择一个模板。</p>
                )}
              </Card>
            </Col>

            {/* 模型预览 */}
            <Col xs={24} sm={8} md={12}>
              <Card title={<span><EyeOutlined /> 模型预览</span>}>
                {selectedTemplate ? (
                  <LazyModelPreview
                    ref={modelPreviewRef}
                    templateId={selectedTemplate.id}
                    parameters={{ ...parameters, environmentMapId: parameters.environmentMapId }}
                    key={selectedTemplate.id}
                    onModelGenerated={(modelId) => setSelectedModelId(modelId)}
                  />
                ) : (
                  <div style={{ height: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f0f0f0' }}>
                    <p>选择模板并配置参数以预览模型</p>
                  </div>
                )}
              </Card>
            </Col>
          </Row>
        </Tabs.TabPane>

        {session && (
          <Tabs.TabPane tab={<span><UserOutlined /> 我的模型</span>} key="myModels">
            <UserModelList userId={session.user.id} />
          </Tabs.TabPane>
        )}

        {/* 添加模型实例预览标签页 */}
        {selectedModelId && (
          <Tabs.TabPane tab="实例预览" key="instancePreview">
            <ModelInstancePreview modelId={selectedModelId} />
          </Tabs.TabPane>
        )}
      </Tabs>

      {/* 保存模型实例对话框 */}
      <Modal
        title="保存模型实例"
        visible={saveModalVisible}
        onOk={handleConfirmSave}
        onCancel={() => setSaveModalVisible(false)}
        confirmLoading={loading}
      >
        <Input
          placeholder="输入模型名称"
          value={modelName}
          onChange={(e) => setModelName(e.target.value)}
        />
      </Modal>
    </div>
  );
}

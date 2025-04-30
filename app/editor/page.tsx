'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Form, Input, Select, Button, Card, Upload, message, Tabs, Spin } from 'antd';
import { UploadOutlined, InboxOutlined } from '@ant-design/icons';
import type { UploadFile, UploadProps } from 'antd/es/upload/interface';

const { TabPane } = Tabs;
const { Dragger } = Upload;

export default function EditorPage() {
  const router = useRouter();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [templates, setTemplates] = useState([]);
  const [loadingTemplates, setLoadingTemplates] = useState(true);
  
  // 加载模板列表
  useState(() => {
    fetch('/api/templates')
      .then(res => res.json())
      .then(data => {
        setTemplates(data);
        setLoadingTemplates(false);
      })
      .catch(err => {
        console.error('Error loading templates:', err);
        message.error('加载模板列表失败');
        setLoadingTemplates(false);
      });
  });
  
  // 处理文件上传
  const handleUpload: UploadProps['onChange'] = ({ fileList }) => {
    setFileList(fileList);
  };
  
  // 处理表单提交
  const handleSubmit = async (values) => {
    if (fileList.length === 0) {
      message.error('请上传 GLB 模型文件');
      return;
    }
    
    setLoading(true);
    
    try {
      const formData = new FormData();
      formData.append('glbFile', fileList[0].originFileObj);
      formData.append('productData', JSON.stringify({
        name: values.name,
        templateId: values.templateId,
        description: values.description
      }));
      
      const response = await fetch('/api/models', {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        throw new Error('上传失败');
      }
      
      const result = await response.json();
      
      message.success('产品创建成功');
      router.push(`/product/${result.id}`);
    } catch (error) {
      console.error('Error creating product:', error);
      message.error('创建产品失败: ' + error.message);
    } finally {
      setLoading(false);
    }
  };
  
  // 处理参数化模型创建
  const handleParametricSubmit = async (values) => {
    setLoading(true);
    
    try {
      const response = await fetch('/api/models', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: values.name,
          templateId: values.templateId,
          params: values.params ? JSON.parse(values.params) : {}
        })
      });
      
      if (!response.ok) {
        throw new Error('创建失败');
      }
      
      const result = await response.json();
      
      message.success('产品创建成功');
      router.push(`/product/${result.id}`);
    } catch (error) {
      console.error('Error creating parametric product:', error);
      message.error('创建产品失败: ' + error.message);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div style={{ padding: '20px' }}>
      <h1 style={{ marginBottom: '20px' }}>产品编辑器</h1>
      
      <Tabs defaultActiveKey="upload">
        <TabPane tab="上传模型" key="upload">
          <Card>
            <Form
              form={form}
              layout="vertical"
              onFinish={handleSubmit}
            >
              <Form.Item
                name="name"
                label="产品名称"
                rules={[{ required: true, message: '请输入产品名称' }]}
              >
                <Input placeholder="请输入产品名称" />
              </Form.Item>
              
              <Form.Item
                name="description"
                label="产品描述"
              >
                <Input.TextArea placeholder="请输入产品描述" rows={4} />
              </Form.Item>
              
              <Form.Item
                name="templateId"
                label="模板"
                rules={[{ required: true, message: '请选择模板' }]}
              >
                <Select
                  placeholder="请选择模板"
                  loading={loadingTemplates}
                >
                  {templates.map(template => (
                    <Select.Option key={template.id} value={template.id}>
                      {template.name}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
              
              <Form.Item
                label="上传 GLB 模型"
              >
                <Dragger
                  name="file"
                  fileList={fileList}
                  onChange={handleUpload}
                  beforeUpload={() => false}
                  accept=".glb"
                  maxCount={1}
                >
                  <p className="ant-upload-drag-icon">
                    <InboxOutlined />
                  </p>
                  <p className="ant-upload-text">点击或拖拽文件到此区域上传</p>
                  <p className="ant-upload-hint">
                    支持单个 GLB 格式的 3D 模型文件
                  </p>
                </Dragger>
              </Form.Item>
              
              <Form.Item>
                <Button type="primary" htmlType="submit" loading={loading}>
                  创建产品
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </TabPane>
        
        <TabPane tab="参数化模型" key="parametric">
          <Card>
            <Form
              layout="vertical"
              onFinish={handleParametricSubmit}
            >
              <Form.Item
                name="name"
                label="产品名称"
                rules={[{ required: true, message: '请输入产品名称' }]}
              >
                <Input placeholder="请输入产品名称" />
              </Form.Item>
              
              <Form.Item
                name="templateId"
                label="模板"
                rules={[{ required: true, message: '请选择模板' }]}
              >
                <Select
                  placeholder="请选择模板"
                  loading={loadingTemplates}
                >
                  {templates.map(template => (
                    <Select.Option key={template.id} value={template.id}>
                      {template.name}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
              
              <Form.Item
                name="params"
                label="参数 (JSON 格式)"
                rules={[
                  { required: true, message: '请输入参数' },
                  {
                    validator: (_, value) => {
                      try {
                        if (value) {
                          JSON.parse(value);
                        }
                        return Promise.resolve();
                      } catch (error) {
                        return Promise.reject('请输入有效的 JSON 格式');
                      }
                    }
                  }
                ]}
              >
                <Input.TextArea
                  placeholder='{"width": 2, "height": 1, "depth": 3}'
                  rows={10}
                />
              </Form.Item>
              
              <Form.Item>
                <Button type="primary" htmlType="submit" loading={loading}>
                  创建参数化产品
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </TabPane>
      </Tabs>
    </div>
  );
}

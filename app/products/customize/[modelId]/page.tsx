'use client';

/**
 * 产品定制页面
 *
 * 该页面用于显示和定制模型实例
 * 它允许用户查看模型实例，调整参数，并将其添加到购物车
 */

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Row, Col, Card, Form, Button, Input, Spin, message, InputNumber, Slider, Select, Checkbox, Divider } from 'antd';
import { ShoppingCartOutlined, SaveOutlined, SettingOutlined } from '@ant-design/icons';
import { useSession } from 'next-auth/react';
import { templateModelService } from '@/lib/services/templateModelService';
import { templateRegistry } from '@/lib/templates/templateRegistry';
import ModelInstancePreview from '@/components/ModelInstancePreview';

export default function ProductCustomizePage() {
  const params = useParams();
  const modelId = params.modelId as string;
  const { data: session } = useSession();
  
  const [loading, setLoading] = useState(true);
  const [modelData, setModelData] = useState<any>(null);
  const [parameters, setParameters] = useState<Record<string, any>>({});
  const [parameterSchema, setParameterSchema] = useState<Record<string, any>>({});
  const [quantity, setQuantity] = useState(1);
  const [form] = Form.useForm();
  
  // 加载模型数据
  useEffect(() => {
    const loadModel = async () => {
      setLoading(true);
      
      try {
        // 加载模型实例
        const data = await templateModelService.loadModelInstance(modelId);
        setModelData(data);
        
        // 设置参数
        setParameters(data.parameters);
        form.setFieldsValue(data.parameters);
        
        // 获取模板
        const template = templateRegistry.get(data.templateId);
        if (template) {
          setParameterSchema(template.getParameterSchema());
        }
      } catch (error: any) {
        console.error('Error loading model:', error);
        message.error(`加载模型失败: ${error.message}`);
      } finally {
        setLoading(false);
      }
    };
    
    if (modelId) {
      loadModel();
    }
  }, [modelId, form]);
  
  // 处理参数变化
  const handleParameterChange = (changedValues: any, allValues: any) => {
    setParameters(allValues);
  };
  
  // 添加到购物车
  const handleAddToCart = async () => {
    if (!modelData || !session?.user) {
      message.error('请先登录');
      return;
    }
    
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
      
      // 添加到购物车
      const response = await fetch('/api/cart/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          modelId,
          parameters: processedParams,
          quantity
        })
      });
      
      if (!response.ok) {
        throw new Error('添加到购物车失败');
      }
      
      message.success('已添加到购物车');
    } catch (error: any) {
      console.error('Error adding to cart:', error);
      message.error(`添加到购物车失败: ${error.message}`);
    }
  };
  
  // 保存参数
  const handleSaveParameters = async () => {
    if (!modelData || !session?.user) {
      message.error('请先登录');
      return;
    }
    
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
      
      // 更新模型实例
      await templateModelService.updateModelInstance(modelId, {
        parameters: processedParams
      });
      
      message.success('参数已保存');
    } catch (error: any) {
      console.error('Error saving parameters:', error);
      message.error(`保存参数失败: ${error.message}`);
    }
  };
  
  // 渲染参数表单
  const renderParameterForm = () => {
    if (!parameterSchema) return null;
    
    return (
      <Form
        form={form}
        layout="vertical"
        onValuesChange={handleParameterChange}
        initialValues={parameters}
      >
        {Object.entries(parameterSchema).map(([key, schema]: [string, any]) => {
          const { type, min, max, description, options } = schema;
          
          switch (type) {
            case 'number':
              return (
                <Form.Item key={key} label={description || key} name={key}>
                  <Row gutter={8}>
                    <Col span={16}>
                      <Slider min={min} max={max} />
                    </Col>
                    <Col span={8}>
                      <InputNumber min={min} max={max} style={{ width: '100%' }} />
                    </Col>
                  </Row>
                </Form.Item>
              );
              
            case 'select':
              return (
                <Form.Item key={key} label={description || key} name={key}>
                  <Select>
                    {options?.map((option: any) => (
                      <Select.Option key={option.value} value={option.value}>
                        {option.label}
                      </Select.Option>
                    ))}
                  </Select>
                </Form.Item>
              );
              
            case 'boolean':
              return (
                <Form.Item key={key} name={key} valuePropName="checked">
                  <Checkbox>{description || key}</Checkbox>
                </Form.Item>
              );
              
            default:
              return (
                <Form.Item key={key} label={description || key} name={key}>
                  <Input />
                </Form.Item>
              );
          }
        })}
      </Form>
    );
  };
  
  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <Spin size="large" tip="加载产品中..." />
      </div>
    );
  }
  
  if (!modelData) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <p>产品不存在或已被删除</p>
      </div>
    );
  }
  
  return (
    <div style={{ padding: '20px' }}>
      <h1>{modelData.name || '产品定制'}</h1>
      
      <Row gutter={24}>
        <Col span={16}>
          <Card>
            <ModelInstancePreview modelId={modelId} height={500} />
          </Card>
        </Col>
        
        <Col span={8}>
          <Card title="产品信息">
            <p>模板: {modelData.templateId}</p>
            
            <Divider orientation="left">参数设置</Divider>
            {renderParameterForm()}
            
            <Divider />
            
            <Form.Item label="数量">
              <InputNumber 
                min={1} 
                value={quantity} 
                onChange={value => setQuantity(value || 1)} 
              />
            </Form.Item>
            
            <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
              <Button 
                type="primary" 
                icon={<ShoppingCartOutlined />} 
                onClick={handleAddToCart}
                block
              >
                添加到购物车
              </Button>
              
              {session?.user && (
                <Button 
                  icon={<SaveOutlined />} 
                  onClick={handleSaveParameters}
                >
                  保存参数
                </Button>
              )}
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
}

import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { db } from '@/lib/db';
import { Button, Card, Descriptions, Tabs, Spin } from 'antd';
import ConfigViewer from '@/components/product/ConfigViewer';

// 获取配置详情
async function getConfigurationDetails(id) {
  try {
    const config = await db.modelConfig.findUnique({
      where: { id },
      include: {
        model: {
          include: {
            template: true
          }
        },
        user: {
          select: {
            id: true,
            username: true
          }
        }
      }
    });
    
    if (!config) {
      return null;
    }
    
    return {
      id: config.id,
      name: config.name,
      model: {
        id: config.model.id,
        name: config.model.name,
        templateId: config.model.templateId,
        templateName: config.model.template.name,
        params: JSON.parse(config.model.params)
      },
      user: config.user,
      materialOverrides: JSON.parse(config.materialOverrides),
      createdAt: config.createdAt
    };
  } catch (error) {
    console.error('Error fetching configuration details:', error);
    return null;
  }
}

export default async function ConfigurationPage({ params }) {
  const configDetails = await getConfigurationDetails(params.id);
  
  if (!configDetails) {
    notFound();
  }
  
  return (
    <div className="configuration-page" style={{ padding: '20px' }}>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1>{configDetails.name}</h1>
        <div className="action-buttons" style={{ display: 'flex', gap: '10px' }}>
          <Link href={`/configurator/${configDetails.model.id}?config=${configDetails.id}`}>
            <Button type="primary">编辑配置</Button>
          </Link>
          <Link href={`/product/${configDetails.model.id}`}>
            <Button>返回产品</Button>
          </Link>
        </div>
      </div>
      
      <Suspense fallback={<div style={{ textAlign: 'center', padding: '50px' }}><Spin size="large" tip="加载配置详情中..." /></div>}>
        <Tabs defaultActiveKey="overview">
          <Tabs.TabPane key="overview" tab="配置概览">
            <div className="config-overview" style={{ display: 'flex', gap: '20px' }}>
              <div className="config-viewer" style={{ flex: '1' }}>
                <ConfigViewer configId={configDetails.id} width={600} height={400} />
              </div>
              
              <div className="config-info" style={{ width: '300px' }}>
                <Card title="配置信息">
                  <Descriptions column={1}>
                    <Descriptions.Item label="ID">{configDetails.id}</Descriptions.Item>
                    <Descriptions.Item label="名称">{configDetails.name}</Descriptions.Item>
                    <Descriptions.Item label="产品">{configDetails.model.name}</Descriptions.Item>
                    <Descriptions.Item label="模板">{configDetails.model.templateName}</Descriptions.Item>
                    <Descriptions.Item label="创建者">{configDetails.user.username}</Descriptions.Item>
                    <Descriptions.Item label="创建时间">{new Date(configDetails.createdAt).toLocaleString()}</Descriptions.Item>
                  </Descriptions>
                </Card>
              </div>
            </div>
          </Tabs.TabPane>
          
          <Tabs.TabPane key="materials" tab="材质设置">
            <Card title="材质覆盖">
              {Object.keys(configDetails.materialOverrides).length === 0 ? (
                <p>没有材质覆盖设置</p>
              ) : (
                <Descriptions bordered column={1}>
                  {Object.entries(configDetails.materialOverrides).map(([key, value]) => (
                    <Descriptions.Item key={key} label={key}>{value}</Descriptions.Item>
                  ))}
                </Descriptions>
              )}
            </Card>
          </Tabs.TabPane>
          
          <Tabs.TabPane key="parameters" tab="参数详情">
            <Card title="基础模型参数">
              <pre className="parameters-json" style={{ 
                backgroundColor: '#f5f5f5', 
                padding: '15px', 
                borderRadius: '5px',
                overflow: 'auto',
                maxHeight: '500px'
              }}>
                {JSON.stringify(configDetails.model.params, null, 2)}
              </pre>
            </Card>
          </Tabs.TabPane>
        </Tabs>
      </Suspense>
    </div>
  );
}

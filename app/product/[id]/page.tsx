import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { db } from '@/lib/db';
import { Button, Card, Tabs, List, Checkbox, Spin, Empty } from 'antd';
import ProductViewer from '@/components/product/ProductViewer';

// 获取产品详情
async function getProductDetails(id) {
  try {
    const model = await db.model.findUnique({
      where: { id },
      include: {
        template: true
      }
    });
    
    if (!model) {
      return null;
    }
    
    // 获取产品的所有配置
    const configs = await db.modelConfig.findMany({
      where: { modelId: id },
      select: {
        id: true,
        name: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    return {
      id: model.id,
      name: model.name,
      templateId: model.templateId,
      template: {
        name: model.template.name,
        description: model.template.description
      },
      params: JSON.parse(model.params),
      configs,
      createdAt: model.createdAt
    };
  } catch (error) {
    console.error('Error fetching product details:', error);
    return null;
  }
}

export default async function ProductPage({ params }) {
  const productDetails = await getProductDetails(params.id);
  
  if (!productDetails) {
    notFound();
  }
  
  return (
    <div className="product-page" style={{ padding: '20px' }}>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1>{productDetails.name}</h1>
        <div className="action-buttons" style={{ display: 'flex', gap: '10px' }}>
          <Link href={`/configurator/${params.id}`}>
            <Button type="primary">配置产品</Button>
          </Link>
          
          {productDetails.configs.length >= 2 && (
            <Link href={`/compare/${productDetails.configs.slice(0, 2).map(c => c.id).join('/')}`}>
              <Button>比较配置</Button>
            </Link>
          )}
        </div>
      </div>
      
      <Suspense fallback={<div style={{ textAlign: 'center', padding: '50px' }}><Spin size="large" tip="加载产品详情中..." /></div>}>
        <Tabs defaultActiveKey="overview">
          <Tabs.TabPane key="overview" tab="产品概览">
            <div className="product-overview" style={{ display: 'flex', gap: '20px' }}>
              <div className="product-viewer" style={{ flex: '1' }}>
                <ProductViewer productId={productDetails.id} />
              </div>
              
              <div className="product-info" style={{ width: '300px' }}>
                <Card title="产品信息">
                  <p><strong>ID:</strong> {productDetails.id}</p>
                  <p><strong>名称:</strong> {productDetails.name}</p>
                  <p><strong>模板:</strong> {productDetails.template.name}</p>
                  <p><strong>描述:</strong> {productDetails.template.description || '无描述'}</p>
                  <p><strong>创建时间:</strong> {new Date(productDetails.createdAt).toLocaleString()}</p>
                </Card>
              </div>
            </div>
          </Tabs.TabPane>
          
          <Tabs.TabPane key="configurations" tab="产品配置">
            <div className="configurations-section">
              <div className="configurations-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3>已保存的配置</h3>
                
                <Link href={`/configurator/${params.id}`}>
                  <Button type="primary" icon={<PlusOutlined />}>
                    创建新配置
                  </Button>
                </Link>
              </div>
              
              {productDetails.configs.length === 0 ? (
                <Empty description="暂无配置" />
              ) : (
                <List
                  dataSource={productDetails.configs}
                  renderItem={config => (
                    <List.Item
                      actions={[
                        <Link key="view" href={`/configurations/${config.id}`}>
                          <Button>查看</Button>
                        </Link>,
                        <Link key="edit" href={`/configurator/${productDetails.id}?config=${config.id}`}>
                          <Button>编辑</Button>
                        </Link>
                      ]}
                    >
                      <List.Item.Meta
                        title={config.name}
                        description={`创建时间: ${new Date(config.createdAt).toLocaleString()}`}
                      />
                    </List.Item>
                  )}
                />
              )}
            </div>
          </Tabs.TabPane>
          
          <Tabs.TabPane key="parameters" tab="参数详情">
            <Card title="模型参数">
              <pre className="parameters-json" style={{ 
                backgroundColor: '#f5f5f5', 
                padding: '15px', 
                borderRadius: '5px',
                overflow: 'auto',
                maxHeight: '500px'
              }}>
                {JSON.stringify(productDetails.params, null, 2)}
              </pre>
            </Card>
          </Tabs.TabPane>
        </Tabs>
      </Suspense>
    </div>
  );
}

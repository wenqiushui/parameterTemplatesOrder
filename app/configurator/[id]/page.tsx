import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import Configurator from '@/components/configurator/Configurator';
import { Spin } from 'antd';

// 服务器组件，获取产品数据
async function getProductData(id) {
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
    
    return {
      id: model.id,
      name: model.name,
      templateId: model.templateId,
      params: JSON.parse(model.params)
    };
  } catch (error) {
    console.error('Error fetching product:', error);
    return null;
  }
}

export default async function ConfiguratorPage({ params }) {
  const productData = await getProductData(params.id);
  
  if (!productData) {
    notFound();
  }
  
  return (
    <div className="configurator-page">
      <Suspense fallback={<div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}><Spin size="large" tip="加载中..." /></div>}>
        <Configurator productId={params.id} initialData={productData} />
      </Suspense>
    </div>
  );
}

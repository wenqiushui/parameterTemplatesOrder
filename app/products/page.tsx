import { Suspense } from 'react';
import Link from 'next/link';
import { db } from '@/lib/db';
import { Button, Card, Spin, Empty } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import Image from 'next/image';

// 获取产品列表
async function getProducts() {
  try {
    const models = await db.model.findMany({
      select: {
        id: true,
        name: true,
        templateId: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    // 获取每个产品的缩略图
    const productsWithThumbnails = await Promise.all(
      models.map(async (model) => {
        // 查找产品的第一个配置作为缩略图
        const config = await db.modelConfig.findFirst({
          where: { modelId: model.id },
          select: { id: true, thumbnailHash: true }
        });
        
        return {
          ...model,
          thumbnailUrl: config?.thumbnailHash 
            ? `/api/textures/${config.thumbnailHash}` 
            : '/images/default-product.jpg'
        };
      })
    );
    
    return productsWithThumbnails;
  } catch (error) {
    console.error('Error fetching products:', error);
    return [];
  }
}

export default async function ProductsPage() {
  const products = await getProducts();
  
  return (
    <div className="products-page" style={{ padding: '20px' }}>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1>产品列表</h1>
        <Link href="/editor">
          <Button type="primary" icon={<PlusOutlined />}>
            添加新产品
          </Button>
        </Link>
      </div>
      
      <Suspense fallback={<div style={{ textAlign: 'center', padding: '50px' }}><Spin size="large" tip="加载产品中..." /></div>}>
        {products.length === 0 ? (
          <Empty description="暂无产品" />
        ) : (
          <div className="product-grid" style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
            gap: '20px'
          }}>
            {products.map(product => (
              <Link href={`/product/${product.id}`} key={product.id} style={{ textDecoration: 'none' }}>
                <Card
                  hoverable
                  cover={
                    <div style={{ height: '200px', position: 'relative' }}>
                      <Image
                        src={product.thumbnailUrl}
                        alt={product.name}
                        fill
                        style={{ objectFit: 'cover' }}
                      />
                    </div>
                  }
                >
                  <Card.Meta
                    title={product.name}
                    description={`模板: ${product.templateId}`}
                  />
                </Card>
              </Link>
            ))}
          </div>
        )}
      </Suspense>
    </div>
  );
}

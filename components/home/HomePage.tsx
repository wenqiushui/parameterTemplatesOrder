'use client';

import Link from 'next/link';
import { Button, Card, Row, Col } from 'antd';
import { ShoppingOutlined, ToolOutlined, AppstoreOutlined } from '@ant-design/icons';

export default function HomePage() {
  return (
    <div className="home-page" style={{ padding: '40px 20px' }}>
      <div className="hero-section" style={{ 
        textAlign: 'center', 
        marginBottom: '60px',
        padding: '60px 0',
        backgroundColor: '#f5f5f5',
        borderRadius: '8px'
      }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '20px' }}>3D 产品定制平台</h1>
        <p style={{ fontSize: '1.2rem', maxWidth: '800px', margin: '0 auto 30px' }}>
          使用我们的 3D 产品配置器，创建和定制您的产品，实时预览效果，满足您的个性化需求。
        </p>
        <Link href="/products">
          <Button type="primary" size="large">
            浏览产品
          </Button>
        </Link>
      </div>
      
      <div className="features-section" style={{ marginBottom: '60px' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '40px' }}>主要功能</h2>
        
        <Row gutter={[24, 24]}>
          <Col xs={24} sm={8}>
            <Card 
              title={<><ShoppingOutlined /> 浏览产品</>}
              style={{ height: '100%' }}
            >
              浏览我们的产品目录，查看各种可定制的 3D 模型，找到适合您需求的产品。
            </Card>
          </Col>
          
          <Col xs={24} sm={8}>
            <Card 
              title={<><ToolOutlined /> 定制配置</>}
              style={{ height: '100%' }}
            >
              使用我们的 3D 配置器，自定义产品的各个部分，选择材质、颜色和其他选项。
            </Card>
          </Col>
          
          <Col xs={24} sm={8}>
            <Card 
              title={<><AppstoreOutlined /> 保存比较</>}
              style={{ height: '100%' }}
            >
              保存您的配置，比较不同选项，找到最适合您的设计方案。
            </Card>
          </Col>
        </Row>
      </div>
      
      <div className="cta-section" style={{ 
        textAlign: 'center', 
        padding: '40px',
        backgroundColor: '#f9f9f9',
        borderRadius: '8px'
      }}>
        <h2 style={{ marginBottom: '20px' }}>开始定制您的产品</h2>
        <p style={{ marginBottom: '30px' }}>
          立即体验我们的 3D 产品定制平台，创建独一无二的产品。
        </p>
        <Link href="/products">
          <Button type="primary" size="large">
            开始定制
          </Button>
        </Link>
      </div>
    </div>
  );
}

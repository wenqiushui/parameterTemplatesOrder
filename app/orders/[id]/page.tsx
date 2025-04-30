'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { Card, Button, Descriptions, List, Tag, Spin, Modal, message } from 'antd';
import { ArrowLeftOutlined, ShoppingCartOutlined } from '@ant-design/icons';
import ConfigViewer from '@/components/product/ConfigViewer';

export default function OrderPage({ params }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelModalVisible, setCancelModalVisible] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  
  // 如果用户未登录，重定向到登录页面
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);
  
  // 加载订单数据
  useEffect(() => {
    if (status === 'authenticated') {
      const fetchOrderData = async () => {
        setLoading(true);
        
        try {
          const response = await fetch(`/api/orders/${params.id}`);
          
          if (!response.ok) {
            throw new Error('Failed to fetch order');
          }
          
          const data = await response.json();
          setOrder(data);
        } catch (error) {
          console.error('Error fetching order:', error);
          message.error('加载订单失败');
        } finally {
          setLoading(false);
        }
      };
      
      fetchOrderData();
    }
  }, [params.id, status]);
  
  // 取消订单
  const handleCancelOrder = async () => {
    setCancelling(true);
    
    try {
      const response = await fetch(`/api/orders/${params.id}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        throw new Error('Failed to cancel order');
      }
      
      message.success('订单已取消');
      
      // 更新订单状态
      setOrder({
        ...order,
        status: 'cancelled'
      });
      
      setCancelModalVisible(false);
    } catch (error) {
      console.error('Error cancelling order:', error);
      message.error('取消订单失败');
    } finally {
      setCancelling(false);
    }
  };
  
  if (status === 'loading' || loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 'calc(100vh - 64px - 70px)' }}>
        <Spin size="large" tip="加载中..." />
      </div>
    );
  }
  
  if (!order) {
    return (
      <div style={{ padding: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
          <Button icon={<ArrowLeftOutlined />} onClick={() => router.push('/account')}>
            返回账户
          </Button>
          <h1 style={{ margin: '0 0 0 20px' }}>订单不存在</h1>
        </div>
        <p>找不到该订单或您没有权限查看。</p>
      </div>
    );
  }
  
  return (
    <div className="order-page" style={{ padding: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => router.push('/account')}>
          返回账户
        </Button>
        <h1 style={{ margin: '0 0 0 20px' }}>订单详情</h1>
      </div>
      
      <Card title="订单信息" style={{ marginBottom: '20px' }}>
        <Descriptions bordered column={1}>
          <Descriptions.Item label="订单 ID">{order.id}</Descriptions.Item>
          <Descriptions.Item label="创建时间">{new Date(order.createdAt).toLocaleString()}</Descriptions.Item>
          <Descriptions.Item label="总价">¥{order.totalPrice.toFixed(2)}</Descriptions.Item>
          <Descriptions.Item label="状态">
            <Tag color={
              order.status === 'pending' ? 'blue' :
              order.status === 'processing' ? 'orange' :
              order.status === 'shipped' ? 'cyan' :
              order.status === 'delivered' ? 'green' :
              order.status === 'cancelled' ? 'red' : 'default'
            }>
              {order.status}
            </Tag>
          </Descriptions.Item>
        </Descriptions>
        
        {order.status === 'pending' && (
          <div style={{ marginTop: '20px', textAlign: 'right' }}>
            <Button danger onClick={() => setCancelModalVisible(true)}>
              取消订单
            </Button>
          </div>
        )}
      </Card>
      
      <Card title="订单项目">
        <List
          dataSource={order.items}
          renderItem={item => (
            <List.Item>
              <div style={{ display: 'flex', width: '100%' }}>
                <div style={{ width: '200px', height: '200px' }}>
                  <ConfigViewer configId={item.configId} width={200} height={200} />
                </div>
                <div style={{ flex: 1, marginLeft: '20px' }}>
                  <h3>{item.configName}</h3>
                  <p>产品: {item.modelName}</p>
                  <p>数量: {item.quantity}</p>
                  <p>单价: ¥{item.price.toFixed(2)}</p>
                  <p>小计: ¥{(item.price * item.quantity).toFixed(2)}</p>
                  <div style={{ marginTop: '10px' }}>
                    <Link href={`/configurations/${item.configId}`}>
                      <Button>查看配置</Button>
                    </Link>
                  </div>
                </div>
              </div>
            </List.Item>
          )}
        />
      </Card>
      
      <Modal
        title="取消订单"
        open={cancelModalVisible}
        onCancel={() => setCancelModalVisible(false)}
        footer={[
          <Button key="back" onClick={() => setCancelModalVisible(false)}>
            返回
          </Button>,
          <Button key="submit" type="primary" danger loading={cancelling} onClick={handleCancelOrder}>
            确认取消
          </Button>,
        ]}
      >
        <p>您确定要取消此订单吗？此操作无法撤销。</p>
      </Modal>
    </div>
  );
}

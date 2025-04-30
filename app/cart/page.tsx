'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { Card, Button, List, InputNumber, Empty, Spin, Divider, message, Modal } from 'antd';
import { DeleteOutlined, ShoppingCartOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import ConfigViewer from '@/components/product/ConfigViewer';
import { useCartStore } from '@/lib/hooks/useCartStore';

export default function CartPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { cartItems, updateItemQuantity, removeItem, clearCart } = useCartStore();
  const [loading, setLoading] = useState(false);
  const [configs, setConfigs] = useState({});
  const [checkoutModalVisible, setCheckoutModalVisible] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);
  
  // 如果用户未登录，重定向到登录页面
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);
  
  // 加载配置详情
  useEffect(() => {
    if (cartItems.length > 0) {
      const fetchConfigDetails = async () => {
        setLoading(true);
        
        try {
          const configDetails = {};
          
          for (const item of cartItems) {
            if (!configDetails[item.configId]) {
              const response = await fetch(`/api/configs/${item.configId}`);
              
              if (response.ok) {
                const data = await response.json();
                configDetails[item.configId] = data;
              }
            }
          }
          
          setConfigs(configDetails);
        } catch (error) {
          console.error('Error fetching config details:', error);
        } finally {
          setLoading(false);
        }
      };
      
      fetchConfigDetails();
    }
  }, [cartItems]);
  
  // 计算总价
  const calculateTotal = () => {
    return cartItems.reduce((total, item) => total + item.price * item.quantity, 0);
  };
  
  // 处理结账
  const handleCheckout = async () => {
    if (cartItems.length === 0) {
      message.warning('购物车为空');
      return;
    }
    
    setCheckingOut(true);
    
    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          items: cartItems
        })
      });
      
      if (!response.ok) {
        throw new Error('结账失败');
      }
      
      const { orderId } = await response.json();
      
      // 清空购物车
      clearCart();
      
      message.success('订单创建成功');
      
      // 跳转到订单详情页
      router.push(`/orders/${orderId}`);
    } catch (error) {
      console.error('Error during checkout:', error);
      message.error('结账失败: ' + error.message);
    } finally {
      setCheckingOut(false);
      setCheckoutModalVisible(false);
    }
  };
  
  if (status === 'loading' || loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 'calc(100vh - 64px - 70px)' }}>
        <Spin size="large" tip="加载中..." />
      </div>
    );
  }
  
  return (
    <div className="cart-page" style={{ padding: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => router.push('/')}>
          继续购物
        </Button>
        <h1 style={{ margin: '0 0 0 20px' }}>购物车</h1>
      </div>
      
      {cartItems.length === 0 ? (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description="购物车为空"
        >
          <Button type="primary" onClick={() => router.push('/products')}>
            浏览产品
          </Button>
        </Empty>
      ) : (
        <>
          <Card title={`购物车 (${cartItems.length} 件商品)`} style={{ marginBottom: '20px' }}>
            <List
              dataSource={cartItems}
              renderItem={item => {
                const config = configs[item.configId];
                
                return (
                  <List.Item
                    actions={[
                      <Button
                        key="delete"
                        type="text"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => removeItem(item.configId)}
                      >
                        删除
                      </Button>
                    ]}
                  >
                    <div style={{ display: 'flex', width: '100%' }}>
                      <div style={{ width: '150px', height: '150px' }}>
                        {config && <ConfigViewer configId={item.configId} width={150} height={150} />}
                      </div>
                      <div style={{ flex: 1, marginLeft: '20px' }}>
                        <h3>{config ? config.name : `配置 ${item.configId}`}</h3>
                        {config && (
                          <>
                            <p>产品: {config.modelName}</p>
                            <Link href={`/configurations/${item.configId}`}>
                              查看详情
                            </Link>
                          </>
                        )}
                      </div>
                      <div style={{ width: '200px', textAlign: 'right' }}>
                        <div style={{ marginBottom: '10px' }}>
                          单价: ¥{item.price.toFixed(2)}
                        </div>
                        <div style={{ marginBottom: '10px' }}>
                          数量: 
                          <InputNumber
                            min={1}
                            max={99}
                            value={item.quantity}
                            onChange={value => updateItemQuantity(item.configId, value)}
                            style={{ marginLeft: '10px', width: '60px' }}
                          />
                        </div>
                        <div>
                          小计: ¥{(item.price * item.quantity).toFixed(2)}
                        </div>
                      </div>
                    </div>
                  </List.Item>
                );
              }}
            />
          </Card>
          
          <Card>
            <div style={{ textAlign: 'right' }}>
              <div style={{ marginBottom: '20px', fontSize: '18px' }}>
                总计: <span style={{ fontWeight: 'bold', fontSize: '24px' }}>¥{calculateTotal().toFixed(2)}</span>
              </div>
              <Button
                type="primary"
                size="large"
                icon={<ShoppingCartOutlined />}
                onClick={() => setCheckoutModalVisible(true)}
              >
                结账
              </Button>
            </div>
          </Card>
        </>
      )}
      
      <Modal
        title="确认订单"
        open={checkoutModalVisible}
        onCancel={() => setCheckoutModalVisible(false)}
        footer={[
          <Button key="back" onClick={() => setCheckoutModalVisible(false)}>
            返回
          </Button>,
          <Button key="submit" type="primary" loading={checkingOut} onClick={handleCheckout}>
            确认下单
          </Button>,
        ]}
      >
        <p>您即将创建一个总价为 ¥{calculateTotal().toFixed(2)} 的订单，包含 {cartItems.length} 件商品。</p>
        <p>确认下单后，我们将为您创建订单。</p>
      </Modal>
    </div>
  );
}

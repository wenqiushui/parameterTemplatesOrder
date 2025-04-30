'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, Tabs, List, Button, Empty, Spin, Avatar, Tag, Modal, Row, Col } from 'antd';
import { ShoppingOutlined, SettingOutlined, UserOutlined, AppstoreOutlined, EyeOutlined, DeleteOutlined, EditOutlined } from '@ant-design/icons';
import Link from 'next/link';
import UserModelList from '@/components/UserModelList';
import ModelInstancePreview from '@/components/ModelInstancePreview';

export default function AccountPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [models, setModels] = useState([]);
  const [configs, setConfigs] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // 模型实例相关状态
  const [selectedModelId, setSelectedModelId] = useState<string | null>(null);
  const [previewModalVisible, setPreviewModalVisible] = useState(false);

  // 如果用户未登录，重定向到登录页面
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  // 加载用户数据
  useEffect(() => {
    if (status === 'authenticated') {
      const fetchUserData = async () => {
        setLoading(true);

        try {
          // 加载用户的模型
          const modelsResponse = await fetch('/api/models');
          const modelsData = await modelsResponse.json();
          setModels(modelsData);

          // 加载用户的配置
          const configsResponse = await fetch('/api/configs');
          const configsData = await configsResponse.json();
          setConfigs(configsData);

          // 加载用户的订单
          const ordersResponse = await fetch('/api/orders');
          const ordersData = await ordersResponse.json();
          setOrders(ordersData);
        } catch (error) {
          console.error('Error fetching user data:', error);
        } finally {
          setLoading(false);
        }
      };

      fetchUserData();
    }
  }, [status]);

  if (status === 'loading' || loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 'calc(100vh - 64px - 70px)' }}>
        <Spin size="large" tip="加载中..." />
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return null; // 将重定向到登录页面
  }

  return (
    <div className="account-page" style={{ padding: '20px' }}>
      <div className="page-header" style={{ marginBottom: '20px' }}>
        <h1>我的账户</h1>
      </div>

      <Card className="user-info-card" style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Avatar size={64} icon={<UserOutlined />} />
          <div style={{ marginLeft: '20px' }}>
            <h2>{session?.user?.name}</h2>
            <p>{session?.user?.email}</p>
          </div>
        </div>
      </Card>

      <Tabs defaultActiveKey="modelInstances">
        <Tabs.TabPane
          tab={<span><AppstoreOutlined /> 我的模型实例</span>}
          key="modelInstances"
        >
          {session?.user ? (
            <Row gutter={24}>
              <Col span={24}>
                <UserModelList
                  userId={session.user.id}
                  onSelectModel={(modelId) => {
                    setSelectedModelId(modelId);
                    setPreviewModalVisible(true);
                  }}
                />
              </Col>
            </Row>
          ) : (
            <Empty description="请登录后查看您的模型实例" />
          )}
        </Tabs.TabPane>

        <Tabs.TabPane
          tab={<span><ShoppingOutlined /> 我的产品</span>}
          key="models"
        >
          {models.length === 0 ? (
            <Empty description="暂无产品" />
          ) : (
            <List
              grid={{ gutter: 16, column: 3 }}
              dataSource={models}
              renderItem={model => (
                <List.Item>
                  <Card
                    title={model.name}
                    extra={<Link href={`/product/${model.id}`}>查看</Link>}
                  >
                    <p>模板: {model.templateId}</p>
                    <p>创建时间: {new Date(model.createdAt).toLocaleString()}</p>
                  </Card>
                </List.Item>
              )}
            />
          )}
        </Tabs.TabPane>

        <Tabs.TabPane
          tab={<span><SettingOutlined /> 我的配置</span>}
          key="configs"
        >
          {configs.length === 0 ? (
            <Empty description="暂无配置" />
          ) : (
            <List
              dataSource={configs}
              renderItem={config => (
                <List.Item
                  actions={[
                    <Link key="view" href={`/configurations/${config.id}`}>
                      <Button>查看</Button>
                    </Link>,
                    <Link key="edit" href={`/configurator/${config.modelId}?config=${config.id}`}>
                      <Button>编辑</Button>
                    </Link>
                  ]}
                >
                  <List.Item.Meta
                    title={config.name}
                    description={`产品: ${config.modelName} | 创建时间: ${new Date(config.createdAt).toLocaleString()}`}
                  />
                </List.Item>
              )}
            />
          )}
        </Tabs.TabPane>

        <Tabs.TabPane
          tab={<span><ShoppingOutlined /> 我的订单</span>}
          key="orders"
        >
          {orders.length === 0 ? (
            <Empty description="暂无订单" />
          ) : (
            <List
              dataSource={orders}
              renderItem={order => (
                <List.Item
                  actions={[
                    <Link key="view" href={`/orders/${order.id}`}>
                      <Button>查看详情</Button>
                    </Link>
                  ]}
                >
                  <List.Item.Meta
                    title={`订单 #${order.id.substring(0, 8)}`}
                    description={
                      <>
                        <p>创建时间: {new Date(order.createdAt).toLocaleString()}</p>
                        <p>总价: ¥{order.totalPrice.toFixed(2)}</p>
                        <p>
                          状态: <Tag color={
                            order.status === 'pending' ? 'blue' :
                            order.status === 'processing' ? 'orange' :
                            order.status === 'shipped' ? 'cyan' :
                            order.status === 'delivered' ? 'green' :
                            order.status === 'cancelled' ? 'red' : 'default'
                          }>{order.status}</Tag>
                        </p>
                      </>
                    }
                  />
                  <div>
                    {order.itemCount} 件商品
                  </div>
                </List.Item>
              )}
            />
          )}
        </Tabs.TabPane>
      </Tabs>

      {/* 模型预览模态框 */}
      <Modal
        title="模型预览"
        open={previewModalVisible}
        onCancel={() => setPreviewModalVisible(false)}
        width={800}
        footer={null}
      >
        {selectedModelId && (
          <div style={{ height: 500 }}>
            <ModelInstancePreview modelId={selectedModelId} height={500} />
          </div>
        )}
      </Modal>
    </div>
  );
}

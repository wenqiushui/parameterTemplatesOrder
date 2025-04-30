'use client';

import { useState, useEffect } from 'react';
import { Layout, Menu, Button, Drawer } from 'antd';
import {
  MenuOutlined,
  HomeOutlined,
  AppstoreOutlined,
  SkinOutlined,
  SettingOutlined,
  UserOutlined,
  ShoppingCartOutlined
} from '@ant-design/icons';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import AppHeader from './AppHeader';

const { Content, Sider } = Layout;

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileView, setMobileView] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const pathname = usePathname();

  // 监听窗口大小变化
  useEffect(() => {
    const checkMobile = () => {
      setMobileView(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  // 获取当前选中的菜单项
  const getSelectedKeys = () => {
    if (pathname === '/') return ['home'];
    if (pathname.startsWith('/products')) return ['products'];
    if (pathname.startsWith('/materials')) return ['materials'];
    if (pathname.startsWith('/models')) return ['models'];
    if (pathname.startsWith('/orders')) return ['orders'];
    return [];
  };

  // 主要功能菜单项配置
  const menuItems = [
    {
      key: 'home',
      icon: <HomeOutlined />,
      label: <Link href="/">首页</Link>,
    },
    {
      key: 'products',
      icon: <AppstoreOutlined />,
      label: <Link href="/products">产品目录</Link>,
    },
    {
      key: 'materials',
      icon: <SkinOutlined />,
      label: <Link href="/materials">材质库</Link>,
    },
    {
      key: 'models',
      icon: <AppstoreOutlined />,
      label: <Link href="/models">模型库</Link>,
    },
    {
      key: 'orders',
      icon: <ShoppingCartOutlined />,
      label: <Link href="/orders">订单管理</Link>,
    },
  ];

  // 侧边栏内容
  const sidebarContent = (
    <Menu
      theme="dark"
      mode="inline"
      selectedKeys={getSelectedKeys()}
      items={menuItems}
    />
  );

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {/* 移动端抽屉菜单 */}
      {mobileView && (
        <Drawer
          placement="left"
          closable={true}
          onClose={() => setDrawerVisible(false)}
          open={drawerVisible}
          bodyStyle={{ padding: 0 }}
        >
          {sidebarContent}
        </Drawer>
      )}

      {/* 桌面端侧边栏 */}
      {!mobileView && (
        <Sider
          collapsible
          collapsed={collapsed}
          onCollapse={setCollapsed}
          style={{
            overflow: 'auto',
            height: '100vh',
            position: 'fixed',
            left: 0,
            top: 0,
            bottom: 0,
            zIndex: 1000
          }}
        >
          <div className="logo" style={{ height: 32, margin: 16, background: 'rgba(255, 255, 255, 0.3)' }} />
          {sidebarContent}
        </Sider>
      )}

      <Layout style={{ marginLeft: mobileView ? 0 : (collapsed ? 80 : 200) }}>
        {/* 顶部导航栏 */}
        <AppHeader
          showMenuButton={mobileView}
          onMenuClick={() => setDrawerVisible(true)}
        />

        {/* 内容区域 */}
        <Content style={{ margin: '0', padding: 0, background: '#fff', minHeight: 280 }}>
          {children}
        </Content>
      </Layout>

      <style jsx global>{`
        .ant-layout-sider-children {
          display: flex;
          flex-direction: column;
        }

        .ant-menu-item a {
          color: inherit;
          text-decoration: none;
        }
      `}</style>
    </Layout>
  );
}

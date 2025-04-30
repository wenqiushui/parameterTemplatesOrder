'use client';

import { Layout, Menu } from 'antd';
import Link from 'next/link';
import { HomeOutlined, ShoppingOutlined, SettingOutlined, UserOutlined, ExperimentOutlined, SkinOutlined } from '@ant-design/icons';
import { useSession } from 'next-auth/react';

const { Header } = Layout;

export default function AppHeader() {
  const { data: session } = useSession();

  return (
    <Header style={{
      position: 'sticky',
      top: 0,
      zIndex: 1,
      width: '100%',
      display: 'flex',
      alignItems: 'center',
      padding: '0 20px'
    }}>
      <div className="logo" style={{
        color: 'white',
        fontSize: '1.5rem',
        fontWeight: 'bold',
        marginRight: '30px'
      }}>
        <Link href="/" style={{ color: 'white', textDecoration: 'none' }}>
          3D 产品定制
        </Link>
      </div>

      <Menu
        theme="dark"
        mode="horizontal"
        defaultSelectedKeys={['home']}
        style={{ flex: 1, minWidth: 0 }}
        items={[
          {
            key: 'home',
            icon: <HomeOutlined />,
            label: <Link href="/">首页</Link>,
          },
          {
            key: 'products',
            icon: <ShoppingOutlined />,
            label: <Link href="/products">产品</Link>,
          },
          {
            key: 'editor',
            icon: <SettingOutlined />,
            label: <Link href="/editor">编辑器</Link>,
          },
          {
            key: 'template-test',
            icon: <ExperimentOutlined />,
            label: <Link href="/template-test">模板测试</Link>,
          },
          {
            key: 'materials',
            icon: <SkinOutlined />,
            label: <Link href="/materials">材质库</Link>,
          },
        ]}
      />

      <div className="user-actions">
        {session ? (
          <Menu
            theme="dark"
            mode="horizontal"
            style={{ minWidth: 0 }}
            items={[
              {
                key: 'user',
                icon: <UserOutlined />,
                label: session.user?.name,
                children: [
                  {
                    key: 'account',
                    label: <Link href="/account">我的账户</Link>,
                  },
                  {
                    key: 'logout',
                    label: <Link href="/api/auth/signout">退出登录</Link>,
                  },
                ],
              },
            ]}
          />
        ) : (
          <Menu
            theme="dark"
            mode="horizontal"
            style={{ minWidth: 0 }}
            items={[
              {
                key: 'login',
                label: <Link href="/login">登录</Link>,
              },
              {
                key: 'register',
                label: <Link href="/register">注册</Link>,
              },
            ]}
          />
        )}
      </div>
    </Header>
  );
}

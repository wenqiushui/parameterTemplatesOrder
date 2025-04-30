'use client';

import { Layout, Menu, Button, Avatar, Dropdown } from 'antd';
import {
  MenuOutlined,
  UserOutlined,
  SettingOutlined,
  LogoutOutlined,
  BellOutlined,
  ShoppingCartOutlined,
  SkinOutlined,
  LoginOutlined
} from '@ant-design/icons';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';

const { Header } = Layout;

interface AppHeaderProps {
  showMenuButton?: boolean;
  onMenuClick?: () => void;
}

export default function AppHeader({ showMenuButton = false, onMenuClick }: AppHeaderProps) {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const isAuthenticated = status === 'authenticated';

  // 用户菜单项
  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: <Link href="/profile">个人中心</Link>,
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: <Link href="/settings">设置</Link>,
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: <a onClick={() => signOut({ callbackUrl: '/' })}>退出登录</a>,
    },
  ];

  // 获取当前选中的菜单项
  const getSelectedKeys = () => {
    if (pathname.startsWith('/profile')) return ['profile'];
    if (pathname.startsWith('/settings')) return ['settings'];
    if (pathname.startsWith('/cart')) return ['cart'];
    if (pathname.startsWith('/notifications')) return ['notifications'];
    return [];
  };

  // 顶部导航菜单项 - 用户相关功能
  const headerMenuItems = [
    {
      key: 'cart',
      icon: <ShoppingCartOutlined />,
      label: <Link href="/cart">购物车</Link>,
    },
    {
      key: 'notifications',
      icon: <BellOutlined />,
      label: <Link href="/notifications">通知</Link>,
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: <Link href="/settings">设置</Link>,
    },
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: <Link href="/profile">个人中心</Link>,
    },
  ];

  return (
    <Header style={{
      display: 'flex',
      alignItems: 'center',
      padding: '0 16px',
      background: '#fff',
      boxShadow: '0 1px 4px rgba(0, 0, 0, 0.1)',
      position: 'sticky',
      top: 0,
      zIndex: 999
    }}>
      {/* 移动端菜单按钮 */}
      {showMenuButton && (
        <Button
          type="text"
          icon={<MenuOutlined />}
          onClick={onMenuClick}
          style={{ marginRight: 16 }}
        />
      )}

      {/* Logo */}
      <div className="logo" style={{
        fontSize: 20,
        fontWeight: 'bold',
        marginRight: 40
      }}>
        <Link href="/" style={{ color: '#1890ff', textDecoration: 'none' }}>
          3D产品定制
        </Link>
      </div>

      {/* 空白填充区域 */}
      <div style={{ flex: 1 }}></div>

      {/* 用户相关导航菜单 */}
      {isAuthenticated ? (
        <>
          <div>
            <Menu
              mode="horizontal"
              selectedKeys={getSelectedKeys()}
              items={headerMenuItems}
              style={{ border: 'none' }}
            />
          </div>

          {/* 用户头像 */}
          <div style={{ marginLeft: 16 }}>
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
              <Avatar style={{ cursor: 'pointer', backgroundColor: '#1890ff' }}>
                {session?.user?.name?.charAt(0) || <UserOutlined />}
              </Avatar>
            </Dropdown>
          </div>
        </>
      ) : (
        <div>
          <Button type="primary" icon={<LoginOutlined />} style={{ marginRight: 8 }}>
            <Link href="/login" style={{ color: 'inherit' }}>登录</Link>
          </Button>
          <Button>
            <Link href="/register">注册</Link>
          </Button>
        </div>
      )}
    </Header>
  );
}

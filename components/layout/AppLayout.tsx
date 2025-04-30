'use client';

import { Layout } from 'antd';
import { SessionProvider } from 'next-auth/react';
import AppHeader from './AppHeader';
import AppFooter from './AppFooter';

const { Content } = Layout;

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <Layout style={{ minHeight: '100vh' }}>
        <AppHeader />
        <Content>
          {children}
        </Content>
        <AppFooter />
      </Layout>
    </SessionProvider>
  );
}

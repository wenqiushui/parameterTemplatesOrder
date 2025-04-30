'use client';

import { Layout } from 'antd';

const { Footer } = Layout;

export default function AppFooter() {
  return (
    <Footer style={{ textAlign: 'center' }}>
      3D 产品定制平台 ©{new Date().getFullYear()} 版权所有
    </Footer>
  );
}

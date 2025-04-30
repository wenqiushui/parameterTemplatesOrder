import { Inter } from 'next/font/google';
import './globals.css';
import AntdRegistry from '@/components/AntdRegistry';
import AppLayout from '@/components/RootLayout';
import SessionProvider from '@/components/providers/SessionProvider';
import TemplateRegistryProvider from '@/components/providers/TemplateRegistryProvider';
import GlobalErrorHandler from '@/components/environment/GlobalErrorHandler';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: '3D 产品定制平台',
  description: '使用我们的 3D 产品配置器，创建和定制您的产品，实时预览效果，满足您的个性化需求。',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body className={inter.className}>
        <AntdRegistry>
          <SessionProvider>
            <TemplateRegistryProvider>
              <GlobalErrorHandler />
              <AppLayout>
                {children}
              </AppLayout>
            </TemplateRegistryProvider>
          </SessionProvider>
        </AntdRegistry>
      </body>
    </html>
  );
}

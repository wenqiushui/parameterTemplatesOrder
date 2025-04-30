'use client';

import { useEffect } from 'react';
import { initializeTemplateRegistry } from '@/lib/templates/registry/templateRegistryFactory';

export default function TemplateRegistryProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    // 使用新的模板注册表工厂
    const initializeRegistry = async () => {
      try {
        console.log('Initializing template registry in provider...');

        // 初始化模板注册表（在客户端会使用 ClientTemplateManager）
        const registry = await initializeTemplateRegistry();

        // 获取所有模板ID
        const templateIds = registry.getAllTemplateIds();
        console.log('Template IDs in registry:', templateIds);

        // 获取所有模板元数据
        const metadata = registry.getAllTemplateMetadata();
        console.log(`Found ${metadata.length} templates:`, metadata.map(m => m.id));

        // 添加一个延迟检查，确保模板在应用启动后仍然存在
        setTimeout(async () => {
          try {
            console.log('Checking templates after delay...');

            // 获取所有模板
            const templates = registry.getAllTemplates();
            console.log('Templates after delay:', templates.map(t => ({ id: t.id, name: t.name })));
          } catch (error) {
            console.error('Error checking templates after delay:', error);
          }
        }, 2000);
      } catch (error) {
        console.error('Error initializing template registry in provider:', error);
      }
    };

    initializeRegistry();
  }, []);

  return <>{children}</>;
}

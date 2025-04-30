/**
 * 模板注册表工厂
 *
 * 根据运行环境创建适当的模板注册表实现
 */

import { ITemplateRegistry } from './templateRegistryInterface';

// 单例实例
let templateRegistryInstance: ITemplateRegistry | null = null;

/**
 * 创建模板注册表
 * 根据运行环境返回适当的实现
 */
export async function createTemplateRegistry(): Promise<ITemplateRegistry> {
  // 如果已经创建了实例，直接返回
  if (templateRegistryInstance) {
    return templateRegistryInstance;
  }

  // 检查运行环境
  if (typeof window === 'undefined') {
    // 服务器端环境 - 动态导入服务器端模块
    // 这段代码只会在服务器端执行
    const { ServerTemplateManager } = await import('./serverTemplateManager');
    templateRegistryInstance = new ServerTemplateManager();
    await templateRegistryInstance.initialize();
  } else {
    // 客户端环境 - 动态导入客户端模块
    // 这段代码只会在客户端执行
    const { ClientTemplateManager } = await import('./clientTemplateManager');
    templateRegistryInstance = new ClientTemplateManager();
    await templateRegistryInstance.initialize();
  }

  return templateRegistryInstance;
}

/**
 * 获取模板注册表单例
 * 注意：在使用前必须先调用 initializeTemplateRegistry
 */
export function getTemplateRegistry(): ITemplateRegistry {
  if (!templateRegistryInstance) {
    throw new Error('Template registry not initialized. Call initializeTemplateRegistry first.');
  }
  return templateRegistryInstance;
}

/**
 * 初始化模板注册表
 */
export async function initializeTemplateRegistry(): Promise<ITemplateRegistry> {
  if (!templateRegistryInstance) {
    templateRegistryInstance = await createTemplateRegistry();
  }
  return templateRegistryInstance;
}

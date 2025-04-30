/**
 * 这个文件用于确保模板被正确注册
 * 它会在应用启动时被导入，并直接注册所有模板
 */

import { templateRegistry } from './templateRegistry';
// 模板现在通过 index.ts 自动导入和注册

// 记录当前环境
const isServer = typeof window === 'undefined';
console.log(`Running registerTemplates in ${isServer ? 'server' : 'client'} environment`);

// 清空注册表，确保没有重复注册
console.log('Clearing template registry...');
const allIds = templateRegistry.getAllTemplateIds();
allIds.forEach(id => {
  console.log(`Unregistering template: ${id}`);
  templateRegistry.unregister(id);
});

// 注册所有模板
console.log('Registering all templates...');

// 模板注册现在由 index.ts 自动处理

// 打印注册表状态
console.log('Template registry now contains:', templateRegistry.getAllTemplateIds());

// 导出一个函数，用于确保模板被注册
export function ensureTemplatesRegistered() {
  console.log('Ensuring templates are registered...');

  // 获取当前注册的模板
  const ids = templateRegistry.getAllTemplateIds();
  console.log(`Current template registry has ${ids.length} templates:`, ids);

  // 模板注册现在完全由 index.ts 自动处理
  // 此函数现在仅用于记录当前注册状态
  console.log('Template registration is now handled automatically by index.ts.');
  console.log('All available templates should be registered upon import.');
  return ids;
}

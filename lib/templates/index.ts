// 导出模板基础类
export * from './baseTemplate';

// 导出模板注册表
export * from './templateRegistry';

// 导出新的模板注册表工厂
// 使用具名导出避免命名冲突
export { getTemplateRegistry as getClientTemplateRegistry } from './registry/templateRegistryFactory';
export * from './registry/templateRegistryInterface';

// 自动导入definitions文件夹下的所有模板文件
console.log('Importing template classes from definitions folder...');

// 动态导入definitions目录下的所有模板文件
const templateFiles = require.context('./definitions', false, /\.ts$/);
templateFiles.keys().forEach(key => {
  templateFiles(key);
});

// 打印模板注册表状态
import { templateRegistry } from './templateRegistry';
console.log('Template registry initialized with templates:', templateRegistry.getAllTemplateIds());

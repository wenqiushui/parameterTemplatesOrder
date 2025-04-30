/**
 * 模板发现和自动注册系统 (已弃用)
 *
 * 这个文件的功能已被 `lib/templates/index.ts` 中的自动发现机制取代。
 * 保留此文件可能仅为历史参考，其中的代码不再被积极使用。
 */

// import { BaseTemplate } from './baseTemplate'; // 不再需要，除非有其他代码依赖
// import { templateRegistry } from './templateRegistry'; // 不再需要，除非有其他代码依赖
// import path from 'path'; // 不再需要

console.warn('DEPRECATED: lib/templates/discovery.ts is no longer used for template registration. This is handled by lib/templates/index.ts');

// 所有与手动扫描、注册、ID提取相关的函数和变量均已移除
// 例如：scanTemplateFiles, getTemplateIdFromFileName, KNOWN_TEMPLATE_IDS, 
// TEMPLATE_GENERATION_MODES, TEMPLATE_FILE_TO_ID, importTemplateModule, 
// getTemplateClassName, registerTemplate, registerAllTemplates, 
// getAllRegisteredTemplates, ensureAllTemplatesRegistered

// 如果将来需要某些辅助函数，可以在这里重新添加，但注册逻辑应保持在 index.ts

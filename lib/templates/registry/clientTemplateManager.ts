/**
 * 客户端模板管理器
 *
 * 负责在客户端按需加载和管理模板
 * 只在浏览器环境中运行
 */

import { BaseTemplate } from '../baseTemplate';
import { TemplateMetadata, ITemplateRegistry } from './templateRegistryInterface';
import { templateCacheService } from '@/lib/services/templateCacheService';

export class ClientTemplateManager implements ITemplateRegistry {
  private templates: Map<string, BaseTemplate> = new Map();
  private templateMetadata: Map<string, TemplateMetadata> = new Map();
  private templateCodeCache: Map<string, string> = new Map();
  private isInitialized: boolean = false;

  /**
   * 初始化客户端模板管理器
   * 从服务器获取模板元数据
   */
  async initialize(): Promise<string[]> {
    if (this.isInitialized) {
      return this.getAllTemplateIds();
    }

    try {
      console.log('[ClientTemplateManager] Initializing...');

      // 从服务器获取模板元数据
      const response = await fetch('/api/templates/metadata');
      if (!response.ok) {
        throw new Error(`Failed to fetch template metadata: ${response.statusText}`);
      }

      const metadata: TemplateMetadata[] = await response.json();
      console.log(`[ClientTemplateManager] Received ${metadata.length} template metadata entries`);

      // 存储模板元数据
      metadata.forEach(meta => {
        this.templateMetadata.set(meta.id, meta);
      });

      // 尝试从缓存加载常用模板
      await this.loadCommonTemplatesFromCache();

      this.isInitialized = true;
      return this.getAllTemplateIds();
    } catch (error) {
      console.error('[ClientTemplateManager] Error initializing:', error);
      return [];
    }
  }

  /**
   * 从缓存加载常用模板
   */
  private async loadCommonTemplatesFromCache(): Promise<void> {
    try {
      // 获取缓存中的模板列表
      const cachedTemplates = await templateCacheService.getCachedTemplateIds();
      console.log(`[ClientTemplateManager] Found ${cachedTemplates.length} cached templates`);

      // 加载前5个常用模板
      const commonTemplates = cachedTemplates.slice(0, 5);
      for (const templateId of commonTemplates) {
        await this.loadTemplateFromCache(templateId);
      }
    } catch (error) {
      console.error('[ClientTemplateManager] Error loading common templates from cache:', error);
    }
  }

  /**
   * 从缓存加载模板
   * @param templateId 模板ID
   */
  private async loadTemplateFromCache(templateId: string): Promise<boolean> {
    try {
      // 从缓存获取模板代码
      const cachedCode = await templateCacheService.getTemplateCode(templateId);
      if (!cachedCode) {
        console.log(`[ClientTemplateManager] No cached code found for template ${templateId}`);
        return false;
      }

      // 验证缓存的代码是否有效
      if (typeof cachedCode !== 'string' || cachedCode.trim() === '') {
        console.warn(`[ClientTemplateManager] Invalid cached code for template ${templateId}`);
        return false;
      }

      // 存储模板代码
      this.templateCodeCache.set(templateId, cachedCode);

      // 动态执行模板代码
      await this.executeTemplateCode(templateId, cachedCode);

      return true;
    } catch (error) {
      console.error(`[ClientTemplateManager] Error loading template ${templateId} from cache:`, error);
      // 清除可能损坏的缓存
      try {
        await templateCacheService.removeTemplateCode(templateId);
        console.log(`[ClientTemplateManager] Removed potentially corrupted cache for template ${templateId}`);
      } catch (cleanupError) {
        console.error(`[ClientTemplateManager] Error cleaning up cache for template ${templateId}:`, cleanupError);
      }
      return false;
    }
  }

  /**
   * 从服务器加载模板
   * @param templateId 模板ID
   */
  async loadTemplateFromServer(templateId: string): Promise<boolean> {
    try {
      console.log(`[ClientTemplateManager] Loading template ${templateId} from server...`);

      // 检查模板元数据是否存在
      if (!this.templateMetadata.has(templateId)) {
        console.error(`[ClientTemplateManager] Template metadata for ${templateId} not found`);
        return false;
      }

      // 从服务器获取模板代码
      const response = await fetch(`/api/templates/code/${templateId}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch template code: ${response.statusText}`);
      }

      // 检查响应类型
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error(`[ClientTemplateManager] Server returned non-JSON response for template ${templateId}:`, text);
        throw new Error(`Server returned non-JSON response: ${contentType}`);
      }

      const data = await response.json();
      if (!data || !data.code) {
        throw new Error(`No code received for template ${templateId}`);
      }

      const { code, version } = data;

      // 验证代码是否有效
      if (typeof code !== 'string' || code.trim() === '') {
        throw new Error(`Invalid code received for template ${templateId}`);
      }

      // 检查代码是否包含 HTML 标记
      if (code.includes('<html') || code.includes('<!DOCTYPE') || code.includes('<body')) {
        console.error(`[ClientTemplateManager] Server returned HTML instead of template code for ${templateId}:`, code);
        throw new Error(`Server returned HTML instead of template code`);
      }

      // 存储模板代码
      this.templateCodeCache.set(templateId, code);

      // 缓存模板代码
      const metadata = this.templateMetadata.get(templateId);
      await templateCacheService.cacheTemplateCode({
        id: templateId,
        code: code,
        version: version || metadata?.version || '1.0.0',
        cachedAt: Date.now()
      });

      // 动态执行模板代码
      await this.executeTemplateCode(templateId, code);

      return true;
    } catch (error) {
      console.error(`[ClientTemplateManager] Error loading template ${templateId} from server:`, error);
      return false;
    }
  }

  /**
   * 动态执行模板代码
   * @param templateId 模板ID
   * @param code 模板代码
   */
  private async executeTemplateCode(templateId: string, code: string): Promise<void> {
    try {
      // 动态导入所需的依赖
      const THREE = await import('three');
      const { BaseTemplate, ModelGenerationMode } = await import('@/lib/templates/baseTemplate');
      const { templateRegistry } = await import('@/lib/templates/templateRegistry');

      // 确保代码是字符串
      if (typeof code !== 'string') {
        throw new Error(`Invalid code for template ${templateId}: code is not a string`);
      }

      // 检查代码是否包含预定义接口
      if (!code.includes('class TemplateParameters')) {
        console.warn(`[ClientTemplateManager] Code for template ${templateId} does not contain predefined interfaces`);
      }

      // 创建一个模块环境
      const moduleExports = { exports: {} };

      // 创建一个新的Function来执行模板代码
      // 注意：这里使用了eval，在生产环境中应该使用更安全的方法
      let templateClass;
      try {
        // 检查代码是否包含 HTML 标记（可能是错误页面）
        if (code.includes('<html') || code.includes('<!DOCTYPE') || code.includes('<body')) {
          console.error(`[ClientTemplateManager] Code for template ${templateId} contains HTML tags:`, code.substring(0, 200));
          throw new Error(`Invalid template code: contains HTML tags`);
        }

        // 检查代码是否包含预定义接口
        if (!code.includes('class TemplateParameters')) {
          console.warn(`[ClientTemplateManager] Code for template ${templateId} does not contain predefined interfaces`);
        }

        // 记录代码的前 100 个字符，用于调试
        console.log(`[ClientTemplateManager] Executing code for template ${templateId}, first 100 chars:`, code.substring(0, 100));

        templateClass = new Function(
          'THREE',
          'BaseTemplate',
          'ModelGenerationMode',
          'templateRegistry',
          'exports',
          `
          try {
            ${code}
            const templateClass = exports.default || exports.${templateId.charAt(0).toUpperCase() + templateId.slice(1)}Template;
            if (!templateClass) {
              console.error('Could not find template class export. Available exports:', Object.keys(exports));
              throw new Error('Template class not found in exports');
            }
            return templateClass;
          } catch (error) {
            console.error('Error in template code execution:', error);
            throw error;
          }
        `)(THREE, BaseTemplate, ModelGenerationMode, templateRegistry, moduleExports.exports);
      } catch (functionError) {
        console.error(`[ClientTemplateManager] Error creating function for template ${templateId}:`, functionError);
        throw new Error(`Failed to create function: ${functionError.message}`);
      }

      if (!templateClass) {
        throw new Error(`Could not find template class export in ${templateId}`);
      }

      // 创建模板实例
      const template = new templateClass();

      if (!template) {
        throw new Error(`Failed to create template instance for ${templateId}`);
      }

      // 注册模板
      this.register(template);

      console.log(`[ClientTemplateManager] Successfully executed and registered template: ${templateId}`);
    } catch (error) {
      console.error(`[ClientTemplateManager] Error executing template code for ${templateId}:`, error);
      throw error;
    }
  }

  /**
   * 处理模板代码，移除 import 语句
   * @param code 原始模板代码
   * @returns 处理后的代码
   */
  private processTemplateCode(code: string | null | undefined): string {
    // 确保 code 是字符串
    if (typeof code !== 'string') {
      console.warn('[ClientTemplateManager] processTemplateCode received non-string code:', code);
      return '';
    }

    try {
      // 移除所有 import 语句
      let processedCode = code.replace(/import\s+.*?from\s+['"].*?['"];?/g, '');

      // 替换 export 语句
      processedCode = processedCode.replace(/export\s+default\s+(\w+);?/g, 'exports.default = $1;');
      processedCode = processedCode.replace(/export\s+class\s+(\w+)/g, 'class $1');
      processedCode = processedCode.replace(/export\s+interface\s+(\w+)/g, 'interface $1');
      processedCode = processedCode.replace(/export\s+type\s+(\w+)/g, 'type $1');

      return processedCode;
    } catch (error) {
      console.error('[ClientTemplateManager] Error processing template code:', error);
      return '';
    }
  }

  /**
   * 确保模板已加载
   * @param templateId 模板ID
   */
  async ensureTemplateLoaded(templateId: string): Promise<boolean> {
    // 检查模板是否已加载
    if (this.templates.has(templateId)) {
      return true;
    }

    // 尝试从缓存加载
    const loadedFromCache = await this.loadTemplateFromCache(templateId);
    if (loadedFromCache) {
      return true;
    }

    // 从服务器加载
    return await this.loadTemplateFromServer(templateId);
  }

  // ITemplateRegistry 接口实现

  register(template: BaseTemplate): void {
    this.templates.set(template.id, template);
  }

  async get(id: string): Promise<BaseTemplate | undefined> {
    // 如果模板已加载，直接返回
    if (this.templates.has(id)) {
      return this.templates.get(id);
    }

    // 尝试加载模板
    const loaded = await this.ensureTemplateLoaded(id);
    if (loaded) {
      return this.templates.get(id);
    }

    return undefined;
  }

  getAllTemplateIds(): string[] {
    // 返回所有已知的模板ID（包括未加载的）
    return Array.from(this.templateMetadata.keys());
  }

  getAllTemplates(): BaseTemplate[] {
    // 只返回已加载的模板
    return Array.from(this.templates.values());
  }

  getAllTemplateMetadata(): TemplateMetadata[] {
    return Array.from(this.templateMetadata.values());
  }

  getTemplateMetadata(id: string): TemplateMetadata | undefined {
    return this.templateMetadata.get(id);
  }

  async createFromJson(json: any): Promise<BaseTemplate | undefined> {
    if (!json || !json.templateId) return undefined;

    // 确保模板已加载
    await this.ensureTemplateLoaded(json.templateId);

    const template = this.templates.get(json.templateId);
    if (!template) return undefined;

    // 创建新实例
    const newTemplate = Object.create(Object.getPrototypeOf(template));
    Object.assign(newTemplate, template);

    // 从JSON加载数据
    newTemplate.loadFromJson(json);

    return newTemplate;
  }

  has(id: string): boolean {
    return this.templates.has(id);
  }

  unregister(id: string): boolean {
    const result = this.templates.delete(id);
    return result;
  }

  clear(): void {
    this.templates.clear();
    // 不清除元数据，因为它们仍然有用
  }
}
